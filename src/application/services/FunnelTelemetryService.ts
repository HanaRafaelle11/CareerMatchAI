import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface RealUserTelemetryItem {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  lastActiveAt: string;
  lastAction: string;
  hasResume: boolean;
  hasMatch: boolean;
  hitPaywall: boolean;
  paywallFeature?: string;
  openedCheckout: boolean;
  isPro: boolean;
  dropoffStage: 'signup' | 'uploaded_resume' | 'match_calculated' | 'paywall_hit' | 'checkout_opened' | 'paid_pro';
  errorsCount: number;
  lastErrorMessage?: string;
}

export interface FunnelTelemetryMetrics {
  totalRegisteredReal: number;
  uploadedResumeCount: number;
  resumeUploadRate: string;
  calculatedMatchCount: number;
  matchRate: string;
  hitPaywallCount: number;
  paywallHitRate: string;
  openedCheckoutCount: number;
  checkoutRate: string;
  paidProCount: number;
  proConversionRate: string;
  
  // Métricas de Retenção D1 Reconciliadas Matematicamente
  d1RetainedCount: number;
  d1RetentionRate: string;
  singleDayDropoffCount: number;
  singleDayDropoffRate: string;
  d7RetainedCount: number;
  d7RetentionRate: string;

  // Detalhamento por usuário
  userTimelines: RealUserTelemetryItem[];
  excludedAccountsCount: number;
  lastUpdated: string;
}

export class FunnelTelemetryService {
  public static isTestOrAdminAccount(profile: { email?: string | null; role?: string | null }): boolean {
    const email = (profile.email || '').toLowerCase().trim();
    const role = (profile.role || '').toLowerCase().trim();

    if (['administrador', 'suporte', 'financeiro'].includes(role)) return true;
    if (email.includes('.e2e.') || email.includes('hardening.e2e') || email.includes('@example.com')) return true;
    if (email.includes('hanarafaelle11@gmail.com') || email.includes('admin@vocentro.com.br')) return true;
    if (email.includes('test_') || email.includes('mock_') || email.startsWith('test')) return true;

    return false;
  }

