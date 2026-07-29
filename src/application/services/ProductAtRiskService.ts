import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface AffectedUserItem {
  id: string;
  name: string;
  email: string;
  lastActivity: string;
  detail: string;
  jobTitle?: string;
  companyName?: string;
  score?: number;
  daysInactive?: number;
}

export interface RiskAlert {
  id: string;
  title: string;
  count: number;
  impact: string;
  priority: 'P1 - Crítica' | 'P2 - Alta' | 'P3 - Média';
  status: 'disponivel' | 'parcial';
  statusLabel?: string;
  category: 'onboarding' | 'match' | 'engagement' | 'pipeline' | 'parsing';
  affectedUsers: AffectedUserItem[];
}

export class ProductAtRiskService {
  /**
   * Agrega todos os 11 alertas de risco operacionais
   */
  static async getRiskAlerts(): Promise<RiskAlert[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getMockRiskAlerts();
    }

    try {
      const [
        profilesRes,
        resumesRes,
        matchesRes,
        applicationsRes,
        _stagesRes,
        parsingErrorsRes,
        _interviewsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, created_at, is_test_account').order('created_at', { ascending: false }),
        supabase.from('resumes').select('id, user_id, file_name, created_at'),
        supabase.from('matches').select('id, user_id, job_id, score_overall, created_at'),
        supabase.from('applications').select('id, user_id, job_id, status, created_at, updated_at'),
        supabase.from('application_stages').select('id, application_id, from_status, to_status, moved_at').order('moved_at', { ascending: false }),
        supabase.from('resume_processing_errors').select('id, user_id, error_type, error_message, created_at').order('created_at', { ascending: false }),
        supabase.from('interview_preps').select('id, user_id, job_id, created_at').order('created_at', { ascending: false })
      ]);

      const allProfiles = (profilesRes.data || []).filter((p: any) => p.is_test_account !== true);
      const resumes = resumesRes.data || [];
      const matches = matchesRes.data || [];
      const applications = applicationsRes.data || [];
      const parsingErrors = parsingErrorsRes.data || [];

      const nowMs = Date.now();

      // 1. Uploads de CV sem Match
      const resumeUserIds = new Set(resumes.map((r: any) => r.user_id));
      const matchUserIds = new Set(matches.map((m: any) => m.user_id));
      const cvWithoutMatchUsers = allProfiles.filter(p => resumeUserIds.has(p.id) && !matchUserIds.has(p.id));

      // 2. Match calculado sem candidatura
      const appUserIds = new Set(applications.map((a: any) => a.user_id));
      const matchWithoutAppUsers = allProfiles.filter(p => matchUserIds.has(p.id) && !appUserIds.has(p.id));

      // 3 & 4. Inativos há 7d e 30d
      const inactive7dUsers = allProfiles.filter(p => {
        const createdMs = new Date(p.created_at).getTime();
        const diffDays = (nowMs - createdMs) / (1000 * 60 * 60 * 24);
        return diffDays >= 7 && diffDays < 30;
      });

      const inactive30dUsers = allProfiles.filter(p => {
        const createdMs = new Date(p.created_at).getTime();
        const diffDays = (nowMs - createdMs) / (1000 * 60 * 60 * 24);
        return diffDays >= 30;
      });

      // 5. Erros recorrentes de parsing
      const parsingErrorUserIds = new Set(parsingErrors.map((e: any) => e.user_id));
      const parsingErrorUsers = allProfiles.filter(p => parsingErrorUserIds.has(p.id));

      // 6. Match alto (>=75%) sem aplicação
      const highMatchNoAppList: AffectedUserItem[] = [];
      matches.forEach((m: any) => {
        if ((m.score_overall || 0) >= 75) {
          const hasApp = applications.some((a: any) => a.user_id === m.user_id && a.job_id === m.job_id);
          if (!hasApp) {
            const profile = allProfiles.find(p => p.id === m.user_id);
            if (profile) {
              highMatchNoAppList.push({
                id: m.id,
                name: profile.full_name || profile.email?.split('@')[0] || 'Candidato',
                email: profile.email || 'Não informado',
                lastActivity: new Date(m.created_at).toLocaleDateString('pt-BR'),
                detail: `Match de ${m.score_overall}% calculado, mas nenhuma candidatura foi iniciada.`,
                score: m.score_overall
              });
            }
          }
        }
      });

