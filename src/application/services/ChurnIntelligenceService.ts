import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface ChurnReasonFactor {
  code: string;
  label: string;
  points: number;
  maxPoints: number;
  severity: 'alta' | 'media' | 'baixa';
}

export interface UserChurnProfile {
  userId: string;
  name: string;
  email: string;
  riskScore: number; // 0 - 100
  riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Onboarding em Andamento';
  churnProbabilityRate: number; // %
  reasons: ChurnReasonFactor[];
  autoSuggestion: string;
  nextBestAction: string;
  lastSessionDate: string;
  daysInactive: number;
  accountAgeDays: number;
}

export interface ChurnIntelligenceSummary {
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  onboardingCount: number;
  avgPlatformRiskScore: number;
  churnProfiles: UserChurnProfile[];
}

export class ChurnIntelligenceService {
  /**
   * Calcula o Risk Score por usuário com carência de 7d para novos cadastros e desduplicação de Pipeline Parado vs Sem Candidaturas
   */
  static async getChurnIntelligence(): Promise<ChurnIntelligenceSummary> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getMockChurnIntelligence();
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
        supabase.from('profiles').select('id, full_name, email, created_at, is_test_account').order('created_at', { ascending: false }),
        supabase.from('resumes').select('id, user_id, created_at'),
        supabase.from('matches').select('id, user_id, created_at'),
        supabase.from('applications').select('id, user_id, status, created_at, updated_at'),
        supabase.from('ai_usage_logs').select('id, user_id, created_at'),
        supabase.from('job_match_feedback').select('id, user_id, rating, created_at'),
        supabase.from('analytics_events').select('user_id, event_name, created_at').order('created_at', { ascending: false })
      ]);

      const allProfiles = (profilesRes.data || []).filter((p: any) => p.is_test_account !== true);
      const resumes = resumesRes.data || [];
      const matches = matchesRes.data || [];
      const applications = applicationsRes.data || [];
      const aiLogs = aiLogsRes.data || [];
      const feedbacks = feedbackRes.data || [];
      const events = eventsRes.data || [];

      const nowMs = Date.now();

      const churnProfiles: UserChurnProfile[] = allProfiles.map((p: any) => {
        const uId = p.id;
        const name = p.full_name || p.email?.split('@')[0] || 'Candidato';
        const email = p.email || 'Não informado';

        const createdMs = new Date(p.created_at).getTime();
        const accountAgeDays = Math.max(0, Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24)));

        // 1. Histórico de Sessões / Eventos / Atividades na Plataforma
        const userEvents = events.filter((e: any) => e.user_id === uId);
        const userResumes = resumes.filter((r: any) => r.user_id === uId);
        const userMatches = matches.filter((m: any) => m.user_id === uId);
        const userApps = applications.filter((a: any) => a.user_id === uId);
        const userAiLogs = aiLogs.filter((l: any) => l.user_id === uId);
        const userFeedbacks = feedbacks.filter((f: any) => f.user_id === uId);

        const allUserTimestamps = [
          ...userEvents.map((e: any) => new Date(e.created_at).getTime()),
          ...userApps.map((a: any) => new Date(a.updated_at || a.created_at).getTime()),
          ...userResumes.map((r: any) => new Date(r.created_at).getTime()),
          ...userMatches.map((m: any) => new Date(m.created_at).getTime()),
          ...userAiLogs.map((l: any) => new Date(l.created_at).getTime()),
          new Date(p.updated_at || p.created_at).getTime()
        ].filter(ts => !isNaN(ts));

        const maxActivityMs = Math.max(...allUserTimestamps, createdMs);
        const daysInactive = Math.max(0, Math.floor((nowMs - maxActivityMs) / (1000 * 60 * 60 * 24)));
        const lastSessionDate = daysInactive === 0 ? 'Hoje' : new Date(maxActivityMs).toLocaleDateString('pt-BR');

        // 🟢 REGRA 1: Grace Period para contas com menos de 7 dias
        if (accountAgeDays < 7) {
          return {
            userId: uId,
            name,
            email,
            riskScore: 0,
            riskLevel: 'Onboarding em Andamento',
            churnProbabilityRate: 0,
            reasons: [
              { code: 'grace_period', label: `Nova conta (${accountAgeDays}d de cadastro) - Carência de Onboarding`, points: 0, maxPoints: 0, severity: 'baixa' }
            ],
            autoSuggestion: 'Candidato em fase inicial de ambientação e preenchimento de perfil.',
            nextBestAction: 'Acompanhar envio do primeiro currículo ou 1º Match.',
            lastSessionDate,
            daysInactive,
            accountAgeDays
          };
        }

        const reasons: ChurnReasonFactor[] = [];
        let totalScore = 0;

        // FATOR 1: Tempo desde última sessão (Máx 20 pts)
        if (daysInactive >= 30) {
          totalScore += 20;
          reasons.push({ code: 'inactivity_30d', label: `Inativo há ${daysInactive} dias (>30d)`, points: 20, maxPoints: 20, severity: 'alta' });
        } else if (daysInactive >= 14) {
          totalScore += 10;
          reasons.push({ code: 'inactivity_14d', label: `Inativo há ${daysInactive} dias (>14d)`, points: 10, maxPoints: 20, severity: 'media' });
        } else if (daysInactive >= 7) {
          totalScore += 5;
          reasons.push({ code: 'inactivity_7d', label: `Inativo há ${daysInactive} dias (>7d)`, points: 5, maxPoints: 20, severity: 'baixa' });
        }

        // FATOR 2: Poucos Logins no mês (Máx 15 pts)
        const userLogins30d = userEvents.filter((e: any) => e.event_name === 'login' || e.event_name === 'user_registered').length;
        if (userLogins30d < 2) {
          totalScore += 15;
          reasons.push({ code: 'low_logins', label: `Poucos logins no mês (${userLogins30d} logins)`, points: 15, maxPoints: 15, severity: 'alta' });
        } else if (userLogins30d < 4) {
          totalScore += 8;
          reasons.push({ code: 'moderate_logins', label: `Frequência de login moderada (${userLogins30d} logins)`, points: 8, maxPoints: 15, severity: 'media' });
        }

        // 🟢 REGRA 2: Desduplicação estrita de "Sem Candidaturas" vs "Pipeline Parado"
        if (userApps.length === 0) {
          // FATOR 3: Sem Candidaturas no Kanban (Aplica-se apenas se não tiver NENHUMA vaga)
          totalScore += 15;
          reasons.push({ code: 'no_applications', label: 'Zero candidaturas registradas no Kanban', points: 15, maxPoints: 15, severity: 'alta' });
        } else {
          // FATOR 4: Pipeline Parado >14d (Aplica-se EXCLUSIVAMENTE se já possuir ao menos 1 candidatura)
          const newestAppUpdateMs = Math.max(...userApps.map((a: any) => new Date(a.updated_at || a.created_at).getTime()));
          const daysAppStuck = Math.floor((nowMs - newestAppUpdateMs) / (1000 * 60 * 60 * 24));
          if (daysAppStuck >= 14) {
            totalScore += 15;
            reasons.push({ code: 'pipeline_stuck', label: `Pipeline parado há ${daysAppStuck} dias sem movimentação`, points: 15, maxPoints: 15, severity: 'alta' });
          }
        }

        // FATOR 5: Sem Cálculo de Match (Máx 10 pts)
        if (userMatches.length === 0) {
          totalScore += 10;
          reasons.push({ code: 'no_match', label: 'Nenhum cálculo de Match realizado', points: 10, maxPoints: 10, severity: 'media' });
        }

        // FATOR 6: Sem Uso da IA (Máx 10 pts)
        if (userAiLogs.length === 0) {
          totalScore += 10;
          reasons.push({ code: 'no_ai_usage', label: 'Sem uso do Simulador STAR, Coach ou Otimizador', points: 10, maxPoints: 10, severity: 'media' });
        }

        // FATOR 7: Perfil Incompleto / Sem CV (Máx 10 pts)
        if (userResumes.length === 0) {
          totalScore += 10;
          reasons.push({ code: 'no_resume', label: 'Nenhum arquivo de currículo PDF enviado', points: 10, maxPoints: 10, severity: 'media' });
        }

        // FATOR 8: Feedback Negativo Registrado (Máx 5 pts)
        const negativeFeedbacks = userFeedbacks.filter((f: any) => f.rating <= 2 || f.feedback_type === 'negative');
        if (negativeFeedbacks.length > 0) {
          totalScore += 5;
          reasons.push({ code: 'negative_feedback', label: 'Registrou feedback negativo no Match', points: 5, maxPoints: 5, severity: 'baixa' });
        }

        const riskScore = Math.min(100, totalScore);
        let riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Onboarding em Andamento' = 'Baixo';
        if (riskScore >= 70) riskLevel = 'Alto';
        else if (riskScore >= 40) riskLevel = 'Médio';

        let autoSuggestion = 'Manter engajamento quinzenal via notificações de novas vagas salvas.';
        let nextBestAction = 'Enviar resumo executivo de vagas recomendadas.';

        if (riskLevel === 'Alto') {
          if (userResumes.length === 0) {
            autoSuggestion = 'Usuário estagnou no onboarding sem enviar o currículo.';
            nextBestAction = 'Disparar e-mail de suporte com guia rápido de upload de currículo em 1 clique.';
          } else if (userMatches.length === 0) {
            autoSuggestion = 'Possui currículo cadastrado mas não explorou os cálculos de Match com vagas.';
            nextBestAction = 'Enviar notificação com 3 vagas de Match > 80% pré-calculadas para o perfil.';
          } else {
            autoSuggestion = 'Candidato inativo há mais de 2 semanas com risco de abandono definitivo.';
            nextBestAction = 'Oferecer sessão gratuita de treino no Simulador STAR ou suporte direto.';
          }
        } else if (riskLevel === 'Médio') {
          if (userApps.length === 0) {
            autoSuggestion = 'Visualizou Matches mas travou antes de adicionar candidaturas ao Kanban.';
            nextBestAction = 'Exibir prompt do Copiloto recomendando aplicar para a vaga de maior fit.';
          } else {
            autoSuggestion = 'Pipeline sem atualizações recentes de estágio.';
            nextBestAction = 'Lembrete de atualização de status e treino de entrevista STAR.';
          }
        }

        return {
          userId: uId,
          name,
          email,
          riskScore,
          riskLevel,
          churnProbabilityRate: riskScore,
          reasons,
          autoSuggestion,
          nextBestAction,
          lastSessionDate,
          daysInactive,
          accountAgeDays
        };
      });

      const highRiskCount = churnProfiles.filter(p => p.riskLevel === 'Alto').length;
      const mediumRiskCount = churnProfiles.filter(p => p.riskLevel === 'Médio').length;
      const lowRiskCount = churnProfiles.filter(p => p.riskLevel === 'Baixo').length;
      const onboardingCount = churnProfiles.filter(p => p.riskLevel === 'Onboarding em Andamento').length;

      const scoredProfiles = churnProfiles.filter(p => p.riskLevel !== 'Onboarding em Andamento');
      const avgPlatformRiskScore = scoredProfiles.length > 0 
        ? Number((scoredProfiles.reduce((acc, p) => acc + p.riskScore, 0) / scoredProfiles.length).toFixed(1)) 
        : 25.0;

      return {
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        onboardingCount,
        avgPlatformRiskScore,
        churnProfiles: churnProfiles.sort((a, b) => b.riskScore - a.riskScore)
      };
    } catch (err) {
      console.error('[ChurnIntelligenceService] Erro ao consultar inteligência de churn:', err);
      return this.getMockChurnIntelligence();
    }
  }

  /**
   * Fallback mock para desenvolvimento local offline
   */
  private static getMockChurnIntelligence(): ChurnIntelligenceSummary {
    const churnProfiles: UserChurnProfile[] = [
      {
        userId: 'usr-101',
        name: 'Roberto Camargo',
        email: 'roberto.camargo@example.com',
        riskScore: 80,
        riskLevel: 'Alto',
        churnProbabilityRate: 80,
        reasons: [
          { code: 'inactivity_30d', label: 'Inativo há 36 dias (>30d)', points: 20, maxPoints: 20, severity: 'alta' },
          { code: 'low_logins', label: 'Poucos logins no mês (0 logins)', points: 15, maxPoints: 15, severity: 'alta' },
          { code: 'no_applications', label: 'Zero candidaturas registradas no Kanban', points: 15, maxPoints: 15, severity: 'alta' },
          { code: 'no_match', label: 'Nenhum cálculo de Match realizado', points: 10, maxPoints: 10, severity: 'media' },
          { code: 'no_ai_usage', label: 'Sem uso do Simulador STAR, Coach ou Otimizador', points: 10, maxPoints: 10, severity: 'media' },
          { code: 'no_resume', label: 'Nenhum arquivo de currículo PDF enviado', points: 10, maxPoints: 10, severity: 'media' }
        ],
        autoSuggestion: 'Usuário estagnou no onboarding sem enviar o currículo.',
        nextBestAction: 'Disparar e-mail de suporte com guia rápido de upload de currículo em 1 clique.',
        lastSessionDate: 'há 36 dias',
        daysInactive: 36,
        accountAgeDays: 45
      },
      {
        userId: 'usr-102',
        name: 'Juliana Paes',
        email: 'juliana.paes@example.com',
        riskScore: 65,
        riskLevel: 'Médio',
        churnProbabilityRate: 65,
        reasons: [
          { code: 'inactivity_14d', label: 'Inativo há 18 dias (>14d)', points: 10, maxPoints: 20, severity: 'media' },
          { code: 'low_logins', label: 'Poucos logins no mês (1 login)', points: 15, maxPoints: 15, severity: 'alta' },
          { code: 'pipeline_stuck', label: 'Pipeline parado há 18 dias sem movimentação', points: 15, maxPoints: 15, severity: 'alta' },
          { code: 'no_ai_usage', label: 'Sem uso das ferramentas avançadas de IA', points: 10, maxPoints: 10, severity: 'media' },
          { code: 'negative_feedback', label: 'Registrou feedback negativo no Match', points: 5, maxPoints: 5, severity: 'baixa' }
        ],
        autoSuggestion: 'Possui currículo cadastrado mas não explorou os cálculos de Match com vagas.',
        nextBestAction: 'Enviar notificação com 3 vagas de Match > 80% pré-calculadas para o perfil.',
        lastSessionDate: 'há 18 dias',
        daysInactive: 18,
        accountAgeDays: 30
      },
      {
        userId: 'usr-103',
        name: 'Marcio Souza',
        email: 'marcio.souza@example.com',
        riskScore: 48,
        riskLevel: 'Médio',
        churnProbabilityRate: 48,
        reasons: [
          { code: 'inactivity_7d', label: 'Inativo há 9 dias (>7d)', points: 5, maxPoints: 20, severity: 'baixa' },
          { code: 'moderate_logins', label: 'Frequência de login moderada (3 logins)', points: 8, maxPoints: 15, severity: 'media' },
          { code: 'pipeline_stuck', label: 'Pipeline parado há 16 dias', points: 15, maxPoints: 15, severity: 'alta' },
          { code: 'no_ai_usage', label: 'Sem uso recente do Simulador STAR', points: 10, maxPoints: 10, severity: 'media' }
        ],
        autoSuggestion: 'Pipeline sem atualizações recentes de estágio.',
        nextBestAction: 'Lembrete de atualização de status e treino de entrevista STAR.',
        lastSessionDate: 'há 9 dias',
        daysInactive: 9,
        accountAgeDays: 20
      },
      {
        userId: 'usr-104',
        name: 'Lucas Nogueira',
        email: 'lucas.nogueira@example.com',
        riskScore: 0,
        riskLevel: 'Onboarding em Andamento',
        churnProbabilityRate: 0,
        reasons: [
          { code: 'grace_period', label: 'Nova conta (3d de cadastro) - Carência de Onboarding', points: 0, maxPoints: 0, severity: 'baixa' }
        ],
        autoSuggestion: 'Candidato em fase inicial de ambientação e preenchimento de perfil.',
        nextBestAction: 'Acompanhar envio do primeiro currículo ou 1º Match.',
        lastSessionDate: 'há 1 dia',
        daysInactive: 1,
        accountAgeDays: 3
      }
    ];

    return {
      highRiskCount: 1,
      mediumRiskCount: 2,
      lowRiskCount: 0,
      onboardingCount: 1,
      avgPlatformRiskScore: 64.3,
      churnProfiles
    };
  }
}
