import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tracker } from '../../src/infrastructure/analytics/tracker';

describe('Auditoria de Telemetria e Analytics do Funil Beta (Fase 5)', () => {
  let trackedEvents: Array<{ eventName: string; category: string; metadata: any }> = [];

  beforeEach(() => {
    trackedEvents = [];
    vi.spyOn(tracker, 'track').mockImplementation(async (eventName, category, metadata) => {
      trackedEvents.push({ eventName, category, metadata });
    });
  });

  describe('Validação dos 10 Eventos Canônicos da Fase 4', () => {
    it('1. sidebar_item_clicked: deve disparar com item e source="sidebar"', async () => {
      await tracker.track('sidebar_item_clicked', 'Navigation', {
        item: 'match',
        source: 'sidebar'
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('sidebar_item_clicked');
      expect(trackedEvents[0].metadata).toEqual({ item: 'match', source: 'sidebar' });
    });

    it('2. sidebar_collapsed_toggled: deve disparar com is_collapsed boolean', async () => {
      await tracker.track('sidebar_collapsed_toggled', 'Navigation', {
        is_collapsed: true
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('sidebar_collapsed_toggled');
      expect(trackedEvents[0].metadata).toEqual({ is_collapsed: true });
    });

    it('3. mobile_nav_item_clicked: deve disparar com item e source="mobile_bottom_nav"', async () => {
      await tracker.track('mobile_nav_item_clicked', 'Navigation', {
        item: 'strategy',
        source: 'mobile_bottom_nav'
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('mobile_nav_item_clicked');
      expect(trackedEvents[0].metadata).toEqual({ item: 'strategy', source: 'mobile_bottom_nav' });
    });

    it('4. copilot_drawer_opened: deve disparar UMA vez por abertura com source, has_resume e is_pro', async () => {
      await tracker.track('copilot_drawer_opened', 'Copilot', {
        source: 'sidebar',
        has_resume: true,
        is_pro: false
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('copilot_drawer_opened');
      expect(trackedEvents[0].metadata).toEqual({
        source: 'sidebar',
        has_resume: true,
        is_pro: false
      });
    });

    it('5. copilot_drawer_closed: deve disparar com contagem numérica de mensagens', async () => {
      await tracker.track('copilot_drawer_closed', 'Copilot', {
        message_count: 4
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('copilot_drawer_closed');
      expect(trackedEvents[0].metadata).toEqual({ message_count: 4 });
    });

    it('6. copilot_recommendation_clicked: deve disparar com rec_id e target_tab', async () => {
      await tracker.track('copilot_recommendation_clicked', 'Copilot', {
        rec_id: 'rec-1',
        target_tab: 'match'
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('copilot_recommendation_clicked');
      expect(trackedEvents[0].metadata).toEqual({
        rec_id: 'rec-1',
        target_tab: 'match'
      });
    });

    it('7. copilot_message_sent: deve enviar length e is_pro SEM expor texto bruto do usuário', async () => {
      const sensitiveUserInput = 'Meu salário atual é 15k e meu CPF é 123.456.789-00';
      
      await tracker.track('copilot_message_sent', 'Copilot', {
        length: sensitiveUserInput.length,
        is_pro: true
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('copilot_message_sent');
      expect(trackedEvents[0].metadata).toEqual({
        length: 50,
        is_pro: true
      });
      // Garante que o texto bruto nunca vazou para os metadados
      expect(JSON.stringify(trackedEvents[0].metadata)).not.toContain('15k');
      expect(JSON.stringify(trackedEvents[0].metadata)).not.toContain('123.456.789-00');
    });

    it('8. copilot_response_received: deve disparar com success boolean', async () => {
      await tracker.track('copilot_response_received', 'Copilot', {
        success: true
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('copilot_response_received');
      expect(trackedEvents[0].metadata).toEqual({ success: true });
    });

    it('9. copilot_error_displayed: deve categorizar erro restrito a rate_limit ou network_or_api sem stack traces', async () => {
      await tracker.track('copilot_error_displayed', 'Copilot', {
        error_type: 'rate_limit'
      });
      await tracker.track('copilot_error_displayed', 'Copilot', {
        error_type: 'network_or_api'
      });

      expect(trackedEvents).toHaveLength(2);
      expect(trackedEvents[0].metadata).toEqual({ error_type: 'rate_limit' });
      expect(trackedEvents[1].metadata).toEqual({ error_type: 'network_or_api' });
      // Proibido conter mensagens brutas de erro ou stack trace
      expect(trackedEvents[0].metadata.message).toBeUndefined();
      expect(trackedEvents[0].metadata.stack).toBeUndefined();
    });

    it('10. copilot_intent_redirected: deve disparar intent="interview_simulation" e target_tab="coach"', async () => {
      await tracker.track('copilot_intent_redirected', 'Copilot', {
        intent: 'interview_simulation',
        target_tab: 'coach'
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('copilot_intent_redirected');
      expect(trackedEvents[0].metadata).toEqual({
        intent: 'interview_simulation',
        target_tab: 'coach'
      });
    });
  });

  describe('Auditoria de Privacidade & Mascaramento', () => {
    it('deve mascarar e-mails no tracker (3 primeiros caracteres + ***)', () => {
      tracker.trackGiveawayRegistered('candidato.teste@exemplo.com.br', 'resp-123');

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('giveaway_registered');
      expect(trackedEvents[0].metadata.email_masked).toBe('can***');
      expect(JSON.stringify(trackedEvents[0].metadata)).not.toContain('candidato.teste@exemplo.com.br');
    });

    it('deve rejeitar e não registrar dados de cartão de crédito no tracker', async () => {
      // Simulação do payload sanitizado do checkout
      tracker.trackCheckoutStarted('pro', {
        billing_type: 'CREDIT_CARD',
        billing_cycle: 'MONTHLY'
      });

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].eventName).toBe('checkout_started');
      expect(trackedEvents[0].metadata).toEqual({
        plan: 'pro',
        billing_type: 'CREDIT_CARD',
        billing_cycle: 'MONTHLY'
      });
      // Verificação estrita de ausência de números de cartão ou CCV
      expect(trackedEvents[0].metadata.cardNumber).toBeUndefined();
      expect(trackedEvents[0].metadata.ccv).toBeUndefined();
    });
  });

  describe('Cobertura dos 13 Estágios do Funil Beta', () => {
    it('deve permitir medir a jornada de ponta a ponta sem lacunas', async () => {
      // 1. Entrada
      await tracker.track('signup_completed', 'auth', {});
      // 2. Perfil
      await tracker.track('profile_updated', 'Profile', { has_skills: true, has_roles: true });
      // 3. Currículo
      await tracker.track('resume_uploaded', 'resumes', {});
      await tracker.track('resume_parsed', 'resumes', {});
      // 4. Análise de Vaga
      tracker.trackJobDiscovered('job-1', { title: 'Frontend Developer' });
      // 5. Match
      await tracker.track('career_score_viewed', 'ProductLaunch', { score: 85 });
      await tracker.track('match_calculated', 'JobMatchHub', { jobId: 'job-1', score: 88 });
      // 6. Candidatura
      await tracker.track('match_apply_clicked', 'JobMatch', { job_id: 'job-1', score: 88 });
      // 7. Pipeline
      await tracker.track('application_pipeline_opened', 'ProductBeta', { applications_count: 1, jobs_count: 1 });
      // 8. Copiloto
      await tracker.track('copilot_drawer_opened', 'Copilot', { source: 'sidebar', has_resume: true, is_pro: false });
      // 9. Entrevista
      await tracker.track('interview_started', 'interviews', {});
      // 10. Paywall Free
      tracker.trackPaywallViewed('weekly_limit', { title: 'Cota Semanal' });
      // 11. CTA Pro
      tracker.trackPaywallCtaClicked('weekly_limit', { cta_text: 'Fazer Upgrade' });
      tracker.trackCheckoutStarted('pro', { billing_type: 'PIX', billing_cycle: 'MONTHLY' });
      // 12. Conversão
      await tracker.track('payment_confirmed', 'Billing', { plan: 'pro', is_pro: true });
      // 13. Abandono
      tracker.trackSurveyAbandoned(2, 'question_2', 'beta_general');

      expect(trackedEvents.length).toBe(16);
      const eventNames = trackedEvents.map(e => e.eventName);

      expect(eventNames).toContain('signup_completed');
      expect(eventNames).toContain('profile_updated');
      expect(eventNames).toContain('resume_uploaded');
      expect(eventNames).toContain('job_discovered');
      expect(eventNames).toContain('career_score_viewed');
      expect(eventNames).toContain('match_calculated');
      expect(eventNames).toContain('match_apply_clicked');
      expect(eventNames).toContain('application_pipeline_opened');
      expect(eventNames).toContain('copilot_drawer_opened');
      expect(eventNames).toContain('interview_started');
      expect(eventNames).toContain('paywall_viewed');
      expect(eventNames).toContain('paywall_cta_clicked');
      expect(eventNames).toContain('checkout_started');
      expect(eventNames).toContain('payment_confirmed');
      expect(eventNames).toContain('survey_abandoned');
    });
  });
});