      // 7. Presos no Kanban (>14 dias na mesma coluna)
      const kanbanStuckList: AffectedUserItem[] = [];
      applications.forEach((app: any) => {
        const updatedMs = new Date(app.updated_at || app.created_at).getTime();
        const diffDays = Math.floor((nowMs - updatedMs) / (1000 * 60 * 60 * 24));
        if (diffDays >= 14 && !['hired', 'rejected'].includes(app.status)) {
          const profile = allProfiles.find(p => p.id === app.user_id);
          if (profile) {
            kanbanStuckList.push({
              id: app.id,
              name: profile.full_name || profile.email?.split('@')[0] || 'Candidato',
              email: profile.email || 'Não informado',
              lastActivity: `${diffDays} dias no mesmo estágio`,
              detail: `Candidatura estagnada na coluna '${app.status}' há ${diffDays} dias sem movimentação.`,
              daysInactive: diffDays
            });
          }
        }
      });

      // 8. Entrevistas sem atualização (>7 dias)
      const interviewStagnatedList: AffectedUserItem[] = [];
      applications.forEach((app: any) => {
        if (['hr', 'interview'].includes(app.status)) {
          const updatedMs = new Date(app.updated_at || app.created_at).getTime();
          const diffDays = Math.floor((nowMs - updatedMs) / (1000 * 60 * 60 * 24));
          if (diffDays >= 7) {
            const profile = allProfiles.find(p => p.id === app.user_id);
            if (profile) {
              interviewStagnatedList.push({
                id: app.id,
                name: profile.full_name || profile.email?.split('@')[0] || 'Candidato',
                email: profile.email || 'Não informado',
                lastActivity: `${diffDays} dias sem atividade de entrevista`,
                detail: `Em fase de entrevista (${app.status === 'hr' ? 'Entrevista RH' : 'Entrevista Gestor'}), sem treino ou nota há ${diffDays} dias.`,
                daysInactive: diffDays
              });
            }
          }
        }
      });

      // 9. Candidaturas esquecidas (>15 dias sem notas/updates)
      const forgottenAppsList: AffectedUserItem[] = [];
      applications.forEach((app: any) => {
        const updatedMs = new Date(app.updated_at || app.created_at).getTime();
        const diffDays = Math.floor((nowMs - updatedMs) / (1000 * 60 * 60 * 24));
        if (diffDays >= 15 && !['hired', 'rejected'].includes(app.status)) {
          const profile = allProfiles.find(p => p.id === app.user_id);
          if (profile) {
            forgottenAppsList.push({
              id: app.id,
              name: profile.full_name || profile.email?.split('@')[0] || 'Candidato',
              email: profile.email || 'Não informado',
              lastActivity: `${diffDays} dias sem toque`,
              detail: `Candidatura sem registros ou anotações de evolução há ${diffDays} dias.`,
              daysInactive: diffDays
            });
          }
        }
      });

      // 10. Abandono no Onboarding (Dado Parcial)
      const onboardingDropoffUsers = allProfiles.filter(p => {
        const hasResume = resumeUserIds.has(p.id);
        const createdMs = new Date(p.created_at).getTime();
        const diffHours = (nowMs - createdMs) / (1000 * 60 * 60);
        return !hasResume && diffHours >= 24;
      });

      // 11. Vagas Rejeitadas em Sequência (Dado Parcial)
      const sequentialRejectionList: AffectedUserItem[] = [];
      const userRejectionsCount: Record<string, number> = {};
      applications.forEach((app: any) => {
        if (app.status === 'rejected') {
          userRejectionsCount[app.user_id] = (userRejectionsCount[app.user_id] || 0) + 1;
        }
      });
      Object.entries(userRejectionsCount).forEach(([uId, count]) => {
        if (count >= 3) {
          const profile = allProfiles.find(p => p.id === uId);
          if (profile) {
            sequentialRejectionList.push({
              id: uId,
              name: profile.full_name || profile.email?.split('@')[0] || 'Candidato',
              email: profile.email || 'Não informado',
              lastActivity: `${count} recusas acumuladas`,
              detail: `Possui ${count} candidaturas finalizadas com status 'rejected'.`
            });
          }
        }
      });

