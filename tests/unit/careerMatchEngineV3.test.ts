import { describe, it, expect } from 'vitest';
import { CareerMatchEngineV3 } from '../../src/domain/services/CareerMatchEngineV3';
import { TransferableSkillsService } from '../../src/domain/services/TransferableSkillsService';
import type { Job, Resume, CareerGoal } from '../../src/domain/models/types';
import type { CareerProfileNew } from '../../src/application/hooks/useMyProfileAi';

describe('CareerMatchEngineV3 — Motor de Matching Orientado a Objetivo (Fase 3)', () => {

  // ─────────────────────────────────────────────────────────────────────────────
  // CENÁRIO 1: MATCH DIRETO (MESMA ÁREA E SENIORIDADE)
  // ─────────────────────────────────────────────────────────────────────────────
  it('Cenário 1: Deve calcular Fit Alto e Goal Alto para perfil com compatibilidade direta', () => {
    const job: Job = {
      id: 'job-dev-senior',
      title: 'Senior Frontend Engineer (React/TypeScript)',
      companyName: 'Fintech Alpha',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'senior',
      description: 'Desenvolvimento de interfaces escaláveis em React, TypeScript e Tailwind.',
      requirements: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'TailwindCSS'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const resume: Resume = {
      id: 'res-dev-01',
      userId: 'usr-dev-01',
      fileName: 'curriculo_senior.pdf',
      fullName: 'Carlos Dev',
      yearsOfExperience: 6,
      skills: [
        { name: 'React', category: 'hard_skill' },
        { name: 'TypeScript', category: 'hard_skill' },
        { name: 'Node.js', category: 'hard_skill' },
        { name: 'PostgreSQL', category: 'hard_skill' },
        { name: 'TailwindCSS', category: 'hard_skill' }
      ],
      experiences: [
        {
          role: 'Senior Frontend Engineer',
          companyName: 'Tech Corp',
          description: 'Liderança técnica no desenvolvimento de aplicações React e TypeScript.'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const careerGoal: CareerGoal = {
      id: 'goal-dev-01',
      userId: 'usr-dev-01',
      intentType: 'same_area_grow',
      targetArea: 'Engenharia de Software Frontend',
      targetRoles: ['Senior Frontend Engineer', 'Staff Frontend Engineer'],
      targetSeniority: 'senior',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(job, resume, null, careerGoal);

    // Verificações
    expect(result.careerFitScore).toBeGreaterThanOrEqual(80);
    expect(result.careerGoalScore).toBeGreaterThanOrEqual(80);
    expect(result.dimensions.skills).toBe(100);
    expect(result.dimensions.experience).toBeGreaterThanOrEqual(85);
    expect(result.dimensions.seniority).toBe(100);
    expect(result.skillsAssessment.matched.length).toBe(5);
    expect(result.skillsAssessment.missing.length).toBe(0);
    expect(result.transition.isCareerTransition).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CENÁRIO 2: TRANSIÇÃO PRÓXIMA (CUSTOMER SUCCESS → PRODUCT MANAGEMENT)
  // ─────────────────────────────────────────────────────────────────────────────
  it('Cenário 2: Deve identificar competências transferíveis e alto potencial para transição de CS para Produto', () => {
    const job: Job = {
      id: 'job-pm-saas',
      title: 'Product Manager Jr/Pleno (SaaS)',
      companyName: 'ScaleUp Hub',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'pleno',
      description: 'Conduzir product discovery, priorização de backlog e análise de métricas de retenção.',
      requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const profile: CareerProfileNew = {
      id: 'prof-cs-01',
      userId: 'usr-cs-01',
      personal: {
        fullName: 'Mariana CS',
        headline: 'Customer Success Manager Pleno | SaaS B2B'
      },
      summary: 'Profissional com 4 anos em Customer Success, liderando onboarding, retenção e rituais ágeis com clientes enterprise.',
      skills: ['Customer Success', 'Onboarding', 'Jira', 'Churn', 'NPS', 'CSAT', 'Comunicação'],
      soft_skills: ['Negociação', 'Gestão de Stakeholders', 'Apresentações Executivas'],
      experience: [
        {
          role: 'Customer Success Manager',
          companyName: 'B2B SaaS Cloud',
          description: 'Gestão de carteira enterprise, análise de métricas de retenção, mapeamento de dores de usuários e interface diária com time de produto.',
          isCurrent: true
        }
      ]
    };

    const careerGoal: CareerGoal = {
      id: 'goal-cs-pm',
      userId: 'usr-cs-01',
      intentType: 'career_transition',
      targetArea: 'Gestão de Produto (Product Management)',
      targetRoles: ['Product Manager', 'Associate Product Manager', 'Product Owner'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(job, null, profile, careerGoal);

    // Invariante de Transição:
    // O Fit Atual pode ser moderado/baixo (~40-65%) porque os requisitos são de PM,
    // mas o Career Goal / Transition Potential DEVE ser alto (>= 75%) pelas competências transferíveis!
    expect(result.careerGoalScore).toBeGreaterThanOrEqual(75);
    expect(result.transition.isCareerTransition).toBe(true);
    expect(result.transition.type).toMatch(/near|moderate/);
    expect(result.skillsAssessment.transferable.length).toBeGreaterThan(0);
    expect(result.explanation.transferabilityReason).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CENÁRIO 3: TRANSIÇÃO DISTANTE (DEV BACKEND → COZINHEIRO CHEF)
  // ─────────────────────────────────────────────────────────────────────────────
  it('Cenário 3: Deve retornar Fit Baixo e Goal Baixo para áreas totalmente discrepantes sem sobreposição', () => {
    const job: Job = {
      id: 'job-cozinha-01',
      title: 'Cozinheiro Geral / Chefe de Praça',
      companyName: 'Restaurante Sabor',
      location: 'São Paulo, SP',
      workMode: 'onsite',
      seniority: 'pleno',
      description: 'Preparo de pratos quentes, corte de carnes e manipulação higiênica de alimentos.',
      requirements: ['Preparo de alimentos', 'Manipulação higiênica', 'Boas práticas ANVISA', 'Cozinha industrial'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const resume: Resume = {
      id: 'res-dev-node',
      userId: 'usr-dev-node',
      fileName: 'dev_backend.pdf',
      fullName: 'Lucas Backend',
      yearsOfExperience: 5,
      skills: [
        { name: 'Node.js', category: 'hard_skill' },
        { name: 'TypeScript', category: 'hard_skill' },
        { name: 'Docker', category: 'hard_skill' }
      ],
      experiences: [
        {
          role: 'Backend Developer',
          companyName: 'Cloud Enterprise',
          description: 'APIs REST e microsserviços em Node.js e Docker.'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const careerGoal: CareerGoal = {
      id: 'goal-dev-node',
      userId: 'usr-dev-node',
      intentType: 'same_area_grow',
      targetArea: 'Engenharia de Software Backend',
      targetRoles: ['Backend Lead'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(job, resume, null, careerGoal);

    // Verificações
    expect(result.careerFitScore).toBeLessThan(35);
    expect(result.careerGoalScore).toBeLessThan(50);
    expect(result.skillsAssessment.matched.length).toBe(0);
    expect(result.dimensions.skills).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CENÁRIO 4: USUÁRIO SEM OBJETIVO DEFINIDO (careerGoal = null)
  // ─────────────────────────────────────────────────────────────────────────────
  it('Cenário 4: Deve calcular Career Fit Score normalmente e retornar Career Goal Score estritamente null', () => {
    const job: Job = {
      id: 'job-analista-ops',
      title: 'Analista de Operações Pleno',
      companyName: 'Logística Express',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'pleno',
      description: 'Análise de indicadores e processos operacionais.',
      requirements: ['Excel', 'Processos', 'Indicadores', 'Comunicação'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const resume: Resume = {
      id: 'res-ops-01',
      userId: 'usr-ops-01',
      fileName: 'cv_operacoes.pdf',
      fullName: 'Ana Silva',
      yearsOfExperience: 3,
      skills: [
        { name: 'Excel', category: 'hard_skill' },
        { name: 'Processos', category: 'hard_skill' },
        { name: 'Indicadores', category: 'hard_skill' },
        { name: 'Comunicação', category: 'soft_skill' }
      ],
      experiences: [
        {
          role: 'Analista de Operações Jr',
          companyName: 'Log Corp',
          description: 'Mapeamento de processos e acompanhamento de indicadores.'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(job, resume, null, null);

    // Verificações
    expect(result.careerFitScore).toBeGreaterThanOrEqual(75);
    expect(result.careerGoalScore).toBeNull();
    expect(result.explanation.goalHeadline).toContain('Defina seu objetivo profissional');
    expect(result.transition.type).toBe('none');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CENÁRIO 5: DADOS INCOMPLETOS E RESILIÊNCIA A FALHAS
  // ─────────────────────────────────────────────────────────────────────────────
  it('Cenário 5: Não deve quebrar com vaga sem requisitos ou perfil sem experiências explícitas', () => {
    const jobIncomplete: Job = {
      id: 'job-inc-01',
      title: 'Oportunidade Profissional',
      companyName: 'Empresa Confidencial',
      location: 'Brasil',
      workMode: 'remote',
      seniority: 'pleno',
      description: '',
      requirements: [],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const resumeIncomplete: Resume = {
      id: 'res-inc-01',
      userId: 'usr-inc-01',
      fileName: 'cv_simples.pdf',
      fullName: 'Candidato Inicial',
      yearsOfExperience: 0,
      skills: [],
      experiences: [],
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(jobIncomplete, resumeIncomplete, null, null);

    expect(result.careerFitScore).toBeDefined();
    expect(typeof result.careerFitScore).toBe('number');
    expect(result.confidenceScore).toBeLessThanOrEqual(60);
    expect(result.dimensions).toBeDefined();
    expect(result.skillsAssessment.matched).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CENÁRIO 6: AS 5 DIMENSÕES DETERMINÍSTICAS DEVEM ESTAR ENTRE 0 E 100
  // ─────────────────────────────────────────────────────────────────────────────
  it('Cenário 6: Todas as 5 dimensões devem retornar números inteiros válidos entre 0 e 100', () => {
    const job: Job = {
      id: 'job-dim-01',
      title: 'Tech Lead Node.js',
      companyName: 'Cloud Inc',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'lead',
      description: 'Liderança técnica de microsserviços.',
      requirements: ['Node.js', 'PostgreSQL', 'Liderança', 'Arquitetura'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const resume: Resume = {
      id: 'res-dim-01',
      userId: 'usr-dim-01',
      fileName: 'cv_lead.pdf',
      fullName: 'Paula Tech',
      yearsOfExperience: 8,
      skills: [
        { name: 'Node.js', category: 'hard_skill' },
        { name: 'PostgreSQL', category: 'hard_skill' },
        { name: 'Liderança', category: 'soft_skill' }
      ],
      experiences: [
        {
          role: 'Senior Backend Engineer',
          companyName: 'Cloud Tech',
          description: 'Desenvolvimento e arquitetura de microsserviços.'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const careerGoal: CareerGoal = {
      id: 'goal-dim-01',
      userId: 'usr-dim-01',
      intentType: 'same_area_grow',
      targetArea: 'Liderança Técnica',
      targetRoles: ['Tech Lead', 'Engineering Manager'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(job, resume, null, careerGoal);

    expect(result.dimensions.experience).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.experience).toBeLessThanOrEqual(100);

    expect(result.dimensions.skills).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.skills).toBeLessThanOrEqual(100);

    expect(result.dimensions.seniority).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.seniority).toBeLessThanOrEqual(100);

    expect(result.dimensions.context).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.context).toBeLessThanOrEqual(100);

    expect(result.dimensions.careerGoal).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.careerGoal).toBeLessThanOrEqual(100);
  });
});
