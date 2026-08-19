import { describe, it, expect } from 'vitest';
import { CareerMatchEngineV3 } from '../../src/domain/services/CareerMatchEngineV3';
import { UnifiedMatchService, buildJobMatchScore } from '../../src/domain/services/UnifiedMatchService';
import { MatchingEngine } from '../../src/application/services/matchingEngine';
import type { Job, Resume, CareerGoal } from '../../src/domain/models/types';
import type { CareerProfileNew } from '../../src/application/hooks/useMyProfileAi';

describe('Match Golden Cases — 10 Casos Determinísticos (Etapa 5)', () => {
  // Mock base resume
  const baseResume: Resume = {
    id: 'res-golden-1',
    userId: 'user-golden-1',
    fullName: 'Lucas Ferreira',
    title: 'Senior Frontend Engineer',
    summary: 'Desenvolvedor React e TypeScript com 6 anos de experiência em arquitetura web.',
    skills: [
      { name: 'React', category: 'hard_skill' },
      { name: 'TypeScript', category: 'hard_skill' },
      { name: 'Node.js', category: 'hard_skill' },
      { name: 'GraphQL', category: 'hard_skill' },
      { name: 'Tailwind CSS', category: 'hard_skill' }
    ],
    experiences: [
      {
        role: 'Senior Frontend Engineer',
        companyName: 'Fintech X',
        description: 'Desenvolvimento e arquitetura de SPAs em React e TypeScript.',
        years: 6
      }
    ],
    education: [{ institution: 'USP', degree: 'Ciência da Computação', year: '2018' }],
    yearsOfExperience: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sameAreaGoal: CareerGoal = {
    id: 'goal-gc-1',
    userId: 'user-golden-1',
    intentType: 'same_area_grow',
    targetArea: 'Engenharia de Software Frontend',
    targetRoles: ['Senior Frontend Engineer', 'Staff Engineer'],
    targetSeniority: 'senior',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // CASO 1: Match Muito Alto (Senior Frontend para Senior React Developer)
  it('Caso 1 — Match muito alto: currículo altamente alinhado com a vaga', () => {
    const directJob: Job = {
      id: 'job-gc-direct',
      title: 'Senior Frontend Engineer (React/TypeScript)',
      companyName: 'Banco Digital Alpha',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'senior',
      requirements: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(directJob, baseResume, null, sameAreaGoal);
    expect(result.careerFitScore).toBeGreaterThanOrEqual(80);
    expect(result.careerGoalScore).toBeGreaterThanOrEqual(80);
    expect(result.skillsAssessment.matched.length).toBe(4);
  });

  // CASO 2: Match Médio (Promoção de Pleno para Tech Lead / Full Stack com stack mista)
  it('Caso 2 — Match médio: compatibilidade parcial entre stack e escopo', () => {
    const midJob: Job = {
      id: 'job-mid-2',
      title: 'Desenvolvedor Full Stack Sênior (Python/React)',
      companyName: 'Empresa Beta',
      location: 'São Paulo, SP',
      workMode: 'hybrid',
      seniority: 'senior',
      description: 'Fullstack com foco em Python, Django, React, AWS, Docker e Kubernetes.',
      requirements: ['Python', 'Django', 'React', 'AWS', 'Docker'],
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(midJob, baseResume, null, null);
    expect(result.careerFitScore).toBeGreaterThanOrEqual(25);
    expect(result.careerFitScore).toBeLessThan(80);
  });

  // CASO 3: Match Baixo (Frontend aplicando para Médico ou Advogado)
  it('Caso 3 — Match baixo: pouca ou nenhuma compatibilidade ocupacional', () => {
    const medJob: Job = {
      id: 'job-low-3',
      title: 'Médico Cardiologista',
      companyName: 'Hospital Central',
      location: 'São Paulo, SP',
      workMode: 'on-site',
      seniority: 'specialist',
      description: 'Atendimento clínico e cirurgias cardiológicas.',
      requirements: ['Medicina', 'CRM Ativo', 'Cardiologia', 'Cirurgia Cardíaca'],
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(medJob, baseResume, null, null);
    expect(result.careerFitScore).toBeLessThanOrEqual(30);
  });

  // CASO 4: Campos Ausentes (Currículo Incompleto)
  it('Caso 4 — Campos ausentes: currículo sem requisitos da vaga', () => {
    const emptyResume: Resume = {
      id: 'res-empty',
      userId: 'user-empty',
      title: 'Profissional',
      summary: '',
      skills: [],
      experiences: [],
      yearsOfExperience: 0,
      createdAt: new Date().toISOString()
    };

    const job: Job = {
      id: 'job-any',
      title: 'Engenheiro de Dados Sênior',
      companyName: 'Empresa Delta',
      requirements: ['Spark', 'Scala', 'Hadoop', 'BigQuery'],
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(job, emptyResume, null, null);
    expect(result.careerFitScore).toBeLessThanOrEqual(30);
  });

  // CASO 5: Senioridade Incompatível (Junior aplicando para Tech Lead)
  it('Caso 5 — Senioridade incompatível: penalização de senioridade', () => {
    const juniorResume: Resume = {
      ...baseResume,
      title: 'Desenvolvedor Frontend Júnior',
      yearsOfExperience: 1,
      experiences: [{ role: 'Desenvolvedor Frontend Júnior', companyName: 'Startup', description: 'React básico', years: 1 }]
    };

    const leadJob: Job = {
      id: 'job-lead',
      title: 'Tech Lead Frontend',
      companyName: 'Enterprise Inc',
      seniority: 'lead',
      requirements: ['React', 'TypeScript', 'Liderança Técnica', 'Arquitetura de Software'],
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(leadJob, juniorResume, null, null);
    expect(result.dimensions.seniority).toBeLessThanOrEqual(50);
  });

  // CASO 6: Competências Incompatíveis (Java Backend para vaga de Designer UI/UX)
  it('Caso 6 — Competências incompatíveis: detecção de gaps técnicos fundamentais', () => {
    const javaResume: Resume = {
      ...baseResume,
      title: 'Desenvolvedor Backend Java',
      skills: [
        { name: 'Java', category: 'hard_skill' },
        { name: 'Spring Boot', category: 'hard_skill' },
        { name: 'Hibernate', category: 'hard_skill' }
      ]
    };

    const uiJob: Job = {
      id: 'job-ui',
      title: 'UI/UX Designer Pleno',
      companyName: 'Design Studio',
      requirements: ['Figma', 'Design System', 'Wireframing', 'User Research'],
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(uiJob, javaResume, null, null);
    expect(result.skillsAssessment.missing.length).toBeGreaterThanOrEqual(3);
    expect(result.dimensions.skills).toBeLessThanOrEqual(30);
  });

  // CASO 7: Experiência Parcialmente Compatível com Objetivo de Transição
  it('Caso 7 — Transição de carreira: CareerGoalScore calculado com separação clara de FitScore', () => {
    const goal: CareerGoal = {
      id: 'goal-1',
      userId: 'user-golden-1',
      targetRoles: ['Product Manager'],
      targetArea: 'Gestão de Produto',
      intentType: 'career_transition',
      targetSeniority: 'mid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pmJob: Job = {
      id: 'job-pm',
      title: 'Product Manager Pleno',
      companyName: 'Fintech X',
      requirements: ['Product Discovery', 'Roadmap', 'Scrum', 'Data Analysis'],
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(pmJob, baseResume, null, goal);
    expect(result.careerGoalScore).not.toBeNull();
    expect(result.transition.isCareerTransition).toBe(true);
  });

  // CASO 8: Dados Extremos (Caracteres especiais, campos longos, sem quebra)
  it('Caso 8 — Dados extremos: resiliência a strings longas e caracteres especiais', () => {
    const extremeJob: Job = {
      id: 'job-extreme',
      title: 'Desenvolvedor Frontend & UI/UX @#$!* 123'.repeat(5),
      companyName: 'Empresa com Nome Muito Longo '.repeat(10),
      requirements: ['React!@#$', 'TypeScript (Avançado/Especialista)'.repeat(3)],
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(extremeJob, baseResume, null, null);
    expect(result.careerFitScore).toBeGreaterThanOrEqual(0);
    expect(result.careerFitScore).toBeLessThanOrEqual(100);
    expect(isNaN(result.careerFitScore)).toBe(false);
  });

  // CASO 9: Score Exibido = Score Calculado (Zero Divergência)
  it('Caso 9 — Score exibido = score calculado: Single Source of Truth em buildJobMatchScore', () => {
    const directJob: Job = {
      id: 'job-align',
      title: 'Senior Frontend Engineer (React/TypeScript)',
      companyName: 'Banco Digital Alpha',
      requirements: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
      createdAt: new Date().toISOString()
    };

    const v3 = CareerMatchEngineV3.calculate(directJob, baseResume, null, null);
    const unified = UnifiedMatchService.calculateMatchV3(directJob, baseResume, null, null);
    const scoreObj = buildJobMatchScore(unified.scoreOverall, null, {
      id: 'match-1',
      userId: 'user-golden-1',
      jobId: directJob.id,
      scoreOverall: unified.scoreOverall,
      careerFitScore: unified.careerFitScore,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);

    expect(unified.careerFitScore).toBe(v3.careerFitScore);
    expect(unified.scoreOverall).toBe(v3.careerFitScore);
    expect(scoreObj.total).toBe(v3.careerFitScore);
  });

  // CASO 10: Score Persistido = Score Calculado (Consistência em calculateMatchSync)
  it('Caso 10 — Score persistido = score calculado: calculateMatchSync retorna careerFitScore do V3', () => {
    const directJob: Job = {
      id: 'job-sync',
      title: 'Senior Frontend Engineer (React/TypeScript)',
      companyName: 'Tech Co',
      requirements: ['React', 'TypeScript', 'Node.js'],
      createdAt: new Date().toISOString()
    };

    const v3 = CareerMatchEngineV3.calculate(directJob, baseResume, null, null);
    const sync = MatchingEngine.calculateMatchSync(baseResume, directJob, null, null);

    expect(sync.careerFitScore).toBe(v3.careerFitScore);
    expect(sync.scoreOverall).toBe(v3.careerFitScore);
  });
});
