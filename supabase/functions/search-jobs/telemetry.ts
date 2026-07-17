import { type NormalizedJob } from "./aggregator.ts";

export interface SearchMetrics {
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
  retrieverHits: {
    title: number;
    alias: number;
    skills: number;
    description: number;
  };
  funnel: {
    rawIngested: number;
    rawUnion: number;
    deduplicated: number;
    postHardFilters: number;
    postLtr: number;
  };
  marginalUtility: {
    uniqueTitle: number;
    uniqueAlias: number;
    uniqueSkills: number;
    uniqueDescription: number;
    intersection: number;
  };
  top20Contribution: {
    title: number;
    alias: number;
    skills: number;
    description: number;
  };
  dominantFeatures: Record<string, number>;
}

export function logSearchTelemetry(m: SearchMetrics, debug: boolean = false) {
  if (!debug) {
    // Modo Enxuto de Produção
    console.log("================ SEARCH TELEMETRY ================");
    console.log(`Raw Ingested Jobs......: ${m.funnel.rawIngested}`);
    console.log(`Deduplicated Candidates: ${m.funnel.deduplicated}`);
    console.log(`Final Returned (Cap)...: ${m.candidatesFiltered}`);
    console.log(`Avg LTR Score..........: ${m.averageScore.toFixed(2)}`);
    console.log(`Serving Latency........: ${m.latencyMs}ms`);
    console.log("==================================================");
    return;
  }

  // Modo Verboso de Depuração (debug=true)
  console.log("================ FUNNEL OBSERVABILITY ================");
  console.log(`Raw Ingested Jobs......: ${m.funnel.rawIngested}`);
  const raw = Math.max(1, m.funnel.rawIngested);
  console.log(`Title Retriever Hits...: ${m.retrieverHits.title} (yield: ${((m.retrieverHits.title / raw) * 100).toFixed(1)}%)`);
  console.log(`Alias Retriever Hits...: ${m.retrieverHits.alias} (yield: ${((m.retrieverHits.alias / raw) * 100).toFixed(1)}%)`);
  console.log(`Skills Retriever Hits..: ${m.retrieverHits.skills} (yield: ${((m.retrieverHits.skills / raw) * 100).toFixed(1)}%)`);
  console.log(`Desc Retriever Hits....: ${m.retrieverHits.description} (yield: ${((m.retrieverHits.description / raw) * 100).toFixed(1)}%)`);
  console.log(`------------------ MARGINAL UTILITY ------------------`);
  console.log(`Unique from Title......: ${m.marginalUtility.uniqueTitle}`);
  console.log(`Unique from Alias......: ${m.marginalUtility.uniqueAlias}`);
  console.log(`Unique from Skills.....: ${m.marginalUtility.uniqueSkills}`);
  console.log(`Unique from Description: ${m.marginalUtility.uniqueDescription}`);
  console.log(`Retriever Intersections: ${m.marginalUtility.intersection}`);
  console.log(`----------------- TOP 20 CONTRIBUTION ----------------`);
  console.log(`Title Retriever Hits...: ${m.top20Contribution.title}`);
  console.log(`Alias Retriever Hits...: ${m.top20Contribution.alias}`);
  console.log(`Skills Retriever Hits..: ${m.top20Contribution.skills}`);
  console.log(`Desc Retriever Hits....: ${m.top20Contribution.description}`);
  console.log(`----------------- DOMINANT FEATURES ------------------`);
  for (const [feat, count] of Object.entries(m.dominantFeatures)) {
    console.log(`${feat.padEnd(23)}: ${count} jobs`);
  }
  console.log(`------------------------------------------------------`);
  console.log(`Raw Union Pool Size....: ${m.funnel.rawUnion}`);
  console.log(`Deduplicated Candidates: ${m.funnel.deduplicated}`);
  console.log(`Rejected by Location...: -${m.rejectedByLocation}`);
  console.log(`Rejected by Seniority..: -${m.rejectedBySeniority}`);
  console.log(`Post Hard Filters......: ${m.funnel.postHardFilters}`);
  console.log(`Post LTR Ranking.......: ${m.funnel.postLtr}`);
  console.log(`Final Returned (Cap)...: ${m.candidatesFiltered}`);
  console.log(`Avg LTR Score..........: ${m.averageScore.toFixed(2)}`);
  console.log(`Threshold Applied......: ${m.threshold.toFixed(2)}`);
  console.log(`Gemini Intent Used.....: ${m.geminiUsed}`);
  console.log(`Serving Latency........: ${m.latencyMs}ms`);
  console.log(`Leading LTR Signals....: ${m.topFeatures.join(', ')}`);
  console.log("======================================================");
}

// 1. Calcular Utilidade Marginal (Unicidade de Recuperação) no pool deduplicado (candidates)
export function calculateMarginalUtility(candidates: NormalizedJob[]) {
  let uniqueTitle = 0;
  let uniqueAlias = 0;
  let uniqueSkills = 0;
  let uniqueDescription = 0;
  let intersection = 0;

  for (const j of candidates) {
    const ev = (j as any)._retrievalEvidence;
    if (!ev) continue;
    
    // Obter scores numéricos contínuos de recuperação
    const tScore = ev.title?.score || 0.0;
    const aScore = ev.alias?.score || 0.0;
    const sScore = ev.skills?.score || 0.0;
    const dScore = ev.description?.score || 0.0;

    const activeCount = (tScore > 0 ? 1 : 0) +
                        (aScore > 0 ? 1 : 0) +
                        (sScore > 0 ? 1 : 0) +
                        (dScore > 0 ? 1 : 0);

    if (activeCount > 1) {
      intersection++;
    } else if (activeCount === 1) {
      if (tScore > 0) uniqueTitle++;
      else if (aScore > 0) uniqueAlias++;
      else if (sScore > 0) uniqueSkills++;
      else if (dScore > 0) uniqueDescription++;
    }
  }

  return {
    uniqueTitle,
    uniqueAlias,
    uniqueSkills,
    uniqueDescription,
    intersection
  };
}

// 2. Calcular Contribuição dos retrievers no Top 20 resultados finais
export function calculateTop20Contribution(top20Jobs: NormalizedJob[]) {
  let title = 0;
  let alias = 0;
  let skills = 0;
  let description = 0;

  for (const j of top20Jobs) {
    const ev = j.scores.explainability?.retrievalEvidence;
    if (!ev) continue;
    
    const tScore = ev.title?.score || 0.0;
    const aScore = ev.alias?.score || 0.0;
    const sScore = ev.skills?.score || 0.0;
    const dScore = ev.description?.score || 0.0;

    if (tScore > 0) title++;
    if (aScore > 0) alias++;
    if (sScore > 0) skills++;
    if (dScore > 0) description++;
  }

  return {
    title,
    alias,
    skills,
    description
  };
}

// 3. Calcular a Feature Dominante (LTR Feature com maior contribuição ponderada) no Top 20
export function calculateDominantFeatures(top20Jobs: NormalizedJob[]) {
  const counts: Record<string, number> = {};
  for (const j of top20Jobs) {
    const breakdown = j.scores.explainability?.feature_breakdown;
    if (!breakdown) continue;
    
    let maxCont = -1;
    let dominant = "None";
    
    for (const [feat, val] of Object.entries(breakdown)) {
      const contribution = val.score * val.contribution;
      if (contribution > maxCont) {
        maxCont = contribution;
        dominant = feat;
      }
    }
    
    counts[dominant] = (counts[dominant] || 0) + 1;
  }
  return counts;
}
