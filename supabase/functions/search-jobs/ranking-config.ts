// ranking-config.ts

export const FEATURE_WEIGHTS: Record<string, number> = {
  TitleSimilarity: 0.40,
  SkillsCoverage: 0.20,
  DepartmentSimilarity: 0.10,
  CompanyQuality: 0.10,
  Freshness: 0.10,
  LocationMatch: 0.10
};

export const GATING_THRESHOLDS = {
  TitleSimilarity: 0.30 // Vagas com similaridade de título inferior a este limiar serão imediatamente descartadas
};

export const PENALTIES = {
  NegativeSignalsWeight: 15 // Penalidade máxima para a presença de palavras-chave negativas na descrição
};
