// ranking-config.ts

export const FEATURE_WEIGHTS: Record<string, number> = {
  TitleSimilarity: 0.35,
  SkillsCoverage: 0.30,
  DescriptionRelevance: 0.15,
  DepartmentSimilarity: 0.10,
  CompanyQuality: 0.05,
  Freshness: 0.05
};

export const GATING_THRESHOLDS = {
  TitleSimilarity: 0.20 // Limiar relaxado para Recall amplo
};

export const PENALTIES = {
  NegativeSignalsWeight: 15 // Penalidade máxima para sinais negativos na descrição ou título
};
