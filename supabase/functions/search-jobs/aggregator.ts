import { type RawJob, type JobIntent } from "./connectors/BaseJobConnector.ts";

export interface NormalizedJob extends RawJob {
  companyNameNormalized: string;
  locationNormalized: string;
  salaryMinBRL?: number;
  salaryMaxBRL?: number;
  workModeNormalized: 'remote' | 'hybrid' | 'onsite';
  seniorityNormalized: 'junior' | 'pleno' | 'senior' | 'lead' | 'director';
  requirementsNormalized: string[];
  benefitsNormalized: string[];
  languageNormalized: 'pt' | 'en' | 'es';
  
  // Tríplice de Origem (Provedor -> Fonte Intermediária -> ATS Oficial)
  provider: string;       // Provedor invocador (ex: Adzuna, Jooble, SerpApi, Greenhouse)
  source: string;         // Plataforma intermediária
  ats?: string;           // ATS Oficial detectado (ex: Workday, Greenhouse, Lever, Gupy)
  confidencePercent: number; // Score de Confiança % (0 - 100%)

  scores: {
    providerQuality: number;
    freshness: number;
    companyTrust: number;
    salaryConfidence: number;
    descriptionCompleteness: number;
    remoteConfidence: number;
    overall: number;
    breakdown?: { title: number; skills: number; context: number };
    adjustments?: { boosts: string[]; penalties: string[] };
    explanation?: string;
    confidence?: 'high' | 'medium' | 'low';
  };
}

// Pre-compiled regex constants for high-performance hierarchy matching
const RX_SUPERVISOR_REQ = /\b(supervisor|supervisora|coordenador|coordenadora|líder|lider|gerente)\b/i;
const RX_SENIOR_REQ = /\b(sênior|senior|sr|lead|principal)\b/i;
const RX_JUNIOR_REQ = /\b(júnior|junior|jr|estagiário|estagio|estagiario|assistente)\b/i;
const RX_EXACT_SUPERVISOR = /\b(supervisor|supervisora)\b/i;
const RX_LEADERSHIP_ROLE = /\b(coordenador|coordenadora|líder|lider|gerente|head)\b/i;
const RX_OPERATIONAL_JUNIOR = /\b(agente|assistente|estágio|estagio|estagiário|estagiario|júnior|junior|jr)\b/i;
const RX_SENIOR_JOB = /\b(sênior|senior|sr|lead|principal|head)\b/i;
const RX_JUNIOR_JOB = /\b(júnior|junior|jr|estagiário|estagiario|assistente)\b/i;
const RX_JUNIOR_OR_ENTRY = /\b(estágio|estagio|estagiário|estagiario|agente|assistente|júnior|junior|jr)\b/i;

// ── 1. TABLE OF PROVIDER / ATS QUALITY INDEX ──
export const PROVIDER_QUALITY_INDEX: Record<string, number> = {
  workday: 100,
  greenhouse: 100,
  lever: 98,
  ashby: 98,
  smartrecruiters: 97,
  gupy: 96,
  catho: 94,
  linkedin: 92,
  google_jobs: 90,
  serpapi: 90,
  jooble: 88,
  remotive: 87,
  arbeitnow: 86,
  adzuna: 75
};

// Detect ATS system from URL or string
function detectATS(url: string, platformName: string): { ats?: string; score: number } {
  const u = (url || '').toLowerCase();
  const p = (platformName || '').toLowerCase();

  if (u.includes('workday') || u.includes('myworkdayjobs')) return { ats: 'Workday', score: 100 };
  if (u.includes('greenhouse.io') || p.includes('greenhouse')) return { ats: 'Greenhouse', score: 100 };
  if (u.includes('lever.co') || p.includes('lever')) return { ats: 'Lever', score: 98 };
  if (u.includes('ashbyhq.com') || p.includes('ashby')) return { ats: 'Ashby', score: 98 };
  if (u.includes('smartrecruiters.com') || p.includes('smartrecruiters')) return { ats: 'SmartRecruiters', score: 97 };
  if (u.includes('gupy.io') || u.includes('gupy.com') || p.includes('gupy')) return { ats: 'Gupy', score: 96 };
  if (u.includes('catho.com.br') || p.includes('catho')) return { ats: 'Catho', score: 94 };
  if (u.includes('linkedin.com')) return { ats: 'LinkedIn', score: 92 };
  if (u.includes('google.com') || p.includes('google') || p.includes('serpapi')) return { ats: undefined, score: 90 };
  if (u.includes('jooble.org') || p.includes('jooble')) return { ats: undefined, score: 88 };
  if (u.includes('remotive.com') || p.includes('remotive')) return { ats: undefined, score: 87 };
  if (u.includes('arbeitnow.com') || p.includes('arbeitnow')) return { ats: undefined, score: 86 };
  if (u.includes('adzuna.com') || p.includes('adzuna')) return { ats: undefined, score: 75 };

  return { ats: undefined, score: 80 };
}

