import { type RawJob, type JobIntent } from "./connectors/BaseJobConnector.ts";
import { normalizeQuery } from "./query-normalizer.ts";
import { FEATURE_REGISTRY, TitleSimilarityFeature } from "./features.ts";
import { FEATURE_WEIGHTS, GATING_THRESHOLDS, PENALTIES } from "./ranking-config.ts";
import { LOCAL_TAXONOMY } from "./taxonomy.ts";
import { expandIntent } from "./intent-resolver.ts";

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
    };
  };
}

// ── 1. Telemetry Logger ──
interface SearchMetrics {
  candidatesGenerated: number;
  candidatesFiltered: number;
  rejectedByTitle: number;
  rejectedByLocation: number;
  rejectedBySeniority: number;
  averageScore: number;
  threshold: number;
  geminiUsed: boolean;
  latencyMs: number;
  topFeatures: string[];
}
function logSearchTelemetry(m: SearchMetrics) {
  console.log("=== SEARCH METRICS ===");
  console.log(`- recall_pool_initial: ${m.candidatesGenerated}`);
  console.log(`- recall_pool_final: ${m.candidatesFiltered}`);
  console.log(`- rejected_by_title: ${m.rejectedByTitle}`);
  console.log(`- rejected_by_location: ${m.rejectedByLocation}`);
  console.log(`- rejected_by_seniority: ${m.rejectedBySeniority}`);
  console.log(`- avg_score: ${m.averageScore.toFixed(2)}`);
  console.log(`- threshold_applied: ${m.threshold.toFixed(2)}`);
  console.log(`- gemini_used: ${m.geminiUsed}`);
  console.log(`- latency_ms: ${m.latencyMs}ms`);
  console.log(`- leading_signals: ${m.topFeatures.join(', ')}`);
  console.log("======================");
}

// ── 2. Local Seniority Normalizer ──
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

