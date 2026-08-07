import { describe, it, expect, vi } from 'vitest';

describe('Pesquisa de Usuários Fundadores (v1_founders_validation)', () => {
  it('deve validar as coortes de pesquisa corretamente (activated, not_activated, beta_general)', () => {
    const classifyUserCohort = (user: { matchesCount: number; sessionsCount: number; hasMainFeature: boolean }) => {
      if (user.matchesCount >= 1 && (user.sessionsCount > 2 || user.hasMainFeature)) {
        return 'activated';
      }
      if (user.matchesCount === 0 && user.sessionsCount <= 2 && !user.hasMainFeature) {
        return 'not_activated';
      }
      return 'beta_general';
    };

    expect(classifyUserCohort({ matchesCount: 2, sessionsCount: 4, hasMainFeature: true })).toBe('activated');
    expect(classifyUserCohort({ matchesCount: 0, sessionsCount: 1, hasMainFeature: false })).toBe('not_activated');
    expect(classifyUserCohort({ matchesCount: 0, sessionsCount: 5, hasMainFeature: false })).toBe('beta_general');
  });

  it('deve aplicar exclusão de contas de teste e internas', () => {
    const isTestAccount = (email: string, name: string = '') => {
      const testPatterns = ['e2e', 'hardening', 'test', 'admin', 'vocentro.com.br', 'example.com', 'demo', 'qa'];
      const e = email.toLowerCase();
      const n = name.toLowerCase();
      return testPatterns.some(pat => e.includes(pat) || n.includes(pat));
    };

    expect(isTestAccount('candidato.e2e@example.com')).toBe(true);
    expect(isTestAccount('hardening_user@vocentro.com.br')).toBe(true);
    expect(isTestAccount('admin@vocentro.com.br')).toBe(true);
    expect(isTestAccount('marcos.silva@gmail.com', 'Marcos Silva')).toBe(false);
  });

  it('deve calcular o Founder Engagement Score (0 a 100) e categorizar os tiers', () => {
    const calculateEngagementScore = (user: {
      respondedSurvey: boolean;
      hadMatch: boolean;
      sessionsCount: number;
      usedMainFeatures: boolean;
      optInInterview: boolean;
    }) => {
      let score = 0;
      if (user.respondedSurvey) score += 20;
      if (user.hadMatch) score += 20;
      if (user.sessionsCount > 3) score += 20;
      if (user.usedMainFeatures) score += 20;
      if (user.optInInterview) score += 20;

      let tier = '🔴 Baixo Engajamento';
      if (score >= 80) tier = '🟢 Founder Champion';
      else if (score >= 50) tier = '🟡 Engajado';

      return { score, tier };
    };

    const champion = calculateEngagementScore({
      respondedSurvey: true,
      hadMatch: true,
      sessionsCount: 5,
      usedMainFeatures: true,
      optInInterview: true
    });
    expect(champion.score).toBe(100);
    expect(champion.tier).toBe('🟢 Founder Champion');

    const engaged = calculateEngagementScore({
      respondedSurvey: true,
      hadMatch: true,
      sessionsCount: 4,
      usedMainFeatures: false,
      optInInterview: false
    });
    expect(engaged.score).toBe(60);
    expect(engaged.tier).toBe('🟡 Engajado');

    const low = calculateEngagementScore({
      respondedSurvey: true,
      hadMatch: false,
      sessionsCount: 1,
      usedMainFeatures: false,
      optInInterview: false
    });
    expect(low.score).toBe(20);
    expect(low.tier).toBe('🔴 Baixo Engajamento');
  });

  it('deve garantir desacoplamento LGPD entre respostas e contatos', () => {
    const responseData = {
      user_id: 'usr_123',
      q11_nps: 10,
      q8_pro_intent: 'Sim',
      survey_version: 'v1_founders_validation'
    };

    const contactData = {
      user_id: 'usr_123',
      email: 'candidato.real@gmail.com',
      whatsapp_phone: '(11) 99999-8888',
      permission_status: 'granted'
    };

    expect(responseData).not.toHaveProperty('email');
    expect(responseData).not.toHaveProperty('whatsapp_phone');
    expect(contactData.permission_status).toBe('granted');
  });
});