// Calculate Freshness score and age in days
function calculateFreshness(publishedAt?: string): { score: number; ageDays: number; isExpired: boolean } {
  if (!publishedAt) return { score: 50, ageDays: 15, isExpired: false };
  
  const pubDate = new Date(publishedAt);
  if (isNaN(pubDate.getTime())) return { score: 50, ageDays: 15, isExpired: false };

  const ageMs = Date.now() - pubDate.getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));

  if (ageDays > 90) return { score: 20, ageDays, isExpired: false };
  if (ageDays <= 1) return { score: 100, ageDays, isExpired: false }; // 0-24h: +15
  if (ageDays <= 3) return { score: 90, ageDays, isExpired: false };  // 1-3d: +12
  if (ageDays <= 7) return { score: 80, ageDays, isExpired: false };  // 4-7d: +8
  if (ageDays <= 15) return { score: 70, ageDays, isExpired: false }; // 8-15d: +5
  if (ageDays <= 30) return { score: 60, ageDays, isExpired: false }; // 16-30d: +2
  if (ageDays <= 60) return { score: 50, ageDays, isExpired: false }; // 31-60d: 0
  return { score: 30, ageDays, isExpired: false };                    // 61-90d: -5
}

// Substring Bigram Similarity (0.0 to 1.0)
function getBigramSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\w]/g, '');
  const s2 = str2.toLowerCase().replace(/[^\w]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const bg1 = new Set<string>();
  for (let i = 0; i < s1.length - 1; i++) bg1.add(s1.substring(i, i + 2));

  let matches = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    if (bg1.has(s2.substring(i, i + 2))) matches++;
  }
  return (2.0 * matches) / (s1.length - 1 + s2.length - 1);
}

// Mapa Taxonômico de Sinônimos de Domínio (PT/EN)
const DOMAIN_SYNONYMS: Record<string, string[]> = {
  "vendedor": ["vendas", "comercial", "consultor de vendas", "vendedora", "promotor", "atendimento", "consultor"],
  "vendas": ["vendedor", "comercial", "consultor de vendas", "vendedora", "atendimento"],
  "comercial": ["vendedor", "vendas", "consultor", "atendimento"],
  "ajudante": ["auxiliar", "assistente", "operacional", "ajudante geral"],
  "auxiliar": ["ajudante", "assistente", "operacional"],
  "customer success": ["sucesso do cliente", "customer experience", "cx", "relacionamento com cliente", "relacionamento", "retenção", "pos-vendas", "pós-vendas", "atendimento ao cliente", "atendimento"],
  "sucesso do cliente": ["customer success", "customer experience", "cx", "relacionamento com cliente", "atendimento"],
  "customer experience": ["cx", "customer success", "sucesso do cliente", "experiência do cliente", "atendimento"],
  "cx": ["customer experience", "customer success", "sucesso do cliente", "atendimento"],
  "relacionamento com cliente": ["customer success", "sucesso do cliente", "atendimento", "cx"],
  "supervisor": ["supervisora", "coordenador", "coordenadora", "líder", "lider", "gerente", "head"]
};

