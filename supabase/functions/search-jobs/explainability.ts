import { type NormalizedJob } from "./aggregator.ts";
import { type JobIntent } from "./connectors/BaseJobConnector.ts";
import { FEATURE_WEIGHTS } from "./ranking-config.ts";

export function formatExplainability(
  j: NormalizedJob,
  intent: JobIntent,
  overallScore: number,
  confidence: "high" | "medium" | "low",
  featuresScore: Record<string, number>,
  matchedTitleStr: string,
  matchedSkillsList: string[],
  boosts: string[],
  penaltiesList: string[]
) {
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
  
  const titleSim = featuresScore["TitleSimilarity"] || 0.0;
  const skillsSim = featuresScore["SkillsCoverage"] || 0.0;
  const descRelevance = featuresScore["DescriptionRelevance"] || 0.0;

  const explanationPtBRStr = `Vaga encontrada por similaridade de título (${Math.round(titleSim * 100)}%). ` +
    `Encontradas ${matchedSkillsList.length} competências (${matchedSkillsList.slice(0, 3).join(', ')}). ` +
    `Nível de correspondência: ${confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Boa' : 'Parcial'}.`;

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
    explanation_ptBR: explanationPtBRStr,
    retrievalEvidence: (j as any)._retrievalEvidence || {
      title: { score: 0.0, method: "cosine_title" },
      alias: { score: 0.0, method: "taxonomy_aliases" },
      skills: { score: 0.0, matched: 0, total: 0 },
      description: { score: 0.0, method: "keyword_overlap" }
    }
  };
}
