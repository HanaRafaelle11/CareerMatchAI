import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface NorthStarDetails {
  scorePercentage: number;
  qualifiedCandidatesCount: number;
  totalActiveCandidates7d: number;
  candidatesWithHighMatchApp: number;
  candidatesInAdvancedStages: number;
  nicheMarketLimitationNote: string;
}

export interface EngagementMetrics {
  activationRate: number;
  totalUsersCount: number;
  activatedUsersCount: number;
  wau: number;
  mau: number;
  dau: number;
  stickinessRate: number;
}

export interface MilestoneVelocity {
  timeToValueHours: number;
  timeToMatchHours: number;
  timeToApplicationDays: number;
  timeToInterviewDays: number;
  timeToHireDays: number;
  hiredSampleCount: number;
}

export interface ProductHealthMetrics {
  northStar: NorthStarDetails;
  engagement: EngagementMetrics;
  velocity: MilestoneVelocity;
}

export class ProductHealthService {
  /**
   * Agrega os 10 indicadores de Saúde do Produto com exclusão estrita de contas de teste
   */
  static async getProductHealthMetrics(): Promise<ProductHealthMetrics> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getEmptyProductHealthMetrics();
    }

    try {
      const [
        profilesRes,
        resumesRes,
        matchesRes,
        applicationsRes,
        eventsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, created_at, is_test_account').order('created_at', { ascending: false }),
        supabase.from('resumes').select('id, user_id, created_at'),
        supabase.from('matches').select('id, user_id, job_id, score_overall, created_at'),
        supabase.from('applications').select('id, user_id, job_id, status, created_at, updated_at'),
        supabase.from('analytics_events').select('user_id, event_name, created_at').order('created_at', { ascending: false })
      ]);

      const rawProfiles = profilesRes.data || [];
      const allProfiles = rawProfiles.filter((p: any) => p.is_test_account !== true);
      const resumes = resumesRes.data || [];
      const matches = matchesRes.data || [];
      const applications = applicationsRes.data || [];
      const events = eventsRes.data || [];

      const nowMs = Date.now();
      const realUserIds = new Set(allProfiles.map(p => p.id));

      // Filter events by real users
      const realEvents = events.filter((e: any) => e.user_id && realUserIds.has(e.user_id));

      // ── 1. WAU, MAU, DAU ──
      const active7dSet = new Set<string>();
      const active30dSet = new Set<string>();
      const active24hSet = new Set<string>();

      realEvents.forEach((ev: any) => {
        const evMs = new Date(ev.created_at).getTime();
        const diffHours = (nowMs - evMs) / (1000 * 60 * 60);
        if (diffHours <= 24) active24hSet.add(ev.user_id);
        if (diffHours <= 24 * 7) active7dSet.add(ev.user_id);
        if (diffHours <= 24 * 30) active30dSet.add(ev.user_id);
      });

      // Complementar com perfis ativos/atualizados no período
      allProfiles.forEach(p => {
        const createdMs = new Date(p.created_at).getTime();
        const diffDays = (nowMs - createdMs) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) active7dSet.add(p.id);
        if (diffDays <= 30) active30dSet.add(p.id);
        if (diffDays <= 1) active24hSet.add(p.id);
      });

      const wau = active7dSet.size;
      const mau = active30dSet.size;
      const dau = active24hSet.size;
      const stickinessRate = mau > 0 ? Number(((dau / mau) * 100).toFixed(1)) : 0;

      // ── 2. ACTIVATION RATE ──
      const activatedUserIds = new Set(resumes.filter((r: any) => realUserIds.has(r.user_id)).map((r: any) => r.user_id));
      const activatedUsersCount = activatedUserIds.size;
      const totalUsersCount = allProfiles.length;
      const activationRate = totalUsersCount > 0 ? Number(((activatedUsersCount / totalUsersCount) * 100).toFixed(1)) : 0;

      // ── 3. NORTH STAR METRIC ──
      // Candidatos ativos 7d com >=1 candidatura em Match >=75% OU com candidatura em 'hr', 'interview', 'offer'
      const highMatchJobIds = new Set(matches.filter((m: any) => (m.score_overall || 0) >= 75).map((m: any) => `${m.user_id}_${m.job_id}`));

      const highMatchAppsUserIds = new Set<string>();
      const advancedStageUserIds = new Set<string>();

      applications.forEach((app: any) => {
        if (!realUserIds.has(app.user_id)) return;

        // Candidatura com Match alto
        if (highMatchJobIds.has(`${app.user_id}_${app.job_id}`)) {
          highMatchAppsUserIds.add(app.user_id);
        }

        // Estágio avançado de entrevista
        if (['hr', 'interview', 'offer'].includes(app.status)) {
          advancedStageUserIds.add(app.user_id);
        }
      });

      const qualifiedSet = new Set<string>([...highMatchAppsUserIds, ...advancedStageUserIds]);
      const totalActive7d = wau;
      const northStarScore = totalActive7d > 0 ? Number(((qualifiedSet.size / totalActive7d) * 100).toFixed(1)) : 0;

      // ── 4. MILESTONE VELOCITY (TTV, Time to Match, Time to App, Time to Interview, Time to Hire) ──
      let totalTtvHours = 0;
      let ttvCount = 0;

      let totalTimeToMatchHours = 0;
      let timeToMatchCount = 0;

      let totalTimeToAppDays = 0;
      let timeToAppCount = 0;

      let totalTimeToInterviewDays = 0;
      let timeToInterviewCount = 0;

      let totalTimeToHireDays = 0;
      let timeToHireCount = 0;

      allProfiles.forEach(p => {
        const pCreatedMs = new Date(p.created_at).getTime();

        // 1. Time to Value (Cadastro -> Diagnóstico do Perfil / Upload do CV)
        const userResumes = resumes.filter((r: any) => r.user_id === p.id).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        if (userResumes.length > 0) {
          const firstCvMs = new Date(userResumes[0].created_at).getTime();
          const diffHours = Math.max(0.1, (firstCvMs - pCreatedMs) / (1000 * 60 * 60));
          totalTtvHours += diffHours;
          ttvCount++;
        }

        // 2. Time to Match (Cadastro -> Primeiro Match Calculado com Vaga)
        const userMatches = [
          ...matches.filter((m: any) => m.user_id === p.id),
          ...events.filter((e: any) => e.user_id === p.id && (e.event_name === 'match_calculated' || e.event_name === 'match_calculation' || e.event_name === 'job_match_viewed'))
        ].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        if (userMatches.length > 0) {
          const firstMatchMs = new Date(userMatches[0].created_at).getTime();
          const diffHours = Math.max(0.1, (firstMatchMs - pCreatedMs) / (1000 * 60 * 60));
          totalTimeToMatchHours += diffHours;
          timeToMatchCount++;
        }

        // Primeiras Candidaturas
        const userApps = applications.filter((a: any) => a.user_id === p.id).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        if (userApps.length > 0) {
          const firstAppMs = new Date(userApps[0].created_at).getTime();
          const diffDays = Math.max(0.1, (firstAppMs - pCreatedMs) / (1000 * 60 * 60 * 24));
          totalTimeToAppDays += diffDays;
          timeToAppCount++;
        }

        // Primeiras Entrevistas
        const userInterviewApps = userApps.filter((a: any) => ['hr', 'interview', 'offer', 'hired'].includes(a.status));
        if (userInterviewApps.length > 0) {
          const firstIntMs = new Date(userInterviewApps[0].updated_at || userInterviewApps[0].created_at).getTime();
          const diffDays = Math.max(0.5, (firstIntMs - pCreatedMs) / (1000 * 60 * 60 * 24));
          totalTimeToInterviewDays += diffDays;
          timeToInterviewCount++;
        }

        // Contratações
        const hiredApps = userApps.filter((a: any) => a.status === 'hired');
        if (hiredApps.length > 0) {
          const hiredMs = new Date(hiredApps[0].updated_at || hiredApps[0].created_at).getTime();
          const diffDays = Math.max(1, (hiredMs - pCreatedMs) / (1000 * 60 * 60 * 24));
          totalTimeToHireDays += diffDays;
          timeToHireCount++;
        }
      });

      const avgTtvHours = ttvCount > 0 ? Number((totalTtvHours / ttvCount).toFixed(1)) : 0;
      const avgTimeToMatchHours = timeToMatchCount > 0 ? Number((totalTimeToMatchHours / timeToMatchCount).toFixed(1)) : 0;
      const avgTimeToAppDays = timeToAppCount > 0 ? Number((totalTimeToAppDays / timeToAppCount).toFixed(1)) : 0;
      const avgTimeToInterviewDays = timeToInterviewCount > 0 ? Number((totalTimeToInterviewDays / timeToInterviewCount).toFixed(1)) : 0;
      const avgTimeToHireDays = timeToHireCount > 0 ? Number((totalTimeToHireDays / timeToHireCount).toFixed(1)) : 0;

      return {
        northStar: {
          scorePercentage: Math.min(100, northStarScore),
          qualifiedCandidatesCount: qualifiedSet.size,
          totalActiveCandidates7d: totalActive7d,
          candidatesWithHighMatchApp: highMatchAppsUserIds.size,
          candidatesInAdvancedStages: advancedStageUserIds.size,
          nicheMarketLimitationNote: 'Limitação Conhecida: Candidatos em nichos altamente especializados ou regiões com menor oferta física de vagas podem ter menos oportunidades de Match >=75% em determinada semana. Tratar variações com contexto qualitativo.'
        },
        engagement: {
          activationRate,
          totalUsersCount,
          activatedUsersCount,
          wau,
          mau,
          dau,
          stickinessRate
        },
        velocity: {
          timeToValueHours: avgTtvHours,
          timeToMatchHours: avgTimeToMatchHours,
          timeToApplicationDays: avgTimeToAppDays,
          timeToInterviewDays: avgTimeToInterviewDays,
          timeToHireDays: avgTimeToHireDays,
          hiredSampleCount: timeToHireCount
        }
      };
    } catch (err) {
      console.error('[ProductHealthService] Erro ao consultar métricas de saúde:', err);
      return this.getEmptyProductHealthMetrics();
    }
  }

  private static getEmptyProductHealthMetrics(): ProductHealthMetrics {
    return {
      northStar: {
        scorePercentage: 0,
        qualifiedCandidatesCount: 0,
        totalActiveCandidates7d: 0,
        candidatesWithHighMatchApp: 0,
        candidatesInAdvancedStages: 0,
        nicheMarketLimitationNote: 'Limitação Conhecida: Candidatos em nichos altamente especializados ou regiões com menor oferta física de vagas podem ter menos oportunidades de Match >=75% em determinada semana. Tratar variações com contexto qualitativo.'
      },
      engagement: {
        activationRate: 0,
        totalUsersCount: 0,
        activatedUsersCount: 0,
        wau: 0,
        mau: 0,
        dau: 0,
        stickinessRate: 0
      },
      velocity: {
        timeToValueHours: 0,
        timeToMatchHours: 0,
        timeToApplicationDays: 0,
        timeToInterviewDays: 0,
        timeToHireDays: 0,
        hiredSampleCount: 0
      }
    };
  }
}
