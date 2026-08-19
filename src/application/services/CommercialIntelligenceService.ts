import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface CommercialUserCandidate {
  userId: string;
  name: string;
  email: string;
  role: string;
  accountAgeDays: number;
  upgradeScore: number; // 0-100%
  upgradeLabel: 'Alta Propensão' | 'Média Propensão' | 'Baixa Propensão' | 'Já em Plano Pago';
  discountEligible: boolean;
  discountReason?: string;
  offerEligible: boolean;
  offerReason?: string;
  ambassadorScore: number; // 0-100
  isAmbassadorCandidate: boolean;
  engagementScore: number;
  estimatedNps: number; // 0-10
  npsCategory: 'Promotor (9-10)' | 'Neutro (7-8)' | 'Detrator (<7)';
  matchesCount: number;
  aiUsageCount: number;
  applicationsCount: number;
  positiveFeedbacksCount: number;
  lastActiveDate: string;
  daysInactive: number;
}

export interface CommercialIntelligenceSummary {
  totalAnalyzedUsers: number;
  highUpgradeProbabilityCount: number;
  discountEligibleCount: number;
  offerEligibleCount: number;
  ambassadorCandidatesCount: number;
  powerUsersCount: number;
  avgEstimatedNps: number;
  candidates: CommercialUserCandidate[];
}

