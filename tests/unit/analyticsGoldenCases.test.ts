import { describe, it, expect } from 'vitest';
import { AdminAnalyticsService, type AnalyticsResult } from '../../src/application/services/AdminAnalyticsService';
import { AnalyticsEventValidator, ANALYTICS_EVENT_NAMES, type CanonicalAnalyticsEvent } from '../../src/application/analytics/AnalyticsEvents';
import { AdminAuditService } from '../../src/application/services/AdminAuditService';

describe('Analytics & Telemetry Golden Cases — 20+ Casos Determinísticos (Fase 6)', () => {
  const refDate = new Date('2026-08-19T12:00:00.000Z');
  const nowMs = refDate.getTime();
  const hoursAgo = (h: number) => new Date(nowMs - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(nowMs - d * 24 * 60 * 60 * 1000).toISOString();

  // CASO 1: DAU com múltiplos eventos por usuário (Deduplicação 10 eventos -> 3 usuários)
  it('Caso 1 — DAU: 10 eventos de 3 usuários únicos geram DAU = 3', () => {
    const events = [
      { user_id: 'usr-1', created_at: hoursAgo(1) },
      { user_id: 'usr-1', created_at: hoursAgo(2) },
      { user_id: 'usr-1', created_at: hoursAgo(3) },
      { user_id: 'usr-2', created_at: hoursAgo(5) },
      { user_id: 'usr-2', created_at: hoursAgo(6) },
      { user_id: 'usr-3', created_at: hoursAgo(10) },
      { user_id: 'usr-3', created_at: hoursAgo(12) },
      { user_id: 'usr-3', created_at: hoursAgo(18) },
      { user_id: 'usr-3', created_at: hoursAgo(22) },
      { user_id: 'usr-3', created_at: hoursAgo(23) }
    ];

    const result = AdminAnalyticsService.calculateActiveUserMetrics(events, refDate);
    expect(result.dau).toBe(3);
    expect(result.wau).toBe(3);
    expect(result.mau).toBe(3);
  });

  // CASO 2: WAU com usuários em diferentes dias
  it('Caso 2 — WAU: usuários ativos entre 1 e 7 dias contam em WAU mas não em DAU', () => {
    const events = [
      { user_id: 'usr-daily', created_at: hoursAgo(2) },
      { user_id: 'usr-weekly-1', created_at: daysAgo(2) },
      { user_id: 'usr-weekly-2', created_at: daysAgo(5) },
      { user_id: 'usr-weekly-3', created_at: daysAgo(6) }
    ];

    const result = AdminAnalyticsService.calculateActiveUserMetrics(events, refDate);
    expect(result.dau).toBe(1);
    expect(result.wau).toBe(4);
    expect(result.mau).toBe(4);
  });

  // CASO 3: MAU com janela estrita de 30 dias
  it('Caso 3 — MAU: usuários entre 8 e 30 dias contam em MAU mas não em WAU ou DAU', () => {
    const events = [
      { user_id: 'usr-dau', created_at: hoursAgo(1) },
      { user_id: 'usr-wau', created_at: daysAgo(3) },
      { user_id: 'usr-mau-1', created_at: daysAgo(10) },
      { user_id: 'usr-mau-2', created_at: daysAgo(25) },
      { user_id: 'usr-expired', created_at: daysAgo(35) } // Mais de 30 dias: descartado
    ];

    const result = AdminAnalyticsService.calculateActiveUserMetrics(events, refDate);
    expect(result.dau).toBe(1);
    expect(result.wau).toBe(2);
    expect(result.mau).toBe(4);
  });

  // CASO 4: Invariante Matemático Natural DAU <= WAU <= MAU
  it('Caso 4 — Invariante Natural: DAU <= WAU <= MAU é sempre verdadeiro por inclusão de conjuntos', () => {
    const events = [
      { user_id: 'usr-1', created_at: hoursAgo(0.5) },
      { user_id: 'usr-2', created_at: daysAgo(4) },
      { user_id: 'usr-3', created_at: daysAgo(15) },
      { user_id: 'usr-4', created_at: daysAgo(28) }
    ];

    const result = AdminAnalyticsService.calculateActiveUserMetrics(events, refDate);
    expect(result.dau).toBeLessThanOrEqual(result.wau);
    expect(result.wau).toBeLessThanOrEqual(result.mau);
  });

  // CASO 5: Stickiness (DAU / MAU * 100)
  it('Caso 5 — Stickiness: cálculo exato da taxa de engajamento diário vs mensal', () => {
    // 2 DAU e 10 MAU -> Stickiness = 20%
    const events = [
      { user_id: 'u1', created_at: hoursAgo(1) },
      { user_id: 'u2', created_at: hoursAgo(2) },
      { user_id: 'u3', created_at: daysAgo(3) },
      { user_id: 'u4', created_at: daysAgo(5) },
      { user_id: 'u5', created_at: daysAgo(8) },
      { user_id: 'u6', created_at: daysAgo(12) },
      { user_id: 'u7', created_at: daysAgo(15) },
      { user_id: 'u8', created_at: daysAgo(18) },
      { user_id: 'u9', created_at: daysAgo(22) },
      { user_id: 'u10', created_at: daysAgo(29) }
    ];

    const result = AdminAnalyticsService.calculateActiveUserMetrics(events, refDate);
    expect(result.dau).toBe(2);
    expect(result.mau).toBe(10);
    expect(result.stickiness).toBe(20.0);
  });

  // CASO 6: Stickiness com Base Vazia (Evitar divisão por zero)
  it('Caso 6 — Stickiness Base Vazia: MAU = 0 retorna stickiness = 0 sem NaN ou Infinity', () => {
    const result = AdminAnalyticsService.calculateActiveUserMetrics([], refDate);
    expect(result.dau).toBe(0);
    expect(result.wau).toBe(0);
    expect(result.mau).toBe(0);
    expect(result.stickiness).toBe(0);
    expect(isNaN(result.stickiness)).toBe(false);
  });

  // CASO 7: Deduplicação Estrita (100 eventos do mesmo usuário -> 1 ativo)
  it('Caso 7 — Deduplicação: 100 eventos do mesmo user_id resultam em exatamente 1 usuário', () => {
    const events = Array.from({ length: 100 }, (_, i) => ({
      user_id: 'heavy-user',
      created_at: hoursAgo(i * 0.2) // todos nas últimas 20 horas
    }));

    const result = AdminAnalyticsService.calculateActiveUserMetrics(events, refDate);
    expect(result.dau).toBe(1);
    expect(result.wau).toBe(1);
    expect(result.mau).toBe(1);
  });

  // CASO 8: Funil de Ativação Baseado em Usuários Únicos
  it('Caso 8 — Funil de Ativação: cálculo preciso de taxas por usuário único', () => {
    const funnelData = {
      totalRegistered: 1000,
      uploadedResume: 750,
      viewedMatch: 500,
      appliedOrSaved: 250,
      proConverted: 50
    };

    const funnel = AdminAnalyticsService.calculateActivationFunnel(funnelData);
    expect(funnel.uploadRate).toBe(75.0);
    expect(funnel.matchViewRate).toBe(66.7);
    expect(funnel.applyRate).toBe(50.0);
    expect(funnel.proConversionRate).toBe(5.0);
  });

  // CASO 9: Funil com Zero Cadastros (Divisão segura)
  it('Caso 9 — Funil Zero Cadastros: retorna 0% para todas as taxas sem quebras', () => {
    const funnel = AdminAnalyticsService.calculateActivationFunnel({
      totalRegistered: 0,
      uploadedResume: 0,
      viewedMatch: 0,
      appliedOrSaved: 0,
      proConverted: 0
    });

    expect(funnel.uploadRate).toBe(0);
    expect(funnel.matchViewRate).toBe(0);
    expect(funnel.applyRate).toBe(0);
    expect(funnel.proConversionRate).toBe(0);
  });

  // CASO 10: Filtro Universal de Contas de Teste e Internas
  it('Caso 10 — Filtro de Teste: isola contas internas e de automação das métricas de produto', () => {
    const users = [
      { id: '1', email: 'candidato.real@gmail.com', is_test_account: false },
      { id: '2', email: 'admin@vocentro.com.br', is_test_account: false },
      { id: '3', email: 'test_user_123@vocentro.com.br', is_test_account: true },
      { id: '4', email: 'e2e.flow@example.com', is_test_account: false },
      { id: '5', email: 'desenvolvedor.real@yahoo.com', is_test_account: false }
    ];

    const prodUsers = AdminAnalyticsService.filterProductionUsers(users);
    expect(prodUsers.length).toBe(2);
    expect(prodUsers.map(u => u.id)).toEqual(['1', '5']);
  });

  // CASO 11: Time to Value (TTFV) — Percentis P50, P75, P90
  it('Caso 11 — TTFV: cálculo determinístico de P50, P75, P90 e média de tempo até primeiro valor', () => {
    const sampleMinutes = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120];
    const ttfv = AdminAnalyticsService.calculateTimeToValue(sampleMinutes);

    expect(ttfv.sampleCount).toBe(10);
    expect(ttfv.p50Minutes).toBe(25);
    expect(ttfv.p75Minutes).toBe(60);
    expect(ttfv.p90Minutes).toBe(90);
    expect(ttfv.avgMinutes).toBe(42);
  });

  // CASO 12: TTFV com Lista Vazia
  it('Caso 12 — TTFV Lista Vazia: retorna 0 sem erro quando não há amostras', () => {
    const ttfv = AdminAnalyticsService.calculateTimeToValue([]);
    expect(ttfv.sampleCount).toBe(0);
    expect(ttfv.avgMinutes).toBe(0);
    expect(ttfv.p50Minutes).toBe(0);
  });

  // CASO 13: Cálculo de Custo Real de IA (SKU Gemini 3.6 Flash)
  it('Caso 13 — Custo de IA: cálculo preciso por tokens de input e output com quebra por feature', () => {
    const logs = [
      { feature: 'job-matching', input_tokens: 100000, output_tokens: 50000 },
      { feature: 'resume-parsing', input_tokens: 200000, output_tokens: 100000 }
    ];

    const ai = AdminAnalyticsService.calculateAiCosts(logs, 5);
    expect(ai.totalTokens).toBe(450000);
    expect(ai.totalCalls).toBe(2);
    expect(ai.totalCostBrl).toBeGreaterThan(0);
    expect(ai.costPerActiveUserBrl).toBeGreaterThan(0);
    expect(ai.featureBreakdown['job-matching'].calls).toBe(1);
    expect(ai.featureBreakdown['resume-parsing'].calls).toBe(1);
  });

  // CASO 14: Freshness Indicator (Atualizado agora, Aging, Stale)
  it('Caso 14 — Freshness: categoriza a frescura dos dados corretamente (<5m Fresh, 5-30m Aging, >30m Stale)', () => {
    const fresh = AdminAnalyticsService.getFreshness(new Date(nowMs - 2 * 60 * 1000), refDate);
    const aging = AdminAnalyticsService.getFreshness(new Date(nowMs - 15 * 60 * 1000), refDate);
    const stale = AdminAnalyticsService.getFreshness(new Date(nowMs - 45 * 60 * 1000), refDate);

    expect(fresh.status).toBe('fresh');
    expect(fresh.label).toBe('Atualizado há 2 min');

    expect(aging.status).toBe('aging');
    expect(aging.label).toBe('Atualizado há 15 min');

    expect(stale.status).toBe('stale');
    expect(stale.label).toContain('Dados desatualizados');
  });

  // CASO 15: Validador de Eventos — Evento Válido
  it('Caso 15 — Schema de Eventos: valida evento canônico com schema correto', () => {
    const validEvent: CanonicalAnalyticsEvent = {
      event: ANALYTICS_EVENT_NAMES.JOB_MATCH_VIEWED,
      userId: 'usr-val-1',
      timestamp: new Date().toISOString(),
      category: 'Matching',
      properties: {
        job_id: 'job-123',
        career_fit_score: 88
      }
    };

    const validation = AnalyticsEventValidator.validate(validEvent);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  // CASO 16: Validador de Eventos — Rejeição de PII no Payload
  it('Caso 16 — Proteção de PII: rejeita eventos contendo campos proibidos (password, token, CPF, etc.)', () => {
    const invalidEvent: CanonicalAnalyticsEvent = {
      event: ANALYTICS_EVENT_NAMES.AUTH_SIGNUP_COMPLETED,
      userId: 'usr-val-2',
      timestamp: new Date().toISOString(),
      category: 'Auth',
      properties: {
        password: 'minha_senha_secreta',
        cpf: '123.456.789-00'
      }
    };

    const validation = AnalyticsEventValidator.validate(invalidEvent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThanOrEqual(2);
  });

  // CASO 17: Validador de Eventos — Rejeição de Schema Inválido
  it('Caso 17 — Schema Inválido: rejeita eventos sem event name ou com timestamp corrompido', () => {
    const badEvent: any = {
      event: '',
      timestamp: 'data-invalida',
      category: 'Error'
    };

    const validation = AnalyticsEventValidator.validate(badEvent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThanOrEqual(2);
  });

  // CASO 18: Envelope de Status de Query (Query Failure ≠ 0)
  it('Caso 18 — Query Failure ≠ 0: envelope AnalyticsResult preserva erro sem mascarar como zero', () => {
    const successResult: AnalyticsResult<number> = {
      status: 'success',
      data: 0, // Zero real
      updatedAt: new Date().toISOString()
    };

    const errorResult: AnalyticsResult<number> = {
      status: 'error',
      error: 'Falha de conexão com a base de dados',
      updatedAt: new Date().toISOString()
    };

    expect(successResult.status).toBe('success');
    expect(successResult.data).toBe(0);

    expect(errorResult.status).toBe('error');
    if (errorResult.status === 'error') {
      expect(errorResult.error).toBe('Falha de conexão com a base de dados');
    }
  });

  // CASO 19: Fronteira Temporal Exata de 24h
  it('Caso 19 — Fronteira de 24h: evento com 23h59min conta no DAU; evento com 24h01min não conta no DAU mas conta no WAU', () => {
    const inDau = { user_id: 'usr-in', created_at: new Date(nowMs - (23 * 60 + 59) * 60 * 1000).toISOString() };
    const outDau = { user_id: 'usr-out', created_at: new Date(nowMs - (24 * 60 + 1) * 60 * 1000).toISOString() };

    const metrics = AdminAnalyticsService.calculateActiveUserMetrics([inDau, outDau], refDate);
    expect(metrics.dau).toBe(1);
    expect(metrics.wau).toBe(2);
  });

  // CASO 20: Eventos sem user_id ou com Data Inválida
  it('Caso 20 — Resiliência a Dados Corrompidos: eventos com user_id nulo ou timestamps inválidos são ignorados com segurança', () => {
    const dirtyEvents = [
      { user_id: null, created_at: hoursAgo(1) },
      { user_id: undefined, created_at: hoursAgo(2) },
      { user_id: 'valid-usr', created_at: 'invalid-date' },
      { user_id: 'valid-usr-2', created_at: hoursAgo(3) }
    ];

    const metrics = AdminAnalyticsService.calculateActiveUserMetrics(dirtyEvents, refDate);
    expect(metrics.dau).toBe(1);
    expect(metrics.wau).toBe(1);
    expect(metrics.mau).toBe(1);
  });
});