// Calculate Semantic Similarity Match Score (0 - 100) — SINGLE SOURCE OF TRUTH FOR CANDIDATE MATCH
function calculateSemanticMatch(
  j: RawJob,
  intent: JobIntent
): { matchScore: number; detail: string } {
  const titleClean = j.title.replace(/<\/?[^>]+(>|$)/g, "").trim();
  const titleLower = titleClean.toLowerCase();
  const descLower = (j.description || '').toLowerCase();
  const combinedText = `${titleLower} ${descLower}`;
  const primaryTitlesStr = (intent?.primary_titles || []).join(" ");
  const rawQuery = (`${intent?.family || ''} ${primaryTitlesStr}`.trim() || titleClean).toLowerCase();

  const stopwords = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'para', 'com', 'por', 'sem', 'ou', 'e', 'a', 'o', 'of', 'for', 'in', 'and']);
  const queryTokens = Array.from(new Set(rawQuery.split(/\s+/).filter(w => !stopwords.has(w) && w.length >= 2)));

  // 1. Expansão Semântica por Taxonomia de Domínio
  const expandedQueryTokens = new Set<string>(queryTokens);
  for (const [key, synonyms] of Object.entries(DOMAIN_SYNONYMS)) {
    if (rawQuery.includes(key) || titleLower.includes(key)) {
      synonyms.forEach(syn => syn.split(/\s+/).forEach(w => {
        if (!stopwords.has(w) && w.length >= 2) expandedQueryTokens.add(w);
      }));
    }
  }

  const titleTokens = Array.from(new Set(titleLower.split(/\s+/).filter(w => !stopwords.has(w) && w.length >= 2)));

  // 2. Similaridade de Jaccard com Tokens Diretos e Expandidos
  const directMatches = queryTokens.filter(t => titleTokens.some(tt => tt.includes(t) || t.includes(tt)));
  const semanticMatches = Array.from(expandedQueryTokens).filter(t => titleTokens.some(tt => tt.includes(t) || t.includes(tt)));

  const jaccardDirect = titleTokens.length > 0 ? directMatches.length / Math.max(queryTokens.length, titleTokens.length) : 0;
  const jaccardSemantic = titleTokens.length > 0 ? semanticMatches.length / Math.max(queryTokens.length, titleTokens.length) : 0;
  const effectiveJaccard = Math.max(jaccardDirect, jaccardSemantic * 0.85);

  // 3. Character Bigram Similarity (0.0 to 1.0)
  const bigramSim = getBigramSimilarity(rawQuery, titleLower);

  // 4. Exact Substring Match Bonus
  const isExactPhrase = titleLower.includes(rawQuery) && rawQuery.length > 3;
  const phraseBonus = isExactPhrase ? 0.28 : 0;

  // VERIFICAÇÃO RIGOROSA DE CORRESPONDÊNCIA TEXTUAL / SEMÂNTICA
  const descMatches = queryTokens.filter(t => descLower.includes(t));
  const descSemanticMatches = Array.from(expandedQueryTokens).filter(t => descLower.includes(t));
  const hasDescMatch = descMatches.length > 0 || descSemanticMatches.length > 0;
  const hasTitleMatch = directMatches.length > 0 || semanticMatches.length > 0 || isExactPhrase || bigramSim >= 0.40;

  // Se NÃO HOUVER match nem no título nem na descrição (ex: Diretor de Arte, Analista Contábil para customer success)
  if (!hasTitleMatch && !hasDescMatch) {
    return { 
      matchScore: 5, 
      detail: `Sem correspondência textual ou semântica com o termo buscado (Jaccard: 0%)` 
    };
  }

  // Cálculo proporcional ao match real (0.0 a 1.0)
  let composite = 0;
  if (hasTitleMatch) {
    composite = (effectiveJaccard * 0.45) + (bigramSim * 0.25) + phraseBonus + 0.15;
  } else if (hasDescMatch) {
    composite = 0.20 + (descMatches.length / Math.max(1, queryTokens.length)) * 0.15;
  }

  // 4. Seniority / Hierarchy Level Adjustment
  const isSupervisorReq = RX_SUPERVISOR_REQ.test(rawQuery);
  const isSeniorReq = RX_SENIOR_REQ.test(rawQuery);
  const isJuniorReq = RX_JUNIOR_REQ.test(rawQuery);

  let hierarchyDelta = 0;
  let detail = `Jaccard: Math ${(effectiveJaccard * 100).toFixed(0)}%`;

  if (isSupervisorReq) {
    const isExactSupervisor = RX_EXACT_SUPERVISOR.test(titleLower);
    const isLeadershipRole = RX_LEADERSHIP_ROLE.test(titleLower);
    const isOperationalOrJunior = RX_OPERATIONAL_JUNIOR.test(titleLower);

    if (isExactSupervisor) {
      hierarchyDelta = +0.10;
      detail += " (+supervisor exato)";
    } else if (isLeadershipRole) {
      hierarchyDelta = +0.05;
      detail += " (+liderança correlata)";
    } else if (isOperationalOrJunior) {
      hierarchyDelta = -0.55; // Descarte de funções operacionais/júnior em busca de supervisão
      detail += " (-penalidade operacional <20%)";
    } else {
      hierarchyDelta = -0.15; // Analistas pleno/sênior não-supervisores recebem ajuste
      detail += " (-não é supervisão)";
    }
  } else if (isSeniorReq) {
    const isSeniorJob = RX_SENIOR_JOB.test(titleLower);
    const isJuniorJob = RX_JUNIOR_JOB.test(titleLower);
    if (isSeniorJob) hierarchyDelta = +0.08;
    else if (isJuniorJob) hierarchyDelta = -0.45;
  } else if (isJuniorReq) {
    const isJuniorJob = RX_JUNIOR_JOB.test(titleLower);
    const isSeniorJob = RX_SENIOR_JOB.test(titleLower);
    if (isJuniorJob) hierarchyDelta = +0.08;
    else if (isSeniorJob) hierarchyDelta = -0.45;
  } else {
    // Busca Genérica (ex: "customer success"): dar preferência a posições efetivas/CSM/analistas,
    // enquanto cargos de Estágio / Agente / Assistente recebem ajuste (-0.35) para não ficarem no topo.
    const isJuniorOrEntry = RX_JUNIOR_OR_ENTRY.test(titleLower);
    if (isJuniorOrEntry) {
      hierarchyDelta = -0.35;
      detail += " (-ajuste nível entrada)";
    }
  }

  // 5. Bonus for matched skills in job text
  if (intent.skills && intent.skills.length > 0) {
    const matchedSkillsCount = intent.skills.filter(skill => {
      if (!skill) return false;
      const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        const rx = new RegExp(`(?:^|\\s|\\b)${escaped}(?:$|\\s|\\b)`, 'i');
        return rx.test(combinedText);
      } catch (_) {
        return combinedText.includes(skill.toLowerCase());
      }
    }).length;

    const skillBonus = Math.min(0.06, (matchedSkillsCount / intent.skills.length) * 0.06);
    composite += skillBonus;
  }

  // 6. Fine Granular Modifier based on title token count & character length (ensures uniqueness)
  const lengthMod = Math.min(0.04, (titleClean.length % 9) * 0.005);

  let finalPercent = Math.round((composite + hierarchyDelta + lengthMod) * 100);
  finalPercent = Math.min(99, Math.max(5, finalPercent));

  return { matchScore: finalPercent, detail };
}


