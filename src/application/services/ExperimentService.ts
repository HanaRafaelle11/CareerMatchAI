// src/application/services/ExperimentService.ts
import { tracker } from '../../infrastructure/analytics/tracker';

export type ExperimentVariant = 'CONTROL' | 'VARIANT_A' | 'VARIANT_B';
export type ExperimentStatus = 'ACTIVE' | 'PAUSED' | 'CONCLUDED' | 'DISABLED';
export type ExperimentDecision = 'WIN' | 'LOSS' | 'INCONCLUSIVE' | 'INSUFFICIENT_SAMPLE' | 'BROKEN' | 'STALE';

export interface ExperimentDefinition {
  id: string;
  name: string;
  hypothesis: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  rolloutPercentage: number; // 0 to 100
  primaryMetric: string;
  secondaryMetrics: string[];
  guardrailMetrics: string[];
  minimumSampleSize: number;
  minimumDetectableEffect: number; // e.g. 0.05 for 5%
  createdAt: string;
  concludedAt?: string;
}

export interface ExperimentVariantStats {
  variant: ExperimentVariant;
  assignedCount: number;
  exposedCount: number;
  convertedCount: number;
  conversionRate: number;
}

export interface ExperimentEvaluation {
  experimentId: string;
  name: string;
  status: ExperimentStatus;
  primaryMetric: string;
  totalExposed: number;
  stats: Record<ExperimentVariant, ExperimentVariantStats>;
  absoluteUplift: number;
  relativeUplift: number;
  confidenceScore: number;
  guardrailsViolated: string[];
  decision: ExperimentDecision;
  decisionRationale: string;
}

export const EXPERIMENTS_REGISTRY: Record<string, ExperimentDefinition> = {
  exp_assisted_onboarding_p0: {
    id: 'exp_assisted_onboarding_p0',
    name: 'P0: Onboarding Assistido Híbrido',
    hypothesis: 'Permitir que o usuário informe objetivo e 3 skills antes do upload de PDF reduz o drop-off inicial no mobile.',
    status: 'ACTIVE',
    variants: ['CONTROL', 'VARIANT_A'],
    rolloutPercentage: 50,
    primaryMetric: 'ACTIVATION_RATE',
    secondaryMetrics: ['CV_UPLOAD_RATE', 'FIRST_MATCH_VIEW_RATE'],
    guardrailMetrics: ['ERROR_RATE', 'TIME_TO_VALUE_P50', 'D7_RETENTION'],
    minimumSampleSize: 200,
    minimumDetectableEffect: 0.10,
    createdAt: '2026-08-19T12:00:00.000Z'
  },
  exp_match_explanation_p1: {
    id: 'exp_match_explanation_p1',
    name: 'P1: Explicabilidade Pró-Ativa no Card de Vaga',
    hypothesis: 'Apresentar 3 pontos fortes de match diretamente no card para vagas de fit 70-79% eleva a conversão para candidatura.',
    status: 'ACTIVE',
    variants: ['CONTROL', 'VARIANT_A'],
    rolloutPercentage: 50,
    primaryMetric: 'MATCH_TO_MEANINGFUL_ACTION_RATE',
    secondaryMetrics: ['JOB_SAVED_RATE', 'APPLY_CLICK_RATE'],
    guardrailMetrics: ['MATCH_REJECTED_RATE', 'RENDER_LATENCY_MS'],
    minimumSampleSize: 300,
    minimumDetectableEffect: 0.08,
    createdAt: '2026-08-19T12:00:00.000Z'
  },
  exp_paywall_value_p2: {
    id: 'exp_paywall_value_p2',
    name: 'P2: Amostra Interativa de Feedback STAR',
    hypothesis: 'Exibir uma análise prévia detalhada da 1ª resposta na simulação STAR eleva a conversão para assinatura Pro.',
    status: 'ACTIVE',
    variants: ['CONTROL', 'VARIANT_A'],
    rolloutPercentage: 50,
    primaryMetric: 'PAYWALL_TO_PAID_RATE',
    secondaryMetrics: ['PAYWALL_TO_CHECKOUT', 'CHECKOUT_TO_PAID'],
    guardrailMetrics: ['AI_COST_PER_ACTIVATED_USER', 'REFUND_RATE'],
    minimumSampleSize: 150,
    minimumDetectableEffect: 0.15,
    createdAt: '2026-08-19T12:00:00.000Z'
  }
};

