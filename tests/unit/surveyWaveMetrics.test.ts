import { describe, it, expect } from 'vitest';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  primary_resume_id?: string | null;
}

export interface EmailCampaign {
  id: string;
  user_id: string;
  cohort: string;
  status: string;
}

export interface SurveyResponse {
  id: string;
  user_id: string;
  research_cohort: string;
}

export function computeWaveMetrics(
  profiles: Profile[],
  activeUserIds: Set<string>,
  emailCampaigns: EmailCampaign[],
  surveyResponses: SurveyResponse[],
  wave: string
) {
  const testPatterns = ['e2e', 'hardening', 'test', 'admin', 'vocentro.com.br', 'example.com', 'demo', 'qa'];
  const realProfiles = profiles.filter(p => {
    const email = (p.email || '').toLowerCase();
    const name = (p.full_name || '').toLowerCase();
    return !testPatterns.some(pat => email.includes(pat) || name.includes(pat));
  });

  const targetProfiles = realProfiles.filter(p => {
    const isActivated = Boolean(p.primary_resume_id) || activeUserIds.has(p.id);
    if (wave === 'activated') return isActivated;
    if (wave === 'not_activated') return !isActivated;
    return true; // beta_general or ALL
  });

  const totalEligible = targetProfiles.length;
  const targetUserIds = new Set(targetProfiles.map(p => p.id));

  const isCohortMatch = (cCohort: string, targetWave: string) => {
    if (targetWave === 'beta_general' || targetWave === 'ALL') {
      return cCohort === 'beta_general' || cCohort === 'ALL';
    }
    return cCohort === targetWave;
  };

  const invitedUserIds = new Set(
    emailCampaigns
      .filter(c => targetUserIds.has(c.user_id) && isCohortMatch(c.cohort, wave))
      .map(c => c.user_id)
  );

  const deliveredUserIds = new Set(
    emailCampaigns
      .filter(c => targetUserIds.has(c.user_id) && isCohortMatch(c.cohort, wave) && ['delivered', 'opened', 'clicked', 'responded', 'survey_completed'].includes(c.status))
      .map(c => c.user_id)
  );

  const respondedUserIds = new Set(
    surveyResponses
      .filter(r => targetUserIds.has(r.user_id) && isCohortMatch(r.research_cohort, wave))
      .map(r => r.user_id)
  );

  const failedUserIds = new Set(
    emailCampaigns
      .filter(c => targetUserIds.has(c.user_id) && isCohortMatch(c.cohort, wave) && ['bounced', 'failed'].includes(c.status))
      .map(c => c.user_id)
  );

  const invitedCount = invitedUserIds.size;
  const deliveredCount = deliveredUserIds.size;
  const respondedCount = respondedUserIds.size;
  const failedCount = failedUserIds.size;
  const pendingCount = Math.max(0, totalEligible - invitedCount);

  return {
    wave,
    eligible: totalEligible,
    invited: invitedCount,
    delivered: deliveredCount,
    responded: respondedCount,
    failed: failedCount,
    pending: pendingCount
  };
}

describe('Survey Wave Metrics Logic (Strict Audit Suite)', () => {
  const mockProfiles: Profile[] = [
    // 43 Activated Mock Candidates
    ...Array.from({ length: 43 }, (_, i) => ({
      id: `act_${i + 1}`,
      email: `user_act_${i + 1}@gmail.com`,
      full_name: `Active Candidate ${i + 1}`,
      primary_resume_id: `res_${i + 1}`
    })),
    // 9 Not Activated Mock Candidates
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `inact_${i + 1}`,
      email: `user_inact_${i + 1}@gmail.com`,
      full_name: `Inactive Candidate ${i + 1}`,
      primary_resume_id: null
    })),
    // QA / Test Accounts (must be filtered out)
    { id: 'qa_1', email: 'e2e_test@vocentro.com.br', full_name: 'E2E Test Account', primary_resume_id: 'res_qa' }
  ];

  const mockActiveUserIds = new Set(Array.from({ length: 43 }, (_, i) => `act_${i + 1}`));

  it('Caso 1 — Ativados: deve retornar exatamente 43 elegíveis', () => {
    const metrics = computeWaveMetrics(mockProfiles, mockActiveUserIds, [], [], 'activated');
    expect(metrics.eligible).toBe(43);
  });

  it('Caso 2 — Não Ativados: deve retornar exatamente 9 elegíveis', () => {
    const metrics = computeWaveMetrics(mockProfiles, mockActiveUserIds, [], [], 'not_activated');
    expect(metrics.eligible).toBe(9);
  });

  it('Caso 3 — Beta Geral: deve retornar exatamente 52 elegíveis', () => {
    const metrics = computeWaveMetrics(mockProfiles, mockActiveUserIds, [], [], 'beta_general');
    expect(metrics.eligible).toBe(52);
  });

  it('Caso 4 — Usuário recebeu outra onda: campanha not_activated NÃO conta na onda activated', () => {
    const campaigns: EmailCampaign[] = [
      { id: 'c1', user_id: 'act_1', cohort: 'not_activated', status: 'sent' }
    ];
    const metrics = computeWaveMetrics(mockProfiles, mockActiveUserIds, campaigns, [], 'activated');
    expect(metrics.invited).toBe(0);
    expect(metrics.pending).toBe(43);
  });

  it('Caso 5 — Usuário recebeu a própria onda: campanha activated IS contabilizada na onda activated', () => {
    const campaigns: EmailCampaign[] = [
      { id: 'c1', user_id: 'act_1', cohort: 'activated', status: 'sent' }
    ];
    const metrics = computeWaveMetrics(mockProfiles, mockActiveUserIds, campaigns, [], 'activated');
    expect(metrics.invited).toBe(1);
    expect(metrics.pending).toBe(42);
  });

  it('Caso 6 — Respondeu outra onda: resposta com research_cohort not_activated NÃO conta na onda activated', () => {
    const responses: SurveyResponse[] = [
      { id: 'r1', user_id: 'act_1', research_cohort: 'not_activated' }
    ];
    const metrics = computeWaveMetrics(mockProfiles, mockActiveUserIds, [], responses, 'activated');
    expect(metrics.responded).toBe(0);
  });

  it('Caso 7 — Resposta da própria onda: resposta com research_cohort activated IS contabilizada na onda activated', () => {
    const responses: SurveyResponse[] = [
      { id: 'r1', user_id: 'act_1', research_cohort: 'activated' }
    ];
    const metrics = computeWaveMetrics(mockProfiles, mockActiveUserIds, [], responses, 'activated');
    expect(metrics.responded).toBe(1);
  });

  it('Caso 8 — Duplicidade: múltiplos registros de campanha para o mesmo usuário na mesma onda NÃO duplicam a contagem', () => {
    const campaigns: EmailCampaign[] = [
      { id: 'c1', user_id: 'act_1', cohort: 'activated', status: 'sent' },
      { id: 'c2', user_id: 'act_1', cohort: 'activated', status: 'delivered' },
      { id: 'c3', user_id: 'act_1', cohort: 'activated', status: 'opened' }
    ];
    const metrics = computeWaveMetrics(mockProfiles, mockActiveUserIds, campaigns, [], 'activated');
    expect(metrics.invited).toBe(1);
    expect(metrics.delivered).toBe(1);
  });
});
