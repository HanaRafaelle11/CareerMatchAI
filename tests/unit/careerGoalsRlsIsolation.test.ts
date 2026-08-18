import { describe, it, expect } from 'vitest';
import { careerGoalService } from '../../src/application/services/CareerGoalService';
import { localDB } from '../../src/infrastructure/storage/localDatabase';
import type { CareerGoal } from '../../src/domain/models/types';

describe('Sprint 1 Security: RLS & Strict Multi-Account Isolation for career_goals', () => {
  const userA = 'user-account-a-uuid-1111';
  const userB = 'user-account-b-uuid-2222';

  it('1. Conta A salva seu objetivo e Conta B salva objetivo diferente sem contaminação cruzada', async () => {
    // Conta A: Transição de Carreira (Cozinha -> Administrativo)
    const goalUserA: CareerGoal = {
      id: 'goal-user-a',
      userId: userA,
      intentType: 'career_transition',
      targetArea: 'Administrativo & Finanças',
      targetRoles: ['Assistente Administrativo'],
      targetSeniority: 'junior',
      targetWorkModes: ['remote', 'hybrid'],
      transferableSkills: ['Comunicação', 'Organização'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Conta B: Crescimento na mesma área (Tech Lead)
    const goalUserB: CareerGoal = {
      id: 'goal-user-b',
      userId: userB,
      intentType: 'same_area_grow',
      targetArea: 'Tecnologia & Engenharia',
      targetRoles: ['Staff Engineer', 'Engineering Manager'],
      targetSeniority: 'lead',
      targetWorkModes: ['remote'],
      transferableSkills: ['Liderança Técnica', 'Arquitetura de Software'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await careerGoalService.saveGoal(goalUserA);
    await careerGoalService.saveGoal(goalUserB);

    // Consulta Conta A
    const retrievedA = await careerGoalService.getGoal(userA);
    expect(retrievedA).not.toBeNull();
    expect(retrievedA?.userId).toBe(userA);
    expect(retrievedA?.intentType).toBe('career_transition');
    expect(retrievedA?.targetArea).toBe('Administrativo & Finanças');
    expect(retrievedA?.targetRoles).toContain('Assistente Administrativo');

    // Consulta Conta B
    const retrievedB = await careerGoalService.getGoal(userB);
    expect(retrievedB).not.toBeNull();
    expect(retrievedB?.userId).toBe(userB);
    expect(retrievedB?.intentType).toBe('same_area_grow');
    expect(retrievedB?.targetArea).toBe('Tecnologia & Engenharia');
    expect(retrievedB?.targetRoles).toContain('Staff Engineer');

    // Garantia absoluta: Conta A NUNCA enxerga dados da Conta B
    expect(retrievedA?.targetArea).not.toBe(retrievedB?.targetArea);
    expect(retrievedA?.targetRoles).not.toContain('Staff Engineer');
    expect(retrievedB?.targetRoles).not.toContain('Assistente Administrativo');
  });

  it('2. Exclusão de objetivo da Conta A não afeta o objetivo da Conta B', async () => {
    localDB.deleteCareerGoal('goal-user-a');

    const retrievedA = await careerGoalService.getGoal(userA);
    const retrievedB = await careerGoalService.getGoal(userB);

    expect(retrievedA).toBeNull();
    expect(retrievedB).not.toBeNull();
    expect(retrievedB?.userId).toBe(userB);
    expect(retrievedB?.intentType).toBe('same_area_grow');
  });
});
