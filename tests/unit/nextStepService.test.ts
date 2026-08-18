import { describe, it, expect } from 'vitest';
import { NextStepService } from '../../src/domain/services/NextStepService';
import type { Application, Match, Resume, Profile, CareerGoal } from '../../src/domain/models/types';
import type { CareerProfileNew } from '../../src/application/hooks/useMyProfileAi';

describe('Fase 2: NextStepService — Motor Determinístico de Decisão do Próximo Passo', () => {
  const baseDate = new Date('2026-08-16T12:00:00.000Z');

  const mockResume: Resume = {
    id: 'res-1',
    userId: 'user-1',
    fileName: 'curriculo.pdf',
    yearsOfExperience: 5,
    isPrimary: true,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
    experiences: [
      {
        id: 'exp-1',
        companyName: 'Tech Corp',
        role: 'Customer Success Specialist',
        description: 'Gestão de contas',
        startDate: '2022-01-01',
        isCurrent: true,
        highlights: []
      }
    ],
    skills: [
      { id: 'sk-1', name: 'Customer Success', category: 'hard_skill' },
      { id: 'sk-2', name: 'SaaS', category: 'hard_skill' }
    ],
    education: []
  };

  const mockOptimizedResume: Resume = {
    ...mockResume,
    id: 'res-opt-1',
    versionNumber: 2,
    structuredSummary: '[Otimizado] Perfil ajustado para transição'
  };

  const mockProfile: Profile = {
    id: 'user-1',
    fullName: 'Rafaela Silva',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  };

  const mockCareerProfile: CareerProfileNew = {
    personal: {
      fullName: 'Rafaela Silva',
      linkedin: 'https://linkedin.com/in/rafaelasilva'
    },
    skills: ['Customer Success', 'SaaS', 'Liderança', 'Onboarding'],
    experience: [
      {
        company: 'Tech Corp',
        role: 'Customer Success Specialist',
        startDate: '2022-01',
        description: 'CS & Churn reduction'
      }
    ]
  };

  const mockTransitionGoal: CareerGoal = {
    id: 'goal-trans-1',
    userId: 'user-1',
    intentType: 'career_transition',
    targetArea: 'Operações & Administrativo',
    targetRoles: ['Assistente de Operações'],
    desiredSalaryMin: 4000,
    desiredSalaryMax: 6000,
    salaryCurrency: 'BRL',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  };

  it('1. Estado 1: Conta sem objetivo profissional definido deve receber "Defina seu objetivo profissional"', () => {
    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerGoal: null, // Sem objetivo definido
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      matches: [],
      applications: [],
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('no_career_goal');
    expect(result.primaryAction.title).toBe('Defina seu objetivo profissional');
    expect(result.primaryAction.badgeText).toBe('Objetivo Pendente');
    expect(result.primaryAction.ctaTab).toBe('profile');
    expect(result.primaryAction.ctaLabel).toBe('Definir objetivo profissional');
    expect(result.primaryAction.reason).toContain('ponto de partida que calibra o cálculo de compatibilidade');
  });

  it('2. Estado 2: Com objetivo definido mas currículo ainda não otimizado, deve sugerir otimização', () => {
    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerGoal: mockTransitionGoal,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume], // Currículo não otimizado
      matches: [],
      applications: [],
      isResumeOptimized: false,
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('optimize_resume_for_goal');
    expect(result.primaryAction.title).toContain('Otimize seu currículo para transição para Operações & Administrativo');
    expect(result.primaryAction.badgeText).toBe('Otimização Recomendada');
    expect(result.primaryAction.ctaLabel).toBe('Otimizar currículo');
    expect(result.primaryAction.ctaTab).toBe('profile');
    expect(result.primaryAction.description).toContain('Você está em transição para Operações & Administrativo');
    expect(result.primaryAction.reason).toContain('Currículos adaptados para transição aumentam');
  });

  it('3. Estado 3: Com currículo otimizado e vagas disponíveis, deve recomendar candidatar-se com contagem N real', () => {
    const matches: Match[] = [
      {
        id: 'm-1',
        userId: 'user-1',
        resumeId: 'res-opt-1',
        jobId: 'job-101',
        jobTitle: 'Analista de Operações Jr',
        companyName: 'Stone',
        scoreOverall: 88,
        scoreTechnical: 90,
        scoreBehavioral: 85,
        scoreSeniority: 90,
        scoreLocation: 100,
        explanation: {
          strengths: ['Organização', 'Processos'],
          weaknesses: [],
          details: { technical: '', behavioral: '', seniority: '', salary: '', location: '' }
        },
        createdAt: '2026-08-16T10:00:00Z'
      },
      {
        id: 'm-2',
        userId: 'user-1',
        resumeId: 'res-opt-1',
        jobId: 'job-102',
        jobTitle: 'Assistente Administrativo',
        companyName: 'Nubank',
        scoreOverall: 84,
        scoreTechnical: 85,
        scoreBehavioral: 83,
        scoreSeniority: 85,
        scoreLocation: 100,
        explanation: {
          strengths: ['Atendimento', 'Comunicação'],
          weaknesses: [],
          details: { technical: '', behavioral: '', seniority: '', salary: '', location: '' }
        },
        createdAt: '2026-08-16T10:00:00Z'
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerGoal: mockTransitionGoal,
      careerProfileNew: mockCareerProfile,
      resumes: [mockOptimizedResume],
      matches,
      applications: [],
      isResumeOptimized: true,
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('apply_high_match_jobs');
    expect(result.primaryAction.title).toBe('Candidate-se a 2 vagas com alto potencial');
    expect(result.primaryAction.subtitle).toContain('Analista de Operações Jr · Stone');
    expect(result.primaryAction.badgeText).toBe('2 Vagas Recomendadas');
    expect(result.primaryAction.ctaTab).toBe('match');
    expect(result.primaryAction.ctaLabel).toBe('Ver vagas recomendadas');
    expect(result.primaryAction.reason).toContain('88% de compatibilidade e a vaga está alinhada ao seu objetivo de transição');
  });

  it('4. Estado 4: Com candidatura enviada e entrevista agendada, deve orientar simulação STAR', () => {
    const apps: Application[] = [
      {
        id: 'app-interview-nubank',
        userId: 'user-1',
        companyName: 'Nubank',
        jobTitle: 'Analista de Operações',
        status: 'interview',
        nextAction: 'Entrevista com o hiring manager',
        nextActionDate: '2026-08-17',
        createdAt: '2026-08-10T10:00:00Z',
        updatedAt: '2026-08-15T10:00:00Z'
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerGoal: mockTransitionGoal,
      careerProfileNew: mockCareerProfile,
      resumes: [mockOptimizedResume],
      applications: apps,
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('interview_simulation');
    expect(result.primaryAction.title).toBe('Simule sua entrevista para Analista de Operações');
    expect(result.primaryAction.subtitle).toBe('Analista de Operações · Nubank');
    expect(result.primaryAction.ctaLabel).toBe('Simular entrevista STAR');
    expect(result.primaryAction.ctaTab).toBe('coach');
    expect(result.primaryAction.badgeText).toBe('Entrevista amanhã');
    expect(result.primaryAction.reason).toContain('Candidatos que treinam respostas com antecedência têm 2.4x mais chances');
  });

  it('5. Invariante: Usuário sem objetivo explícito NUNCA deve pular direto para recomendação de vagas', () => {
    const matches: Match[] = [
      {
        id: 'm-1',
        userId: 'user-1',
        jobId: 'job-101',
        jobTitle: 'Analista',
        companyName: 'Tech',
        scoreOverall: 95,
        scoreTechnical: 95,
        scoreBehavioral: 95,
        scoreSeniority: 95,
        scoreLocation: 100,
        explanation: { strengths: [], weaknesses: [], details: { technical: '', behavioral: '', seniority: '', salary: '', location: '' } },
        createdAt: '2026-08-16T10:00:00Z'
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerGoal: null, // Sem objetivo explícito
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      matches,
      applications: [],
      currentDate: baseDate
    });

    // Deve bloquear e pedir objetivo profissional prioritariamente
    expect(result.primaryAction.type).toBe('no_career_goal');
    expect(result.primaryAction.title).toBe('Defina seu objetivo profissional');
  });

  it('6. Deve conter no máximo 2 ações secundárias não redundantes', () => {
    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerGoal: mockTransitionGoal,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      matches: [],
      applications: [],
      currentDate: baseDate
    });

    expect(result.secondaryActions.length).toBeLessThanOrEqual(2);
  });
});