  public static async getFunnelTelemetry(): Promise<FunnelTelemetryMetrics> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getEmptyMetrics(0);
    }

    try {
      // 1. Perfis
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at, updated_at');

      const profiles = allProfiles || [];
      const excludedAccounts = profiles.filter(p => this.isTestOrAdminAccount(p));
      const realProfiles = profiles.filter(p => !this.isTestOrAdminAccount(p));
      const realUserIds = new Set(realProfiles.map(p => p.id));

      if (realProfiles.length === 0) {
        return this.getEmptyMetrics(excludedAccounts.length);
      }

      // 2. Resumes
      const { data: resumes } = await supabase
        .from('resumes')
        .select('user_id, created_at');
      
      const realResumes = (resumes || []).filter(r => realUserIds.has(r.user_id));
      const usersWithResume = new Set(realResumes.map(r => r.user_id));

      // 3. Matches
      const { data: matches } = await supabase
        .from('job_matches')
        .select('user_id, created_at');

      const realMatches = (matches || []).filter(m => realUserIds.has(m.user_id));
      const usersWithMatch = new Set(realMatches.map(m => m.user_id));

      // 4. Subscrições Pro ativas
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('user_id, status, created_at');

      const realProUsers = new Set((subs || []).filter(s => s.status === 'active' && realUserIds.has(s.user_id)).map(s => s.user_id));

      // 5. Activity Logs e Analytics Events
      const { data: activityLogs } = await supabase
        .from('activity_logs')
        .select('user_id, event_type, entity_id, metadata, created_at')
        .order('created_at', { ascending: true });

      const { data: analyticsEvents } = await supabase
        .from('analytics_events')
        .select('user_id, event_name, category, metadata, created_at')
        .order('created_at', { ascending: true });

      // 6. Tabela de Erros
      const { data: appErrors } = await supabase
        .from('application_errors')
        .select('user_id, message, error_code, component, created_at')
        .order('created_at', { ascending: false });

      const errorsByUser = new Map<string, { count: number; lastMessage?: string }>();
      (appErrors || []).forEach(err => {
        if (err.user_id && realUserIds.has(err.user_id)) {
          const current = errorsByUser.get(err.user_id) || { count: 0 };
          errorsByUser.set(err.user_id, {
            count: current.count + 1,
            lastMessage: current.lastMessage || `${err.component || 'App'}: ${err.message}`
          });
        }
      });

      // Mapeamento de Atividades por Usuário
      const userTimelineMap = new Map<string, {
        events: Array<{ name: string; time: Date; metadata?: any }>;
        paywallHit: boolean;
        paywallFeature?: string;
        checkoutOpened: boolean;
      }>();

      realProfiles.forEach(p => {
        userTimelineMap.set(p.id, {
          events: [{ name: 'signup', time: new Date(p.created_at) }],
          paywallHit: false,
          checkoutOpened: false
        });
      });

      // Processar activity_logs
      (activityLogs || []).forEach(log => {
        if (!log.user_id || !realUserIds.has(log.user_id)) return;
        const record = userTimelineMap.get(log.user_id);
        if (!record) return;

        const eventTime = new Date(log.created_at);
        const eventType = log.event_type;

        if (eventType === 'paywall_triggered') {
          record.paywallHit = true;
          record.paywallFeature = log.entity_id || log.metadata?.feature;
        } else if (eventType === 'checkout_opened' || eventType === 'billing_modal_opened') {
          record.checkoutOpened = true;
        }

        record.events.push({ name: eventType, time: eventTime, metadata: log.metadata });
      });

      // Processar analytics_events
      (analyticsEvents || []).forEach(evt => {
        if (!evt.user_id || !realUserIds.has(evt.user_id)) return;
        const record = userTimelineMap.get(evt.user_id);
        if (!record) return;

        const eventTime = new Date(evt.created_at);
        const eventName = evt.event_name;

        if (eventName === 'paywall_triggered') {
          record.paywallHit = true;
          record.paywallFeature = evt.metadata?.feature;
        } else if (eventName === 'checkout_opened') {
          record.checkoutOpened = true;
        }

        record.events.push({ name: eventName, time: eventTime, metadata: evt.metadata });
      });

      // ── Reconciliação Matemática da Retenção D1 (Janela 24h-48h pós-cadastro) ──
      let d1RetainedCount = 0;
      let singleDayDropoffCount = 0;
      let d7RetainedCount = 0;

      const userTimelines: RealUserTelemetryItem[] = [];

      realProfiles.forEach(p => {
        const record = userTimelineMap.get(p.id);
        const createdAt = new Date(p.created_at);
        const events = record?.events || [{ name: 'signup', time: createdAt }];
        
        // Ordenar eventos cronologicamente
        events.sort((a, b) => a.time.getTime() - b.time.getTime());
        const lastEvent = events[events.length - 1];

        // Verificar janela D1 (24h a 48h pós-cadastro)
        const hasD1Activity = events.some(e => {
          const diffHours = (e.time.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          return diffHours >= 24 && diffHours <= 48;
        });

        if (hasD1Activity) d1RetainedCount++;

        // Verificar janela D7 (>= 168h pós-cadastro)
        const hasD7Activity = events.some(e => {
          const diffHours = (e.time.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          return diffHours >= 168;
        });
        if (hasD7Activity) d7RetainedCount++;

        // Verificar Abandono Single-Day (Última atividade < 24h e sem retorno posterior)
        const maxDiffHours = (lastEvent.time.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        if (maxDiffHours < 24 && events.length <= 3) {
          singleDayDropoffCount++;
        }

        // Determinar Estágio de Abandono (Funil)
        let dropoffStage: RealUserTelemetryItem['dropoffStage'] = 'signup';
        const isPro = realProUsers.has(p.id);
        const hasResume = usersWithResume.has(p.id);
        const hasMatch = usersWithMatch.has(p.id);
        const hitPaywall = record?.paywallHit || false;
        const openedCheckout = record?.checkoutOpened || false;

        if (isPro) dropoffStage = 'paid_pro';
        else if (openedCheckout) dropoffStage = 'checkout_opened';
        else if (hitPaywall) dropoffStage = 'paywall_hit';
        else if (hasMatch) dropoffStage = 'match_calculated';
        else if (hasResume) dropoffStage = 'uploaded_resume';

        const errInfo = errorsByUser.get(p.id);

        userTimelines.push({
          userId: p.id,
          name: p.full_name || p.email?.split('@')[0] || 'Candidato Real',
          email: p.email || 'N/A',
          createdAt: p.created_at,
          lastActiveAt: lastEvent.time.toISOString(),
          lastAction: lastEvent.name,
          hasResume,
          hasMatch,
          hitPaywall,
          paywallFeature: record?.paywallFeature,
          openedCheckout,
          isPro,
          dropoffStage,
          errorsCount: errInfo?.count || 0,
          lastErrorMessage: errInfo?.lastMessage
        });
      });

      const totalReal = realProfiles.length;
      const uploadedCount = userTimelines.filter(u => u.hasResume).length;
      const matchCount = userTimelines.filter(u => u.hasMatch).length;
      const paywallCount = userTimelines.filter(u => u.hitPaywall).length;
      const checkoutCount = userTimelines.filter(u => u.openedCheckout).length;
      const paidCount = userTimelines.filter(u => u.isPro).length;

      return {
        totalRegisteredReal: totalReal,
        uploadedResumeCount: uploadedCount,
        resumeUploadRate: totalReal > 0 ? ((uploadedCount / totalReal) * 100).toFixed(1) + '%' : '0%',
        calculatedMatchCount: matchCount,
        matchRate: totalReal > 0 ? ((matchCount / totalReal) * 100).toFixed(1) + '%' : '0%',
        hitPaywallCount: paywallCount,
        paywallHitRate: totalReal > 0 ? ((paywallCount / totalReal) * 100).toFixed(1) + '%' : '0%',
        openedCheckoutCount: checkoutCount,
        checkoutRate: totalReal > 0 ? ((checkoutCount / totalReal) * 100).toFixed(1) + '%' : '0%',
        paidProCount: paidCount,
        proConversionRate: totalReal > 0 ? ((paidCount / totalReal) * 100).toFixed(1) + '%' : '0%',

        d1RetainedCount,
        d1RetentionRate: totalReal > 0 ? ((d1RetainedCount / totalReal) * 100).toFixed(1) + '%' : '0%',
        singleDayDropoffCount,
        singleDayDropoffRate: totalReal > 0 ? ((singleDayDropoffCount / totalReal) * 100).toFixed(1) + '%' : '0%',
        d7RetainedCount,
        d7RetentionRate: totalReal > 0 ? ((d7RetainedCount / totalReal) * 100).toFixed(1) + '%' : '0%',

        userTimelines,
        excludedAccountsCount: excludedAccounts.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (err: any) {
      console.error('[FunnelTelemetryService] Erro ao extrair telemetria:', err);
      return this.getEmptyMetrics(0);
    }
  }

  private static getEmptyMetrics(excludedCount = 0): FunnelTelemetryMetrics {
    return {
      totalRegisteredReal: 0,
      uploadedResumeCount: 0,
      resumeUploadRate: '0.0%',
      calculatedMatchCount: 0,
      matchRate: '0.0%',
      hitPaywallCount: 0,
      paywallHitRate: '0.0%',
      openedCheckoutCount: 0,
      checkoutRate: '0.0%',
      paidProCount: 0,
      proConversionRate: '0.0%',

      d1RetainedCount: 0,
      d1RetentionRate: '0.0%',
      singleDayDropoffCount: 0,
      singleDayDropoffRate: '0.0%',
      d7RetainedCount: 0,
      d7RetentionRate: '0.0%',

      userTimelines: [],
      excludedAccountsCount: excludedCount,
      lastUpdated: new Date().toISOString()
    };
  }
}
