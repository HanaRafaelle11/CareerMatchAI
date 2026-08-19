// src/infrastructure/analytics/tracker.ts
import { isSupabaseConfigured, supabase } from '../api/supabaseClient';
import { localDB } from '../storage/localDatabase';

export interface AnalyticsEvent {
  id?: string;
  user_id?: string | null;
  event_name: string;
  category: string;
  metadata?: any;
  created_at?: string;
  session_id?: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}

class AnalyticsTracker {
  private sessionId: string;
  private deviceDetails: { device: string; browser: string; os: string };

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.deviceDetails = this.detectDeviceDetails();
  }

  private getOrCreateSessionId(): string {
    try {
      let sid = sessionStorage.getItem('vocentro_session_id');
      if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('vocentro_session_id', sid);
      }
      return sid;
    } catch {
      return 'sess_fallback_' + Date.now();
    }
  }

  private detectDeviceDetails() {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    let device = 'Desktop';

    // Browser detection
    if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Browser';
    else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
    else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Edge';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';

    // OS detection
    if (ua.indexOf('Windows NT 10.0') > -1) os = 'Windows 10/11';
    else if (ua.indexOf('Windows NT 6.2') > -1) os = 'Windows 8';
    else if (ua.indexOf('Windows NT 6.1') > -1) os = 'Windows 7';
    else if (ua.indexOf('Macintosh') > -1) os = 'macOS';
    else if (ua.indexOf('X11') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

    // Device detection
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
      device = 'Mobile';
      if (/iPad|tablet/i.test(ua)) {
        device = 'Tablet';
      }
    }

    return { device, browser, os };
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Tracks an analytical event and pushes it to Supabase (if configured) or local DB fallback
   */
  public async track(eventName: string, category: string, metadata: any = {}): Promise<void> {
    try {
      let userId: string | null = null;

      // Get authenticated user ID if possible
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      } else {
        const mockAuth = localStorage.getItem('mock_auth_user');
        if (mockAuth) {
          const parsed = JSON.parse(mockAuth);
          userId = parsed.id || null;
        }
      }

      // Hardcode location approximations or fallback (avoid external blocking API calls in sync flows)
      const country = 'BR';
      const city = 'São Paulo';

      const eventPayload: AnalyticsEvent = {
        user_id: userId,
        event_name: eventName,
        category,
        metadata,
        session_id: this.sessionId,
        device: this.deviceDetails.device,
        browser: this.deviceDetails.browser,
        os: this.deviceDetails.os,
        country,
        city,
        created_at: new Date().toISOString()
      };

      // Disparar evento de conversão do LinkedIn Insight Tag se configurado no navegador
      this.trackLinkedInConversion(eventName, metadata);

      // Write to Supabase if available
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('analytics_events').insert(eventPayload);
        if (error) {
          console.warn('Failed to insert event in Supabase, logging locally:', error);
          localDB.saveAnalyticsEvent(eventPayload);
        }
      } else {
        // Write to mock storage
        localDB.saveAnalyticsEvent(eventPayload);
      }
    } catch (err) {
      console.error('Error in AnalyticsTracker:', err);
    }
  }

  /**
   * Dispara eventos customizados para o LinkedIn Insight Tag (lintrk) em pontos-chave do funil
   */
  private trackLinkedInConversion(eventName: string, metadata: any = {}) {
    try {
      if (typeof window !== 'undefined' && (window as any).lintrk) {
        const conversionEvents: Record<string, string> = {
          'signup_completed': 'signup_completed',
          'resume_uploaded': 'resume_uploaded',
          'match_calculated': 'match_calculated',
          'pro_subscription_paid': 'pro_subscription_paid',
          'payment_confirmed': 'pro_subscription_paid'
        };

        const targetEvent = conversionEvents[eventName];
        if (targetEvent) {
          (window as any).lintrk('track', { conversion_id: metadata?.conversion_id || targetEvent });
          console.log(`[Analytics] Evento de conversão LinkedIn '${targetEvent}' disparado com sucesso.`);
        }
      }
    } catch (lErr) {
      console.warn('[Analytics] Erro não fatal ao disparar conversão LinkedIn:', lErr);
    }
  }

  /**
   * Dispara o evento de momento "Aha!" quando o usuário completa o funil básico de valor
   */
  public trackAhaMoment(metadata: {
    user_id?: string;
    career_score?: number;
    first_job_match_score?: number;
    time_since_signup?: number;
  }) {
    this.track('aha_moment_reached', 'Growth', {
      session_id: this.sessionId,
      ...metadata
    });
  }

  /**
   * Dispara o evento de ação de carreira qualificada (Saved / Applied / Adaptation com fit >= 75)
   */
  public trackQualifiedAction(metadata: {
    user_id?: string;
    job_id: string;
    action: 'saved' | 'applied' | 'resume_adaptation';
    career_fit_score: number;
  }) {
    this.track('qualified_career_action', 'Growth', metadata);
  }

  // ── Métodos de Telemetria do Funil de Monetização (Free -> PRO) ──

  public trackJobDiscovered(jobId: string, metadata: { title?: string; company?: string; source?: string } = {}) {
    this.track('job_discovered', 'Monetization', { job_id: jobId, ...metadata });
  }

  public trackJobUnlocked(jobId: string, metadata: { unlocked_count: number; is_pro: boolean } = { unlocked_count: 1, is_pro: false }) {
    this.track('job_unlocked', 'Monetization', { job_id: jobId, ...metadata });
  }

  public trackFreeJobLimitReached(jobId: string, metadata: { current_count: number; limit: number } = { current_count: 3, limit: 3 }) {
    this.track('free_job_limit_reached', 'Monetization', { job_id: jobId, ...metadata });
  }

  public trackPaywallViewed(feature: string, metadata: { title?: string; location?: string } = {}) {
    this.track('paywall_viewed', 'Monetization', { feature, ...metadata });
  }

  public trackPaywallCtaClicked(feature: string, metadata: { cta_text?: string; plan?: string } = {}) {
    this.track('paywall_cta_clicked', 'Monetization', { feature, ...metadata });
  }

  public trackCheckoutStarted(plan: string, metadata: { feature?: string; amount?: number; billing_type?: string; billing_cycle?: string } = {}) {
    this.track('checkout_started', 'Monetization', { plan, ...metadata });
  }

  public trackMatchCompleted(matchScore: number, jobId: string, metadata: any = {}) {
    this.track('match_completed', 'Monetization', { match_score: matchScore, job_id: jobId, ...metadata });
  }

  public trackMatchUpgradeCtaClicked(matchScore: number, jobId: string, ctaType: 'copilot' | 'resume_export') {
    this.track('match_upgrade_cta_clicked', 'Monetization', { match_score: matchScore, job_id: jobId, type: ctaType });
  }

  public trackResumeExportUpgradeCtaClicked(matchScore: number, jobId: string, ctaType: 'resume_export') {
    this.track('resume_export_upgrade_cta_clicked', 'Monetization', { match_score: matchScore, job_id: jobId, type: ctaType });
  }

  public trackResumeOptimizedPreviewViewed(jobId: string, metadata: any = {}) {
    this.track('resume_optimized_preview_viewed', 'Monetization', { job_id: jobId, ...metadata });
  }

  // ── Métodos de Telemetria da Pesquisa de Usuários Fundadores (v1_founders_validation) ──

  public trackSurveyCampaignViewed(cohort: string, source: string) {
    this.track('survey_campaign_viewed', 'UserResearch', { cohort, source, survey_version: 'v1_founders_validation' });
  }

  public trackSurveyStarted(cohort: string, source: string) {
    this.track('survey_started', 'UserResearch', { cohort, source, survey_version: 'v1_founders_validation' });
  }

  public trackSurveyCompleted(cohort: string, source: string, nps: number, proIntent: string) {
    this.track('survey_completed', 'UserResearch', {
      cohort,
      source,
      nps,
      pro_intent: proIntent,
      survey_version: 'v1_founders_validation'
    });
  }

  public trackSurveyAbandoned(questionNumber: number, questionName: string, cohort: string) {
    this.track('survey_abandoned', 'UserResearch', {
      question_number: questionNumber,
      question_name: questionName,
      cohort,
      survey_version: 'v1_founders_validation'
    });
  }

  public trackGiveawayRegistered(email: string, responseId: string) {
    this.track('giveaway_registered', 'UserResearch', { email_masked: email.slice(0, 3) + '***', survey_response_id: responseId });
  }

  public trackSurveyQuestionAnswered(questionNumber: number, questionName: string, metadata: any = {}) {
    this.track('survey_question_answered', 'UserResearch', {
      question_number: questionNumber,
      question_name: questionName,
      ...metadata,
      survey_version: 'v1_founders_validation'
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('survey_events').insert({
        event_name: 'survey_question_answered',
        question_number: questionNumber,
        question_name: questionName,
        metadata
      }).then(({ error }) => {
        if (error) console.warn('[Analytics] Erro não fatal em survey_events:', error);
      });
    }
  }

  public trackSurveyEmailSent(email: string, cohort: string, emailType: string) {
    this.track('survey_email_sent', 'UserResearch', { email_masked: email.slice(0, 3) + '***', cohort, email_type: emailType, survey_version: 'v1_founders_validation' });
  }

  public trackSurveyEmailDelivered(email: string, cohort: string) {
    this.track('survey_email_delivered', 'UserResearch', { email_masked: email.slice(0, 3) + '***', cohort, survey_version: 'v1_founders_validation' });
  }

  public trackSurveyEmailOpened(email: string, cohort: string) {
    this.track('survey_email_opened', 'UserResearch', { email_masked: email.slice(0, 3) + '***', cohort, survey_version: 'v1_founders_validation' });
  }

  public trackSurveyEmailClicked(email: string, cohort: string) {
    this.track('survey_email_clicked', 'UserResearch', { email_masked: email.slice(0, 3) + '***', cohort, survey_version: 'v1_founders_validation' });
  }

  // ── Telemetria de Produto & Matching V3 (Fase 5 - Sem PII) ──

  public trackJobMatchViewed(jobId: string, metadata: { career_fit_score?: number; career_goal_score?: number | null; transition_type?: string; intent_type?: string } = {}) {
    this.track('job_match_viewed', 'Matching', { job_id: jobId, ...metadata });
  }

  public trackMatchExplanationOpened(jobId: string, metadata: { career_fit_score?: number; career_goal_score?: number | null; transition_type?: string } = {}) {
    this.track('match_explanation_opened', 'Matching', { job_id: jobId, ...metadata });
  }

  public trackCareerGoalCtaClicked(source?: string) {
    this.track('career_goal_cta_clicked', 'CareerGoal', { source: source || 'unknown' });
  }

  public trackCareerGoalCreated(intentType: string, metadata: { has_target_area?: boolean; roles_count?: number } = {}) {
    this.track('career_goal_created', 'CareerGoal', { intent_type: intentType, ...metadata });
  }

  public trackApplyRecommendationViewed(jobId: string, recommendation: string, metadata: { career_fit_score?: number; career_goal_score?: number | null } = {}) {
    this.track('apply_recommendation_viewed', 'DecisionSupport', { job_id: jobId, recommendation, ...metadata });
  }

  public trackJobSaved(jobId: string, metadata: { career_fit_score?: number; career_goal_score?: number | null } = {}) {
    this.track('job_saved', 'Action', { job_id: jobId, ...metadata });
  }

  public trackJobRejected(jobId: string, metadata: { career_fit_score?: number; reason?: string } = {}) {
    this.track('job_rejected', 'Action', { job_id: jobId, ...metadata });
  }

  public trackCoverLetterGenerated(jobId: string, metadata: { style?: string; fit_score?: number } = {}) {
    this.track('cover_letter_generated', 'Action', { job_id: jobId, ...metadata });
  }

  public trackApplicationCreated(jobId: string, metadata: { stage?: string; fit_score?: number } = {}) {
    this.track('application_created', 'Action', { job_id: jobId, ...metadata });
  }

  // ── Telemetria de Ranking & Qualidade de Vagas (Fase 8 - Sem PII) ──

  public trackJobDuplicateFiltered(duplicateCount: number) {
    this.track('job_duplicate_filtered', 'Ranking', { duplicate_count: duplicateCount });
  }

  public trackJobQualityFiltered(filteredCount: number) {
    this.track('job_quality_filtered', 'Ranking', { filtered_count: filteredCount });
  }

  public trackJobRanked(totalRanked: number, strategy: string) {
    this.track('job_ranked', 'Ranking', { total_ranked: totalRanked, strategy });
  }

  // ── Telemetria de Valor do Usuário & Feedback (Fase 9 - Sem PII) ──

  public trackJobResultClicked(jobId: string, rankPosition: number) {
    this.track('job_result_clicked', 'UserValue', { job_id: jobId, rank_position: rankPosition });
  }

  public trackJobApplicationStarted(jobId: string) {
    this.track('job_application_started', 'UserValue', { job_id: jobId });
  }

  public trackJobMatchFeedbackSubmitted(jobId: string, isPositive: boolean, reason?: string) {
    this.track('job_match_feedback_submitted', 'UserValue', { job_id: jobId, is_positive: isPositive, reason: reason || 'none' });
  }

  // ── Telemetria de Experimentação & Testes A/B (Fase 10 - Sem PII) ──

  public trackExperimentExposed(experimentId: string, variant: string, metadata: any = {}) {
    this.track('experiment_exposed', 'Experimentation', {
      experiment_id: experimentId,
      variant,
      ...metadata
    });
  }

  public trackExperimentConversion(experimentId: string, variant: string, metricName: string, value: number = 1, metadata: any = {}) {
    this.track('experiment_conversion', 'Experimentation', {
      experiment_id: experimentId,
      variant,
      metric_name: metricName,
      value,
      ...metadata
    });
  }

  public trackExperimentGuardrailTriggered(experimentId: string, variant: string, guardrailName: string, metadata: any = {}) {
    this.track('experiment_guardrail_triggered', 'Experimentation', {
      experiment_id: experimentId,
      variant,
      guardrail_name: guardrailName,
      ...metadata
    });
  }
}

export const tracker = new AnalyticsTracker();
