/**
 * MATCHING_WEIGHTS - Configuração Centralizada de Pesos e Limiares da Fase 3
 * 
 * Define os pesos determinísticos para o cálculo independente de:
 * 1. Career Fit Score (Aderência ao perfil profissional atual)
 * 2. Career Goal Score (Potencial de alinhamento e transição de carreira)
 * 
 * Regra: Não espalhar números mágicos pelo código. Qualquer calibração de pesos
 * deve ser ajustada nesta estrutura única.
 */

export interface FitWeightsConfig {
  skills: number;        // Competências técnicas e ferramentas comprovadas (35%)
  experience: number;    // Relevância e anos de experiência profissional (25%)
  seniority: number;     // Compatibilidade de senioridade relativa (15%)
  domainContext: number; // Similaridade de contexto funcional e de negócio (15%)
  workModeLocation: number; // Modalidade (remoto/híbrido) e localização (10%)
}

export interface GoalWeightsConfig {
  targetRoleAlignment: number; // Proximidade do título e área desejada (35%)
  transferableSkills: number;  // Competências transferíveis mapeadas (25%)
  domainBridge: number;        // Conexão entre setor atual e setor-alvo (15%)
  skillGapOpportunity: number; // Oportunidade de aprendizado e expansão (15%)
  seniorityTrajectory: number; // Adequação da trajetória para o próximo passo (10%)
}

export interface TransitionThresholds {
  nearGapMax: number;        // Gap até 30% -> Transição Próxima
  moderateGapMax: number;    // Gap até 60% -> Transição Moderada
  challengingGapMax: number; // Gap até 85% -> Transição Desafiadora
  // Acima de 85% -> Transição Distante
}

export const MATCHING_WEIGHTS: {
  fit: FitWeightsConfig;
  goal: GoalWeightsConfig;
  thresholds: TransitionThresholds;
} = {
  fit: {
    skills: 0.35,
    experience: 0.25,
    seniority: 0.15,
    domainContext: 0.15,
    workModeLocation: 0.10
  },
  goal: {
    targetRoleAlignment: 0.35,
    transferableSkills: 0.25,
    domainBridge: 0.15,
    skillGapOpportunity: 0.15,
    seniorityTrajectory: 0.10
  },
  thresholds: {
    nearGapMax: 30,
    moderateGapMax: 60,
    challengingGapMax: 85
  }
};