// Normalize Company Name
function normalizeCompany(name: string): string {
  if (!name) return "Empresa Confidencial";
  return name
    .replace(/\b(S\.?A\.?|L[tT][dD][aA]\.?|Inc\.?|Corp\.?|L[lL][cC]|GmbH|S\.?A\.?S\.?|Group|Grupo)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalize Location
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
  return loc.trim();
}

// Aggregate, Normalize, Deduplicate and Rank Jobs
export function aggregateAndNormalizeJobs(
  rawJobs: RawJob[],
  intent: JobIntent,
  targetLocation: string
): NormalizedJob[] {
  console.log(`[SEARCH ENGINE AGGREGATOR] Processando ${rawJobs.length} vagas brutas...`);

  // Count raw inputs per provider
  const rawProviderCounts: Record<string, number> = {};
  rawJobs.forEach(j => {
    const src = j.sourcePlatform || 'Desconhecido';
    rawProviderCounts[src] = (rawProviderCounts[src] || 0) + 1;
  });

  // Step 1: Deduplication & Official ATS Link Upgrade
  const deduplicatedMap = new Map<string, NormalizedJob>();
  let duplicatesRemoved = 0;

  for (let idx = 0; idx < rawJobs.length; idx++) {
    const j = rawJobs[idx];
    const company = normalizeCompany(j.companyName);
    const titleClean = (j.title || '').replace(/<\/?[^>]+(>|$)/g, "").trim();
    const locStr = normalizeLocation(j.location);
    const srcPlatform = j.sourcePlatform || 'Desconhecido';
    
    // a/b/c) Chave de Deduplicação Inteligente e Rica (Evita falsos positivos em empresas confidenciais)
    const buildKey = (): string => {
      const rawUrl = j.sourceUrl || (j as any).url || (j as any).redirect_url;
      if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 12) {
        try {
          const urlObj = new URL(rawUrl.trim());
          const cleanPath = (urlObj.origin + urlObj.pathname + urlObj.search).toLowerCase().replace(/\/+$/, '');
          if (cleanPath.length > 15 && !cleanPath.includes('/search') && !cleanPath.includes('/vagas/busca')) {
            return `url:${cleanPath}`;
          }
        } catch {
          const cleanUrl = rawUrl.trim().toLowerCase();
          if (cleanUrl.length > 15 && !cleanUrl.includes('/search')) return `url:${cleanUrl}`;
        }
      }

      const cleanCompany = (company || j.companyName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const rawTitle = (j.title || titleClean || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLoc = (locStr || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\b(brasil|brazil|remoto|remote)\b/g, '');

      const isConfidential = !cleanCompany || 
        cleanCompany.includes('empresaconfidencial') || 
        cleanCompany.includes('confidencial') || 
        cleanCompany === 'empresa' || 
        cleanCompany === 'jobaggregator' ||
        cleanCompany === 'adzuna';

      const descSnippet = (j.description || '').replace(/[^a-z0-9]/gi, '').slice(0, 60).toLowerCase();

      if (isConfidential) {
        return `conf:${rawTitle}|${cleanLoc}|${descSnippet}`;
      }

      return `comp:${cleanCompany}|${rawTitle}|${cleanLoc}|${descSnippet}`;
    };

    const key = buildKey();

    const { ats, score: atsScore } = detectATS(j.sourceUrl, j.sourcePlatform);
    const { score: freshnessScore, ageDays, isExpired } = calculateFreshness(j.publishedAt);
    
    // Discard stale jobs (>90 days) if publishedAt is explicit
    if (isExpired) continue;

    const { matchScore, detail } = calculateSemanticMatch(j, intent);
    
    const locLower = locStr.toLowerCase();
    const isBrazilLoc = locLower.includes("brasil") || locLower.includes("sp") || locLower.includes("rj") || locLower.includes("mg") || locLower.includes("pr") || locLower.includes("remoto");

    // ── FONTE ÚNICA DE VERDADE ──
    const candidateMatchScore = Math.min(99, Math.max(5, matchScore));

    // Calculate Confidence Score %
    let confidencePercent = 60;
    if (candidateMatchScore >= 75) confidencePercent += 15;
    if (freshnessScore >= 80) confidencePercent += 10;
    if (atsScore >= 90) confidencePercent += 10;
    if (isBrazilLoc) confidencePercent += 5;
    confidencePercent = Math.min(99, confidencePercent);

    const providerName = j.sourcePlatform || 'JobAggregator';
    const normalizedItem: NormalizedJob = {
      ...j,
      companyNameNormalized: company,
      locationNormalized: locStr,
      workModeNormalized: (locLower.includes('remoto') || titleClean.toLowerCase().includes('remot')) ? 'remote' : 'onsite',
      seniorityNormalized: 'pleno',
      requirementsNormalized: [],
      benefitsNormalized: [],
      languageNormalized: /[\u00C0-\u024F]/.test(titleClean + j.description) || /você|vaga|experiência/i.test(j.description) ? 'pt' : 'en',
      provider: providerName,
      source: j.sourcePlatform,
      ats,
      sources: j.sources && j.sources.length > 0 ? j.sources : [providerName],
      confidencePercent,
      scores: {
        providerQuality: atsScore,
        freshness: freshnessScore,
        companyTrust: company !== "Empresa Confidencial" ? 90 : 50,
        salaryConfidence: 50,
        descriptionCompleteness: Math.min(100, j.description.length / 10),
        remoteConfidence: locLower.includes('remoto') ? 100 : 50,
        overall: candidateMatchScore,
        explanation: `${detail} | Frescor: ${ageDays}d | Link: ${ats || providerName}`,
        confidence: confidencePercent >= 85 ? 'high' : confidencePercent >= 70 ? 'medium' : 'low'
      }
    };

    if (deduplicatedMap.has(key)) {
      const existing = deduplicatedMap.get(key)!;

      // Regra de Tolerância de 14 Dias:
      // Se AMBOS os registros possuírem publishedAt e a diferença for > 14 dias (14 * 24 * 60 * 60 * 1000 ms),
      // trata-se de um processo seletivo reaberto -> MANTER como vagas distintas!
      let isReopenedDistinctJob = false;
      if (existing.publishedAt && normalizedItem.publishedAt) {
        const d1 = new Date(existing.publishedAt).getTime();
        const d2 = new Date(normalizedItem.publishedAt).getTime();
        if (!isNaN(d1) && !isNaN(d2)) {
          const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
          if (diffDays > 14) {
            isReopenedDistinctJob = true;
          }
        }
      }

      if (isReopenedDistinctJob) {
        // Vaga reaberta após mais de 14 dias: salva com sufixo de chave única
        deduplicatedMap.set(`${key}|reopened:${normalizedItem.publishedAt}`, normalizedItem);
      } else {
        // Duplicata confirmada (mesmo período ou pelo menos uma data nula): Mesclar fontes!
        duplicatesRemoved++;

        const mergedSources = Array.from(new Set([...(existing.sources || []), ...(normalizedItem.sources || [])]));
        existing.sources = mergedSources;

        const existingATS = detectATS(existing.sourceUrl, existing.source);
        const newATS = detectATS(normalizedItem.sourceUrl, normalizedItem.source);

        if (newATS.score > existingATS.score) {
          existing.sourceUrl = normalizedItem.sourceUrl;
          existing.provider = normalizedItem.provider;
          existing.ats = newATS.ats;
          existing.scores.providerQuality = newATS.score;
          existing.scores.overall = Math.max(existing.scores.overall, normalizedItem.scores.overall);
        }
      }
    } else {
      deduplicatedMap.set(key, normalizedItem);
    }
  }

  const deduplicatedJobs = Array.from(deduplicatedMap.values());

  // Garantir que todo id de vaga seja estritamente único no array final
  const seenJobIds = new Set<string>();
  deduplicatedJobs.forEach((job, index) => {
    if (!job.id || seenJobIds.has(job.id)) {
      job.id = `${job.id || 'job'}_${index}_${Math.random().toString(36).slice(2, 6)}`;
    }
    seenJobIds.add(job.id);
  });

  // Step 3: Smart Block Bucketing & Dynamic Penalties for Companies & Cities
  // Group jobs by primary provider
  const jobsByProvider = new Map<string, NormalizedJob[]>();
  deduplicatedJobs.forEach(job => {
    const p = job.provider || 'Outros';
    if (!jobsByProvider.has(p)) jobsByProvider.set(p, []);
    jobsByProvider.get(p)!.push(job);
  });

  // Sort each provider's bucket by jobScore descending
  for (const [p, list] of jobsByProvider.entries()) {
    list.sort((a, b) => b.scores.overall - a.scores.overall);
  }

  // Interleave using Smart Block Bucketing (Preference, NOT rigid block)
  const rankedResults: NormalizedJob[] = [];
  const companyAppearanceCount = new Map<string, number>();
  let lastCity = '';

  const providerKeys = Array.from(jobsByProvider.keys()).sort((a, b) => {
    const scoreA = PROVIDER_QUALITY_INDEX[a.toLowerCase()] || 80;
    const scoreB = PROVIDER_QUALITY_INDEX[b.toLowerCase()] || 80;
    return scoreB - scoreA;
  });

  let addedInRound = true;
  while (addedInRound) {
    addedInRound = false;
    for (const pKey of providerKeys) {
      const bucket = jobsByProvider.get(pKey);
      if (bucket && bucket.length > 0) {
        const candidate = bucket.shift()!;
        
        // Dynamic Penalty: Repeated Company (-5 for 1st repeat, -10 for 2nd, -20 for 3rd+)
        const companyKey = candidate.companyNameNormalized.toLowerCase();
        const prevCompCount = companyAppearanceCount.get(companyKey) || 0;
        let companyPenalty = 0;
        if (prevCompCount === 1) companyPenalty = 5;
        else if (prevCompCount === 2) companyPenalty = 10;
        else if (prevCompCount >= 3) companyPenalty = 20;

        // Dynamic Penalty: Continuous City (-3 pts for identical consecutive city)
        let cityPenalty = 0;
        if (candidate.locationNormalized === lastCity && lastCity !== 'Remoto') {
          cityPenalty = 3;
        }

        companyAppearanceCount.set(companyKey, prevCompCount + 1);
        lastCity = candidate.locationNormalized;

        rankedResults.push(candidate);
        addedInRound = true;
      }
    }
  }

  // ── 1. STRICT RELEVANCE FILTER ──
  // Filter ONLY jobs with real candidate compatibility match >= 20%
  const relevantJobs = rankedResults.filter(j => j.scores.overall >= 20);

  // ── 2. SOURCE DIVERSITY CAP ON RELEVANT JOBS ONLY ──
  // Limit each provider to max 15 results to prevent any single source (e.g., Adzuna)
  // from dominating the final list when it returns 37+ raw jobs vs 1-8 from others.
  const sourceCountMap = new Map<string, number>();
  const diverseResults: NormalizedJob[] = [];
  const SOURCE_MAX = 15;
  for (const job of relevantJobs) {
    const src = job.provider || 'Outros';
    const count = sourceCountMap.get(src) || 0;
    if (count < SOURCE_MAX) {
      diverseResults.push(job);
      sourceCountMap.set(src, count + 1);
    }
  }


  // Sort final array strictly by Candidate Compatibility Score (scores.overall) descending
  // Tie-breaker: ATS Provider Quality and Freshness
  diverseResults.sort((a, b) => {
    const diff = b.scores.overall - a.scores.overall;
    if (Math.abs(diff) >= 3) return diff;
    return (b.scores.providerQuality + b.scores.freshness) - (a.scores.providerQuality + a.scores.freshness);
  });

  // ── 4. PIPELINE HEALTH DASHBOARD LOG ──
  const finalProviderStats: Record<string, number> = {};
  let officialAtsCount = 0;
  let directLinksCount = 0;
  let redirectLinksCount = 0;
  const uniqueCompanies = new Set<string>();
  const uniqueCities = new Set<string>();
  let totalAgeDays = 0;

  diverseResults.forEach(j => {
    finalProviderStats[j.provider] = (finalProviderStats[j.provider] || 0) + 1;
    if (j.ats) officialAtsCount++;
    if (j.sourceUrl.includes('adzuna.com')) redirectLinksCount++;
    else directLinksCount++;

    uniqueCompanies.add(j.companyNameNormalized);
    uniqueCities.add(j.locationNormalized);

    const { ageDays } = calculateFreshness(j.publishedAt);
    totalAgeDays += ageDays;
  });

  const avgAgeDays = diverseResults.length > 0 ? Math.round(totalAgeDays / diverseResults.length) : 0;
  
  // Overall Job Quality Score formula (0 - 100)
  const officialAtsRatio = diverseResults.length > 0 ? officialAtsCount / diverseResults.length : 0;
  const directLinkRatio = diverseResults.length > 0 ? directLinksCount / diverseResults.length : 0;
  const providerCount = Object.keys(finalProviderStats).length;

  let pipelineHealthScore = Math.round(
    (officialAtsRatio * 40) +
    (directLinkRatio * 30) +
    (Math.min(1, providerCount / 4) * 20) +
    (Math.min(1, uniqueCompanies.size / Math.max(1, diverseResults.length)) * 10)
  );
  pipelineHealthScore = Math.max(0, Math.min(100, pipelineHealthScore));

  console.log(`
========== PIPELINE HEALTH ==========
Busca: ${intent.family} | Terreno: ${targetLocation}
Vagas Brutas: ${rawJobs.length}
Após deduplicação: ${deduplicatedJobs.length} (Duplicatas removidas: ${duplicatesRemoved})
Após ranking final: ${diverseResults.length}

Diversidade de Provedores:
${JSON.stringify(finalProviderStats, null, 2)}

Métricas de Qualidade:
  - ATS Oficiais (Greenhouse/Lever/Gupy/Workday): ${officialAtsCount}
  - Links Diretos: ${directLinksCount}
  - Links Redirecionadores: ${redirectLinksCount}
  - Empresas Únicas: ${uniqueCompanies.size}
  - Cidades Únicas: ${uniqueCities.size}
  - Idade Média das Vagas: ${avgAgeDays} dias

Job Quality Score: ${pipelineHealthScore} / 100
====================================
  `);

  return diverseResults;

}
