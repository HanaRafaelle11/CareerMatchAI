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
      let sid = sessionStorage.getItem('talenta_session_id');
      if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('talenta_session_id', sid);
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
}

export const tracker = new AnalyticsTracker();
