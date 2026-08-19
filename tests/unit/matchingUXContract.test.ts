import { describe, it, expect } from 'vitest';
import { CareerMatchEngineV3 } from '../../src/domain/services/CareerMatchEngineV3';
import { UnifiedMatchService } from '../../src/domain/services/UnifiedMatchService';
import type { Job, Resume, CareerGoal, Match } from '../../src/domain/models/types';

describe('Matching UX Contract & Invariants (Fase 5)', () => {
  const sampleJob: Job = {
    id: 'job-ux-01',
    title: 'Senior Frontend Developer',
    companyName: 'Tech Brasil',
    location: 'Remoto',
    workMode: 'remote',
    seniority: 'senior',
    requirements: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const sampleResume: Resume = {
    id: 'res-ux-01',
    userId: 'usr-ux-01',
    resumeVersionId: 'ver-ux-01',
    fileName: 'cv_dev.pdf',
    fullName: 'Desenvolvedor Senior',
    yearsOfExperience: 6,
    skills: [
      { name: 'React', category: 'hard_skill' },
      { name: 'TypeScript', category: 'hard_skill' },
      { name: 'JavaScript', category: 'hard_skill' }
    ],
    experiences: [
      {
        role: 'Senior Frontend Developer',
        companyName: 'Empresa A',
        description: 'Desenvolvimento React e TypeScript.'
      }
    ],
    createdAt: new Date().toISOString()
  };

  const sampleGoal: CareerGoal = {
    id: 'goal-ux-01',
    userId: 'usr-ux-01',
    intentType: 'same_area_grow',
    targetArea: 'Engenharia de Software',
    targetRoles: ['Senior Frontend Developer', 'Staff Engineer'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('Contrato 1: careerFitScore sempre presente e dentro do intervalo [0, 100]', () => {
    const result = CareerMatchEngineV3.calculate(sampleJob, sampleResume, null, sampleGoal);
    expect(result.careerFitScore).toBeDefined();
    expect(typeof result.careerFitScore).toBe('number');
    expect(result.careerFitScore).toBeGreaterThanOrEqual(0);
    expect(result.careerFitScore).toBeLessThanOrEqual(100);
  });

  it('Contrato 2: careerGoalScore é null quando sem objetivo (nunca 0, undefined, NaN ou default artificial)', () => {
    const result = CareerMatchEngineV3.calculate(sampleJob, sampleResume, null, null);
    expect(result.careerGoalScore).toBeNull();
    expect(result.careerGoalScore).not.toBe(0);
    expect(result.careerGoalScore).not.toBeUndefined();
    expect(result.careerGoalScore).not.toBeNaN();
  });

  it('Contrato 3: scoreOverall legado nunca sobrescreve ou oculta careerFitScore e careerGoalScore', async () => {
    const v3Res = CareerMatchEngineV3.calculate(sampleJob, sampleResume, null, sampleGoal);

    const legacyMatchDoc: Match = {
      id: 'match-legacy-1',
      userId: sampleResume.userId,
      jobId: sampleJob.id,
      resumeId: sampleResume.id,
      scoreOverall: 50, // legado divergente
      scoreTechnical: 60,
      scoreBehavioral: 70,
      scoreSeniority: 80,
      scoreLocation: 90,
      scoreSalary: 80,
      missingSkills: [],
      matchedSkills: [],
      careerFitScore: v3Res.careerFitScore,
      careerGoalScore: v3Res.careerGoalScore,
      dimensions: v3Res.dimensions,
      transition: v3Res.transition,
      skillsAssessment: v3Res.skillsAssessment,
      createdAt: new Date().toISOString()
    };

    const unified = await UnifiedMatchService.getMatch(
      sampleResume.userId,
      sampleJob,
      sampleResume,
      null,
      legacyMatchDoc,
      sampleGoal
    );

    // careerFitScore e careerGoalScore permanecem as fontes da verdade do V3
    expect(unified.careerFitScore).toBe(v3Res.careerFitScore);
    expect(unified.careerGoalScore).toBe(v3Res.careerGoalScore);
  });

  it('Contrato 4: skillsAssessment contém estritamente os 3 grupos (Você já possui, Transferíveis, Para desenvolver)', () => {
    const result = CareerMatchEngineV3.calculate(sampleJob, sampleResume, null, sampleGoal);
    expect(result.skillsAssessment).toBeDefined();
    expect(Array.isArray(result.skillsAssessment.matched)).toBe(true);
    expect(Array.isArray(result.skillsAssessment.transferable)).toBe(true);
    expect(Array.isArray(result.skillsAssessment.missing)).toBe(true);
  });

  it('Contrato 5: 5 Dimensões estão completas e delimitadas no intervalo [0, 100]', () => {
    const result = CareerMatchEngineV3.calculate(sampleJob, sampleResume, null, sampleGoal);
    const dims = result.dimensions;

    expect(dims.skills).toBeGreaterThanOrEqual(0);
    expect(dims.skills).toBeLessThanOrEqual(100);

    expect(dims.experience).toBeGreaterThanOrEqual(0);
    expect(dims.experience).toBeLessThanOrEqual(100);

    expect(dims.seniority).toBeGreaterThanOrEqual(0);
    expect(dims.seniority).toBeLessThanOrEqual(100);

    expect(dims.context).toBeGreaterThanOrEqual(0);
    expect(dims.context).toBeLessThanOrEqual(100);

    expect(dims.careerGoal).toBeGreaterThanOrEqual(0);
    expect(dims.careerGoal).toBeLessThanOrEqual(100);
  });
});
