import { describe, it, expect } from 'vitest';
import { UnifiedMatchService } from '../../src/domain/services/UnifiedMatchService';
import { CareerMatchEngineV3 } from '../../src/domain/services/CareerMatchEngineV3';
import type { Job, Resume, CareerGoal } from '../../src/domain/models/types';
import type { CareerProfileNew } from '../../src/application/hooks/useMyProfileAi';

describe('UnifiedMatchService — V3 Integration & Data Integrity Audit', () => {

  const sampleJob: Job = {
    id: 'job-unit-test-v3',
    title: 'Product Manager (SaaS & Operações)',
    companyName: 'Fintech Hub',
    location: 'Remoto',
    workMode: 'remote',
    seniority: 'pleno',
    requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis', 'SQL'],
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const sampleProfile: CareerProfileNew = {
    id: 'prof-v3-integ',
    userId: 'usr-integ-1',
    personal: {
      fullName: 'Rafaela Santos',
      headline: 'Customer Success Manager Pleno'
    },
    summary: 'Atuação em CS, rituais ágeis, análise de churn e relacionamento com clientes corporativos.',
    skills: ['Customer Success', 'Onboarding', 'Jira', 'Churn', 'NPS', 'Comunicação'],
    experience: [
      {
        role: 'Customer Success Manager',
        companyName: 'SaaS Alpha',
        description: 'Gestão de clientes corporativos e mapeamento de dores de produto.',
        isCurrent: true
      }
    ]
  };

  const sampleGoal: CareerGoal = {
    id: 'goal-v3-integ',
    userId: 'usr-integ-1',
    intentType: 'career_transition',
    targetArea: 'Gestão de Produto & Operações',
    targetRoles: ['Product Manager', 'Associate Product Manager'],
    targetSeniority: 'pleno',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('1. Deve preservar com exatidão todos os campos calculados pelo CareerMatchEngineV3', () => {
    // 1. Cálculo isolado do Engine V3
    const directV3 = CareerMatchEngineV3.calculate(sampleJob, null, sampleProfile, sampleGoal);

    // 2. Chamada via UnifiedMatchService
    const unifiedResult = UnifiedMatchService.calculateMatchV3(sampleJob, null, sampleProfile, sampleGoal);

    // 3. Asserções de Identidade Estrita
    expect(unifiedResult.careerFitScore).toBe(directV3.careerFitScore);
    expect(unifiedResult.careerGoalScore).toBe(directV3.careerGoalScore);
    expect(unifiedResult.scoreOverall).toBe(directV3.careerFitScore);
    
    // 4. Preservação de Dimensões (sem perda de dados)
    expect(unifiedResult.dimensions).toBeDefined();
    expect(unifiedResult.dimensions?.skills).toBe(directV3.dimensions.skills);
    expect(unifiedResult.dimensions?.experience).toBe(directV3.dimensions.experience);
    expect(unifiedResult.dimensions?.seniority).toBe(directV3.dimensions.seniority);
    expect(unifiedResult.dimensions?.context).toBe(directV3.dimensions.context);
    expect(unifiedResult.dimensions?.careerGoal).toBe(directV3.dimensions.careerGoal);

    // 5. Preservação de Transição
    expect(unifiedResult.transition).toBeDefined();
    expect(unifiedResult.transition?.type).toBe(directV3.transition.type);
    expect(unifiedResult.transition?.label).toBe(directV3.transition.label);
    expect(unifiedResult.transition?.isCareerTransition).toBe(true);

    // 6. Preservação de Skills Assessment
    expect(unifiedResult.skillsAssessment).toBeDefined();
    expect(unifiedResult.skillsAssessment?.transferable).toEqual(directV3.skillsAssessment.transferable);
    expect(unifiedResult.skillsAssessment?.missing).toEqual(directV3.skillsAssessment.missing);
    expect(unifiedResult.skillsAssessment?.matched).toEqual(directV3.skillsAssessment.matched);
  });

  it('2. getMatch deve enriquecer match existente com V3 sem corromper campos estruturais', async () => {
    const directV3 = CareerMatchEngineV3.calculate(sampleJob, null, sampleProfile, sampleGoal);

    const existingMatch = {
      id: 'match-saved-1',
      userId: 'usr-integ-1',
      jobId: sampleJob.id,
      resumeId: 'res-dummy-1',
      scoreOverall: directV3.careerFitScore,
      scoreTechnical: directV3.dimensions.skills,
      scoreBehavioral: directV3.dimensions.experience,
      scoreSeniority: directV3.dimensions.seniority,
      scoreLocation: directV3.dimensions.context,
      scoreSalary: 80,
      missingSkills: directV3.skillsAssessment.missing,
      matchedSkills: directV3.skillsAssessment.matched,
      careerFitScore: directV3.careerFitScore,
      careerGoalScore: directV3.careerGoalScore,
      dimensions: directV3.dimensions,
      transition: directV3.transition,
      skillsAssessment: directV3.skillsAssessment,
      createdAt: new Date().toISOString()
    };

    const result = await UnifiedMatchService.getMatch(
      'usr-integ-1',
      sampleJob,
      { id: 'res-dummy-1', userId: 'usr-integ-1', fileName: 'cv.pdf', skills: [], createdAt: new Date().toISOString() },
      sampleProfile,
      existingMatch as any,
      sampleGoal
    );

    expect(result.careerFitScore).toBe(directV3.careerFitScore);
    expect(result.careerGoalScore).toBe(directV3.careerGoalScore);
    expect(result.dimensions?.skills).toBe(directV3.dimensions.skills);
    expect(result.transition?.type).toBe(directV3.transition.type);
    expect(result.skillsAssessment?.transferable.length).toBeGreaterThan(0);
  });
});
