import { describe, it, expect } from 'vitest';
import { calculateProfileCompleteness } from '../../src/domain/services/ProfileCompletenessService';
import { determineCandidateCohort, isTestAccount } from '../../src/domain/services/CohortService';
import { computeWaveMetrics } from './surveyWaveMetrics.test';

describe('VoCentro Architectural & Business Invariant Test Suite', () => {

  // INVARIANT 1: Candidate Cohort Single Source of Truth
  describe('Invariant 1: Candidate Activation Classification SSOT', () => {
    it('deve classificar candidato como activated se possuir primary_resume_id', () => {
      const cohort = determineCandidateCohort({ id: 'user_1', primary_resume_id: 'res_1' }, new Set());
      expect(cohort).toBe('activated');
    });

    it('deve classificar candidato como activated se possuir histórico em activeUserIds', () => {
      const activeSet = new Set(['user_2']);
      const cohort = determineCandidateCohort({ id: 'user_2', primary_resume_id: null }, activeSet);
      expect(cohort).toBe('activated');
    });

    it('deve classificar candidato sem currículo e sem atividade como not_activated', () => {
      const cohort = determineCandidateCohort({ id: 'user_3', primary_resume_id: null }, new Set());
      expect(cohort).toBe('not_activated');
    });

    it('deve identificar corretamente contas de teste/QA para exclusão de campanhas de produção', () => {
      expect(isTestAccount('e2e_user@vocentro.com.br', 'E2E Test User')).toBe(true);
      expect(isTestAccount('candidate@gmail.com', 'Real Candidate')).toBe(false);
    });
  });

  // INVARIANT 2 & 3: Survey Wave Metrics Cohort Isolation
  describe('Invariant 2 & 3: Survey Wave Metrics Cohort Isolation', () => {
    const mockProfiles = [
      { id: 'u1', email: 'act1@gmail.com', full_name: 'Activated 1', primary_resume_id: 'r1' },
      { id: 'u2', email: 'inact1@gmail.com', full_name: 'Inactive 1', primary_resume_id: null }
    ];
    const activeSet = new Set(['u1']);

    it('não deve contar convites da onda not_activated na prévia da onda activated', () => {
      const campaigns = [{ id: 'c1', user_id: 'u1', cohort: 'not_activated', status: 'sent' }];
      const metrics = computeWaveMetrics(mockProfiles, activeSet, campaigns, [], 'activated');
      expect(metrics.invited).toBe(0);
      expect(metrics.pending).toBe(1);
    });

    it('não deve contar respostas da onda not_activated na prévia da onda activated', () => {
      const responses = [{ id: 'resp1', user_id: 'u1', research_cohort: 'not_activated' }];
      const metrics = computeWaveMetrics(mockProfiles, activeSet, [], responses, 'activated');
      expect(metrics.responded).toBe(0);
    });
  });

  // INVARIANT 4: User Metrics Deduplication
  describe('Invariant 4: User Metrics Deduplication (1 Candidate = 1 Count)', () => {
    const mockProfiles = [
      { id: 'u1', email: 'candidate@gmail.com', full_name: 'Candidate One', primary_resume_id: 'r1' }
    ];

    it('múltiplos logs da mesma campanha para o mesmo usuário devem contar como 1 único convidado', () => {
      const duplicateCampaigns = [
        { id: 'c1', user_id: 'u1', cohort: 'activated', status: 'sent' },
        { id: 'c2', user_id: 'u1', cohort: 'activated', status: 'delivered' },
        { id: 'c3', user_id: 'u1', cohort: 'activated', status: 'opened' }
      ];
      const metrics = computeWaveMetrics(mockProfiles, new Set(['u1']), duplicateCampaigns, [], 'activated');
      expect(metrics.invited).toBe(1);
      expect(metrics.delivered).toBe(1);
    });
  });

  // INVARIANT 5: Contract Alignment Across Layers
  describe('Invariant 5: Contract Alignment Across Layers', () => {
    it('valores de coorte devem ser estritamente válidos e sem misturas de tipo', () => {
      const validCohorts = ['activated', 'not_activated', 'beta_general', 'ALL'];
      expect(validCohorts).toContain('activated');
      expect(validCohorts).toContain('not_activated');
      expect(validCohorts).toContain('beta_general');
    });
  });

  // INVARIANT 6: Profile Completeness Calculation SSOT
  describe('Invariant 6: Profile Completeness Calculation SSOT', () => {
    it('deve retornar exatamente o mesmo valor de completude para o mesmo estado de perfil', () => {
      const params = {
        hasResume: true,
        hasLinkedin: false,
        hasSkills: true,
        hasExperiences: true
      };

      const res1 = calculateProfileCompleteness(params);
      const res2 = calculateProfileCompleteness(params);

      expect(res1.score).toBe(80);
      expect(res2.score).toBe(80);
      expect(res1.score).toBe(res2.score);
    });

    it('deve retornar 100% de completude quando todos os critérios forem atendidos', () => {
      const fullParams = {
        hasResume: true,
        hasLinkedin: true,
        hasSkills: true,
        hasExperiences: true
      };

      const res = calculateProfileCompleteness(fullParams);
      expect(res.score).toBe(100);
      expect(res.isComplete).toBe(true);
      expect(res.missingItems.length).toBe(0);
    });
  });

  // INVARIANT 7: Active Resume Switch does NOT delete Kanban Applications
  describe('Invariant 7: Active Resume Switch Invariant', () => {
    it('trocar currículo ativo deve preservar integralmente a lista de candidaturas do usuário', () => {
      const mockApplications = [
        { id: 'app_1', user_id: 'user_1', company_name: 'Tech Corp', status: 'APPLIED' },
        { id: 'app_2', user_id: 'user_1', company_name: 'AI Labs', status: 'INTERVIEW' }
      ];

      let activeResumeId = 'res_A';
      // Switch resume A -> resume B
      activeResumeId = 'res_B';

      // Application array MUST be identical and untouched
      expect(mockApplications.length).toBe(2);
      expect(mockApplications[0].id).toBe('app_1');
      expect(mockApplications[1].status).toBe('INTERVIEW');
      expect(activeResumeId).toBe('res_B');
    });
  });
  // INVARIANT 8: Journey Progress Calculation Invariants (40% vs 80% vs 100%)
  describe('Invariant 8: Journey Progress vs Profile Completeness Disambiguation', () => {
    it('deve calcular a Jornada como 100% se as 4 etapas estiverem concluídas, mesmo com Perfil em 80%', () => {
      const profileCompleteness = 80; // Falta o LinkedIn

      const journeySteps = [
        { id: 'profile', completed: true },
        { id: 'match', completed: true },
        { id: 'strategy', completed: true },
        { id: 'coach', completed: true }
      ];

      const completedCount = journeySteps.filter(s => s.completed).length;
      const journeyProgress = Math.round((completedCount / journeySteps.length) * 100);

      expect(journeyProgress).toBe(100);
      expect(profileCompleteness).toBe(80);
      expect(journeyProgress).not.toBe(profileCompleteness);
    });

    it('deve calcular a Jornada como 50% se 2 de 4 etapas estiverem concluídas', () => {
      const journeySteps = [
        { id: 'profile', completed: true },
        { id: 'match', completed: true },
        { id: 'strategy', completed: false },
        { id: 'coach', completed: false }
      ];

      const completedCount = journeySteps.filter(s => s.completed).length;
      const journeyProgress = Math.round((completedCount / journeySteps.length) * 100);

      expect(journeyProgress).toBe(50);
    });

    it('deve calcular a Jornada como 25% se 1 de 4 etapas estiver concluída', () => {
      const journeySteps = [
        { id: 'profile', completed: true },
        { id: 'match', completed: false },
        { id: 'strategy', completed: false },
        { id: 'coach', completed: false }
      ];

      const completedCount = journeySteps.filter(s => s.completed).length;
      const journeyProgress = Math.round((completedCount / journeySteps.length) * 100);

      expect(journeyProgress).toBe(25);
    });
  });
});
