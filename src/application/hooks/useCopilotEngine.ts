import { useMemo } from 'react';
import type { Application, Job, CopilotRecommendation } from '../../domain/models/types';
import type { CareerProfileNew } from './useMyProfileAi';

interface UseCopilotEngineProps {
  applications?: Application[];
  jobs?: Job[];
  matches?: any[];
  careerProfileNew?: CareerProfileNew | null;
}

export function useCopilotEngine({
  applications = [],
  jobs = [],
  matches = [],
  careerProfileNew
}: UseCopilotEngineProps) {
  // ── Sinais Rastreáveis e Recomendações Diárias Proativas ──
  const recommendations = useMemo<CopilotRecommendation[]>(() => {
    const list: CopilotRecommendation[] = [];

    // Sinal 1: Dias sem enviar candidatura (Fonte: public.applications)
    const activeApps = applications.filter(a => a.status !== 'deleted' && a.status !== 'rejected');
    const applicationDates = activeApps
      .map(a => new Date(a.appliedAt || (a as any).created_at || a.createdAt || Date.now()).getTime())
      .filter(t => !isNaN(t));

    const lastAppDateMs = applicationDates.length > 0 ? Math.max(...applicationDates) : 0;
    const daysSinceLastApp = lastAppDateMs > 0 
      ? Math.floor((Date.now() - lastAppDateMs) / (1000 * 60 * 60 * 24))
      : 99;

    if (daysSinceLastApp >= 3 && daysSinceLastApp < 90) {
      list.push({
        id: 'rec-inactivity',
        type: 'warning',
        title: `Há ${daysSinceLastApp} dias você não envia candidaturas`,
        description: 'Manter a constância de candidaturas semanais é crucial para acelerar convites de entrevista.',
        actionLabel: 'Ver vagas recomendadas',
        targetTab: 'match',
        priority: 'high'
      });
    }

    // Sinal 2: Entrevistas agendadas ou em andamento (Fonte: public.applications + public.application_stages)
    const interviewApps = activeApps.filter(a => {
      const status = String(a.status).toLowerCase();
      return status === 'hr' || status === 'interview' || status.includes('entrevista') || status.includes('recrutador') || status.includes('gestor');
    });

    if (interviewApps.length > 0) {
      const targetApp = interviewApps[0];
      list.push({
        id: `rec-interview-${targetApp.id}`,
        type: 'interview_prep',
        title: `Treino STAR para ${targetApp.jobTitle}`,
        description: `Você está na fase de entrevista na ${targetApp.companyName}. Faça uma simulação rápida agora para praticar respostas impactantes.`,
        actionLabel: 'Iniciar Treino STAR',
        targetTab: 'coach',
        targetAppId: targetApp.id,
        priority: 'high'
      });
    }

    // Sinal 3: Vagas com alto match sem candidatura (Fonte: public.matches + public.jobs)
    const highMatches = matches.filter(m => {
      const score = m.overallScore || m.score || 0;
      const hasApp = activeApps.some(a => a.jobId === m.jobId || a.jobId === m.job_id);
      return score >= 75 && !hasApp;
    });

    if (highMatches.length > 0) {
      const topMatch = highMatches[0];
      const job = jobs.find(j => j.id === (topMatch.jobId || topMatch.job_id));
      if (job) {
        list.push({
          id: `rec-high-match-${job.id}`,
          type: 'priority_job',
          title: `Vaga de alta prioridade: ${job.title}`,
          description: `Identificamos ${topMatch.overallScore || topMatch.score}% de alinhamento com seu perfil na ${job.companyName}.`,
          actionLabel: 'Candidatar-se agora',
          targetTab: 'match',
          targetJobId: job.id,
          priority: 'medium'
        });
      }
    }

    // Sinal 4: Completude do perfil (Fonte: public.career_profiles)
    const hasSkills = (careerProfileNew?.skills?.length || 0) > 0;
    const hasExperience = (careerProfileNew?.experience?.length || 0) > 0;
    if (!hasSkills || !hasExperience) {
      list.push({
        id: 'rec-profile-completeness',
        type: 'action',
        title: 'Calibrar competências no Perfil',
        description: 'Complete suas experiências e competências chave para que o Copiloto selecione as melhores oportunidades.',
        actionLabel: 'Completar perfil',
        targetTab: 'profile',
        priority: 'medium'
      });
    } else if (list.length < 3) {
      // Fallback positivo
      list.push({
        id: 'rec-all-ready',
        type: 'action',
        title: 'O currículo já está pronto',
        description: 'Agora vale investir tempo em simulações de entrevista STAR para as candidaturas ativas.',
        actionLabel: 'Treinar com IA',
        targetTab: 'coach',
        priority: 'low'
      });
    }

    return list.slice(0, 3);
  }, [applications, jobs, matches, careerProfileNew]);

  // Mensagem proativa inicial do assistente
  const greetingHeadline = useMemo(() => {
    if (recommendations.length > 0) {
      return `Olá! Hoje eu faria estas ${recommendations.length} ações prioritárias para avançar sua carreira:`;
    }
    return "Olá! Seu copiloto de carreira está pronto para orientar seus próximos passos.";
  }, [recommendations]);

  return {
    recommendations,
    greetingHeadline
  };
}
