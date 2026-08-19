import { describe, it, expect } from 'vitest';
import { AdminAnalyticsService } from '../../src/application/services/AdminAnalyticsService';
import { AdminAuditService } from '../../src/application/services/AdminAuditService';

describe('AdminAnalyticsService & AdminAuditService (Etapa 8 & 9)', () => {
  it('1. Deve calcular DAU, WAU, MAU garantindo o invariante WAU >= DAU e MAU >= WAU', () => {
    const now = new Date('2026-08-19T12:00:00Z');
    const events = [
      // Ativos hoje (DAU, WAU, MAU)
      { user_id: 'u1', created_at: '2026-08-19T10:00:00Z' },
      { user_id: 'u2', created_at: '2026-08-19T08:00:00Z' },
      // Ativos nos últimos 7 dias (WAU, MAU)
      { user_id: 'u3', created_at: '2026-08-16T12:00:00Z' },
      { user_id: 'u4', created_at: '2026-08-14T12:00:00Z' },
      // Ativos nos últimos 30 dias (MAU)
      { user_id: 'u5', created_at: '2026-08-01T12:00:00Z' },
      // Mais antigos que 30 dias (Inativos)
      { user_id: 'u6', created_at: '2026-06-01T12:00:00Z' }
    ];

    const metrics = AdminAnalyticsService.calculateActiveUserMetrics(events, now);

    expect(metrics.dau).toBe(2); // u1, u2
    expect(metrics.wau).toBe(4); // u1, u2, u3, u4
    expect(metrics.mau).toBe(5); // u1, u2, u3, u4, u5
    expect(metrics.wau).toBeGreaterThanOrEqual(metrics.dau);
    expect(metrics.mau).toBeGreaterThanOrEqual(metrics.wau);
    expect(metrics.stickiness).toBe(40.0); // (2 / 5) * 100 = 40.0%
  });

  it('2. Deve calcular taxas do funil de ativação com dados reais e sem mock', () => {
    const funnel = AdminAnalyticsService.calculateActivationFunnel({
      totalRegistered: 1000,
      uploadedResume: 700,
      viewedMatch: 500,
      appliedOrSaved: 250,
      proConverted: 50
    });

    expect(funnel.uploadRate).toBe(70.0);       // 700 / 1000
    expect(funnel.matchViewRate).toBe(71.4);    // 500 / 700
    expect(funnel.applyRate).toBe(50.0);        // 250 / 500
    expect(funnel.proConversionRate).toBe(5.0); // 50 / 1000
  });

  it('3. Deve isolar contas de teste e internas com AdminAuditService.isTestOrInternalAccount', () => {
    const users = [
      { id: '1', email: 'candidato.real@gmail.com', is_test_account: false },
      { id: '2', email: 'admin@vocentro.com.br', is_test_account: false },
      { id: '3', email: 'qa_tester@exemplo.com', is_test_account: false },
      { id: '4', email: 'usuario.teste@hotmail.com', is_test_account: false },
      { id: '5', email: 'candidata.pro@empresa.com.br', is_test_account: false },
      { id: '6', email: 'qualquer@email.com', is_test_account: true }
    ];

    const realUsers = AdminAnalyticsService.filterProductionUsers(users);

    expect(realUsers.length).toBe(2);
    expect(realUsers.map(u => u.id)).toEqual(['1', '5']);
  });
});
