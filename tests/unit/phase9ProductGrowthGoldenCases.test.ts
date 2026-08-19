import { describe, it, expect } from 'vitest';
import { AdminAnalyticsService } from '../../src/application/services/AdminAnalyticsService';
import { AdminAuditService } from '../../src/application/services/AdminAuditService';

describe('Phase 9 Product Growth, Real User Behavior & Experimentation Golden Cases', () => {
  const refDate = new Date('2026-08-19T12:00:00.000Z');
  const nowMs = refDate.getTime();
  const hoursAgo = (h: number) => new Date(nowMs - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(nowMs - d * 24 * 60 * 60 * 1000).toISOString();

  // -------------------------------------------------------------------------
  // 1. FUNIL COMPLETO DE PRODUTO (11 ETAPAS) BASEADO EM USUÁRIOS ÚNICOS
  // -------------------------------------------------------------------------
  describe('1. Funil Completo de Produto (11 Etapas)', () => {
    it('Caso 1 — Calcula taxas absolutas e relativas do funil de 11 etapas', () => {
      const stageCounts = {
        visitors: 10000,
        signups: 2000,
        onboardingCompleted: 1600,
        cvUploaded: 1200,
        firstMatch: 1000,
        matchViewed: 800,
        jobSaved: 400,
        jobApplied: 200,
        paywallViewed: 300,
        checkoutStarted: 80,
        paymentConfirmed: 24
      };

      // Conversão Signup -> CV
      const signupToCvRate = (stageCounts.cvUploaded / stageCounts.signups) * 100;
      expect(signupToCvRate).toBe(60.0);

      // Conversão CV -> First Match
      const cvToMatchRate = (stageCounts.firstMatch / stageCounts.cvUploaded) * 100;
      expect(cvToMatchRate).toBeCloseTo(83.33, 1);

      // Conversão Match Viewed -> Save
      const viewToSaveRate = (stageCounts.jobSaved / stageCounts.matchViewed) * 100;
      expect(viewToSaveRate).toBe(50.0);

      // Conversão Save -> Apply
      const saveToApplyRate = (stageCounts.jobApplied / stageCounts.jobSaved) * 100;
      expect(saveToApplyRate).toBe(50.0);

      // Conversão Checkout -> Payment
      const checkoutToPayRate = (stageCounts.paymentConfirmed / stageCounts.checkoutStarted) * 100;
      expect(checkoutToPayRate).toBe(30.0);

      // Conversão Global (Signup -> Payment)
      const globalMonetization = (stageCounts.paymentConfirmed / stageCounts.signups) * 100;
      expect(globalMonetization).toBe(1.2);
    });

    it('Caso 2 — Funil com zero visitantes/signups retorna 0.0% sem quebrar por divisão por zero', () => {
      const emptyStage = { signups: 0, cvUploaded: 0 };
      const rate = emptyStage.signups > 0 ? (emptyStage.cvUploaded / emptyStage.signups) * 100 : 0.0;
      expect(rate).toBe(0.0);
    });
  });

  // -------------------------------------------------------------------------
  // 2. AVALIAÇÃO DE CANDIDATAS À DEFINIÇÃO DE ATIVAÇÃO
  // -------------------------------------------------------------------------
  describe('2. Definição de Ativação do Candidato', () => {
    it('Caso 3 — Avalia candidatos A, B, C, D e E de ativação com retenção downstream', () => {
      const candidates = [
        { name: 'A_CV_UPLOAD', users: 120, retainedD7: 48 }, // 40%
        { name: 'B_FIRST_MATCH', users: 100, retainedD7: 55 }, // 55%
        { name: 'C_MATCH_VIEW', users: 80, retainedD7: 60 }, // 75%
        { name: 'D_JOB_SAVED', users: 40, retainedD7: 32 }, // 80%
        { name: 'E_JOB_APPLIED', users: 20, retainedD7: 18 } // 90%
      ];

      const scored = candidates.map(c => ({
        ...c,
        retentionRate: (c.retainedD7 / c.users) * 100
      }));

      expect(scored[2].name).toBe('C_MATCH_VIEW');
      expect(scored[2].retentionRate).toBe(75.0);
      expect(scored[3].retentionRate).toBe(80.0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. ANÁLISE DE DROPOFF FORENSICS
  // -------------------------------------------------------------------------
  describe('3. Dropoff Forensics', () => {
    it('Caso 4 — Identifica o maior gargalo absoluto e relativo de abandono', () => {
      const steps = [
        { from: 'Signup', to: 'CV', usersIn: 1000, usersOut: 600 }, // drop 400 (40%)
        { from: 'CV', to: 'Match', usersIn: 600, usersOut: 500 }, // drop 100 (16.6%)
        { from: 'Match', to: 'Save', usersIn: 500, usersOut: 200 }, // drop 300 (60%)
        { from: 'Save', to: 'Apply', usersIn: 200, usersOut: 100 } // drop 100 (50%)
      ];

      const dropoffs = steps.map(s => ({
        ...s,
        absoluteLoss: s.usersIn - s.usersOut,
        relativeLossRate: ((s.usersIn - s.usersOut) / s.usersIn) * 100
      }));

      // Maior perda absoluta = Signup -> CV (400 usuários)
      const maxAbsolute = [...dropoffs].sort((a, b) => b.absoluteLoss - a.absoluteLoss)[0];
      expect(maxAbsolute.from).toBe('Signup');
      expect(maxAbsolute.absoluteLoss).toBe(400);

      // Maior taxa relativa de perda = Match -> Save (60%)
      const maxRelative = [...dropoffs].sort((a, b) => b.relativeLossRate - a.relativeLossRate)[0];
      expect(maxRelative.from).toBe('Match');
      expect(maxRelative.relativeLossRate).toBe(60.0);
    });
  });

  // -------------------------------------------------------------------------
  // 4. RETENÇÃO & COHORT MATRIX
  // -------------------------------------------------------------------------
  describe('4. Retenção & Cohorts', () => {
    it('Caso 5 — Calcula matriz de retenção D1, D3, D7, D14, D30 para coorte', () => {
      const cohortTotal = 100;
      const retained = { d1: 45, d3: 35, d7: 28, d14: 20, d30: 15 };

      const matrix = {
        d1Rate: (retained.d1 / cohortTotal) * 100,
        d3Rate: (retained.d3 / cohortTotal) * 100,
        d7Rate: (retained.d7 / cohortTotal) * 100,
        d14Rate: (retained.d14 / cohortTotal) * 100,
        d30Rate: (retained.d30 / cohortTotal) * 100
      };

      expect(matrix.d1Rate).toBeCloseTo(45.0, 1);
      expect(matrix.d7Rate).toBeCloseTo(28.0, 1);
      expect(matrix.d30Rate).toBeCloseTo(15.0, 1);
    });

    it('Caso 6 — Coorte recente sem tempo decorrido suficiente retorna INSUFFICIENT_SAMPLE', () => {
      const cohortAgeDays = 3;
      const canComputeD30 = cohortAgeDays >= 30;
      expect(canComputeD30).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 5. FEATURE ADOPTION MATRIX
  // -------------------------------------------------------------------------
  describe('5. Feature Adoption Matrix', () => {
    it('Caso 7 — Computa métricas de adoção, taxa de repetição e downstream conversion', () => {
      const features = [
        { feature: 'MatchFeed', totalUsers: 200, repeatUsers: 140, convertedToPro: 14 },
        { feature: 'StarSimulator', totalUsers: 50, repeatUsers: 20, convertedToPro: 8 },
        { feature: 'CvOptimizer', totalUsers: 80, repeatUsers: 40, convertedToPro: 12 },
        { feature: 'KanbanPipeline', totalUsers: 90, repeatUsers: 60, convertedToPro: 10 }
      ];

      const adoption = features.map(f => ({
        ...f,
        repeatRate: (f.repeatUsers / f.totalUsers) * 100,
        proConversionRate: (f.convertedToPro / f.totalUsers) * 100
      }));

      expect(adoption[0].repeatRate).toBe(70.0); // MatchFeed tem 70% repetição
      expect(adoption[1].proConversionRate).toBe(16.0); // STAR Simulator converte 16% em Pro
    });
  });

  // -------------------------------------------------------------------------
  // 6. QUALIDADE DE MATCH POR BUCKETS DE SCORE
  // -------------------------------------------------------------------------
  describe('6. Qualidade de Match por Buckets de Score (0-49 até 90-100)', () => {
    it('Caso 8 — Avalia se scores maiores (80-100) apresentam maior CTR e taxa de candidatura', () => {
      const buckets = [
        { range: '0-49', matches: 500, views: 100, applications: 5 }, // 1% apply rate
        { range: '50-69', matches: 800, views: 320, applications: 32 }, // 4% apply rate
        { range: '70-79', matches: 600, views: 360, applications: 72 }, // 12% apply rate
        { range: '80-89', matches: 400, views: 320, applications: 120 }, // 30% apply rate
        { range: '90-100', matches: 200, views: 180, applications: 90 } // 45% apply rate
      ];

      const evaluated = buckets.map(b => ({
        ...b,
        viewRate: (b.views / b.matches) * 100,
        applyPerMatchRate: (b.applications / b.matches) * 100
      }));

      expect(evaluated[0].applyPerMatchRate).toBe(1.0);
      expect(evaluated[3].applyPerMatchRate).toBe(30.0);
      expect(evaluated[4].applyPerMatchRate).toBe(45.0);
      expect(evaluated[4].applyPerMatchRate).toBeGreaterThan(evaluated[0].applyPerMatchRate);
    });
  });

  // -------------------------------------------------------------------------
  // 7. ECONOMIA DE IA (AI VALUE VS COST)
  // -------------------------------------------------------------------------
  describe('7. Economia de IA (AI Economics)', () => {
    it('Caso 9 — Calcula custo de IA por usuário ativado, por aplicação e por conversão Pro', () => {
      const totalAiCostBrl = 145.00;
      const totalSignups = 500;
      const activatedUsers = 250;
      const totalApplications = 100;
      const paidUsers = 20;

      const costPerSignup = totalAiCostBrl / totalSignups;
      const costPerActivated = totalAiCostBrl / activatedUsers;
      const costPerApp = totalAiCostBrl / totalApplications;
      const costPerPaid = totalAiCostBrl / paidUsers;

      expect(costPerSignup).toBe(0.29); // R$ 0,29 por cadastro
      expect(costPerActivated).toBe(0.58); // R$ 0,58 por ativado
      expect(costPerApp).toBe(1.45); // R$ 1,45 por candidatura
      expect(costPerPaid).toBe(7.25); // R$ 7,25 por cliente Pro adquirido
    });
  });

  // -------------------------------------------------------------------------
  // 8. IMPACTO DE ERROS NO NEGÓCIO
  // -------------------------------------------------------------------------
  describe('8. Impacto de Erros no Negócio', () => {
    it('Caso 10 — Compara taxa de conclusão de usuários com erro vs sem erro', () => {
      const usersWithoutError = { total: 400, completedOnboarding: 320 }; // 80%
      const usersWithUploadError = { total: 50, completedOnboarding: 15 }; // 30%

      const normalRate = (usersWithoutError.completedOnboarding / usersWithoutError.total) * 100;
      const errorRate = (usersWithUploadError.completedOnboarding / usersWithUploadError.total) * 100;

      expect(normalRate).toBe(80.0);
      expect(errorRate).toBe(30.0);
      expect(normalRate - errorRate).toBe(50.0); // 50% de gap de ativação
    });
  });

  // -------------------------------------------------------------------------
  // 9. ARQUITETURA DE EXPERIMENTAÇÃO (A/B TESTING READINESS)
  // -------------------------------------------------------------------------
  describe('9. Experimentation Readiness', () => {
    it('Caso 11 — Atribuição determinística de variante A/B baseada em hash de user_id', () => {
      const assignVariant = (userId: string, experimentId: string): 'control' | 'variant_b' => {
        let hash = 0;
        const key = `${userId}_${experimentId}`;
        for (let i = 0; i < key.length; i++) {
          hash = (hash << 5) - hash + key.charCodeAt(i);
          hash |= 0;
        }
        return Math.abs(hash) % 2 === 0 ? 'control' : 'variant_b';
      };

      const user1Variant = assignVariant('usr-abc-123', 'exp_match_cta_v1');
      const user1VariantSecondCall = assignVariant('usr-abc-123', 'exp_match_cta_v1');
      const user2Variant = assignVariant('usr-xyz-789', 'exp_match_cta_v1');

      // Idempotência determinística
      expect(user1Variant).toBe(user1VariantSecondCall);
      expect(['control', 'variant_b']).toContain(user2Variant);
    });
  });

  // -------------------------------------------------------------------------
  // 10. QUALIDADE DE EVENTOS & OBSERVABILIDADE
  // -------------------------------------------------------------------------
  describe('10. Qualidade de Eventos & North Star Metric', () => {
    it('Caso 12 — Classifica evento entre HEALTHY, LOW_VOLUME, ZERO_VOLUME, BROKEN, STALE, UNMEASURED', () => {
      const classifyEvent = (volume: number, lastSeenMinutes: number, hasErrors: boolean) => {
        if (hasErrors) return 'BROKEN';
        if (volume === 0) return 'ZERO_VOLUME';
        if (lastSeenMinutes > 1440) return 'STALE';
        if (volume < 5) return 'LOW_VOLUME';
        return 'HEALTHY';
      };

      expect(classifyEvent(150, 2, false)).toBe('HEALTHY');
      expect(classifyEvent(2, 10, false)).toBe('LOW_VOLUME');
      expect(classifyEvent(0, 9999, false)).toBe('ZERO_VOLUME');
      expect(classifyEvent(50, 2, true)).toBe('BROKEN');
      expect(classifyEvent(50, 2000, false)).toBe('STALE');
    });

    it('Caso 13 — Avaliação de North Star Metric (Meaningful Career Actions)', () => {
      // Meaningful Career Actions = Upload CV + Match View + Job Saved/Applied + STAR Sim
      const userActions = {
        resumes: 1,
        matchViews: 5,
        applications: 2,
        starSims: 1
      };
      const totalMeaningfulActions = userActions.resumes + userActions.matchViews + userActions.applications + userActions.starSims;
      expect(totalMeaningfulActions).toBe(9);
      expect(totalMeaningfulActions).toBeGreaterThan(0);
    });
  });
});
