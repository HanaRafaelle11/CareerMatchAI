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

  public trackCheckoutStarted(plan: string, metadata: { feature?: string; amount?: number } = {}) {
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
}


export const tracker = new AnalyticsTracker();