export class ExperimentService {
  /**
   * Deterministic Murmur-like hash function for stable user assignment
   */
  public static hash(key: string): number {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = (h << 5) - h + key.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  /**
   * Assigns a variant deterministically to a user without any random flip on re-render.
   */
  public static assignVariant(experimentId: string, userId: string | null | undefined): ExperimentVariant {
    const experiment = EXPERIMENTS_REGISTRY[experimentId];
    if (!experiment || experiment.status === 'DISABLED' || experiment.status === 'PAUSED') {
      return 'CONTROL';
    }

    if (experiment.rolloutPercentage <= 0) {
      return 'CONTROL';
    }

    // Use stable ID (user_id or anonymous session fallback)
    const subjectId = userId || tracker.getSessionId() || 'anon_subject';
    const hashValue = this.hash(`${subjectId}_${experimentId}`);

    // Check rollout inclusion
    const rolloutBucket = hashValue % 100;
    if (rolloutBucket >= experiment.rolloutPercentage) {
      return 'CONTROL';
    }

    // Assign variant according to variant list
    const variantIndex = (hashValue >> 8) % experiment.variants.length;
    return experiment.variants[variantIndex] || 'CONTROL';
  }

  /**
   * Records that an assigned user was genuinely exposed to the experiment UI/feature.
   */
  public static trackExposure(experimentId: string, variant: ExperimentVariant, metadata: any = {}) {
    tracker.trackExperimentExposed(experimentId, variant, metadata);
  }

  /**
   * Records a conversion event for an active experiment.
   */
  public static trackConversion(
    experimentId: string,
    variant: ExperimentVariant,
    metricName: string,
    value: number = 1,
    metadata: any = {}
  ) {
    tracker.trackExperimentConversion(experimentId, variant, metricName, value, metadata);
  }

  /**
   * Evaluates experiment results deterministically based on real observed numbers.
   */
  public static evaluateExperiment(
    experimentId: string,
    realStats: {
      control: { exposed: number; converted: number };
      variantA: { exposed: number; converted: number };
      guardrailViolations?: string[];
    }
  ): ExperimentEvaluation {
    const experiment = EXPERIMENTS_REGISTRY[experimentId];
    const def: ExperimentDefinition = experiment || {
      id: experimentId,
      name: experimentId,
      hypothesis: '',
      status: 'ACTIVE',
      variants: ['CONTROL', 'VARIANT_A'],
      rolloutPercentage: 50,
      primaryMetric: 'PRIMARY_RATE',
      secondaryMetrics: [],
      guardrailMetrics: [],
      minimumSampleSize: 100,
      minimumDetectableEffect: 0.10,
      createdAt: new Date().toISOString()
    };

    const ctrlExposed = realStats.control.exposed;
    const ctrlConverted = realStats.control.converted;
    const ctrlRate = ctrlExposed > 0 ? (ctrlConverted / ctrlExposed) * 100 : 0.0;

    const varAExposed = realStats.variantA.exposed;
    const varAConverted = realStats.variantA.converted;
    const varARate = varAExposed > 0 ? (varAConverted / varAExposed) * 100 : 0.0;

    const totalExposed = ctrlExposed + varAExposed;
    const absoluteUplift = varARate - ctrlRate;
    const relativeUplift = ctrlRate > 0 ? ((varARate - ctrlRate) / ctrlRate) * 100 : 0.0;

    const stats: Record<ExperimentVariant, ExperimentVariantStats> = {
      CONTROL: {
        variant: 'CONTROL',
        assignedCount: ctrlExposed,
        exposedCount: ctrlExposed,
        convertedCount: ctrlConverted,
        conversionRate: ctrlRate
      },
      VARIANT_A: {
        variant: 'VARIANT_A',
        assignedCount: varAExposed,
        exposedCount: varAExposed,
        convertedCount: varAConverted,
        conversionRate: varARate
      },
      VARIANT_B: {
        variant: 'VARIANT_B',
        assignedCount: 0,
        exposedCount: 0,
        convertedCount: 0,
        conversionRate: 0
      }
    };

    const guardrails = realStats.guardrailViolations || [];

    // Decision Logic
    let decision: ExperimentDecision = 'INSUFFICIENT_SAMPLE';
    let decisionRationale = `Amostra total (${totalExposed}) inferior ao tamanho mínimo requerido (${def.minimumSampleSize}).`;
    let confidenceScore = 0;

    if (totalExposed >= def.minimumSampleSize) {
      // Simplified deterministic Z-score / confidence estimation
      const pooledRate = (ctrlConverted + varAConverted) / totalExposed;
      const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / ctrlExposed + 1 / varAExposed));
      const zScore = se > 0 ? (varAConverted / varAExposed - ctrlConverted / ctrlExposed) / se : 0;
      confidenceScore = Math.min(99.9, Math.max(0, Math.round((1 - Math.exp(-Math.abs(zScore) * 1.5)) * 100)));

      if (guardrails.length > 0) {
        decision = 'LOSS';
        decisionRationale = `Violação de guardrails detectada: ${guardrails.join(', ')}. Não elegível para WIN.`;
      } else if (zScore > 1.96 && relativeUplift >= def.minimumDetectableEffect * 100) {
        decision = 'WIN';
        decisionRationale = `Variante A superou o Controle com significância estatística (+${relativeUplift.toFixed(1)}% uplift, confiança ${confidenceScore}%).`;
      } else if (zScore < -1.96) {
        decision = 'LOSS';
        decisionRationale = `Variante A performou estatisticamente pior que o Controle (${relativeUplift.toFixed(1)}% drop).`;
      } else {
        decision = 'INCONCLUSIVE';
        decisionRationale = `Diferença entre variantes não atingiu significância estatística dentro da margem de confiança.`;
      }
    }

    return {
      experimentId,
      name: def.name,
      status: def.status,
      primaryMetric: def.primaryMetric,
      totalExposed,
      stats,
      absoluteUplift,
      relativeUplift,
      confidenceScore,
      guardrailsViolated: guardrails,
      decision,
      decisionRationale
    };
  }
}
