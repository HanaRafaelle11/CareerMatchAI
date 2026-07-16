// src/infrastructure/analytics/eventBus.ts
import { isSupabaseConfigured, supabase } from '../api/supabaseClient';

export interface ActivityLog {
  id?: string;
  user_id: string;
  event_type: string;
  entity?: string;
  entity_id?: string;
  metadata?: any;
  ip?: string;
  device?: string;
  created_at?: string;
}

export interface AiTelemetryLog {
  id?: string;
  user_id?: string | null;
  action_type: string;
  duration_ms: number;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  edge_function_name: string;
  failures_count?: number;
  retries_count?: number;
  created_at?: string;
}

class EventBusService {
  private detectedDevice = 'Desktop';
  private detectedBrowser = 'Chrome';
  private detectedOS = 'Windows 11';
  private clientIp = '127.0.0.1';
  private clientCity = 'São Paulo';
  private clientCountry = 'BR';
  private geoFetched = false;

  constructor() {
    this.detectDeviceDetails();
    this.fetchGeoLocation();
  }

  private detectDeviceDetails() {
    if (typeof window === 'undefined' || !navigator) return;
    const ua = navigator.userAgent;
    
    // Browser
    if (ua.indexOf('Firefox') > -1) this.detectedBrowser = 'Firefox';
    else if (ua.indexOf('SamsungBrowser') > -1) this.detectedBrowser = 'Samsung Browser';
    else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) this.detectedBrowser = 'Opera';
    else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) this.detectedBrowser = 'Edge';
    else if (ua.indexOf('Chrome') > -1) this.detectedBrowser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) this.detectedBrowser = 'Safari';

    // OS
    if (ua.indexOf('Windows NT 10.0') > -1) this.detectedOS = 'Windows 10/11';
    else if (ua.indexOf('Windows NT 6.2') > -1) this.detectedOS = 'Windows 8';
    else if (ua.indexOf('Windows NT 6.1') > -1) this.detectedOS = 'Windows 7';
    else if (ua.indexOf('Macintosh') > -1) this.detectedOS = 'macOS';
    else if (ua.indexOf('X11') > -1) this.detectedOS = 'Linux';
    else if (ua.indexOf('Android') > -1) this.detectedOS = 'Android';
    else if (ua.indexOf('iPhone') > -1) this.detectedOS = 'iOS';

    // Device
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
      this.detectedDevice = 'Mobile';
    }
  }

  private async fetchGeoLocation() {
    if (this.geoFetched) return;
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        this.clientIp = data.ip || '127.0.0.1';
        this.clientCity = data.city || 'São Paulo';
        this.clientCountry = data.country_name || 'BR';
        this.geoFetched = true;
      }
    } catch (e) {
      console.warn('[EventBus] Geo fetching failed, using default offline geolocation values.');
    }
  }

  /**
   * Logs a new session entry in admin_user_sessions
   */
  public async logSession(userId: string): Promise<string | null> {
    await this.fetchGeoLocation();
    
    if (!isSupabaseConfigured || !supabase) {
      // Local fallback simulation
      const mockSessions = JSON.parse(localStorage.getItem('vocentro_sessions') || '[]');
      const newSession = {
        id: 'sess-' + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        ip: this.clientIp,
        city: this.clientCity,
        country: this.clientCountry,
        browser: this.detectedBrowser,
        device: this.detectedDevice,
        os: this.detectedOS,
        login_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString()
      };
      mockSessions.unshift(newSession);
      localStorage.setItem('vocentro_sessions', JSON.stringify(mockSessions));
      return newSession.id;
    }

    try {
      const { data, error } = await supabase
        .from('admin_user_sessions')
        .insert({
          user_id: userId,
          ip: this.clientIp,
          city: this.clientCity,
          country: this.clientCountry,
          browser: this.detectedBrowser,
          device: this.detectedDevice,
          os: this.detectedOS,
          login_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          status: 'active'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (err) {
      console.error('[EventBus] Error logging admin session:', err);
      return null;
    }
  }

  /**
   * Updates the last activity date or status of a session
   */
  public async updateSessionActivity(sessionId: string, status: 'active' | 'expired' | 'logged_out' = 'active'): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const mockSessions = JSON.parse(localStorage.getItem('vocentro_sessions') || '[]');
      const session = mockSessions.find((s: any) => s.id === sessionId);
      if (session) {
        session.last_activity = new Date().toISOString();
        session.status = status;
        if (status === 'logged_out') {
          session.logout_at = new Date().toISOString();
        }
        localStorage.setItem('vocentro_sessions', JSON.stringify(mockSessions));
      }
      return;
    }

    try {
      const updatePayload: any = {
        last_activity: new Date().toISOString(),
        status
      };
      if (status === 'logged_out') {
        updatePayload.logout_at = new Date().toISOString();
      }
      await supabase
        .from('admin_user_sessions')
        .update(updatePayload)
        .eq('id', sessionId);
    } catch (err) {
      console.error('[EventBus] Error updating session activity:', err);
    }
  }

  /**
   * Registers a relevant event action in activity_logs
   */
  public async logActivity(
    userId: string,
    eventType: string,
    entity?: string,
    entityId?: string,
    metadata: any = {}
  ): Promise<void> {
    await this.fetchGeoLocation();

    const deviceString = `${this.detectedBrowser} / ${this.detectedOS} (${this.detectedDevice})`;

    if (!isSupabaseConfigured || !supabase) {
      // Local fallback
      const mockLogs = JSON.parse(localStorage.getItem('vocentro_activity_logs') || '[]');
      const newLog = {
        id: 'log-' + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        event_type: eventType,
        entity: entity || null,
        entity_id: entityId || null,
        metadata,
        ip: this.clientIp,
        device: deviceString,
        created_at: new Date().toISOString()
      };
      mockLogs.unshift(newLog);
      localStorage.setItem('vocentro_activity_logs', JSON.stringify(mockLogs));
      
      // Update local baseline statistics if needed
      return;
    }

    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          event_type: eventType,
          entity: entity || null,
          entity_id: entityId || null,
          metadata,
          ip: this.clientIp,
          device: deviceString
        });
      if (error) throw error;
    } catch (err) {
      console.error('[EventBus] Error writing activity log:', err);
    }
  }

  /**
   * Registers AI latency, costs and token telemetry logs
   */
  public async logTelemetry(log: AiTelemetryLog): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      // Local fallback
      const mockTelemetry = JSON.parse(localStorage.getItem('vocentro_ai_telemetry') || '[]');
      const newTelemetry = {
        id: 'tel-' + Math.random().toString(36).substring(2, 9),
        ...log,
        created_at: new Date().toISOString()
      };
      mockTelemetry.unshift(newTelemetry);
      localStorage.setItem('vocentro_ai_telemetry', JSON.stringify(mockTelemetry));
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_telemetry')
        .insert({
          user_id: log.user_id || null,
          action_type: log.action_type,
          duration_ms: log.duration_ms,
          latency_ms: log.latency_ms,
          input_tokens: log.input_tokens,
          output_tokens: log.output_tokens,
          estimated_cost: log.estimated_cost,
          edge_function_name: log.edge_function_name,
          failures_count: log.failures_count || 0,
          retries_count: log.retries_count || 0
        });
      if (error) throw error;
    } catch (err) {
      console.error('[EventBus] Error writing AI telemetry:', err);
    }
  }
}

export const eventBus = new EventBusService();
