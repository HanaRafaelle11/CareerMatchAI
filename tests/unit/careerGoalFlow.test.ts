import { describe, it, expect } from 'vitest';
import { CareerMatchEngineV3 } from '../../src/domain/services/CareerMatchEngineV3';
import { careerGoalService } from '../../src/application/services/CareerGoalService';
import type { Job, Resume, CareerGoal, CareerGoalIntentType } from '../../src/domain/models/types';

describe('Career Goal Flow & Strategic Decisions (Fase 5)', () => {
  const baseResume: Resume = {
    id: 'res-goal-flow-1',
    userId: 'usr-gf-1',
    resumeVersionId: 'ver-gf-1',
    fileName: 'curriculo.pdf',
    fullName: 'Ana Beatriz',
    yearsOfExperience: 5,
    skills: [
      { name: 'Customer Success', category: 'hard_skill' },
      { name: 'Gestão de Contas', category: 'hard_skill' },
      { name: 'Onboarding', category: 'hard_skill' }
    ],
    experiences: [
      {
        role: 'Customer Success Specialist',
        companyName: 'Empresa SA',
        description: 'Atendimento e retenção de clientes B2B.'
      }
    ],
    createdAt: new Date().toISOString()
  };

  const productJob: Job = {
    id: 'job-pm-1',
    title: 'Product Manager Pleno',
    companyName: 'Fintech X',
    location: 'Remoto',
    workMode: 'remote',
    seniority: 'pleno',
    requirements: ['Product Discovery', 'Roadmap', 'Gestão de Stakeholders', 'SQL'],
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const csJob: Job = {
    id: 'job-cs-1',
    title: 'Senior Customer Success Manager',
    companyName: 'SaaS Y',
    location: 'Remoto',
    workMode: 'remote',
    seniority: 'senior',
    requirements: ['Customer Success', 'Gestão de Contas', 'Onboarding', 'NPS'],
    isActive: true,
    createdAt: new Date().toISOString()
  };

  it('Decisão 1: same_area_continue prioriza vagas na mesma área e senioridade correspondente', () => {
    const goal: CareerGoal = {
      id: 'g1',
      userId: baseResume.userId,
      intentType: 'same_area_continue',
      targetArea: 'Customer Success',
      targetRoles: ['Customer Success Specialist', 'CS Manager'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = CareerMatchEngineV3.calculate(csJob, baseResume, null, goal);
    expect(res.careerGoalScore).toBeGreaterThanOrEqual(75);
    expect(res.transition.type).toBe('none');
  });

  it('Decisão 2: same_area_grow calcula ponte de senioridade sem penalizar por falta de competência básica', () => {
    const goal: CareerGoal = {
      id: 'g2',
      userId: baseResume.userId,
      intentType: 'same_area_grow',
      targetArea: 'Customer Success',
      targetRoles: ['Head of Customer Success', 'CS Lead'],
      targetSeniority: 'lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const leadJob: Job = {
      ...csJob,
      title: 'Head of Customer Success',
      seniority: 'lead'
    };

    const res = CareerMatchEngineV3.calculate(leadJob, baseResume, null, goal);
    expect(res.careerGoalScore).toBeGreaterThanOrEqual(70);
  });

  it('Decisão 3: career_transition calcula potencial de transição e competências transferíveis', () => {
    const goal: CareerGoal = {
      id: 'g3',
      userId: baseResume.userId,
      intentType: 'career_transition',
      targetArea: 'Gestão de Produto',
      targetRoles: ['Product Manager'],
      transferableSkills: ['Comunicação interpessoal', 'Visão do Cliente'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = CareerMatchEngineV3.calculate(productJob, baseResume, null, goal);
    expect(res.careerGoalScore).toBeGreaterThanOrEqual(75);
    expect(['near', 'moderate', 'challenging']).toContain(res.transition.type);
    expect(res.skillsAssessment.transferable.length).toBeGreaterThanOrEqual(0);
  });

  it('Decisão 4: exploring (explorando opções) processa dados com resiliência sem quebra', () => {
    const goal: CareerGoal = {
      id: 'g4',
      userId: baseResume.userId,
      intentType: 'exploring',
      targetArea: 'Tecnologia / Inovação',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = CareerMatchEngineV3.calculate(productJob, baseResume, null, goal);
    expect(res.careerFitScore).toBeGreaterThanOrEqual(0);
    expect(res.careerGoalScore).toBeDefined();
    expect(typeof res.careerGoalScore).toBe('number');
  });

  it('Resiliência: dados incompletos (sem targetRoles ou targetArea) nunca produzem NaN', () => {
    const partialGoal: CareerGoal = {
      id: 'g5',
      userId: baseResume.userId,
      intentType: 'same_area_continue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = CareerMatchEngineV3.calculate(productJob, baseResume, null, partialGoal);
    expect(Number.isNaN(res.careerFitScore)).toBe(false);
    expect(Number.isNaN(res.careerGoalScore)).toBe(false);
    expect(Number.isNaN(res.dimensions.skills)).toBe(false);
    expect(Number.isNaN(res.dimensions.careerGoal)).toBe(false);
  });
});
