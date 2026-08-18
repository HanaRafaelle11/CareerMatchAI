import type { Application, Match, Profile, Resume, CareerGoal } from '../models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { ApplicationPipelineService } from '../../application/services/ApplicationPipelineService';
import { calculateProfileCompleteness } from './ProfileCompletenessService';

export interface NextStepAction {
  id: string;
  type:
    | 'hired'
    | 'future_interview'
    | 'interview_simulation'
    | 'no_career_goal'
    | 'optimize_resume_for_goal'
    | 'apply_high_match_jobs'
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
  icon: 'trophy' | 'calendar' | 'alert-circle' | 'message-square' | 'clock' | 'file-up' | 'user-check' | 'sparkles' | 'compass' | 'target';
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
  careerGoal?: CareerGoal | null;
  careerProfileNew?: CareerProfileNew | null;
  resumes?: Resume[];
  matches?: Match[];
  applications?: Application[];
  isResumeOptimized?: boolean;
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
    const careerGoal = context.careerGoal;
    const hasExplicitGoal = Boolean(careerGoal && careerGoal.intentType);

    // Determinar se o currículo já foi otimizado para o objetivo declarado
    const isResumeOptimized = Boolean(
      context.isResumeOptimized ||
      resumes.some(r => (r as any).isOptimized || (r as any).is_optimized || r.structuredSummary?.includes('[Otimizado]') || (r.versionNumber && r.versionNumber > 1)) ||
      Boolean((context.careerProfileNew as any)?.optimizations?.length)
    );

    const candidates: NextStepAction[] = [];