// ── 3. Base formatting normalizers ──
function normalizeCompany(name: string): string {
  if (!name) return "Empresa Confidencial";
  return name
    .replace(/\b(S\.?A\.?|L[tT][dD][aA]\.?|Inc\.?|Corp\.?|L[lL][cC]|GmbH|S\.?A\.?S\.?|Group|Grupo)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLocation(loc: string): string {
  if (!loc) return "Brasil";
  const l = loc.toLowerCase();
  if (l.includes("remot") || l.includes("anywhere") || l.includes("home office") || l.includes("teletrabalho")) {
    return "Remoto";
  }
  if (l.includes("sao paulo") || l.includes("são paulo") || l.includes("sp")) {
    return "São Paulo, SP";
  }
  if (l.includes("rio de janeiro") || l.includes("rj")) {
    return "Rio de Janeiro, RJ";
  }
  if (l.includes("belo horizonte") || l.includes("bh") || l.includes("mg")) {
    return "Belo Horizonte, MG";
  }
  if (l.includes("curitiba") || l.includes("pr")) {
    return "Curitiba, PR";
  }
  if (l.includes("porto alegre") || l.includes("poa") || l.includes("rs")) {
    return "Porto Alegre, RS";
  }
  return loc.trim();
}

function normalizeSalary(j: RawJob): { min?: number; max?: number } {
  let min = j.salaryMin;
  let max = j.salaryMax;
  if (!min && !max) return {};

  const curr = (j.currency || "USD").toUpperCase();
  let rate = 1;
  if (curr === "USD") rate = 5.0;
  else if (curr === "EUR") rate = 5.4;
  else if (curr === "GBP") rate = 6.2;

  return {
    min: min ? Math.round(min * rate) : undefined,
    max: max ? Math.round(max * rate) : undefined
  };
}

function normalizeWorkMode(j: RawJob): 'remote' | 'hybrid' | 'onsite' {
  if (j.workMode) return j.workMode;
  const text = (j.title + " " + j.description).toLowerCase();
  if (text.includes("remot") || text.includes("anywhere") || text.includes("home office") || text.includes("teletrabalho") || text.includes("distância")) {
    return "remote";
  }
  if (text.includes("hybrid") || text.includes("híbrido") || text.includes("presencial e remoto")) {
    return "hybrid";
  }
  return "onsite";
}

function normalizeSeniority(j: RawJob): 'junior' | 'pleno' | 'senior' | 'lead' | 'director' {
  if (j.seniority) return j.seniority;
  const title = j.title.toLowerCase();
  if (title.includes("junior") || title.includes("júnior") || title.includes("jr") || title.includes("estágio") || title.includes("estagiário") || title.includes("trainee")) {
    return "junior";
  }
  if (title.includes("senior") || title.includes("sênior") || title.includes("sr") || title.includes("pleno") || title.includes("pl")) {
    return title.includes("senior") || title.includes("sênior") || title.includes("sr") ? "senior" : "pleno";
  }
  if (title.includes("lead") || title.includes("lider") || title.includes("líder") || title.includes("coordenador") || title.includes("coordinator")) {
    return "lead";
  }
  if (title.includes("director") || title.includes("diretor") || title.includes("gerente") || title.includes("manager") || title.includes("head") || title.includes("vp")) {
    return "director";
  }
  return "pleno";
}

const KNOWN_STACKS = [
  "React", "TypeScript", "Node.js", "Docker", "AWS", "Python", "Java",
  "PostgreSQL", "CSS", "HTML", "Vite", "GraphQL", "Figma", "Salesforce",
  "Git", "Kubernetes", "Next.js", "Vue", "Angular", "Go", "Ruby", "PHP"
];
function normalizeRequirements(j: RawJob): string[] {
  if (j.requirements && j.requirements.length > 0) return j.requirements;
  const text = (j.title + " " + j.description).toLowerCase();
  const reqs = KNOWN_STACKS.filter(stack =>
    new RegExp(`\\b${stack}\\b`, 'i').test(text)
  );
  return reqs.length > 0 ? reqs : ["Geral"];
}

const KNOWN_BENEFITS = [
  { term: /vale refeição|vale-refeição|\bvr\b/i, normalized: "Vale Refeição" },
  { term: /vale alimentação|vale-alimentação|\bva\b/i, normalized: "Vale Alimentação" },
  { term: /plano de saúde|saúde|unimed|bradesco saúde/i, normalized: "Plano de Saúde" },
  { term: /plano odontológico|odonto/i, normalized: "Plano Odontológico" },
  { term: /vale transporte|vale-transporte|\bvt\b/i, normalized: "Vale Transporte" },
  { term: /gympass|academia/i, normalized: "Gympass" },
  { term: /participação nos lucros|\bplr\b/i, normalized: "PLR" }
];
function normalizeBenefits(j: RawJob): string[] {
  if (j.benefits && j.benefits.length > 0) return j.benefits;
  const text = j.description.toLowerCase();
  const benefits: string[] = [];
  KNOWN_BENEFITS.forEach(b => {
    if (b.term.test(text)) benefits.push(b.normalized);
  });
  return benefits;
}

function detectLanguage(description: string): 'pt' | 'en' | 'es' {
  const text = description.toLowerCase();
  const ptCount = (text.match(/\b(o|a|e|da|do|em|para|com|vaga|requisitos)\b/g) || []).length;
  const enCount = (text.match(/\b(the|and|of|in|to|with|job|requirements|skills)\b/g) || []).length;
  const esCount = (text.match(/\b(el|la|y|de|en|para|con|trabajo|requisitos)\b/g) || []).length;

  if (enCount > ptCount && enCount > esCount) return "en";
  if (esCount > ptCount && esCount > enCount) return "es";
  return "pt";
}

function calculateScores(
  j: RawJob,
  workMode: 'remote' | 'hybrid' | 'onsite',
  salMinBRL?: number
) {
  let providerQuality = 70;
  const platform = j.sourcePlatform.toLowerCase();
  if (["greenhouse", "lever", "ashby", "smartrecruiters"].includes(platform)) providerQuality = 95;
  else if (["adzuna", "remotive", "remoteok"].includes(platform)) providerQuality = 85;
  else if (["gupy", "abler"].includes(platform)) providerQuality = 90;

  let freshness = 90;
  if (j.publishedAt) {
    const ageMs = Date.now() - new Date(j.publishedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 1) freshness = 100;
    else if (ageDays <= 3) freshness = 90;
    else if (ageDays <= 7) freshness = 70;
    else if (ageDays <= 14) freshness = 40;
    else freshness = 20;
  }

  const cName = j.companyName.toLowerCase();
  let companyTrust = 90;
  if (cName.includes("confidencial") || cName.includes("empresa") || cName.length < 3) {
    companyTrust = 40;
  }

  let salaryConfidence = 20;
  if (salMinBRL) {
    salaryConfidence = j.salaryMin && j.salaryMax ? 100 : 80;
  }

  const descLen = j.description.length;
  let descriptionCompleteness = 30;
  if (descLen > 1500) descriptionCompleteness = 100;
  else if (descLen > 800) descriptionCompleteness = 80;
  else if (descLen > 400) descriptionCompleteness = 60;

  let remoteConfidence = 50;
  if (workMode === "remote") remoteConfidence = 100;
  else if (workMode === "hybrid") remoteConfidence = 80;
  else remoteConfidence = 70;

  const overall = Math.round(
    (providerQuality * 0.25) +
    (freshness * 0.15) +
    (companyTrust * 0.15) +
    (salaryConfidence * 0.10) +
    (descriptionCompleteness * 0.15) +
    (remoteConfidence * 0.20)
  );

  return {
    providerQuality,
    freshness,
    companyTrust,
    salaryConfidence,
    descriptionCompleteness,
    remoteConfidence,
    overall
  };
}

export function aggregateAndNormalizeJobs(
  jobs: RawJob[],
  intent?: JobIntent,
  location?: string,
  rawQuery?: string,
  geminiUsed = false,
  debug = false
): NormalizedJob[] {
  const startTime = Date.now();
  const parsedJobs: NormalizedJob[] = [];
  const seen = new Set<string>();

  // Passar localização buscada no intent para processamento de LocationFeature
  if (intent && location) {
    intent.target_location = location;
  }

  // Phase 0 & 1: Parse, Normalização Básica e Deduplicação
  for (const j of jobs) {
    // Resetar estado temporário para evitar vazamento em execuções concorrentes ou consecutivas
    delete (j as any)._titleSim;

    const titleClean = j.title.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const companyNormalized = normalizeCompany(j.companyName);

    const key = `${titleClean.toLowerCase()}|${companyNormalized.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const locNormalized = normalizeLocation(j.location);
    const salaries = normalizeSalary(j);
    const mode = normalizeWorkMode(j);
    const seniority = normalizeSeniority(j);
    const reqs = normalizeRequirements(j);
    const benefits = normalizeBenefits(j);
    const lang = detectLanguage(j.description);
    const baseScores = calculateScores(j, mode, salaries.min);

    const descClean = j.description
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    const normalizedTitle = normalizeQuery(titleClean);

    parsedJobs.push({
      ...j,
      title: titleClean,
      description: descClean,
      _normalizedTitle: normalizedTitle, // Pré-normalizado uma única vez
      companyNameNormalized: companyNormalized,
      locationNormalized: locNormalized,
      salaryMinBRL: salaries.min,
      salaryMaxBRL: salaries.max,
      workModeNormalized: mode,
      seniorityNormalized: seniority,
      requirementsNormalized: reqs,
      benefitsNormalized: benefits,
      languageNormalized: lang,
      scores: {
        ...baseScores,
        overall: baseScores.overall,
        confidence: 'low'
      }
    });
  }

  const initialCount = parsedJobs.length;

  // Phase 3: Candidate recall pool generation com expansão ponderada de Grafo
  const candidates: NormalizedJob[] = [];
  let rejectedByTitle = 0;

  if (intent) {
    const expandedIntents = expandIntent(intent.canonical_key);

    for (const j of parsedJobs) {
      // 1. Buscar a similaridade de título máxima expandida no Grafo direcionado
      let maxWeightedSim = 0.0;
      let bestExpandedKey = intent.canonical_key;

      for (const [expandedKey, expansionWeight] of Object.entries(expandedIntents)) {
        const expandedNode = LOCAL_TAXONOMY[expandedKey];
        if (!expandedNode) continue;

        const tempIntent = {
          canonical_key: expandedNode.id,
          primary_titles: expandedNode.primary_titles,
          secondary_titles: expandedNode.secondary_titles,
          raw_query: intent.raw_query,
          _normalizedPrimary: [expandedNode.id.replace(/_/g, " "), ...expandedNode.primary_titles].map(t => normalizeQuery(t)).filter(Boolean),
          _normalizedSecondary: expandedNode.secondary_titles.map(t => normalizeQuery(t)).filter(Boolean)
        };
        const sim = TitleSimilarityFeature.calculate(j, tempIntent as any);
        const weightedSim = sim * expansionWeight;
        if (weightedSim > maxWeightedSim) {
          maxWeightedSim = weightedSim;
          bestExpandedKey = expandedKey;
        }
      }

      // Salvar similaridade ponderada e nó correspondente de match no objeto temporário
      (j as any)._titleSim = maxWeightedSim;
      (j as any)._matchedCanonicalKey = bestExpandedKey;

      // 2. Critérios extremamente amplos de Gating para Recall Máximo (title OR alias OR skill OR description OR department)
      const titleLower = j.title.toLowerCase();
      const descLower = j.description.toLowerCase();

      const matchedNode = LOCAL_TAXONOMY[bestExpandedKey] || LOCAL_TAXONOMY[intent.canonical_key];

      // Validação de Skills
      const nodeSkills = matchedNode ? [...(matchedNode.required_skills || []), ...(matchedNode.preferred_skills || [])] : [];
      const hasAnySkill = nodeSkills.some(skill => {
        const normSkill = normalizeQuery(skill);
        return normSkill && descLower.includes(normSkill);
      });

      // Validação de Aliases/Títulos
      const nodeAliases = matchedNode ? [...(matchedNode.aliases || []), ...(matchedNode.primary_titles || []), ...(matchedNode.secondary_titles || [])] : [];
      const hasAnyAlias = nodeAliases.some(alias => {
        const normAlias = normalizeQuery(alias);
        return normAlias && (titleLower.includes(normAlias) || descLower.includes(normAlias));
      });

      const domainIntent = matchedNode ? {
        ...intent,
        canonical_key: matchedNode.id,
        family: matchedNode.department,
        primary_titles: [matchedNode.id.replace(/_/g, " "), ...matchedNode.primary_titles],
        secondary_titles: matchedNode.secondary_titles,
        skills: matchedNode.required_skills,
        preferred_skills: matchedNode.preferred_skills,
        negative_keywords: matchedNode.negative_keywords,
        department: matchedNode.department,
        _normalizedPrimary: [matchedNode.id.replace(/_/g, " "), ...matchedNode.primary_titles].map(t => normalizeQuery(t)).filter(Boolean),
        _normalizedSecondary: matchedNode.secondary_titles.map(t => normalizeQuery(t)).filter(Boolean)
      } : intent;

      const titleSimFeature = FEATURE_REGISTRY.find(f => f.key === "TitleSimilarity");
      const skillsFeature = FEATURE_REGISTRY.find(f => f.key === "SkillsCoverage");
      const descFeature = FEATURE_REGISTRY.find(f => f.key === "DescriptionRelevance");
      const deptFeature = FEATURE_REGISTRY.find(f => f.key === "DepartmentSimilarity");

      const titleSim = titleSimFeature ? titleSimFeature.calculate(j, domainIntent as any) : 0.0;
      const skillsSim = skillsFeature ? skillsFeature.calculate(j, domainIntent as any) : 0.0;
      const descRelevance = descFeature ? descFeature.calculate(j, domainIntent as any) : 0.0;
      const deptSim = deptFeature ? deptFeature.calculate(j, domainIntent as any) : 0.0;

      const isAcceptedCandidate = 
        (titleSim > 0.0) || 
        (skillsSim > 0.0) || 
        (descRelevance > 0.0) || 
        (deptSim > 0.0) || 
        hasAnyAlias;

      if (!isAcceptedCandidate) {
        rejectedByTitle++;
        if (debug) {
          console.log(`[Phase 3 Recall Rejected] "${j.title}" (Company: ${j.companyName}) - titleSim: ${titleSim.toFixed(3)}, skillsSim: ${skillsSim.toFixed(3)}, descRelevance: ${descRelevance.toFixed(3)}, deptSim: ${deptSim.toFixed(3)}, hasAnyAlias: ${hasAnyAlias}`);
        }
        continue;
      }
      candidates.push(j);
    }
  } else {
    candidates.push(...parsedJobs);
  }

  // Phase 4: L2 Hard Filters (Seniority, Location e Geográfico Internacional)
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

    // 2. Filtro Geográfico Internacional (se busca no Brasil)
    if (isBrazilianSearch) {
      const jobLoc = (j.locationNormalized || j.location || '').toLowerCase();
      const jobTitle = j.title.toLowerCase();
      const jobDesc = j.description.substring(0, 300).toLowerCase();

      const isRemoteKeyword = jobLoc.includes('remot') || jobLoc === '' || jobLoc === 'remote' || jobLoc.includes('anywhere') || jobLoc.includes('worldwide');

      if (!isRemoteKeyword) {
        if (nonBrazilPatterns.test(jobLoc) || nonBrazilPatterns.test(jobDesc) || foreignLangPatterns.test(jobTitle)) {
          rejectedByLocation++;
          continue;
        }
      }
    }

    // 3. Filtro Geográfico Local (se especificado um local que não seja remoto)
    if (location && j.workModeNormalized !== 'remote') {
      const targetLoc = location.toLowerCase().replace(/[^\w]/g, "");
      const jobLoc = j.locationNormalized.toLowerCase().replace(/[^\w]/g, "");

      const isMatch = jobLoc.includes(targetLoc) || targetLoc.includes(jobLoc) ||
        (targetLoc === 'sp' && jobLoc.includes('saopaulo')) ||
        (jobLoc === 'sp' && targetLoc === 'saopaulo');
      if (!isMatch) {
        rejectedByLocation++;
        continue;
      }
    }

    filteredJobs.push(j);
  }

  // Phase 5, 6, 7 & 8: Extração de Features, LTR Ranker e Explainability Engine
  const matchedTitleStr = intent ? (intent.primary_titles[0] || "") : "";
  const allIntentSkills = intent ? [...(intent.skills || []), ...(intent.preferred_skills || [])].filter(Boolean) : [];
  const expandedIntents = intent ? expandIntent(intent.canonical_key) : {};

  for (const j of filteredJobs) {
    if (!intent) continue;

    const bestExpandedKey = (j as any)._matchedCanonicalKey || intent.canonical_key;
    const matchedNode = LOCAL_TAXONOMY[bestExpandedKey] || LOCAL_TAXONOMY[intent.canonical_key];

    // Criar o contexto de intenção mapeado no grafo (evitando double penalty de competências)
    const domainIntent = matchedNode ? {
      ...intent,
      canonical_key: matchedNode.id,
      family: matchedNode.department,
      primary_titles: [matchedNode.id.replace(/_/g, " "), ...matchedNode.primary_titles],
      secondary_titles: matchedNode.secondary_titles,
      skills: matchedNode.required_skills,
      preferred_skills: matchedNode.preferred_skills,
      negative_keywords: matchedNode.negative_keywords,
      department: matchedNode.department,
      _normalizedPrimary: [matchedNode.id.replace(/_/g, " "), ...matchedNode.primary_titles].map(t => normalizeQuery(t)).filter(Boolean),
      _normalizedSecondary: matchedNode.secondary_titles.map(t => normalizeQuery(t)).filter(Boolean)
    } : intent;

    const featuresScore: Record<string, number> = {};
    for (const feature of FEATURE_REGISTRY) {
      if (feature.key === "TitleSimilarity" && (j as any)._titleSim !== undefined) {
        featuresScore[feature.key] = (j as any)._titleSim;
      } else {
        featuresScore[feature.key] = feature.calculate(j, domainIntent as any);
      }
    }

    // LTR Linear Score Composition
    let weightedSum = 0.0;
    for (const [key, weight] of Object.entries(FEATURE_WEIGHTS)) {
      const score = featuresScore[key] || 0.0;
      weightedSum += score * weight;
    }

    const titleSim = featuresScore["TitleSimilarity"] || 0.0;
    const skillsSim = featuresScore["SkillsCoverage"] || 0.0;

    // ── 1. Pre-calcular Skills Correspondidas ──
    const normText = normalizeQuery(`${j.title} ${j.description}`);
    const matchedSkillsList: string[] = [];
    for (const skill of allIntentSkills) {
      const normSkill = normalizeQuery(skill);
      if (!normSkill) continue;
      const escaped = normSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`\\b${escaped}\\b`, 'i');
      if (rx.test(normText)) {
        matchedSkillsList.push(skill);
      }
    }

    // Penalidade por palavras-chave negativas na descrição
    const negativeKeywords = intent.negative_keywords || [];
    const normDesc = normalizeQuery(j.description);
    const matchedNegatives: string[] = [];
    for (const kw of negativeKeywords) {
      const normKw = normalizeQuery(kw);
      if (!normKw) continue;
      const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`\\b${escaped}\\b`, 'i');
      if (rx.test(normDesc)) {
        matchedNegatives.push(kw);
      }
    }
    const negativeSignalsScore = Math.min(1.0, matchedNegatives.length * 0.5);
    // Se o título tem alta compatibilidade, mitigar a penalidade de descrição
    let negativePenalty = negativeSignalsScore * PENALTIES.NegativeSignalsWeight;
    if (titleSim >= 0.60) {
      negativePenalty = negativePenalty * 0.5;
    }

    // Penalidade por termos negativos de título (penalização em vez de exclusão)
    const titleNegativeKeywords = domainIntent.negative_titles || [];
    let titleNegativePenalty = 0.0;
    const titleLower = j.title.toLowerCase();
    for (const kw of titleNegativeKeywords) {
      if (!kw) continue;
      const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`\\b${escaped}\\b`, 'i');
      if (rx.test(titleLower)) {
        titleNegativePenalty = 15.0; // Aplica penalidade de 15 pontos em vez de exclusão
        break;
      }
    }

    // ── 2. Calcular Score LTR Linear Simples ──
    const boosts: string[] = [];
    const penaltiesList: string[] = [];

    let overallScore = Math.max(0, Math.min(100, Math.round(weightedSum * 100)));

    // ── 3. Aplicar Multiplicador Leve do Grafo (GraphDistance) ──
    const graphWeight = expandedIntents[bestExpandedKey] || 1.0;
    overallScore = Math.round(overallScore * (0.9 + graphWeight * 0.1));

    // ── 4. Calibrar Confiança Baseada em Regras Simples ──
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (titleSim > 0.75 && skillsSim > 0.60) {
      confidence = 'high';
    } else if (titleSim > 0.45 || skillsSim > 0.40) {
      confidence = 'medium';
    }

    // Formatação de Explainability Payload
    const featureBreakdown: Record<string, { score: number; contribution: number }> = {};
    for (const [key, score] of Object.entries(featuresScore)) {
      const weight = FEATURE_WEIGHTS[key] || 0.0;
      featureBreakdown[key] = {
        score: score,
        contribution: Math.round(weight * 100)
      };
    }

    const matchedDepartmentStr = intent.department || "Não especificado na intenção";
    const rankingReasonStr = `Título similar a '${matchedTitleStr}' com pontuação total de ${overallScore}/100. Confiança classificada como ${confidence.toUpperCase()}.`;
    const explanationPtBRStr = `Vaga encontrada por similaridade de título (${Math.round(titleSim * 100)}%). ` +
      `Encontradas ${matchedSkillsList.length} competências (${matchedSkillsList.slice(0, 3).join(', ')}). ` +
      `Nível de correspondência: ${confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Boa' : 'Parcial'}.`;

    const descRelevance = featuresScore["DescriptionRelevance"] || 0.0;

    j.scores.overall = overallScore;
    j.scores.confidence = confidence;
    j.scores.breakdown = {
      title: Math.round(titleSim * 30),
      skills: Math.round(skillsSim * 25),
      description: Math.round(descRelevance * 30),
      industry: Math.round((featuresScore["DepartmentSimilarity"] || 0) * 10),
      company: 0,
      freshness: Math.round((featuresScore["Freshness"] || 0) * 5)
    };
    j.scores.explainability = {
      overall_score: overallScore,
      confidence,
      matched_titles: [matchedTitleStr],
      matched_skills: matchedSkillsList,
      matched_department: matchedDepartmentStr,
      feature_breakdown: featureBreakdown,
      boosts,
      penalties: penaltiesList,
      ranking_reason: rankingReasonStr,
      explanation_ptBR: explanationPtBRStr
    };
  }

  // Phase 9: Capping results at Top 100 & Gating Noise (Score >= 30 conditionally)
  let finalJobs: NormalizedJob[] = [];
  let thresholdApplied = 0.0;

  // Filtrar apenas o ruído (vagas completamente irrelevantes que pontuaram < 30)
  // Mas apenas se o pool inicial de candidatos for grande (>= 100 resultados)
  let candidatesPool = [...filteredJobs];
  if (filteredJobs.length >= 100) {
    thresholdApplied = 30.0;
    candidatesPool = filteredJobs.filter(item => item.scores.overall >= 30.0);
  }

  candidatesPool.sort((a, b) => b.scores.overall - a.scores.overall);

  if (candidatesPool.length <= 100) {
    finalJobs = candidatesPool;
  } else {
    finalJobs = candidatesPool.slice(0, 100);
  }

  const durationMs = Date.now() - startTime;

  // Extrair leading signals para analítica
  const topFeatures = finalJobs.length > 0
    ? Object.keys(finalJobs[0].scores.explainability?.feature_breakdown || {}).slice(0, 3)
    : [];

  const avgScore = finalJobs.length > 0
    ? finalJobs.reduce((sum, j) => sum + j.scores.overall, 0) / finalJobs.length
    : 0.0;

  logSearchTelemetry({
    candidatesGenerated: initialCount,
    candidatesFiltered: finalJobs.length,
    rejectedByTitle,
    rejectedByLocation,
    rejectedBySeniority,
    averageScore: avgScore,
    threshold: thresholdApplied,
    geminiUsed,
    latencyMs: durationMs,
    topFeatures
  });

  return finalJobs;
}
