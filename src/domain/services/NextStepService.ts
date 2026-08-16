import type { Application, Match, Profile, Resume } from '../models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { ApplicationPipelineService } from '../../application/services/ApplicationPipelineService';
import { calculateProfileCompleteness } from './ProfileCompletenessService';

export interface NextStepAction {
  id: string;
  type:
    | 'hired'
    | 'future_interview'
    | 'overdue_action'
    | 'recent_interview'
    | 'stagnant_application'
    | 'no_resume'
    | 'incomplete_profile'
    | 'explore_matches'
    | 'discover_jobs'
    | 'neutral';
  title: string;
  subtitle?: string;
  description: string;
  reason?: string;
  badgeText: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'info' | 'brand';
  ctaLabel: string;
  ctaTab: string;
  ctaPayload?: {
    jobId?: string;
    applicationId?: string;
    resumeId?: string;
  };
  icon: 'trophy' | 'calendar' | 'alert-circle' | 'message-square' | 'clock' | 'file-up' | 'user-check' | 'sparkles' | 'compass';
  urgencyScore: number; // 0 a 100 para desempate contextual
}

export interface SecondaryAction {
  id: string;
  label: string;
  ctaTab: string;
  completed: boolean;
  actionPayload?: any;
}

export interface NextStepResult {
  primaryAction: NextStepAction;
  secondaryActions: SecondaryAction[];
}

export interface UserNextStepContext {
  profile?: Profile | null;
  careerProfileNew?: CareerProfileNew | null;
  resumes?: Resume[];
  matches?: Match[];
  applications?: Application[];
  currentDate?: Date; // Injeção de data para testes 100% determinísticos
}

/**
 * Normaliza uma data para meia-noite (00:00:00) local para comparação de dias exatos
 */
function toMidnightDate(dateOrStr: string | Date | undefined): Date | null {
  if (!dateOrStr) return null;
  try {
    if (typeof dateOrStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrStr.trim())) {
      const parts = dateOrStr.trim().split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const d = typeof dateOrStr === 'string' ? new Date(dateOrStr) : new Date(dateOrStr.getTime());
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  } catch {
    return null;
  }
}

/**
 * Retorna a diferença em dias entre duas datas (dateB - dateA em dias inteiros)
 */
function diffInDays(dateA: Date, dateB: Date): number {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.round((dateB.getTime() - dateA.getTime()) / oneDayMs);
}