export class CommercialIntelligenceService {
  /**
   * Agrega e calcula métricas de Inteligência Comercial (Módulo 2.7)
   * Filtrando obrigatoriamente is_test_account !== true
   */
  static async getCommercialIntelligence(): Promise<CommercialIntelligenceSummary> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getEmptyCommercialIntelligence();
    }

    try {
      const [
        profilesRes,
        resumesRes,
        matchesRes,
        applicationsRes,
        aiLogsRes,
        feedbackRes,
        eventsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, role, created_at, is_test_account').order('created_at', { ascending: false }),
        supabase.from('resumes').select('id, user_id, created_at'),
        supabase.from('matches').select('id, user_id, created_at'),
        supabase.from('applications').select('id, user_id, status, created_at, updated_at'),
        supabase.from('ai_usage_logs').select('id, user_id, created_at'),
        supabase.from('job_match_feedback').select('id, user_id, rating, feedback_type, created_at'),
        supabase.from('analytics_events').select('user_id, event_name, created_at').order('created_at', { ascending: false })
      ]);

      const rawProfiles = profilesRes.data || [];
      const allProfiles = rawProfiles.filter((p: any) => p.is_test_account !== true);
      const resumes = resumesRes.data || [];
      const matches = matchesRes.data || [];
      const applications = applicationsRes.data || [];
      const aiLogs = aiLogsRes.data || [];
      const feedbacks = feedbackRes.data || [];
      const events = eventsRes.data || [];

      const nowMs = Date.now();

      const candidates: CommercialUserCandidate[] = allProfiles.map((p: any) => {
        const uId = p.id;
        const name = p.full_name || p.email?.split('@')[0] || 'Candidato';
        const email = p.email || 'Não informado';
        const role = p.role || 'user';

        const createdMs = new Date(p.created_at).getTime();
        const accountAgeDays = Math.max(0, Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24)));

        // Histórico de Sessões / Eventos
        const userEvents = events.filter((e: any) => e.user_id === uId);
        const lastEvMs = userEvents.length > 0 ? new Date(userEvents[0].created_at).getTime() : createdMs;
        const daysInactive = Math.max(0, Math.floor((nowMs - lastEvMs) / (1000 * 60 * 60 * 24)));
        const lastActiveDate = new Date(lastEvMs).toLocaleDateString('pt-BR');

        // Mapeamento de usos
        const userResumes = resumes.filter((r: any) => r.user_id === uId);
        const userMatches = matches.filter((m: any) => m.user_id === uId);
        const userApps = applications.filter((a: any) => a.user_id === uId);
        const userAiLogs = aiLogs.filter((l: any) => l.user_id === uId);
        const userFeedbacks = feedbacks.filter((f: any) => f.user_id === uId);
        const positiveFeedbacks = userFeedbacks.filter((f: any) => f.rating >= 4 || f.feedback_type === 'thumbs_up' || f.rating === 'POSITIVE');

        // 1. Cálculo de Propensão ao Upgrade (Heurística)
        let upgradeScore = 0;
        if (role !== 'user') {
          upgradeScore = 100;
        } else {
          if (userResumes.length > 0) upgradeScore += 15;
          if (userMatches.length >= 15) upgradeScore += 30;
          else if (userMatches.length >= 5) upgradeScore += 20;

          if (userAiLogs.length >= 8) upgradeScore += 30;
          else if (userAiLogs.length >= 3) upgradeScore += 20;

          if (userApps.length >= 5) upgradeScore += 25;
          else if (userApps.length >= 2) upgradeScore += 15;

          if (daysInactive <= 7) upgradeScore += 10;
        }
        upgradeScore = Math.min(100, upgradeScore);

        let upgradeLabel: CommercialUserCandidate['upgradeLabel'] = 'Baixa Propensão';
        if (role !== 'user') {
          upgradeLabel = 'Já em Plano Pago';
        } else if (upgradeScore >= 70) {
          upgradeLabel = 'Alta Propensão';
        } else if (upgradeScore >= 40) {
          upgradeLabel = 'Média Propensão';
        }

        // 2. Elegibilidade a Desconto (Sensibilidade a Preço)
        const discountEligible = role === 'user' && accountAgeDays >= 14 && daysInactive <= 7 && (userAiLogs.length >= 3 || userApps.length >= 2);
        const discountReason = discountEligible 
          ? `Usuário ativo há ${accountAgeDays}d no plano gratuito com ${userAiLogs.length} chamadas de IA. Alto risco de fricção de preço.`
          : undefined;

        // 3. Elegibilidade a Oferta / Trial
        const offerEligible = role === 'user' && daysInactive <= 7 && (userApps.length >= 3 || userAiLogs.length >= 5);
        const offerReason = offerEligible
          ? `Marco de engajamento recente atingido (${userApps.length} candidaturas no pipeline). Momento ideal para oferta de Trial ou Créditos Extra.`
          : undefined;

        // 4. Candidato a Embaixador
        let ambassadorScore = 0;
        if (positiveFeedbacks.length > 0) ambassadorScore += 40;
        if (userApps.length >= 2) ambassadorScore += 25;
        if (userMatches.length >= 5) ambassadorScore += 20;
        if (daysInactive <= 5) ambassadorScore += 15;
        ambassadorScore = Math.min(100, ambassadorScore);

        const isAmbassadorCandidate = ambassadorScore >= 60 || positiveFeedbacks.length > 0;

        // 5. Engaged Power Score
        const engagementScore = (userMatches.length * 3) + (userAiLogs.length * 5) + (userApps.length * 4) + (positiveFeedbacks.length * 10);

        // 6. NPS Estimado (0-10)
        let estimatedNps = 7; // base neutra
        if (positiveFeedbacks.length > 0) estimatedNps += 2;
        if (userApps.length >= 2) estimatedNps += 1;
        if (userAiLogs.length >= 5) estimatedNps += 1;
        if (daysInactive > 14) estimatedNps -= 2;
        estimatedNps = Math.max(0, Math.min(10, estimatedNps));

        let npsCategory: CommercialUserCandidate['npsCategory'] = 'Neutro (7-8)';
        if (estimatedNps >= 9) npsCategory = 'Promotor (9-10)';
        else if (estimatedNps < 7) npsCategory = 'Detrator (<7)';

        return {
          userId: uId,
          name,
          email,
          role,
          accountAgeDays,
          upgradeScore,
          upgradeLabel,
          discountEligible,
          discountReason,
          offerEligible,
          offerReason,
          ambassadorScore,
          isAmbassadorCandidate,
          engagementScore,
          estimatedNps,
          npsCategory,
          matchesCount: userMatches.length,
          aiUsageCount: userAiLogs.length,
          applicationsCount: userApps.length,
          positiveFeedbacksCount: positiveFeedbacks.length,
          lastActiveDate,
          daysInactive
        };
      });

      const highUpgradeCount = candidates.filter(c => c.upgradeLabel === 'Alta Propensão').length;
      const discountCount = candidates.filter(c => c.discountEligible).length;
      const offerCount = candidates.filter(c => c.offerEligible).length;
      const ambassadorCount = candidates.filter(c => c.isAmbassadorCandidate).length;
      const powerUsersCount = candidates.filter(c => c.engagementScore >= 30).length;

      const totalNps = candidates.reduce((acc, c) => acc + c.estimatedNps, 0);
      const avgEstimatedNps = candidates.length > 0 ? Number((totalNps / candidates.length).toFixed(1)) : 0;

      return {
        totalAnalyzedUsers: candidates.length,
        highUpgradeProbabilityCount: highUpgradeCount,
        discountEligibleCount: discountCount,
        offerEligibleCount: offerCount,
        ambassadorCandidatesCount: ambassadorCount,
        powerUsersCount,
        avgEstimatedNps,
        candidates
      };
    } catch (e) {
      console.error('[CommercialIntelligenceService] Erro ao carregar inteligência comercial:', e);
      return this.getEmptyCommercialIntelligence();
    }
  }

  private static getEmptyCommercialIntelligence(): CommercialIntelligenceSummary {
    return {
      totalAnalyzedUsers: 0,
      highUpgradeProbabilityCount: 0,
      discountEligibleCount: 0,
      offerEligibleCount: 0,
      ambassadorCandidatesCount: 0,
      powerUsersCount: 0,
      avgEstimatedNps: 0,
      candidates: []
    };
  }
}