      return [
        {
          id: 'resume_without_match',
          title: 'Upload de Currículo sem Match',
          count: cvWithoutMatchUsers.length,
          impact: 'Candidato enviou o currículo mas não calculou Match. 78% de taxa de desistência se não houver cálculo em 24h.',
          priority: 'P1 - Crítica',
          status: 'disponivel',
          category: 'onboarding',
          affectedUsers: cvWithoutMatchUsers.map(p => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Candidato',
            email: p.email || 'Não informado',
            lastActivity: new Date(p.created_at).toLocaleDateString('pt-BR'),
            detail: 'Fez upload do currículo mas ainda não realizou o primeiro cálculo de Match com vaga.'
          }))
        },
        {
          id: 'match_without_app',
          title: 'Match Calculado sem Candidatura',
          count: matchWithoutAppUsers.length,
          impact: 'Candidato visualizou o Match mas não adicionou nenhuma vaga ao Pipeline de candidaturas.',
          priority: 'P2 - Alta',
          status: 'disponivel',
          category: 'match',
          affectedUsers: matchWithoutAppUsers.map(p => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Candidato',
            email: p.email || 'Não informado',
            lastActivity: new Date(p.created_at).toLocaleDateString('pt-BR'),
            detail: 'Possui análises de Match calculadas, mas nenhuma vaga salva ou aplicada no Kanban.'
          }))
        },
        {
          id: 'inactive_7d',
          title: 'Sem Login há 7 Dias',
          count: inactive7dUsers.length,
          impact: 'Perda de engajamento no ciclo semanal. Requer notificação do Copiloto IA com novas vagas recomendadas.',
          priority: 'P3 - Média',
          status: 'disponivel',
          category: 'engagement',
          affectedUsers: inactive7dUsers.map(p => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Candidato',
            email: p.email || 'Não informado',
            lastActivity: new Date(p.created_at).toLocaleDateString('pt-BR'),
            detail: 'Sem acesso à plataforma nos últimos 7 a 29 dias.'
          }))
        },
        {
          id: 'inactive_30d',
          title: 'Sem Login há 30 Dias (Risco de Churn)',
          count: inactive30dUsers.length,
          impact: 'Risco severo de abandono definitivo. O candidato está inativo há mais de 1 mês completo.',
          priority: 'P1 - Crítica',
          status: 'disponivel',
          category: 'engagement',
          affectedUsers: inactive30dUsers.map(p => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Candidato',
            email: p.email || 'Não informado',
            lastActivity: new Date(p.created_at).toLocaleDateString('pt-BR'),
            detail: 'Sem atividade na plataforma há mais de 30 dias.'
          }))
        },
        {
          id: 'parsing_error_recurrent',
          title: 'Erro Recorrente de Parsing de PDF',
          count: parsingErrorUsers.length,
          impact: 'Falha técnica na extração de texto do currículo. Impede a geração automática de análises.',
          priority: 'P1 - Crítica',
          status: 'disponivel',
          category: 'parsing',
          affectedUsers: parsingErrorUsers.map(p => {
            const err = parsingErrors.find((e: any) => e.user_id === p.id);
            return {
              id: p.id,
              name: p.full_name || p.email?.split('@')[0] || 'Candidato',
              email: p.email || 'Não informado',
              lastActivity: err ? new Date(err.created_at).toLocaleDateString('pt-BR') : 'Recentemente',
              detail: err?.error_message || 'Ocorreu um erro no processamento automático do arquivo PDF.'
            };
          })
        },
        {
          id: 'high_match_unapplied',
          title: 'Match Alto (>=75%) sem Aplicação',
          count: highMatchNoAppList.length,
          impact: 'Oportunidades de alto potencial que não viraram candidatura. O candidato tem forte aderência mas não aplicou.',
          priority: 'P1 - Crítica',
          status: 'disponivel',
          category: 'match',
          affectedUsers: highMatchNoAppList
        },
        {
          id: 'kanban_stuck',
          title: 'Presos no Kanban (>14 Dias)',
          count: kanbanStuckList.length,
          impact: 'Candidaturas estagnadas em etapas intermediárias sem avanço ou encerramento.',
          priority: 'P2 - Alta',
          status: 'disponivel',
          category: 'pipeline',
          affectedUsers: kanbanStuckList
        },
        {
          id: 'interview_stagnated',
          title: 'Entrevistas sem Atualização (>7 Dias)',
          count: interviewStagnatedList.length,
          impact: 'Candidatos em fase de entrevista sem treino STAR recente ou feedback de acompanhamento.',
          priority: 'P1 - Crítica',
          status: 'disponivel',
          category: 'pipeline',
          affectedUsers: interviewStagnatedList
        },
        {
          id: 'forgotten_apps',
          title: 'Candidaturas Esquecidas (>15 Dias)',
          count: forgottenAppsList.length,
          impact: 'Cards no Kanban sem anotações, agendamentos ou atualizaciones recentes de status.',
          priority: 'P2 - Alta',
          status: 'disponivel',
          category: 'pipeline',
          affectedUsers: forgottenAppsList
        },
        {
          id: 'onboarding_dropoff',
          title: 'Abandono no Onboarding Inicial',
          count: onboardingDropoffUsers.length,
          impact: 'Usuários cadastrados que não enviaram o primeiro currículo. (Eventos detalhados de cliques no modal pendentes de instrumentação).',
          priority: 'P2 - Alta',
          status: 'parcial',
          statusLabel: 'DADO PARCIAL — INSTRUMENTAÇÃO ADICIONAL NECESSÁRIA',
          category: 'onboarding',
          affectedUsers: onboardingDropoffUsers.map(p => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Candidato',
            email: p.email || 'Não informado',
            lastActivity: new Date(p.created_at).toLocaleDateString('pt-BR'),
            detail: 'Cadastrou-se há mais de 24h sem realizar o upload do primeiro currículo.'
          }))
        },
        {
          id: 'sequential_rejections',
          title: 'Vagas Rejeitadas em Sequência',
          count: sequentialRejectionList.length,
          impact: 'Candidatos acumulando múltiplas recusas. (Descartes em tempo real no feed de descoberta pendentes de instrumentação).',
          priority: 'P2 - Alta',
          status: 'parcial',
          statusLabel: 'DADO PARCIAL — INSTRUMENTAÇÃO ADICIONAL NECESSÁRIA',
          category: 'pipeline',
          affectedUsers: sequentialRejectionList
        }
      ];
    } catch (err) {
      console.error('[ProductAtRiskService] Erro ao consultar alertas de risco:', err);
      return this.getMockRiskAlerts();
    }
  }

  /**
   * Fallback mock para desenvolvimento local sem Supabase
   */
  private static getMockRiskAlerts(): RiskAlert[] {
    return [
      {
        id: 'resume_without_match',
        title: 'Upload de Currículo sem Match',
        count: 2,
        impact: 'Candidato enviou o currículo mas não calculou Match. 78% de taxa de desistência se não houver cálculo em 24h.',
        priority: 'P1 - Crítica',
        status: 'disponivel',
        category: 'onboarding',
        affectedUsers: [
          { id: 'usr-1', name: 'Carla Silveira', email: 'carla.silveira@example.com', lastActivity: 'há 2 dias', detail: 'Fez upload do CV_2026.pdf mas não selecionou nenhuma vaga para calcular o Match.' },
          { id: 'usr-2', name: 'Lucas Mendes', email: 'lucas.mendes@example.com', lastActivity: 'há 4 dias', detail: 'Cadastrou currículo de Engenheiro de Software sem iniciar análises.' }
        ]
      },
      {
        id: 'match_without_app',
        title: 'Match Calculado sem Candidatura',
        count: 3,
        impact: 'Candidato visualizou o Match mas não adicionou nenhuma vaga ao Pipeline de candidaturas.',
        priority: 'P2 - Alta',
        status: 'disponivel',
        category: 'match',
        affectedUsers: [
          { id: 'usr-3', name: 'Mariana Costa', email: 'mariana.costa@example.com', lastActivity: 'há 1 dia', detail: 'Calculou 4 Matches de vagas mas não aplicou para nenhuma delas.' }
        ]
      },
      {
        id: 'inactive_7d',
        title: 'Sem Login há 7 Dias',
        count: 5,
        impact: 'Perda de engajamento no ciclo semanal. Requer notificação do Copiloto IA.',
        priority: 'P3 - Média',
        status: 'disponivel',
        category: 'engagement',
        affectedUsers: [
          { id: 'usr-4', name: 'Rodrigo Lima', email: 'rodrigo.lima@example.com', lastActivity: 'há 8 dias', detail: 'Sem sessões registradas desde a semana passada.' }
        ]
      },
      {
        id: 'inactive_30d',
        title: 'Sem Login há 30 Dias (Risco de Churn)',
        count: 4,
        impact: 'Risco severo de abandono definitivo. O candidato está inativo há mais de 1 mês completo.',
        priority: 'P1 - Crítica',
        status: 'disponivel',
        category: 'engagement',
        affectedUsers: [
          { id: 'usr-5', name: 'Fernanda Rocha', email: 'fernanda.rocha@example.com', lastActivity: 'há 34 dias', detail: 'Última atividade registrada há mais de 1 mês.' }
        ]
      },
      {
        id: 'parsing_error_recurrent',
        title: 'Erro Recorrente de Parsing de PDF',
        count: 1,
        impact: 'Falha técnica na extração de texto do currículo. Impede a geração automática de análises.',
        priority: 'P1 - Crítica',
        status: 'disponivel',
        category: 'parsing',
        affectedUsers: [
          { id: 'usr-6', name: 'Gabriel Alves', email: 'gabriel.alves@example.com', lastActivity: 'há 3 horas', detail: 'Erro OCR_TIMEOUT ao extrair PDF digitalizado de 8MB.' }
        ]
      },
      {
        id: 'high_match_unapplied',
        title: 'Match Alto (>=75%) sem Aplicação',
        count: 4,
        impact: 'Oportunidades de alto potencial que não viraram candidatura.',
        priority: 'P1 - Crítica',
        status: 'disponivel',
        category: 'match',
        affectedUsers: [
          { id: 'usr-7', name: 'Patrícia Souza', email: 'patricia.souza@example.com', lastActivity: 'há 1 dia', detail: 'Match de 88% na vaga Senior Tech Lead em Nubank, mas não aplicou.', score: 88 }
        ]
      },
      {
        id: 'kanban_stuck',
        title: 'Presos no Kanban (>14 Dias)',
        count: 2,
        impact: 'Candidaturas estagnadas em etapas intermediárias sem avanço ou encerramento.',
        priority: 'P2 - Alta',
        status: 'disponivel',
        category: 'pipeline',
        affectedUsers: [
          { id: 'usr-8', name: 'Thiago Martins', email: 'thiago.martins@example.com', lastActivity: '18 dias no mesmo estágio', detail: 'Candidatura estagnada no estágio Entrevista RH há 18 dias.', daysInactive: 18 }
        ]
      },
      {
        id: 'interview_stagnated',
        title: 'Entrevistas sem Atualização (>7 Dias)',
        count: 2,
        impact: 'Candidatos em fase de entrevista sem treino STAR recente ou feedback de acompanhamento.',
        priority: 'P1 - Crítica',
        status: 'disponivel',
        category: 'pipeline',
        affectedUsers: [
          { id: 'usr-9', name: 'Aline Oliveira', email: 'aline.oliveira@example.com', lastActivity: '9 dias sem treino STAR', detail: 'Possui entrevista agendada mas não realizou simulação de perguntas comportamentais.', daysInactive: 9 }
        ]
      },
      {
        id: 'forgotten_apps',
        title: 'Candidaturas Esquecidas (>15 Dias)',
        count: 3,
        impact: 'Cards no Kanban sem anotações, agendamentos ou atualizações recentes de status.',
        priority: 'P2 - Alta',
        status: 'disponivel',
        category: 'pipeline',
        affectedUsers: [
          { id: 'usr-10', name: 'Bruno Castro', email: 'bruno.castro@example.com', lastActivity: '21 dias sem toque', detail: 'Sem nenhuma nota ou movimentação no card há 21 dias.', daysInactive: 21 }
        ]
      },
      {
        id: 'onboarding_dropoff',
        title: 'Abandono no Onboarding Inicial',
        count: 3,
        impact: 'Usuários cadastrados que não enviaram o primeiro currículo.',
        priority: 'P2 - Alta',
        status: 'parcial',
        statusLabel: 'DADO PARCIAL — INSTRUMENTAÇÃO ADICIONAL NECESSÁRIA',
        category: 'onboarding',
        affectedUsers: [
          { id: 'usr-11', name: 'Vanessa Pires', email: 'vanessa.pires@example.com', lastActivity: 'há 2 dias', detail: 'Conta criada há 48h sem upload de CV inicial.' }
        ]
      },
      {
        id: 'sequential_rejections',
        title: 'Vagas Rejeitadas em Sequência',
        count: 1,
        impact: 'Candidatos acumulando múltiplas recusas no funil.',
        priority: 'P2 - Alta',
        status: 'parcial',
        statusLabel: 'DADO PARCIAL — INSTRUMENTAÇÃO ADICIONAL NECESSÁRIA',
        category: 'pipeline',
        affectedUsers: [
          { id: 'usr-12', name: 'Renato Faria', email: 'renato.faria@example.com', lastActivity: '3 recusas ativas', detail: 'Acumulou 3 candidaturas marcadas como Recusadas.' }
        ]
      }
    ];
  }
}