export class NextStepService {
  /**
   * Determina deterministicamente o Próximo Passo do usuário com base no estado contextual real.
   */
  static getUserNextStep(context: UserNextStepContext): NextStepResult {
    const now = context.currentDate || new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const resumes = context.resumes || [];
    const hasResume = resumes.length > 0;
    const matches = context.matches || [];
    const applications = (context.applications || []).filter(
      app => app.status !== 'rejected' && (app.status as string) !== 'deleted'
    );

    const candidates: NextStepAction[] = [];

    // ── 1. CONTRATAÇÃO (Vitória Máxima) ──
    const hiredApps = applications.filter(
      app => ApplicationPipelineService.getCleanStatus(app.status) === 'hired'
    );
    if (hiredApps.length > 0) {
      const topHired = hiredApps[0];
      candidates.push({
        id: 'hired-celebration',
        type: 'hired',
        title: '🎉 Parabéns pela sua contratação!',
        description: `Você conquistou a vaga de ${topHired.jobTitle} na ${topHired.companyName}! Acompanhe seu histórico de sucesso no Pipeline de Carreira.`,
        reason: 'Seu objetivo foi alcançado com sucesso.',
        badgeText: 'Contratado 🏆',
        badgeVariant: 'success',
        ctaLabel: 'Ver no Pipeline',
        ctaTab: 'strategy',
        ctaPayload: { applicationId: topHired.id },
        icon: 'trophy',
        urgencyScore: 98
      });
    }

    // ── 2. ENTREVISTAS FUTURAS & AÇÕES PLANEJADAS VENCIDAS ──
    for (const app of applications) {
      const cleanStatus = ApplicationPipelineService.getCleanStatus(app.status);
      const actionDate = toMidnightDate(app.nextActionDate);

      if (actionDate) {
        const daysFromToday = diffInDays(todayMidnight, actionDate);

        // A. Entrevista Futura (Hoje ou Futuro)
        if (daysFromToday >= 0 && (cleanStatus === 'hr' || cleanStatus === 'interview')) {
          const daysText =
            daysFromToday === 0
              ? 'hoje'
              : daysFromToday === 1
              ? 'amanhã'
              : `em ${daysFromToday} dias`;

          // Urgência máxima quanto mais próxima a entrevista
          const urgencyScore = Math.max(90, 100 - daysFromToday * 2);

          candidates.push({
            id: `future-interview-${app.id}`,
            type: 'future_interview',
            title: '🎯 Sua entrevista está chegando',
            subtitle: `${app.jobTitle} · ${app.companyName}`,
            description: `Você tem uma entrevista agendada ${daysText} na ${app.companyName}. Prepare suas respostas e pratique perguntas com o simulador STAR.`,
            reason: 'Candidatos que treinam respostas com antecedência têm 2.4x mais chances de aprovação.',
            badgeText: `Entrevista ${daysText}`,
            badgeVariant: 'brand',
            ctaLabel: 'Preparar entrevista',
            ctaTab: 'coach',
            ctaPayload: { applicationId: app.id, jobId: app.jobId },
            icon: 'calendar',
            urgencyScore
          });
        }

        // B. Ação Planejada Vencida (Data no passado)
        if (daysFromToday < 0) {
          const absDays = Math.abs(daysFromToday);
          const overdueText = absDays === 1 ? '1 dia em atraso' : `${absDays} dias em atraso`;
          const actionName = app.nextAction?.trim() || 'Acompanhamento do processo';

          // Urgência alta (80 a 89), balanceada para não suplantar entrevista de amanhã (96+)
          const urgencyScore = Math.min(89, 80 + Math.min(absDays, 9));

          candidates.push({
            id: `overdue-action-${app.id}`,
            type: 'overdue_action',
            title: '⚠️ Você tem uma ação pendente',
            subtitle: `${app.jobTitle} · ${app.companyName}`,
            description: `"${actionName}" para ${app.companyName} está com ${overdueText}. Conclua ou reagende para manter seu processo aquecido.`,
            reason: 'Retornos ágeis demonstram comprometimento e evitam que sua candidatura esfrie.',
            badgeText: overdueText,
            badgeVariant: 'warning',
            ctaLabel: 'Resolver agora',
            ctaTab: 'strategy',
            ctaPayload: { applicationId: app.id },
            icon: 'alert-circle',
            urgencyScore
          });
        }
      }
    }

    // ── 3. ENTREVISTAS RECENTES SEM FOLLOW-UP AGENDADO ──
    const interviewAppsWithoutAction = applications.filter(app => {
      const cleanStatus = ApplicationPipelineService.getCleanStatus(app.status);
      const isInterview = cleanStatus === 'hr' || cleanStatus === 'interview';
      const hasNoFutureAction = !app.nextActionDate || (toMidnightDate(app.nextActionDate) && diffInDays(todayMidnight, toMidnightDate(app.nextActionDate)!) < 0);
      return isInterview && hasNoFutureAction;
    });

    for (const app of interviewAppsWithoutAction) {
      const lastUpdate = toMidnightDate(app.updatedAt || app.createdAt);
      if (lastUpdate) {
        const daysSinceUpdate = diffInDays(lastUpdate, todayMidnight);
        if (daysSinceUpdate >= 1 && daysSinceUpdate <= 5) {
          const daysText = daysSinceUpdate === 1 ? 'ontem' : `há ${daysSinceUpdate} dias`;
          candidates.push({
            id: `recent-interview-followup-${app.id}`,
            type: 'recent_interview',
            title: '💬 Envie um follow-up pós-entrevista',
            subtitle: `${app.jobTitle} · ${app.companyName}`,
            description: `Você realizou uma etapa para ${app.jobTitle} na ${app.companyName} ${daysText}. Envie uma mensagem de agradecimento para reforçar seu interesse.`,
            reason: 'Mensagens pós-entrevista reforçam boa impressão e mantêm você no topo da lista.',
            badgeText: 'Follow-up recomendado',
            badgeVariant: 'info',
            ctaLabel: 'Enviar follow-up',
            ctaTab: 'strategy',
            ctaPayload: { applicationId: app.id },
            icon: 'message-square',
            urgencyScore: 75
          });
        }
      }
    }

    // ── 4. CANDIDATURAS ESTAGNADAS (> 7 DIAS SEM MOVIMENTAÇÃO) ──
    const appliedApps = applications.filter(
      app => ApplicationPipelineService.getCleanStatus(app.status) === 'applied' && !app.nextActionDate
    );
    for (const app of appliedApps) {
      const appliedDate = toMidnightDate(app.appliedAt || app.createdAt);
      if (appliedDate) {
        const daysSinceApplied = diffInDays(appliedDate, todayMidnight);
        if (daysSinceApplied >= 7) {
          candidates.push({
            id: `stagnant-app-${app.id}`,
            type: 'stagnant_application',
            title: '📌 Acompanhe sua candidatura',
            subtitle: `${app.jobTitle} · ${app.companyName}`,
            description: `Sua candidatura para ${app.jobTitle} na ${app.companyName} foi enviada há ${daysSinceApplied} dias sem retorno. Verifique o status ou busque novas vagas.`,
            reason: 'Diversificar candidaturas ativas reduz o tempo médio de recolocação.',
            badgeText: `${daysSinceApplied} dias sem retorno`,
            badgeVariant: 'warning',
            ctaLabel: 'Acompanhar candidatura',
            ctaTab: 'strategy',
            ctaPayload: { applicationId: app.id },
            icon: 'clock',
            urgencyScore: 65
          });
        }
      }
    }

    // ── 5. PERFIL SEM CURRÍCULO (Bloqueio Fundamental) ──
    if (!hasResume) {
      candidates.push({
        id: 'no-resume-upload',
        type: 'no_resume',
        title: 'Envie seu currículo para começar',
        description: 'Faça upload do seu currículo em PDF para calcular seu Career Score, desbloquear o Match de vagas e receber recomendações personalizadas.',
        reason: 'O currículo é a base necessária para mapear suas competências profissionais.',
        badgeText: 'Primeiro passo',
        badgeVariant: 'brand',
        ctaLabel: 'Enviar currículo',
        ctaTab: 'profile',
        icon: 'file-up',
        urgencyScore: 92
      });
    }

    // ── 6. PERFIL INCOMPLETO (< 70%) ──
    const linkedinVal = context.careerProfileNew?.personal?.linkedin;
    const hasLinkedin =
      !!linkedinVal &&
      typeof linkedinVal === 'string' &&
      linkedinVal.trim().length > 0 &&
      !['n/a', 'na', 'none', 'não informado', 'não consta', 'null', 'undefined'].includes(linkedinVal.toLowerCase().trim()) &&
      linkedinVal.toLowerCase().includes('linkedin.com');
    const hasSkills = (context.careerProfileNew?.skills?.length || 0) > 0;
    const hasExperiences = (context.careerProfileNew?.experience?.length || 0) > 0;

    const completenessResult = calculateProfileCompleteness({
      hasResume,
      hasLinkedin,
      hasSkills,
      hasExperiences,
      profile: context.profile,
      careerProfile: context.careerProfileNew,
      resume: resumes[0]
    });

    if (hasResume && completenessResult.score < 70) {
      candidates.push({
        id: 'incomplete-profile',
        type: 'incomplete_profile',
        title: 'Complete seu perfil profissional',
        description: `Seu perfil está ${completenessResult.score}% preenchido. Cadastrar suas competências e histórico aumenta a precisão do cálculo de compatibilidade.`,
        reason: 'Perfis completos recebem recomendações com índice de assertividade 3x maior.',
        badgeText: `${completenessResult.score}% preenchido`,
        badgeVariant: 'warning',
        ctaLabel: 'Completar meu perfil',
        ctaTab: 'profile',
        icon: 'user-check',
        urgencyScore: 60
      });
    }

    // ── 7. BONS MATCHES SEM CANDIDATURAS ENVIADAS ──
    const activeAppliedCount = applications.filter(a => {
      const s = ApplicationPipelineService.getCleanStatus(a.status);
      return s === 'applied' || s === 'hr' || s === 'interview' || s === 'offer';
    }).length;

    if (hasResume && matches.length > 0 && activeAppliedCount === 0) {
      const sortedMatches = [...matches].sort((a, b) => b.scoreOverall - a.scoreOverall);
      const topMatch = sortedMatches[0];

      candidates.push({
        id: 'explore-top-matches',
        type: 'explore_matches',
        title: 'Vagas com alta compatibilidade encontradas',
        subtitle: `${topMatch.jobTitle} · ${topMatch.companyName}`,
        description: `Você tem ${matches.length} vagas mapeadas, com destaque para ${topMatch.jobTitle} na ${topMatch.companyName} (${topMatch.scoreOverall}% de compatibilidade). Candidate-se agora.`,
        reason: 'Seu perfil atende aos principais requisitos técnicos desta vaga.',
        badgeText: `${topMatch.scoreOverall}% Compatível`,
        badgeVariant: 'success',
        ctaLabel: 'Ver vagas compatíveis',
        ctaTab: 'match',
        ctaPayload: { jobId: topMatch.jobId },
        icon: 'sparkles',
        urgencyScore: 55
      });
    }

    // ── 8. NENHUM MATCH CALCULADO AINDA ──
    if (hasResume && matches.length === 0) {
      candidates.push({
        id: 'discover-first-jobs',
        type: 'discover_jobs',
        title: 'Encontre vagas compatíveis com sua experiência',
        description: 'Seu currículo está pronto! Explore as oportunidades do mercado e calcule sua compatibilidade em tempo real.',
        reason: 'Calculamos a aderência de competências e senioridade para cada oportunidade.',
        badgeText: 'Oportunidades abertas',
        badgeVariant: 'brand',
        ctaLabel: 'Encontrar vagas',
        ctaTab: 'match',
        icon: 'compass',
        urgencyScore: 50
      });
    }

    // ── 9. FALLBACK NEUTRO (Usuário em Dia) ──
    const defaultNeutralAction: NextStepAction = {
      id: 'default-neutral',
      type: 'neutral',
      title: 'Acompanhe seu progresso de carreira',
      description: 'Explore novas oportunidades no mercado, treine simulações de entrevista e mantenha seu Pipeline atualizado.',
      reason: 'Constância semanal é o fator determinante para acelerar contratações.',
      badgeText: 'Copiloto Ativo',
      badgeVariant: 'info',
      ctaLabel: 'Explorar vagas',
      ctaTab: 'match',
      icon: 'compass',
      urgencyScore: 10
    };

    // Ordenação estrita por pontuação de urgência + relevância contextual
    candidates.sort((a, b) => b.urgencyScore - a.urgencyScore);
    const primaryAction = candidates.length > 0 ? candidates[0] : defaultNeutralAction;

    // ── 10. AÇÕES SECUNDÁRIAS ("Também pode fazer hoje") ──
    // Máximo de 1 a 2 ações secundárias não redundantes com a ação primária
    const secondaryActions: SecondaryAction[] = [];

    // Se a ação primária não for o upload de currículo, sugerir checar o perfil se incompleto
    if (primaryAction.type !== 'no_resume' && primaryAction.type !== 'incomplete_profile') {
      if (completenessResult.score < 100) {
        secondaryActions.push({
          id: 'sec-profile-completeness',
          label: `Completar competências no perfil (${completenessResult.score}% pronto)`,
          ctaTab: 'profile',
          completed: false
        });
      }
    }

    // Se o usuário tem vagas salvas mas não aplicadas
    const savedAppsCount = applications.filter(a => ApplicationPipelineService.getCleanStatus(a.status) === 'saved').length;
    if (savedAppsCount > 0 && primaryAction.type !== 'explore_matches') {
      secondaryActions.push({
        id: 'sec-saved-jobs',
        label: `Revisar ${savedAppsCount} vaga(s) salva(s) no Pipeline`,
        ctaTab: 'strategy',
        completed: false
      });
    }

    // Treino STAR no simulador se houver currículo
    if (hasResume && primaryAction.type !== 'future_interview') {
      secondaryActions.push({
        id: 'sec-practice-interview',
        label: 'Praticar 1 simulação de entrevista com o simulador',
        ctaTab: 'coach',
        completed: false
      });
    }

    // Garantir limite de 2 ações secundárias no máximo
    return {
      primaryAction,
      secondaryActions: secondaryActions.slice(0, 2)
    };
  }
}
