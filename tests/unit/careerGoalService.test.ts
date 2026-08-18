import { describe, it, expect } from 'vitest';
import { careerGoalService, COMMON_TRANSFERABLE_SKILLS } from '../../src/application/services/CareerGoalService';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { CareerGoal } from '../../src/domain/models/types';

describe('Sprint 1: Career Goal & Transition Architecture', () => {
  const mockUserId = 'test-user-transition-123';

  it('1. Deve salvar e recuperar Objetivo Profissional desacoplado do histórico com novo schema', async () => {
    const goalData: CareerGoal = {
      id: 'goal-test-1',
      userId: mockUserId,
      intentType: 'career_transition',
      targetArea: 'Administrativo & Operações',
      targetRoles: ['Assistente Administrativo', 'Analista de Operações'],
      targetIndustries: ['Fintech', 'SaaS', 'E-commerce'],
      targetSeniority: 'junior',
      targetLocation: 'São Paulo, SP',
      targetWorkModes: ['remote', 'hybrid'],
      desiredSalaryMin: 3500,
      desiredSalaryMax: 5000,
      salaryCurrency: 'BRL',
      desiredSalary: 'R$ 3.500 - 5.000',
      transferableSkills: ['Comunicação interpessoal', 'Organização e planejamento', 'Atendimento ao cliente'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await careerGoalService.saveGoal(goalData);
    expect(saved.intentType).toBe('career_transition');
    expect(saved.targetArea).toBe('Administrativo & Operações');
    expect(saved.desiredSalaryMin).toBe(3500);
    expect(saved.desiredSalaryMax).toBe(5000);
    expect(saved.salaryCurrency).toBe('BRL');
    expect(saved.targetIndustries).toContain('Fintech');

    const retrieved = await careerGoalService.getGoal(mockUserId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.targetRoles).toContain('Assistente Administrativo');
    expect(retrieved?.targetIndustries).toContain('SaaS');
    expect(retrieved?.desiredSalaryMin).toBe(3500);
    expect(retrieved?.intentType).toBe('career_transition');
  });

  it('2. Deve extrair competências transferíveis de um perfil em transição (ex: Cozinha -> Administrativo)', () => {
    const cookSkills = ['Gestão de tempo', 'Trabalho em equipe', 'Controle de estoque', 'Comunicação interpessoal', 'Organização de insumos'];
    const cookSummary = 'Profissional dedicada com 5 anos de atuação, focada em organização de equipe, atendimento ágil e resolução de problemas sob pressão.';

    const transferable = careerGoalService.extractTransferableSkills(cookSkills, cookSummary);
    
    expect(transferable).toContain('Comunicação interpessoal');
    expect(transferable).toContain('Organização e planejamento');
    expect(transferable).toContain('Trabalho em equipe');
    expect(transferable).toContain('Gestão de tempo');
    expect(transferable).toContain('Resolução de problemas');
  });

  it('3. Deve suportar todos os 4 tipos de decisão estratégica', async () => {
    const intents = ['same_area_continue', 'same_area_grow', 'career_transition', 'exploring'] as const;

    for (const intent of intents) {
      const g: CareerGoal = {
        id: `goal-${intent}`,
        userId: `user-${intent}`,
        intentType: intent,
        targetRoles: intent === 'same_area_grow' ? ['Tech Lead'] : [],
        targetWorkModes: ['remote'],
        transferableSkills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await careerGoalService.saveGoal(g);
      const res = await careerGoalService.getGoal(`user-${intent}`);
      expect(res?.intentType).toBe(intent);
    }
  });

  it('4. Validação de competências universais transferíveis', () => {
    expect(COMMON_TRANSFERABLE_SKILLS.length).toBeGreaterThanOrEqual(10);
    expect(COMMON_TRANSFERABLE_SKILLS).toContain('Comunicação interpessoal');
    expect(COMMON_TRANSFERABLE_SKILLS).toContain('Resolução de problemas');
    expect(COMMON_TRANSFERABLE_SKILLS).toContain('Organização e planejamento');
    expect(COMMON_TRANSFERABLE_SKILLS).toContain('Adaptabilidade e resiliência');
  });

  it('5. Deve validar faixa salarial e moeda (desired_salary_min/max e currency)', async () => {
    const salaryGoal: CareerGoal = {
      id: 'goal-salary-test',
      userId: 'user-salary-1',
      intentType: 'same_area_grow',
      desiredSalaryMin: 8000,
      desiredSalaryMax: 12000,
      salaryCurrency: 'BRL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await careerGoalService.saveGoal(salaryGoal);
    const retrieved = await careerGoalService.getGoal('user-salary-1');
    expect(retrieved?.desiredSalaryMin).toBe(8000);
    expect(retrieved?.desiredSalaryMax).toBe(12000);
    expect(retrieved?.salaryCurrency).toBe('BRL');
  });

  it('6. Deve suportar segmentação por indústrias e setores alvo (target_industries)', async () => {
    const industryGoal: CareerGoal = {
      id: 'goal-industry-test',
      userId: 'user-industry-1',
      intentType: 'career_transition',
      targetIndustries: ['Fintech', 'Healthtech', 'Inteligência Artificial'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await careerGoalService.saveGoal(industryGoal);
    const retrieved = await careerGoalService.getGoal('user-industry-1');
    expect(retrieved?.targetIndustries).toHaveLength(3);
    expect(retrieved?.targetIndustries).toContain('Fintech');
    expect(retrieved?.targetIndustries).toContain('Healthtech');
  });
});
