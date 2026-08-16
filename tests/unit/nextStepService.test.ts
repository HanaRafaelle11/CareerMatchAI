import { describe, it, expect } from 'vitest';
import { NextStepService } from '../../src/domain/services/NextStepService';
import type { Application, Match, Resume, Profile } from '../../src/domain/models/types';
import type { CareerProfileNew } from '../../src/application/hooks/useMyProfileAi';

describe('NextStepService — Regras Canônicas de Decisão do Próximo Passo', () => {
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

  it('Cenário A: Deve recomendar celebração e Pipeline quando houver contratação (hired)', () => {
    const apps: Application[] = [
      {
        id: 'app-hired',
        userId: 'user-1',
        companyName: 'Nubank',
        jobTitle: 'CS Operations Lead',
        status: 'hired',
        createdAt: '2026-08-10T10:00:00Z',
        updatedAt: '2026-08-15T10:00:00Z'
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      applications: apps,
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('hired');
    expect(result.primaryAction.ctaTab).toBe('strategy');
    expect(result.primaryAction.badgeVariant).toBe('success');
    expect(result.primaryAction.title).toContain('Parabéns pela sua contratação');
    expect(result.primaryAction.description).toContain('Nubank');
  });

  it('Cenário B: Deve priorizar Entrevista Futura com antecedência', () => {
    const apps: Application[] = [
      {
        id: 'app-interview-tomorrow',
        userId: 'user-1',
        companyName: 'Adlook',
        jobTitle: 'Customer Success Manager',
        status: 'interview',
        nextAction: 'Entrevista técnica com gestor',
        nextActionDate: '2026-08-17', // Amanhã
        createdAt: '2026-08-10T10:00:00Z',
        updatedAt: '2026-08-15T10:00:00Z'
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      applications: apps,
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('future_interview');
    expect(result.primaryAction.ctaTab).toBe('coach');
    expect(result.primaryAction.ctaLabel).toBe('Preparar entrevista');
    expect(result.primaryAction.badgeText).toContain('amanhã');
    expect(result.primaryAction.description).toContain('Adlook');
  });

  it('Cenário C: Deve apontar Ação Planejada Vencida com contagem exata de dias de atraso', () => {
    const apps: Application[] = [
      {
        id: 'app-overdue',
        userId: 'user-1',
        companyName: 'Stone',
        jobTitle: 'Analista de Operações',
        status: 'applied',
        nextAction: 'Enviar follow-up para Mariana Silva',
        nextActionDate: '2026-08-14', // 2 dias atrás
        createdAt: '2026-08-05T10:00:00Z',
        updatedAt: '2026-08-14T10:00:00Z'
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      applications: apps,
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('overdue_action');
    expect(result.primaryAction.ctaTab).toBe('strategy');
    expect(result.primaryAction.ctaLabel).toBe('Resolver agora');
    expect(result.primaryAction.badgeText).toBe('2 dias em atraso');
    expect(result.primaryAction.description).toContain('Enviar follow-up para Mariana Silva');
    expect(result.primaryAction.description).toContain('2 dias em atraso');
  });

  it('Ponderação Crítica: Entrevista futura deve suplantar Ação Vencida antiga', () => {
    const apps: Application[] = [
      {
        id: 'app-overdue-followup',
        userId: 'user-1',
        companyName: 'Empresa A',
        jobTitle: 'Analista Jr',
        status: 'applied',
        nextAction: 'Mandar e-mail para recrutador',
        nextActionDate: '2026-08-13', // 3 dias em atraso
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-13T10:00:00Z'
      },
      {
        id: 'app-interview-tomorrow',
        userId: 'user-1',
        companyName: 'Adlook',
        jobTitle: 'CS Specialist',
        status: 'hr',
        nextAction: 'Entrevista RH',
        nextActionDate: '2026-08-17', // Amanhã
        createdAt: '2026-08-10T10:00:00Z',
        updatedAt: '2026-08-15T10:00:00Z'
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      applications: apps,
      currentDate: baseDate
    });

    // Entrevista amanhã (urgency 98) DEVE vencer follow-up vencido (urgency 83)
    expect(result.primaryAction.type).toBe('future_interview');
    expect(result.primaryAction.ctaTab).toBe('coach');
    expect(result.primaryAction.description).toContain('Adlook');
  });

  it('Cenário D: Deve sugerir follow-up para entrevista recente (1 a 5 dias atrás)', () => {
    const apps: Application[] = [
      {
        id: 'app-recent-interview',
        userId: 'user-1',
        companyName: 'Loft',
        jobTitle: 'Customer Operations Manager',
        status: 'interview',
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-14T10:00:00Z' // 2 dias atrás
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      applications: apps,
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('recent_interview');
    expect(result.primaryAction.ctaLabel).toBe('Enviar follow-up');
    expect(result.primaryAction.description).toContain('Loft');
    expect(result.primaryAction.badgeText).toBe('Follow-up recomendado');
  });

  it('Cenário E: Deve alertar candidatura estagnada (> 7 dias sem retorno)', () => {
    const apps: Application[] = [
      {
        id: 'app-stagnant',
        userId: 'user-1',
        companyName: 'ContaAzul',
        jobTitle: 'Coordenadora de Atendimento',
        status: 'applied',
        appliedAt: '2026-08-07T10:00:00Z', // 9 dias atrás
        createdAt: '2026-08-07T10:00:00Z',
        updatedAt: '2026-08-07T10:00:00Z'
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      applications: apps,
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('stagnant_application');
    expect(result.primaryAction.badgeText).toContain('9 dias sem retorno');
    expect(result.primaryAction.description).toContain('ContaAzul');
  });

  it('Cenário F: Usuário sem currículo deve ser orientado a enviar currículo', () => {
    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: null,
      resumes: [],
      applications: [],
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('no_resume');
    expect(result.primaryAction.ctaTab).toBe('profile');
    expect(result.primaryAction.ctaLabel).toBe('Enviar currículo');
  });

  it('Cenário G: Usuário com currículo mas perfil incompleto (<70%) deve ser orientado a completar', () => {
    // Sem skills nem experiências detalhadas -> score baixo
    const incompleteCareerProfile: CareerProfileNew = {
      personal: {
        fullName: 'Rafaela'
      },
      skills: [],
      experience: []
    };

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: incompleteCareerProfile,
      resumes: [mockResume],
      applications: [],
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('incomplete_profile');
    expect(result.primaryAction.ctaTab).toBe('profile');
    expect(result.primaryAction.ctaLabel).toBe('Completar meu perfil');
  });

  it('Cenário H: Usuário com bons matches mas sem candidaturas deve ser incentivado a candidatar-se', () => {
    const matches: Match[] = [
      {
        id: 'm-1',
        userId: 'user-1',
        resumeId: 'res-1',
        jobId: 'job-101',
        jobTitle: 'Head of CS',
        companyName: 'Gympass',
        scoreOverall: 94,
        scoreTechnical: 95,
        scoreBehavioral: 90,
        scoreSeniority: 92,
        scoreLocation: 100,
        explanation: {
          strengths: ['SaaS', 'CS'],
          weaknesses: [],
          details: { technical: '', behavioral: '', seniority: '', salary: '', location: '' }
        },
        createdAt: '2026-08-16T10:00:00Z'
      }
    ];

    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      matches,
      applications: [],
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('explore_matches');
    expect(result.primaryAction.ctaTab).toBe('match');
    expect(result.primaryAction.ctaLabel).toBe('Ver vagas compatíveis');
    expect(result.primaryAction.description).toContain('Gympass');
    expect(result.primaryAction.badgeText).toBe('94% Compatível');
  });

  it('Cenário I: Usuário com currículo mas sem nenhum match deve ser orientado a encontrar vagas', () => {
    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      matches: [],
      applications: [],
      currentDate: baseDate
    });

    expect(result.primaryAction.type).toBe('discover_jobs');
    expect(result.primaryAction.ctaTab).toBe('match');
    expect(result.primaryAction.ctaLabel).toBe('Encontrar vagas');
  });

  it('Cenário J: Deve fornecer no máximo 2 ações secundárias não conflitantes', () => {
    const result = NextStepService.getUserNextStep({
      profile: mockProfile,
      careerProfileNew: mockCareerProfile,
      resumes: [mockResume],
      matches: [],
      applications: [],
      currentDate: baseDate
    });

    expect(result.secondaryActions.length).toBeLessThanOrEqual(2);
    result.secondaryActions.forEach(sec => {
      expect(sec.label).toBeDefined();
      expect(sec.ctaTab).toBeDefined();
    });
  });
});
