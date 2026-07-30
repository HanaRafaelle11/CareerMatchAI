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

  if (ageDays > 90) return { score: 0, ageDays, isExpired: true };
  if (ageDays <= 1) return { score: 100, ageDays, isExpired: false }; // 0-24h: +15
  if (ageDays <= 3) return { score: 90, ageDays, isExpired: false };  // 1-3d: +12
  if (ageDays <= 7) return { score: 80, ageDays, isExpired: false };  // 4-7d: +8
  if (ageDays <= 15) return { score: 70, ageDays, isExpired: false }; // 8-15d: +5
  if (ageDays <= 30) return { score: 60, ageDays, isExpired: false }; // 16-30d: +2
  if (ageDays <= 60) return { score: 50, ageDays, isExpired: false }; // 31-60d: 0
  return { score: 30, ageDays, isExpired: false };                    // 61-90d: -5
}

// Calculate Semantic Similarity Match Score (0 - 100) — SINGLE SOURCE OF TRUTH FOR CANDIDATE MATCH
function calculateSemanticMatch(
  j: RawJob,
  intent: JobIntent
): { matchScore: number; detail: string } {
  const titleClean = j.title.replace(/<\/?[^>]+(>|$)/g, "").trim();
  const titleLower = titleClean.toLowerCase();
  const descLower = (j.description || '').toLowerCase();
  const combinedText = `${titleLower} ${descLower}`;
  const rawQuery = (intent.raw_query || '').toLowerCase();

  let score = 35;
  let detail = "compatibilidade inicial";

  const matchedPrimary = intent.primary_titles.some(t => {
    const tLower = t.toLowerCase().trim();
    return titleLower.includes(tLower) || tLower.includes(titleLower);
  });

  if (matchedPrimary) {
    score = 88;
    detail = "correspondência exata de cargo";
  } else {
    const matchedSecondary = intent.secondary_titles.some(t => {
      const tLower = t.toLowerCase().trim();
      return titleLower.includes(tLower) || tLower.includes(titleLower);
    });

    if (matchedSecondary) {
      score = 75;
      detail = "cargo correlato relevante";
    } else {
      const tokensToMatch = new Set<string>();
      intent.primary_titles.forEach(t => t.toLowerCase().split(/\s+/).forEach(w => {
        const cleaned = w.replace(/[^\w]/g, "");
        if (cleaned.length >= 2 && !['de', 'da', 'do', 'das', 'dos', 'em', 'para', 'com', 'e', 'a', 'o', 'of', 'for', 'in', 'and'].includes(cleaned)) {
          tokensToMatch.add(cleaned);
        }
      }));

      const titleWords = titleLower.split(/\s+/).map(w => w.replace(/[^\w]/g, "")).filter(w => w.length >= 2);
      const overlapCount = titleWords.filter(w => tokensToMatch.has(w)).length;
      if (overlapCount > 0) {
        score = Math.min(68, 40 + (overlapCount * 14));
        detail = "sobreposição parcial de palavra-chave";
      }
    }
  }

  // ── ALINHAMENTO DE SENIORIDADE E NÍVEL HIERÁRQUICO ──
  const isSupervisorRequested = /\b(supervisor|supervisora|coordenador|coordenadora|líder|lider|gerente)\b/i.test(rawQuery);
  const isSeniorRequested = /\b(sênior|senior|sr|lead|principal)\b/i.test(rawQuery);
  const isJuniorRequested = /\b(júnior|junior|jr|estagiário|estagiario|assistente)\b/i.test(rawQuery);

  if (isSupervisorRequested) {
    const isSupervisorJob = /\b(supervisor|supervisora|coordenador|coordenadora|líder|lider|gerente|head)\b/i.test(titleLower);
    const isJuniorJob = /\b(agente|assistente|estagiário|estagiario|júnior|junior|jr)\b/i.test(titleLower);
    
    if (isSupervisorJob) {
      score = Math.min(99, score + 10);
      detail += " + liderança aderente";
    } else if (isJuniorJob) {
      score = Math.max(5, score - 40); // Penaliza níveis operacionais/júnior em busca de supervisão
      detail += " - penalidade por nível operacional em busca de liderança";
    }
  } else if (isSeniorRequested) {
    const isSeniorJob = /\b(sênior|senior|sr|lead|principal|head)\b/i.test(titleLower);
    const isJuniorJob = /\b(júnior|junior|jr|estagiário|estagiario)\b/i.test(titleLower);
    if (isSeniorJob) {
      score = Math.min(99, score + 10);
    } else if (isJuniorJob) {
      score = Math.max(5, score - 35);
    }
  } else if (isJuniorRequested) {
    const isJuniorJob = /\b(júnior|junior|jr|estagiário|estagiario|assistente)\b/i.test(titleLower);
    const isSeniorJob = /\b(sênior|senior|sr|lead|gerente|head)\b/i.test(titleLower);
    if (isJuniorJob) {
      score = Math.min(99, score + 10);
    } else if (isSeniorJob) {
      score = Math.max(5, score - 35);
    }
  }

  // Bonus for matched skills
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

    const skillBonus = Math.min(10, Math.round((matchedSkillsCount / intent.skills.length) * 10));
    score = Math.min(99, score + skillBonus);
  }

  return { matchScore: score, detail };
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
  _targetLocation: string
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
    const key = `${company.toLowerCase()}|${titleClean.toLowerCase()}`;

    const { ats, score: atsScore } = detectATS(j.sourceUrl, j.sourcePlatform);
    const { score: freshnessScore, ageDays, isExpired } = calculateFreshness(j.publishedAt);
    
    // Discard stale jobs (>90 days) if publishedAt is explicit
    if (isExpired) continue;

    const { matchScore, detail } = calculateSemanticMatch(j, intent);
    
    const locLower = locStr.toLowerCase();
    const isBrazilLoc = locLower.includes("brasil") || locLower.includes("sp") || locLower.includes("rj") || locLower.includes("mg") || locLower.includes("pr") || locLower.includes("remoto");

    // ── FONTE ÚNICA DE VERDADE ──
    // scores.overall É O SCORE DE COMPATIBILIDADE CANDIDATO-VAGA (0 - 100%).
    // O jobScore/rankingScore de frescor e ATS é mantido apenas como critério interno de desempate.
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
        overall: candidateMatchScore, // FONTE ÚNICA DE VERDADE PARA MATCH DO CANDIDATO
        explanation: `${detail} | Frescor: ${ageDays}d | Link: ${ats || providerName}`,
        confidence: confidencePercent >= 85 ? 'high' : confidencePercent >= 70 ? 'medium' : 'low'
      }
    };

    if (deduplicatedMap.has(key)) {
      duplicatesRemoved++;
      const existing = deduplicatedMap.get(key)!;

      // Merge sources array
      const mergedSources = Array.from(new Set([...(existing.sources || []), ...(normalizedItem.sources || [])]));
      existing.sources = mergedSources;

      // Priority upgrade: Replace Adzuna redirect link if an official ATS or direct URL is found
      const existingATS = detectATS(existing.sourceUrl, existing.source);
      const newATS = detectATS(normalizedItem.sourceUrl, normalizedItem.source);

      if (newATS.score > existingATS.score) {
        existing.sourceUrl = normalizedItem.sourceUrl;
        existing.provider = normalizedItem.provider;
        existing.ats = newATS.ats;
        existing.scores.providerQuality = newATS.score;
        existing.scores.overall = Math.max(existing.scores.overall, normalizedItem.scores.overall);
      }
    } else {
      deduplicatedMap.set(key, normalizedItem);
    }
  }

  const deduplicatedJobs = Array.from(deduplicatedMap.values());

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

  // Filter ONLY jobs with candidate compatibility match >= 20%
  const relevantJobs = rankedResults.filter(j => j.scores.overall >= 20);

  // Sort final array strictly by Candidate Compatibility Score (scores.overall) descending
  // Tie-breaker: ATS Provider Quality and Freshness
  relevantJobs.sort((a, b) => {
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

  rankedResults.forEach(j => {
    finalProviderStats[j.provider] = (finalProviderStats[j.provider] || 0) + 1;
    if (j.ats) officialAtsCount++;
    if (j.sourceUrl.includes('adzuna.com')) redirectLinksCount++;
    else directLinksCount++;

    uniqueCompanies.add(j.companyNameNormalized);
    uniqueCities.add(j.locationNormalized);

    const { ageDays } = calculateFreshness(j.publishedAt);
    totalAgeDays += ageDays;
  });

  const avgAgeDays = rankedResults.length > 0 ? Math.round(totalAgeDays / rankedResults.length) : 0;
  
  // Overall Job Quality Score formula (0 - 100)
  const officialAtsRatio = rankedResults.length > 0 ? officialAtsCount / rankedResults.length : 0;
  const directLinkRatio = rankedResults.length > 0 ? directLinksCount / rankedResults.length : 0;
  const providerCount = Object.keys(finalProviderStats).length;

  let pipelineHealthScore = Math.round(
    (officialAtsRatio * 40) +
    (directLinkRatio * 30) +
    (Math.min(1, providerCount / 4) * 20) +
    (Math.min(1, uniqueCompanies.size / Math.max(1, rankedResults.length)) * 10)
  );
  pipelineHealthScore = Math.max(0, Math.min(100, pipelineHealthScore));

  console.log(`
========== PIPELINE HEALTH ==========
Busca: ${intent.family} | Terreno: ${searchLocation}
Vagas Brutas: ${rawJobs.length}
Após deduplicação: ${deduplicatedJobs.length} (Duplicatas removidas: ${duplicatesRemoved})
Após ranking final: ${rankedResults.length}

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

  return relevantJobs;
}
