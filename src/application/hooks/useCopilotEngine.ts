import { useMemo } from 'react';
import type { Application, Job, Match, Profile, Resume, CopilotRecommendation } from '../../domain/models/types';
import type { CareerProfileNew } from './useMyProfileAi';
import { NextStepService } from '../../domain/services/NextStepService';

export interface UseCopilotEngineProps {
  applications?: Application[];
  jobs?: Job[];
  matches?: Match[];
  careerProfileNew?: CareerProfileNew | null;
  profile?: Profile | null;
  resumes?: Resume[];
  selectedJob?: Job | null;
}

export function useCopilotEngine({
  applications = [],
  jobs = [],
  matches = [],
  careerProfileNew,
  profile,
  resumes = [],
  selectedJob
}: UseCopilotEngineProps) {
  // ── 1. CÁLCULO CANÔNICO DO PRÓXIMO PASSO (Fase 1 Alignment) ──
  const nextStepResult = useMemo(() => {
    try {
      return NextStepService.getUserNextStep({
        profile,
        careerProfileNew,
        resumes,
        matches,
        applications
      });
    } catch (err) {
      console.warn('[useCopilotEngine] Erro ao consultar NextStepService:', err);
      return null;
    }
  }, [profile, careerProfileNew, resumes, matches, applications]);

  // ── 2. CÁLCULO CANÔNICO DO CAREER SCORE (Fase 2 Alignment: 50 + skills*3 + exp*5) ──
  const careerScoreBreakdown = useMemo(() => {
    const base = 50;
    const skills = careerProfileNew?.skills || [];
    const exp = careerProfileNew?.experience || [];
    const skillsPoints = Math.min(30, skills.length * 3);
    const expPoints = Math.min(20, exp.length * 5);
    const total = base + skillsPoints + expPoints;

    return {
      total,
      base,
      skillsPoints,
      expPoints,
      skillsCount: skills.length,
      expCount: exp.length,
      hasMaxScore: total >= 100
    };
  }, [careerProfileNew]);

  // ── 3. RECOMENDAÇÕES PROATIVAS DO COPILOTO (Fases 1, 2 e 3 Integradas) ──
  const recommendations = useMemo<CopilotRecommendation[]>(() => {
    const list: CopilotRecommendation[] = [];

    // Recomendação 1 (Canônica): Derivada do NextStepService
    if (nextStepResult?.primaryAction) {
      const primary = nextStepResult.primaryAction;
      list.push({
        id: `rec-canonical-${primary.id}`,
        type: primary.type === 'future_interview' || primary.type === 'recent_interview' ? 'interview_prep' : 'action',
        title: primary.title,
        description: primary.description,
        actionLabel: primary.ctaLabel,
        targetTab: primary.ctaTab,
        targetAppId: primary.ctaPayload?.applicationId,
        targetJobId: primary.ctaPayload?.jobId,
        priority: 'high'
      });
    }

    // Recomendação 2: Vagas de Alta Aderência (Match >= 75%) se não for a ação #1
    const activeApps = applications.filter(a => a.status !== 'deleted' && a.status !== 'rejected');
    const highMatches = matches.filter(m => {
      const score = m.scoreOverall || (m as any).overallScore || (m as any).score || 0;
      const hasApp = activeApps.some(a => a.jobId === m.jobId || (a as any).job_id === m.jobId);
      return score >= 75 && !hasApp;
    });

    if (highMatches.length > 0) {
      const topMatch = highMatches[0];
      const targetJobId = topMatch.jobId || (topMatch as any).job_id;
      const job = jobs.find(j => j.id === targetJobId);
      if (job && list.every(r => r.targetJobId !== job.id)) {
        const scoreVal = topMatch.scoreOverall || (topMatch as any).overallScore || (topMatch as any).score || 0;
        list.push({
          id: `rec-high-match-${job.id}`,
          type: 'priority_job',
          title: `Vaga de alta aderência: ${job.title}`,
          description: `Identificamos ${scoreVal}% de Match na ${job.companyName}. Vale a pena conferir o diagnóstico.`,
          actionLabel: 'Ver Diagnóstico',
          targetTab: 'match',
          targetJobId: job.id,
          priority: 'medium'
        });
      }
    }

    // Recomendação 3: Evolução do Career Score (se < 100) ou Treino STAR
    if (careerScoreBreakdown.total < 90 && list.length < 3) {
      list.push({
        id: 'rec-career-score-boost',
        type: 'action',
        title: `Seu Career Score está em ${careerScoreBreakdown.total}/100`,
        description: 'Adicionar competências e detalhes às suas experiências aumenta sua visibilidade para recrutadores.',
        actionLabel: 'Evoluir Score',
        targetTab: 'profile',
        priority: 'medium'
      });
    } else if (list.length < 3 && activeApps.length > 0) {
      const targetApp = activeApps[0];
      list.push({
        id: `rec-star-training-${targetApp.id}`,
        type: 'interview_prep',
        title: `Treino STAR para ${targetApp.jobTitle}`,
        description: `Pratique respostas com método STAR para suas candidaturas ativas na ${targetApp.companyName}.`,
        actionLabel: 'Treinar com IA',
        targetTab: 'coach',
        targetAppId: targetApp.id,
        priority: 'low'
      });
    }

    // Fallback amigável se lista estiver vazia
    if (list.length === 0) {
      list.push({
        id: 'rec-explore-opportunities',
        type: 'action',
        title: 'Mapear novas oportunidades',
        description: 'Descubra vagas alinhadas ao seu momento profissional e ative diagnósticos de compatibilidade.',
        actionLabel: 'Explorar Vagas',
        targetTab: 'match',
        priority: 'medium'
      });
    }

    return list.slice(0, 3);
  }, [nextStepResult, applications, matches, jobs, careerScoreBreakdown]);

  // ── 4. SAUDAÇÃO PERSONALIZADA DO COPILOTO ──
  const candidateName = profile?.fullName?.split(' ')[0] || (careerProfileNew?.personal as any)?.fullName?.split(' ')[0] || '';

  const greetingHeadline = useMemo(() => {
    if (candidateName) {
      return `Olá, ${candidateName}! Analisei seu momento na jornada. Como posso te orientar hoje?`;
    }
    return 'Olá! Analisei seu momento na jornada. Como posso te orientar hoje?';
  }, [candidateName]);

  return {
    recommendations,
    greetingHeadline,
    candidateName,
    nextStepResult,
    careerScoreBreakdown,
    selectedJob
  };
}