    // ── 1. CONTRATAÇÃO (Vitória Máxima, Score 99) ──
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
        urgencyScore: 99
      });
    }

    // ── 2. ENTREVISTA AGENDADA / SIMULAÇÃO DE ENTREVISTA (Score 96) ──
    // Se há candidatura em fase de entrevista (hr / interview)
    // ── 2. ENTREVISTA AGENDADA / SIMULAÇÃO DE ENTREVISTA (Score 96) ──
    // Se há candidatura em fase de entrevista com agendamento ativo futuro
    const futureInterviewApps = applications.filter(app => {
      const cleanStatus = ApplicationPipelineService.getCleanStatus(app.status);
      const isInterview = cleanStatus === 'hr' || cleanStatus === 'interview';
      if (!isInterview) return false;
      const actionDate = toMidnightDate(app.nextActionDate);
      if (actionDate) {
        return diffInDays(todayMidnight, actionDate) >= 0;
      }
      return Boolean(app.nextAction && !app.nextActionDate);
    });

    if (futureInterviewApps.length > 0) {
      const topInterview = futureInterviewApps[0];
      const actionDate = toMidnightDate(topInterview.nextActionDate);
      let daysText = 'em breve';
      let urgencyScore = 96;

      if (actionDate) {
        const daysFromToday = diffInDays(todayMidnight, actionDate);
        if (daysFromToday >= 0) {
          daysText = daysFromToday === 0 ? 'hoje' : daysFromToday === 1 ? 'amanhã' : `em ${daysFromToday} dias`;
          urgencyScore = Math.max(90, 100 - daysFromToday * 2);
        }
      }

      candidates.push({
        id: `interview-sim-${topInterview.id}`,
        type: 'interview_simulation',
        title: `Simule sua entrevista para ${topInterview.jobTitle}`,
        subtitle: `${topInterview.jobTitle} · ${topInterview.companyName}`,
        description: `Você tem uma etapa de entrevista agendada ${daysText} na ${topInterview.companyName}. Treine suas respostas estruturadas no método STAR com o Copiloto IA.`,
        reason: 'Treinar respostas no método STAR com antecedência ajuda a estruturar exemplos reais com clareza e segurança diante do recrutador.',
        badgeText: `Entrevista ${daysText}`,
        badgeVariant: 'brand',
        ctaLabel: 'Simular entrevista STAR',
        ctaTab: 'coach',
        ctaPayload: { applicationId: topInterview.id, jobId: topInterview.jobId },
        icon: 'calendar',
        urgencyScore
      });
    }

    // ── 3. SEM OBJETIVO PROFISSIONAL DEFINIDO (Score 94) ──
    // Invariante de Negócio: Se o usuário não tem objetivo explícito, o próximo passo prioritário é defini-lo!
    if (!hasExplicitGoal) {
      candidates.push({
        id: 'no-career-goal',
        type: 'no_career_goal',
        title: 'Defina seu objetivo profissional',
        subtitle: 'Calibração Essencial (30s)',
        description: 'Você ainda não definiu seu objetivo de carreira. Escolha se quer continuar na sua área, buscar crescimento ou mudar de carreira para calibrar o Copiloto.',
        reason: 'O objetivo profissional é o ponto de partida que calibra o cálculo de compatibilidade e orienta as recomendações da plataforma.',
        badgeText: 'Objetivo Pendente',
        badgeVariant: 'brand',
        ctaLabel: 'Definir objetivo profissional',
        ctaTab: 'profile',
        icon: 'target',
        urgencyScore: 94
      });
    }

    // ── 4. PERFIL SEM CURRÍCULO (Bloqueio Fundamental de Dados, Score 92) ──
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

    // ── 5. COM OBJETIVO DEFINIDO, MAS CURRÍCULO AINDA NÃO OTIMIZADO PARA ELE (Score 88) ──
    if (hasExplicitGoal && hasResume && !isResumeOptimized) {
      const intentType = careerGoal!.intentType;
      let targetLabel = 'seu objetivo';
      let targetSubtitle = 'Alinhamento de Competências';
      let customDescription = 'Otimize os termos e competências do seu currículo para aumentar seu destaque nas triagens.';
      let customReason = 'Currículos com palavras-chave alinhadas à vaga aumentam a aderência aos requisitos buscados.';

      if (intentType === 'career_transition') {
        targetLabel = careerGoal?.targetArea ? `transição para ${careerGoal.targetArea}` : 'transição de carreira';
        targetSubtitle = 'Transição de Carreira';
        customDescription = `Você está em transição para ${careerGoal?.targetArea || 'uma nova área'}. Destaque suas competências transferíveis e palavras-chave no currículo para maximizar seu potencial.`;
        customReason = 'Adaptar seu currículo destacando competências transferíveis facilita a identificação do seu potencial pela equipe de recrutamento.';
      } else if (intentType === 'same_area_grow') {
        targetLabel = careerGoal?.targetRoles?.[0] || careerGoal?.targetArea || 'crescimento profissional';
        targetSubtitle = 'Crescimento Profissional';
        customDescription = `Você busca crescer profissionalmente como ${targetLabel}. Destaque métricas de impacto, liderança e resultados estratégicos no seu currículo.`;
        customReason = 'Posições de maior senioridade valorizam evidências claras de entregas, liderança e impacto no currículo.';
      } else if (intentType === 'same_area_continue') {
        targetLabel = careerGoal?.targetRoles?.[0] || careerGoal?.targetArea || 'sua área';
        targetSubtitle = 'Continuidade & Foco';
        customDescription = `Seu objetivo é ${targetLabel}. Otimize os termos e competências do seu currículo para aumentar seu destaque nas triagens.`;
        customReason = 'Currículos com termos técnicos e ferramentas atualizadas têm maior taxa de avanço para entrevistas.';
      } else if (intentType === 'exploring') {
        targetLabel = 'suas competências';
        targetSubtitle = 'Exploração de Oportunidades';
        customDescription = 'Otimize e destaque suas principais habilidades universais para descobrir as melhores oportunidades no mercado.';
        customReason = 'Evidenciar competências transferíveis facilita a descoberta de novos caminhos profissionais compatíveis.';
      }

      candidates.push({
        id: 'optimize-resume-for-goal',
        type: 'optimize_resume_for_goal',
        title: `Otimize seu currículo para ${targetLabel}`,
        subtitle: targetSubtitle,
        description: customDescription,
        reason: customReason,
        badgeText: 'Otimização Recomendada',
        badgeVariant: 'warning',
        ctaLabel: 'Otimizar currículo',
        ctaTab: 'profile',
        icon: 'sparkles',
        urgencyScore: 88
      });
    }

    // ── 6. AÇÕES PLANEJADAS VENCIDAS (Score 80-89) ──
    for (const app of applications) {
      const actionDate = toMidnightDate(app.nextActionDate);
      if (actionDate) {
        const daysFromToday = diffInDays(todayMidnight, actionDate);
        if (daysFromToday < 0) {
          const absDays = Math.abs(daysFromToday);
          const overdueText = absDays === 1 ? '1 dia em atraso' : `${absDays} dias em atraso`;
          const actionName = app.nextAction?.trim() || 'Acompanhamento do processo';
          const urgencyScore = Math.min(87, 80 + Math.min(absDays, 7));

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

    // ── 7. COM CURRÍCULO E VAGAS DE ALTO POTENCIAL DISPONÍVEIS (Score 78) ──
    if (hasResume && matches.length > 0) {
      const highMatches = matches.filter(
        m => m.scoreOverall >= 70 || ((m as any).transitionPotential && (m as any).transitionPotential >= 70)
      );
      const matchCount = highMatches.length > 0 ? highMatches.length : matches.length;
      const sortedMatches = (highMatches.length > 0 ? highMatches : matches).sort((a, b) => b.scoreOverall - a.scoreOverall);
      const topMatch = sortedMatches[0];

      let matchDescription = `Encontramos ${matchCount} vaga(s) com boa aderência ao seu perfil atual, com destaque para ${topMatch.jobTitle} na ${topMatch.companyName} (${topMatch.scoreOverall}% de compatibilidade).`;
      let matchReason = `você tem ${topMatch.scoreOverall}% de compatibilidade com seu histórico profissional atual.`;

      if (careerGoal?.intentType === 'career_transition') {
        matchDescription = `Encontramos ${matchCount} vaga(s) com boa aderência ao seu perfil profissional atual, com destaque para ${topMatch.jobTitle} na ${topMatch.companyName} (${topMatch.scoreOverall}% de compatibilidade direta).`;
        matchReason = `Estas vagas têm ${topMatch.scoreOverall}% de aderência com seu perfil profissional atual. O cálculo específico de potencial de transição de carreira será integrado na Fase 3.`;
      } else if (careerGoal?.intentType === 'same_area_grow' || careerGoal?.intentType === 'same_area_continue') {
        matchReason = `você tem ${topMatch.scoreOverall}% de compatibilidade direta com os requisitos desta oportunidade.`;
      }

      candidates.push({
        id: 'apply-high-match-jobs',
        type: 'apply_high_match_jobs',
        title: `Candidate-se a ${matchCount} vagas com alto potencial`,
        subtitle: `${topMatch.jobTitle} · ${topMatch.companyName}`,
        description: matchDescription,
        reason: matchReason,
        badgeText: `${matchCount} Vagas Recomendadas`,
        badgeVariant: 'success',
        ctaLabel: 'Ver vagas recomendadas',
        ctaTab: 'match',
        ctaPayload: { jobId: topMatch.jobId },
        icon: 'sparkles',
        urgencyScore: 78
      });
    }

    // ── 8. ENTREVISTAS RECENTES SEM FOLLOW-UP AGENDADO (Score 75) ──
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

    // ── 9. CANDIDATURAS ESTAGNADAS (> 7 DIAS SEM MOVIMENTAÇÃO, Score 65) ──
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

    // ── 10. PERFIL INCOMPLETO (< 70%, Score 60) ──
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
        reason: 'Perfis detalhados permitem que o Copiloto cruze mais requisitos técnicos e comportamentais com as oportunidades abertas.',
        badgeText: `${completenessResult.score}% preenchido`,
        badgeVariant: 'warning',
        ctaLabel: 'Completar meu perfil',
        ctaTab: 'profile',
        icon: 'user-check',
        urgencyScore: 60
      });
    }

    // ── 11. DESCOBRIR PRIMEIRAS VAGAS (Score 50) ──
    if (hasResume && matches.length === 0) {
      candidates.push({
        id: 'discover-first-jobs',
        type: 'discover_jobs',
        title: 'Encontre vagas compatíveis com seu objetivo',
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

    // ── 12. FALLBACK NEUTRO (Score 10) ──
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

    // Ordenação estrita por pontuação de urgência
    candidates.sort((a, b) => b.urgencyScore - a.urgencyScore);
    const primaryAction = candidates.length > 0 ? candidates[0] : defaultNeutralAction;

    // ── AÇÕES SECUNDÁRIAS ("Também pode fazer hoje") ──
    const secondaryActions: SecondaryAction[] = [];

    if (!hasExplicitGoal && primaryAction.type !== 'no_career_goal') {
      secondaryActions.push({
        id: 'sec-define-goal',
        label: 'Definir objetivo de carreira (30s)',
        ctaTab: 'profile',
        completed: false
      });
    }

    if (hasResume && !isResumeOptimized && primaryAction.type !== 'optimize_resume_for_goal') {
      secondaryActions.push({
        id: 'sec-optimize-resume',
        label: 'Otimizar currículo para seu objetivo',
        ctaTab: 'profile',
        completed: false
      });
    }

    if (hasResume && primaryAction.type !== 'interview_simulation') {
      secondaryActions.push({
        id: 'sec-practice-interview',
        label: 'Praticar 1 simulação de entrevista STAR',
        ctaTab: 'coach',
        completed: false
      });
    }

    return {
      primaryAction,
      secondaryActions: secondaryActions.slice(0, 2)
    };
  }
}
