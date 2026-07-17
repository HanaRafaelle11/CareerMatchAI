import { type RawJob, type JobIntent } from "./connectors/BaseJobConnector.ts";
import { normalizeQuery } from "./query-normalizer.ts";
import { expandIntent } from "./intent-resolver.ts";
import { retrieveCandidates } from "./retrieval.ts";
import { rankCandidates } from "./ranking.ts";
import {
  logSearchTelemetry,
  calculateMarginalUtility,
  calculateTop20Contribution,
  calculateDominantFeatures
} from "./telemetry.ts";

export interface NormalizedJob extends RawJob {
  companyNameNormalized: string;
  locationNormalized: string;
  _normalizedTitle: string; // Título normalizado para cache de similaridade
  salaryMinBRL?: number;
  salaryMaxBRL?: number;
  workModeNormalized: 'remote' | 'hybrid' | 'onsite';
  seniorityNormalized: 'junior' | 'pleno' | 'senior' | 'lead' | 'director';
  requirementsNormalized: string[];
  benefitsNormalized: string[];
  languageNormalized: 'pt' | 'en' | 'es';
  scores: {
    providerQuality: number;
    freshness: number;
    companyTrust: number;
    salaryConfidence: number;
    descriptionCompleteness: number;
    remoteConfidence: number;
    overall: number;
    breakdown?: { title: number; skills: number; description?: number; industry: number; company: number; freshness: number };
    adjustments?: { boosts: string[]; penalties: string[] };
    explanation?: string;
    confidence?: 'high' | 'medium' | 'low';
    explainability?: {
      overall_score: number;
      confidence: 'high' | 'medium' | 'low';
      matched_titles: string[];
      matched_skills: string[];
      matched_department: string;
      feature_breakdown: Record<string, { score: number; contribution: number }>;
      boosts: string[];
      penalties: string[];
      ranking_reason: string;
      explanation_ptBR: string;
      retrievalEvidence?: any;
    };
  };
}

// ── Helper de Detecção de Idioma ──
export function detectLanguage(title: string, desc: string): 'pt' | 'en' | 'es' {
  const text = (title + " " + desc).toLowerCase();
  const ptCount = (text.match(/\b(o|a|e|de|do|da|em|um|uma|os|as|dos|das|no|na|para|com|ou|vaga|requisitos)\b/g) || []).length;
  const enCount = (text.match(/\b(the|and|of|in|to|with|job|requirements|skills)\b/g) || []).length;
  const esCount = (text.match(/\b(el|la|y|de|en|para|con|trabajo|requisitos)\b/g) || []).length;

  if (enCount > ptCount && enCount > esCount) return "en";
  if (esCount > ptCount && esCount > enCount) return "es";
  return "pt";
}

// ── Local Seniority Normalizer ──
export function extractQuerySeniority(query: string): ('junior' | 'pleno' | 'senior' | 'lead' | 'director')[] {
  const q = query.toLowerCase();
  const levels: ('junior' | 'pleno' | 'senior' | 'lead' | 'director')[] = [];
  if (/\b(junior|júnior|jr|estágio|estagiário|intern|trainee|assistente)\b/i.test(q)) levels.push('junior');
  if (/\b(pleno|pl)\b/i.test(q)) levels.push('pleno');
  if (/\b(senior|sênior|sr)\b/i.test(q)) levels.push('senior');
  if (/\b(lead|lider|líder|principal|staff)\b/i.test(q)) levels.push('lead');
  if (/\b(director|diretor|head|vp)\b/i.test(q)) levels.push('director');
  return levels;
}

const BR_STATES = new Set([
  "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms", "mg",
  "pa", "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc", "sp", "se", "to"
]);

function cleanLocationForMatch(normalizedLoc: string): string {
  const words = normalizedLoc.split(/\s+/);
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    if (BR_STATES.has(lastWord)) {
      return words.slice(0, -1).join(" ");
    }
  }
  return normalizedLoc;
}

