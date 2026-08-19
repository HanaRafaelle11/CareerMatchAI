import { describe, it, expect } from 'vitest';
import { CareerMatchEngineV3 } from '../../src/domain/services/CareerMatchEngineV3';
import { CareerCoachService } from '../../src/application/services/CareerCoachService';
import type { Job, Resume, CareerGoal } from '../../src/domain/models/types';

describe('Match Explanation & Decision Support (Fase 5)', () => {

  // Caso A — Match Direto
  it('Caso A (Match Direto): Fit alto e Goal alto geram explicação positiva e recomendação forte no Coach', () => {
    const job: Job = {
      id: 'job-a',
      title: 'Senior Frontend Engineer',
      companyName: 'Alpha Tech',
      seniority: 'senior',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['React', 'TypeScript', 'Next.js'],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    const resume: Resume = {
      id: 'res-a',
      userId: 'usr-a',
      fullName: 'Dev Senior',
      yearsOfExperience: 6,
      skills: [{ name: 'React' }, { name: 'TypeScript' }, { name: 'Next.js' }],
      experiences: [{ role: 'Senior Frontend Engineer', companyName: 'Beta' }],
      createdAt: new Date().toISOString()
    };
    const goal: CareerGoal = {
      id: 'goal-a',
      userId: 'usr-a',
      intentType: 'same_area_grow',
      targetArea: 'Frontend',
      targetRoles: ['Senior Frontend Engineer'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const v3 = CareerMatchEngineV3.calculate(job, resume, null, goal);
    const coach = CareerCoachService.evaluateCandidacy(resume, job, null, null, v3, goal);

    expect(v3.careerFitScore).toBeGreaterThanOrEqual(80);
    expect(v3.careerGoalScore).toBeGreaterThanOrEqual(80);
    expect(v3.explanation.fitHeadline).toContain('Excelente compatibilidade');
    expect(coach.shouldApply).toBe('🟢 Sim');
    expect(coach.recommendation).toContain('Forte recomendação');
  });

  // Caso B — Transição
  it('Caso B (Transição): Fit baixo e Goal alto geram explicação de ponte de transição e candidatura estratégica', () => {
    const job: Job = {
      id: 'job-b',
      title: 'Product Manager Pleno',
      companyName: 'Fintech X',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Product Discovery', 'Roadmap', 'SQL'],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    const resume: Resume = {
      id: 'res-b',
      userId: 'usr-b',
      fullName: 'CS Manager',
      yearsOfExperience: 4,
      skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Comunicação' }],
      experiences: [{ role: 'Customer Success Manager', companyName: 'Gamma' }],
      createdAt: new Date().toISOString()
    };
    const goal: CareerGoal = {
      id: 'goal-b',
      userId: 'usr-b',
      intentType: 'career_transition',
      targetArea: 'Gestão de Produto',
      targetRoles: ['Product Manager'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const v3 = CareerMatchEngineV3.calculate(job, resume, null, goal);
    const coach = CareerCoachService.evaluateCandidacy(resume, job, null, null, v3, goal);

    expect(v3.careerFitScore).toBeLessThan(65);
    expect(v3.careerGoalScore).toBeGreaterThanOrEqual(75);
    expect(v3.explanation.fitHeadline).toContain('escopo diferente');
    expect(coach.shouldApply).toBe('🟡 Ajustar antes');
    expect(coach.recommendation).toContain('Candidatura estratégica');
  });

  // Caso C — Vaga Incompatível
  it('Caso C (Vaga Incompatível): Fit baixo e Goal baixo geram aviso claro e baixa prioridade', () => {
    const job: Job = {
      id: 'job-c',
      title: 'Enfermeiro de UTI',
      companyName: 'Hospital Central',
      seniority: 'pleno',
      location: 'São Paulo, SP',
      workMode: 'onsite',
      requirements: ['COREN Ativo', 'UTI Adulto', 'Enfermagem'],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    const resume: Resume = {
      id: 'res-c',
      userId: 'usr-c',
      fullName: 'Backend Dev',
      yearsOfExperience: 3,
      skills: [{ name: 'Python' }, { name: 'Django' }],
      experiences: [{ role: 'Python Developer', companyName: 'Delta' }],
      createdAt: new Date().toISOString()
    };
    const goal: CareerGoal = {
      id: 'goal-c',
      userId: 'usr-c',
      intentType: 'same_area_grow',
      targetArea: 'Engenharia Backend',
      targetRoles: ['Senior Python Developer'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const v3 = CareerMatchEngineV3.calculate(job, resume, null, goal);
    const coach = CareerCoachService.evaluateCandidacy(resume, job, null, null, v3, goal);

    expect(v3.careerFitScore).toBeLessThan(30);
    expect(v3.careerGoalScore).toBeLessThan(40);
    expect(coach.shouldApply).toBe('🔴 Match baixo com a vaga');
    expect(coach.recommendation).toContain('priorizar outras oportunidades');
  });

  // Caso D — Usuário Sem Objetivo
  it('Caso D (Sem Objetivo): careerGoalScore é null e recomendação do Coach baseia-se no Fit Atual', () => {
    const job: Job = {
      id: 'job-d',
      title: 'UX/UI Designer',
      companyName: 'Design Studio',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Figma', 'Design System', 'Prototipação'],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    const resume: Resume = {
      id: 'res-d',
      userId: 'usr-d',
      fullName: 'Designer',
      yearsOfExperience: 3,
      skills: [{ name: 'Figma' }, { name: 'Design System' }, { name: 'UI Design' }],
      experiences: [{ role: 'UX/UI Designer Pleno', companyName: 'Epsilon' }],
      createdAt: new Date().toISOString()
    };

    const v3 = CareerMatchEngineV3.calculate(job, resume, null, null);
    const coach = CareerCoachService.evaluateCandidacy(resume, job, null, null, v3, null);

    expect(v3.careerGoalScore).toBeNull();
    expect(v3.careerFitScore).toBeGreaterThanOrEqual(70);
    expect(coach.shouldApply).toBe('🟢 Sim');
  });

  // Caso E — Promoção
  it('Caso E (Promoção): Fit moderado por senioridade superior, mas Goal alto para crescimento', () => {
    const job: Job = {
      id: 'job-e',
      title: 'Tech Lead Backend',
      companyName: 'Enterprise Cloud',
      seniority: 'lead',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Node.js', 'Arquitetura de Sistemas', 'Liderança Técnica'],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    const resume: Resume = {
      id: 'res-e',
      userId: 'usr-e',
      fullName: 'Dev Backend Pleno',
      yearsOfExperience: 4,
      skills: [{ name: 'Node.js' }, { name: 'TypeScript' }, { name: 'PostgreSQL' }],
      experiences: [{ role: 'Backend Developer Pleno', companyName: 'Zeta' }],
      createdAt: new Date().toISOString()
    };
    const goal: CareerGoal = {
      id: 'goal-e',
      userId: 'usr-e',
      intentType: 'same_area_grow',
      targetArea: 'Liderança Técnica',
      targetRoles: ['Tech Lead'],
      targetSeniority: 'lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const v3 = CareerMatchEngineV3.calculate(job, resume, null, goal);

    expect(v3.careerFitScore).toBeGreaterThanOrEqual(45);
    expect(v3.careerGoalScore).toBeGreaterThanOrEqual(70);
    // Dimensão de senioridade aponta progressão
    expect(v3.dimensions.seniority).toBeDefined();
  });
});
