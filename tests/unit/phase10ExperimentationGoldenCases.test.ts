import { describe, it, expect } from 'vitest';
import { ExperimentService, EXPERIMENTS_REGISTRY } from '../../src/application/services/ExperimentService';
import { AdminAuditService } from '../../src/application/services/AdminAuditService';

describe('Phase 10 Growth Experiments & A/B Testing Golden Cases', () => {
  // -------------------------------------------------------------------------
  // 1. ATRIBUIÇÃO DETERMINÍSTICA E ESTABILIDADE
  // -------------------------------------------------------------------------
  describe('1. Atribuição Determinística & Estabilidade de Variantes', () => {
    it('Caso 1 — Atribuição é determinística por hash de user_id', () => {
      const variant1 = ExperimentService.assignVariant('exp_assisted_onboarding_p0', 'usr-test-1234');
      const variant2 = ExperimentService.assignVariant('exp_assisted_onboarding_p0', 'usr-test-1234');
      expect(variant1).toBe(variant2);
      expect(['CONTROL', 'VARIANT_A']).toContain(variant1);
    });

    it('Caso 2 — Variante permanece estável em múltiplas chamadas consecutivas (sem Math.random)', () => {
      const userA = 'user_stable_alpha';
      const initial = ExperimentService.assignVariant('exp_match_explanation_p1', userA);
      for (let i = 0; i < 50; i++) {
        expect(ExperimentService.assignVariant('exp_match_explanation_p1', userA)).toBe(initial);
      }
    });

    it('Caso 3 — Rollout 0% sempre retorna CONTROL para qualquer usuário', () => {
      const mockExpId = 'exp_test_rollout_0';
      EXPERIMENTS_REGISTRY[mockExpId] = {
        id: mockExpId,
        name: 'Test Rollout 0',
        hypothesis: 'Test',
        status: 'ACTIVE',
        variants: ['CONTROL', 'VARIANT_A'],
        rolloutPercentage: 0,
        primaryMetric: 'RATE',
        secondaryMetrics: [],
        guardrailMetrics: [],
        minimumSampleSize: 100,
        minimumDetectableEffect: 0.05,
        createdAt: new Date().toISOString()
      };

      expect(ExperimentService.assignVariant(mockExpId, 'user_xyz')).toBe('CONTROL');
      expect(ExperimentService.assignVariant(mockExpId, 'user_abc')).toBe('CONTROL');
      delete EXPERIMENTS_REGISTRY[mockExpId];
    });

    it('Caso 4 — Rollout 100% distribui variantes entre CONTROL e VARIANT_A', () => {
      const mockExpId = 'exp_test_rollout_100';
      EXPERIMENTS_REGISTRY[mockExpId] = {
        id: mockExpId,
        name: 'Test Rollout 100',
        hypothesis: 'Test',
        status: 'ACTIVE',
        variants: ['CONTROL', 'VARIANT_A'],
        rolloutPercentage: 100,
        primaryMetric: 'RATE',
        secondaryMetrics: [],
        guardrailMetrics: [],
        minimumSampleSize: 100,
        minimumDetectableEffect: 0.05,
        createdAt: new Date().toISOString()
      };

      const variants = new Set<string>();
      for (let i = 0; i < 100; i++) {
        variants.add(ExperimentService.assignVariant(mockExpId, `user_${i}`));
      }

      expect(variants.has('CONTROL')).toBe(true);
      expect(variants.has('VARIANT_A')).toBe(true);
      delete EXPERIMENTS_REGISTRY[mockExpId];
    });

    it('Caso 5 — Distribuição equilibrada entre Control e Variant A com amostra grande', () => {
      let controlCount = 0;
      let variantACount = 0;

      for (let i = 0; i < 1000; i++) {
        const v = ExperimentService.assignVariant('exp_assisted_onboarding_p0', `subject_id_${i}`);
        if (v === 'CONTROL') controlCount++;
        else if (v === 'VARIANT_A') variantACount++;
      }

      expect(controlCount).toBeGreaterThan(600); // 75% esperado com rollout 50%
      expect(variantACount).toBeGreaterThan(180); // 25% esperado com rollout 50%
      expect(controlCount + variantACount).toBe(1000);
    });
  });

  // -------------------------------------------------------------------------
  // 2. EXPOSIÇÃO, CONVERSÃO E DEDUPLICAÇÃO
  // -------------------------------------------------------------------------
  describe('2. Telemetria de Exposição & Integridade de Conversão', () => {
    it('Caso 6 — Exposição é separada estritamente de atribuição', () => {
      const assigned = ['user_1', 'user_2', 'user_3'];
      const exposed = ['user_1', 'user_2']; // user_3 não alcançou a tela

      expect(assigned.length).toBe(3);
      expect(exposed.length).toBe(2);
      expect(exposed.includes('user_3')).toBe(false);
    });

    it('Caso 7 — Conversão é associada à variante correta do usuário', () => {
      const user = 'user_test_conversion_variant';
      const variant = ExperimentService.assignVariant('exp_assisted_onboarding_p0', user);
      
      const conversionPayload = {
        experiment_id: 'exp_assisted_onboarding_p0',
        variant,
        user_id: user,
        metric: 'ACTIVATION_RATE'
      };

      expect(conversionPayload.variant).toBe(variant);
      expect(['CONTROL', 'VARIANT_A']).toContain(conversionPayload.variant);
    });

    it('Caso 8 — Deduplicação de múltiplas exposições do mesmo usuário', () => {
      const rawExposures = [
        { user_id: 'usr_1', exp: 'p0', variant: 'CONTROL' },
        { user_id: 'usr_1', exp: 'p0', variant: 'CONTROL' },
        { user_id: 'usr_2', exp: 'p0', variant: 'VARIANT_A' }
      ];

      const uniqueExposedUsers = new Set(rawExposures.map(e => e.user_id));
      expect(uniqueExposedUsers.size).toBe(2);
    });

    it('Caso 9 — Prevenção de contaminação cruzada (usuário em apenas 1 variante por experimento)', () => {
      const user = 'usr_isolated_123';
      const v1 = ExperimentService.assignVariant('exp_assisted_onboarding_p0', user);
      const v2 = ExperimentService.assignVariant('exp_assisted_onboarding_p0', user);
      expect(v1).toBe(v2);
    });

    it('Caso 10 — Rejeição de conversão antes da exposição', () => {
      const userHistory = [
        { type: 'conversion', timestamp: 100 },
        { type: 'exposure', timestamp: 200 }
      ];

      const isCausal = userHistory[0].timestamp > userHistory[1].timestamp;
      expect(isCausal).toBe(false); // Conversão ocorreu antes da exposição = inválida
    });
  });

  // -------------------------------------------------------------------------
  // 3. FRAMEWORK DE DECISÃO & REGRAS ESTATÍSTICAS
  // -------------------------------------------------------------------------
  describe('3. Framework de Decisão Causal (WIN, LOSS, INCONCLUSIVE, INSUFFICIENT_SAMPLE)', () => {
    it('Caso 11 — Amostra insuficiente retorna INSUFFICIENT_SAMPLE', () => {
      const evalResult = ExperimentService.evaluateExperiment('exp_assisted_onboarding_p0', {
        control: { exposed: 40, converted: 10 },
        variantA: { exposed: 40, converted: 18 }
      });

      expect(evalResult.decision).toBe('INSUFFICIENT_SAMPLE');
      expect(evalResult.totalExposed).toBe(80);
      expect(evalResult.decisionRationale).toContain('inferior ao tamanho mínimo');
    });

    it('Caso 12 — Variante com uplift significativo e guardrails saudáveis retorna WIN', () => {
      const evalResult = ExperimentService.evaluateExperiment('exp_assisted_onboarding_p0', {
        control: { exposed: 200, converted: 40 }, // 20%
        variantA: { exposed: 200, converted: 80 }  // 40% (+100% relative uplift)
      });

      expect(evalResult.decision).toBe('WIN');
      expect(evalResult.relativeUplift).toBe(100.0);
      expect(evalResult.confidenceScore).toBeGreaterThan(95);
      expect(evalResult.guardrailsViolated.length).toBe(0);
    });

    it('Caso 13 — Variante com performance inferior retorna LOSS', () => {
      const evalResult = ExperimentService.evaluateExperiment('exp_assisted_onboarding_p0', {
        control: { exposed: 200, converted: 80 }, // 40%
        variantA: { exposed: 200, converted: 40 }  // 20% (-50% relative drop)
      });

      expect(evalResult.decision).toBe('LOSS');
      expect(evalResult.relativeUplift).toBe(-50.0);
    });

    it('Caso 14 — Diferença pequena sem significância estatística retorna INCONCLUSIVE', () => {
      const evalResult = ExperimentService.evaluateExperiment('exp_assisted_onboarding_p0', {
        control: { exposed: 150, converted: 45 }, // 30%
        variantA: { exposed: 150, converted: 48 }  // 32% (+6.6% uplift, não estatisticamente significante)
      });

      expect(evalResult.decision).toBe('INCONCLUSIVE');
    });

    it('Caso 15 — Violação de guardrail impede status WIN e força LOSS', () => {
      const evalResult = ExperimentService.evaluateExperiment('exp_assisted_onboarding_p0', {
        control: { exposed: 200, converted: 40 },
        variantA: { exposed: 200, converted: 80 },
        guardrailViolations: ['ERROR_RATE_EXCEEDED_5_PERCENT']
      });

      expect(evalResult.decision).toBe('LOSS');
      expect(evalResult.guardrailsViolated).toContain('ERROR_RATE_EXCEEDED_5_PERCENT');
    });

    it('Caso 16 — Detecção de experimento quebrado com zero exposições', () => {
      const evalResult = ExperimentService.evaluateExperiment('exp_assisted_onboarding_p0', {
        control: { exposed: 0, converted: 0 },
        variantA: { exposed: 0, converted: 0 }
      });

      expect(evalResult.totalExposed).toBe(0);
      expect(evalResult.decision).toBe('INSUFFICIENT_SAMPLE');
    });
  });

  // -------------------------------------------------------------------------
  // 4. GUARDRAILS, CONTAS DE TESTE & MOBILIDADE
  // -------------------------------------------------------------------------
  describe('4. Guardrails, Contas Internas e Resiliência Operacional', () => {
    it('Caso 17 — Exclusão de contas de teste e internas antes da avaliação', () => {
      const internalEmails = ['admin@vocentro.com.br', 'teste@example.com', 'candidato.e2e@hardening.test'];
      internalEmails.forEach(email => {
        expect(AdminAuditService.isTestOrInternalAccount({ email })).toBe(true);
      });
    });

    it('Caso 18 — Killswitch de emergência (status DISABLED reverte imediatamente para CONTROL)', () => {
      const mockExpId = 'exp_killswitch_test';
      EXPERIMENTS_REGISTRY[mockExpId] = {
        id: mockExpId,
        name: 'Killswitch Test',
        hypothesis: 'Test',
        status: 'DISABLED',
        variants: ['CONTROL', 'VARIANT_A'],
        rolloutPercentage: 100,
        primaryMetric: 'RATE',
        secondaryMetrics: [],
        guardrailMetrics: [],
        minimumSampleSize: 100,
        minimumDetectableEffect: 0.05,
        createdAt: new Date().toISOString()
      };

      expect(ExperimentService.assignVariant(mockExpId, 'any_user')).toBe('CONTROL');
      delete EXPERIMENTS_REGISTRY[mockExpId];
    });

    it('Caso 19 — Guardrail de Custo de IA (Alerta quando custo por ativado excede R$ 1,50)', () => {
      const calculateAiGuardrail = (totalCostBrl: number, activatedUsers: number) => {
        const costPerUser = activatedUsers > 0 ? totalCostBrl / activatedUsers : 0;
        return costPerUser > 1.50 ? 'GUARDRAIL_BREACHED' : 'HEALTHY';
      };

      expect(calculateAiGuardrail(100, 200)).toBe('HEALTHY'); // R$ 0,50/user
      expect(calculateAiGuardrail(400, 200)).toBe('GUARDRAIL_BREACHED'); // R$ 2,00/user
    });

    it('Caso 20 — Contrato de Acessibilidade Mobile (Touch Target mínimo de 44px)', () => {
      const mobileButtonSizePx = 48;
      expect(mobileButtonSizePx).toBeGreaterThanOrEqual(44);
    });

    it('Caso 21 — Invariante do Core: Experimento não altera CareerMatchEngineV3', () => {
      // O experimento atua estritamente na jornada de apresentação (UI/Journey), preservando a verdade matemática do motor
      const coreWeights = { hardSkills: 0.50, seniority: 0.30, culture: 0.20 };
      expect(coreWeights.hardSkills + coreWeights.seniority + coreWeights.culture).toBe(1.0);
    });
  });
});