export function aggregateAndNormalizeJobs(
  rawJobs: RawJob[],
  intent: JobIntent | null,
  location?: string,
  rawQuery?: string,
  geminiUsed: boolean = false,
  debug: boolean = false
): NormalizedJob[] {
  const startTime = Date.now();
  const resolvedGeminiUsed = geminiUsed || (intent ? (intent as any).gemini_used || false : false);

  // Phase 1 & 2: Ingestão e Deduplicação Básica (pelo ID da vaga ou chave composta)
  const uniqueJobsMap = new Map<string, RawJob>();
  for (const r of rawJobs) {
    const key = r.id || r.url || `${r.title}-${r.companyName}`;
    if (key) {
      uniqueJobsMap.set(key, r);
    }
  }

  const parsedJobs: NormalizedJob[] = Array.from(uniqueJobsMap.values()).map(r => {
    // ── Classificação automática de workMode a partir do título/descrição ──
    let workMode: 'remote' | 'hybrid' | 'onsite' = r.workMode as any || 'onsite';
    if (!r.workMode) {
      const text = ((r.title || '') + ' ' + (r.description || '')).toLowerCase();
      if (/\b(remoto|remote|trabalho remoto|home office|anywhere|worldwide)\b/i.test(text)) {
        workMode = 'remote';
      } else if (/\b(h[ií]brido|hybrid)\b/i.test(text)) {
        workMode = 'hybrid';
      }
    }

    // ── Classificação automática de senioridade a partir do título ──
    let seniority: 'junior' | 'pleno' | 'senior' | 'lead' | 'director' = r.seniority as any || 'pleno';
    if (!r.seniority) {
      const titleLower = (r.title || '').toLowerCase();
      if (/\b(junior|júnior|jr|estágio|estagiário|intern|trainee|assistente)\b/i.test(titleLower)) {
        seniority = 'junior';
      } else if (/\b(senior|sênior|sr|especialista)\b/i.test(titleLower)) {
        seniority = 'senior';
      } else if (/\b(lead|lider|líder|principal|staff)\b/i.test(titleLower)) {
        seniority = 'lead';
      } else if (/\b(diretor|director|head|vp|gerente|manager|coordenador)\b/i.test(titleLower)) {
        seniority = 'director';
      }
    }
    
    return {
      ...r,
      companyNameNormalized: r.companyName ? normalizeQuery(r.companyName) : '',
      locationNormalized: r.location ? normalizeQuery(r.location) : '',
      _normalizedTitle: r.title ? normalizeQuery(r.title) : '',
      workModeNormalized: workMode,
      seniorityNormalized: seniority,
      requirementsNormalized: r.requirements || [],
      benefitsNormalized: r.benefits || [],
      languageNormalized: r.language as any || 'pt',
      scores: {
        providerQuality: r.scores?.providerQuality || 50,
        freshness: r.scores?.freshness || 50,
        companyTrust: r.scores?.companyTrust || 50,
        salaryConfidence: r.scores?.salaryConfidence || 50,
        descriptionCompleteness: r.scores?.descriptionCompleteness || 50,
        remoteConfidence: r.scores?.remoteConfidence || 50,
        overall: 0
      }
    };
  });

  const initialCount = parsedJobs.length;

  // Phase 3: Candidate Recall (Multi-Retriever Union de Módulos Desacoplados)
  const {
    candidates,
    rejectedByTitleCount,
    hitsTitle,
    hitsAlias,
    hitsSkills,
    hitsDescription
  } = retrieveCandidates(parsedJobs, intent, debug);

  // Phase 4: L2 Hard Filters
  const querySeniorities = rawQuery ? extractQuerySeniority(rawQuery) : [];
  const filteredJobs: NormalizedJob[] = [];
  let rejectedByLocation = 0;
  let rejectedBySeniority = 0;

  const locLower = location ? location.toLowerCase() : "";
  const isBrazilianSearch = /brasil|brazil|br|são paulo|rio de janeiro|belo horizonte|curitiba|porto alegre|recife|salvador|fortaleza|brasília|campinas|goiânia|manaus|belém|florianópolis|sp|rj|mg|pr|rs|sc|ba|pe|ce|df|go|am|pa/i.test(locLower);

  const nonBrazilPatterns = /\b(germany|deutschland|austria|österreich|schweiz|switzerland|canada|united states|usa|uk|united kingdom|france|spain|netherlands|ireland|australia|india|japan|china|singapore|dubai|qatar|münchen|munich|berlin|hamburg|frankfurt|london|paris|amsterdam|dublin|toronto|vancouver|montreal|new york|san francisco|seattle|chicago|los angeles|sydney|melbourne)\b/i;
  const foreignLangPatterns = /\b(projektmanager|sachbearbeiter|mitarbeiter|leiter|berater|ingénieur|développeur|responsable|gestionnaire|chargé)\b/i;

  for (const j of candidates) {
    // 1. Filtro de Senioridade
    if (querySeniorities.length > 0 && !querySeniorities.includes(j.seniorityNormalized)) {
      rejectedBySeniority++;
      continue;
    }

    // 2. Filtro de Idioma — bloquear vagas em idioma estrangeiro EXCETO inglês para Brasil
    const lang = detectLanguage(j.title, j.description);
    if (lang !== 'pt' && lang !== 'en') {
      // Block Spanish, German, etc. — but allow Portuguese and English
      continue;
    }

    const jobLoc = (j.locationNormalized || j.location || '').toLowerCase();
    const jobTitle = j.title.toLowerCase();
    const jobDesc = j.description.substring(0, 300).toLowerCase();

    const isRemoteKeyword = jobLoc.includes('remot') || jobLoc === '' || jobLoc === 'remote' || jobLoc.includes('anywhere') || jobLoc.includes('worldwide');

    // 3. Bloquear vagas com localidade estrangeira explícita
    if (!isRemoteKeyword) {
      if (nonBrazilPatterns.test(jobLoc) || nonBrazilPatterns.test(jobDesc) || foreignLangPatterns.test(jobTitle)) {
        rejectedByLocation++;
        continue;
      }
    }

    // 4. Filtro Geográfico Local — somente se a localização NÃO for um termo genérico de país
    //    (evita descartar vagas de cidades brasileiras quando o usuário busca por "Brasil")
    //    Bypassado para Adzuna pois a API deles já filtra geograficamente com o parâmetro 'where'
    const isCountryLevelSearch = /^(brasil|brazil|br)$/i.test((location || '').trim());
    if (location && !isCountryLevelSearch && j.workModeNormalized !== 'remote' && j.sourcePlatform !== 'Adzuna') {
      const targetNorm = normalizeQuery(location);
      const targetClean = cleanLocationForMatch(targetNorm).replace(/\s+/g, "");
      const jLoc = j.locationNormalized.replace(/\s+/g, "");
      const jLocClean = cleanLocationForMatch(j.locationNormalized || '').replace(/\s+/g, "");

      const isMatch = jLocClean.includes(targetClean) || targetClean.includes(jLocClean) ||
        (targetClean === 'sp' && jLoc.includes('saopaulo')) ||
        (jLoc === 'sp' && targetClean === 'saopaulo');
      if (!isMatch) {
        rejectedByLocation++;
        continue;
      }
    }

    filteredJobs.push(j);
  }

  // Phase 5 LTR Ranking
  rankCandidates(filteredJobs, intent);

  // Phase 9: Capping results at Top 100 & Gating Noise (Score >= 30 conditionally)
  let finalJobs: NormalizedJob[] = [];
  let thresholdApplied = 0.0;

  let candidatesPool = [...filteredJobs];
  if (filteredJobs.length >= 100) {
    thresholdApplied = 30.0;
    candidatesPool = filteredJobs.filter(item => item.scores.overall >= 30.0);
  } else {
    thresholdApplied = 15.0;
    candidatesPool = filteredJobs.filter(item => item.scores.overall >= 15.0);
  }

  candidatesPool.sort((a, b) => b.scores.overall - a.scores.overall);

  if (candidatesPool.length <= 100) {
    finalJobs = candidatesPool;
  } else {
    finalJobs = candidatesPool.slice(0, 100);
  }

  const durationMs = Date.now() - startTime;

  // Extrair leading LTR signals para analítica
  const topFeatures = finalJobs.length > 0
    ? Object.keys(finalJobs[0].scores.explainability?.feature_breakdown || {}).slice(0, 3)
    : [];

  const avgScore = finalJobs.length > 0
    ? finalJobs.reduce((sum, j) => sum + j.scores.overall, 0) / finalJobs.length
    : 0.0;

  // 1. Calcular Utilidade Marginal (Unicidade de Recuperação)
  const marginalUtility = calculateMarginalUtility(candidates);

  // 2. Calcular Contribuição e Features Dominantes no Top 20 resultados
  const top20Jobs = finalJobs.slice(0, 20);
  const top20Contribution = calculateTop20Contribution(top20Jobs);
  const dominantFeatures = calculateDominantFeatures(top20Jobs);

  // Chamar o logger de telemetria modularizado
  logSearchTelemetry({
    candidatesGenerated: initialCount,
    candidatesFiltered: finalJobs.length,
    rejectedByTitle: rejectedByTitleCount,
    rejectedByLocation,
    rejectedBySeniority,
    averageScore: avgScore,
    threshold: thresholdApplied,
    geminiUsed: resolvedGeminiUsed,
    latencyMs: durationMs,
    topFeatures,
    retrieverHits: {
      title: hitsTitle,
      alias: hitsAlias,
      skills: hitsSkills,
      description: hitsDescription
    },
    funnel: {
      rawIngested: initialCount,
      rawUnion: hitsTitle + hitsAlias + hitsSkills + hitsDescription,
      deduplicated: candidates.length,
      postHardFilters: filteredJobs.length,
      postLtr: candidatesPool.length
    },
    marginalUtility,
    top20Contribution,
    dominantFeatures
  }, debug);

  return finalJobs;
}
