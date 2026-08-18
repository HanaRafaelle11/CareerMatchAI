import { describe, it, expect, beforeEach } from 'vitest';
import { CareerMatchEngineV3 } from '../../src/domain/services/CareerMatchEngineV3';
import { UnifiedMatchService } from '../../src/domain/services/UnifiedMatchService';
import { localDB } from '../../src/infrastructure/storage/localDatabase';
import type { Job, Resume, CareerGoal, Match } from '../../src/domain/models/types';
import type { CareerProfileNew } from '../../src/application/hooks/useMyProfileAi';

describe('Audit Round-Trip Persistence & Golden Cases Traceability (Fase 4)', () => {

  const candidateResume: Resume = {
    id: 'res-rt-01',
    userId: 'usr-rt-01',
    resumeVersionId: 'ver-rt-01',
    fileName: 'cv_rafaela.pdf',
    fullName: 'Rafaela Santos',
    yearsOfExperience: 4,
    skills: [
      { name: 'Customer Success', category: 'hard_skill' },
      { name: 'Onboarding', category: 'hard_skill' },
      { name: 'Jira', category: 'hard_skill' },
      { name: 'Churn', category: 'hard_skill' },
      { name: 'NPS', category: 'hard_skill' }
    ],
    experiences: [
      {
        role: 'Customer Success Manager',
        companyName: 'Cloud Corp',
        description: 'Gestão de contas e acompanhamento de métricas de retenção.'
      }
    ],
    createdAt: new Date().toISOString()
  };

  const targetJob: Job = {
    id: 'job-rt-01',
    title: 'Product Manager (SaaS & Operações)',
    companyName: 'Stone Pagamentos',
    location: 'Remoto',
    workMode: 'remote',
    seniority: 'pleno',
    requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis'],
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const candidateGoal: CareerGoal = {
    id: 'goal-rt-01',
    userId: 'usr-rt-01',
    intentType: 'career_transition',
    targetArea: 'Gestão de Produto',
    targetRoles: ['Product Manager', 'Associate Product Manager'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    localDB.clearJobExplanations('usr-rt-01');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // REGRA 4: TESTE DE PERSISTÊNCIA ROUND-TRIP
  // ─────────────────────────────────────────────────────────────────────────
  it('Regra 4: Round-Trip de Persistência — Engine -> Save -> Clear Cache -> Load -> Deep Compare', async () => {
    // 1. Calcular V3 no motor
    const engineResult = CareerMatchEngineV3.calculate(targetJob, candidateResume, null, candidateGoal);

    // 2. Montar objeto Match persistível (Supabase / LocalDB)
    const matchRecord: Match = {
      id: 'match-rt-persisted-1',
      userId: candidateResume.userId,
      jobId: targetJob.id,
      resumeId: candidateResume.id,
      scoreOverall: engineResult.careerFitScore,
      scoreTechnical: engineResult.dimensions.skills,
      scoreBehavioral: engineResult.dimensions.experience,
      scoreSeniority: engineResult.dimensions.seniority,
      scoreLocation: engineResult.dimensions.context,
      scoreSalary: 85,
      missingSkills: engineResult.skillsAssessment.missing,
      matchedSkills: engineResult.skillsAssessment.matched,
      careerFitScore: engineResult.careerFitScore,
      careerGoalScore: engineResult.careerGoalScore,
      dimensions: engineResult.dimensions,
      transition: engineResult.transition,
      skillsAssessment: engineResult.skillsAssessment,
      createdAt: new Date().toISOString()
    };

    // 3. Limpar memória e cache
    localDB.clearJobExplanations(candidateResume.userId);

    // 4. Recuperar via UnifiedMatchService
    const retrieved = await UnifiedMatchService.getMatch(
      candidateResume.userId,
      targetJob,
      candidateResume,
      null,
      matchRecord,
      candidateGoal
    );

    // 5. Comparação Profunda de Todos os 7 Campos
    expect(retrieved.careerFitScore).toBe(engineResult.careerFitScore);
    expect(retrieved.careerGoalScore).toBe(engineResult.careerGoalScore);
    expect(retrieved.dimensions).toEqual(engineResult.dimensions);
    expect(retrieved.transition?.type).toBe(engineResult.transition.type);
    expect(retrieved.transition?.label).toBe(engineResult.transition.label);
    expect(retrieved.skillsAssessment?.matched).toEqual(engineResult.skillsAssessment.matched);
    expect(retrieved.skillsAssessment?.transferable).toEqual(engineResult.skillsAssessment.transferable);
    expect(retrieved.skillsAssessment?.missing).toEqual(engineResult.skillsAssessment.missing);
  });

  it('Regra 4 & 9: Quando careerGoal === null, careerGoalScore deve persistir e recuperar estritamente como null', async () => {
    // 1. Calcular V3 sem objetivo
    const engineResult = CareerMatchEngineV3.calculate(targetJob, candidateResume, null, null);

    expect(engineResult.careerGoalScore).toBeNull();

    // 2. Persistir
    const matchRecord: Match = {
      id: 'match-rt-no-goal',
      userId: candidateResume.userId,
      jobId: targetJob.id,
      resumeId: candidateResume.id,
      scoreOverall: engineResult.careerFitScore,
      scoreTechnical: engineResult.dimensions.skills,
      scoreBehavioral: engineResult.dimensions.experience,
      scoreSeniority: engineResult.dimensions.seniority,
      scoreLocation: engineResult.dimensions.context,
      scoreSalary: 85,
      missingSkills: engineResult.skillsAssessment.missing,
      matchedSkills: engineResult.skillsAssessment.matched,
      careerFitScore: engineResult.careerFitScore,
      careerGoalScore: null,
      dimensions: engineResult.dimensions,
      transition: engineResult.transition,
      skillsAssessment: engineResult.skillsAssessment,
      createdAt: new Date().toISOString()
    };

    // 3. Recuperar
    const retrieved = await UnifiedMatchService.getMatch(
      candidateResume.userId,
      targetJob,
      candidateResume,
      null,
      matchRecord,
      null
    );

    // 4. Garantir que null NUNCA é convertido para 0, undefined, NaN ou score falso
    expect(retrieved.careerGoalScore).toBeNull();
    expect(retrieved.careerGoalScore).not.toBe(0);
    expect(retrieved.careerGoalScore).not.toBeUndefined();
    expect(retrieved.careerGoalScore).not.toBeNaN();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // REGRA 6: RASTREABILIDADE DOS 5 GOLDEN CASES (INPUT -> V3 -> PERSISTENCE)
  // ─────────────────────────────────────────────────────────────────────────
  it('Regra 6: Rastreabilidade completa dos 5 Golden Cases', async () => {
    const goldenCases = [
      {
        name: 'Match Direto',
        job: { id: 'g1', title: 'Senior Frontend Engineer', requirements: ['React', 'TypeScript'], seniority: 'senior', location: 'Remoto', workMode: 'remote' } as Job,
        resume: { id: 'r1', userId: 'u1', fullName: 'Dev Senior', yearsOfExperience: 6, skills: [{ name: 'React' }, { name: 'TypeScript' }], experiences: [{ role: 'Senior Frontend Engineer', companyName: 'X' }] } as Resume,
        goal: { id: 'g1', userId: 'u1', intentType: 'same_area_grow', targetArea: 'Frontend', targetRoles: ['Senior Frontend Engineer'] } as CareerGoal,
        expectedFitMin: 80,
        expectedGoalMin: 80
      },
      {
        name: 'Promoção',
        job: { id: 'g2', title: 'Tech Lead Backend', requirements: ['Node.js', 'Liderança Técnica'], seniority: 'lead', location: 'Remoto', workMode: 'remote' } as Job,
        resume: { id: 'r2', userId: 'u2', fullName: 'Dev Pleno', yearsOfExperience: 4, skills: [{ name: 'Node.js' }], experiences: [{ role: 'Backend Developer Pleno', companyName: 'Y' }] } as Resume,
        goal: { id: 'g2', userId: 'u2', intentType: 'same_area_grow', targetArea: 'Liderança', targetRoles: ['Tech Lead'] } as CareerGoal,
        expectedFitMin: 50,
        expectedGoalMin: 70
      },
      {
        name: 'Transição Próxima',
        job: { id: 'g3', title: 'Product Manager', requirements: ['Product Discovery', 'Analytics'], seniority: 'pleno', location: 'Remoto', workMode: 'remote' } as Job,
        resume: { id: 'r3', userId: 'u3', fullName: 'CS Manager', yearsOfExperience: 4, skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }], experiences: [{ role: 'Customer Success Manager', companyName: 'Z' }] } as Resume,
        goal: { id: 'g3', userId: 'u3', intentType: 'career_transition', targetArea: 'Gestão de Produto', targetRoles: ['Product Manager'] } as CareerGoal,
        expectedFitMax: 40,
        expectedGoalMin: 75
      },
      {
        name: 'Transição Distante',
        job: { id: 'g4', title: 'Enfermeiro UTI', requirements: ['COREN Ativo', 'UTI'], seniority: 'pleno', location: 'São Paulo', workMode: 'onsite' } as Job,
        resume: { id: 'r4', userId: 'u4', fullName: 'Python Dev', yearsOfExperience: 3, skills: [{ name: 'Python' }], experiences: [{ role: 'Python Developer', companyName: 'W' }] } as Resume,
        goal: { id: 'g4', userId: 'u4', intentType: 'career_transition', targetArea: 'Enfermagem', targetRoles: ['Enfermeiro'] } as CareerGoal,
        expectedFitMax: 30,
        expectedGoalMax: 50
      },
      {
        name: 'Sem Objetivo',
        job: { id: 'g5', title: 'UX Designer', requirements: ['Figma'], seniority: 'pleno', location: 'Remoto', workMode: 'remote' } as Job,
        resume: { id: 'r5', userId: 'u5', fullName: 'UX Designer', yearsOfExperience: 3, skills: [{ name: 'Figma' }], experiences: [{ role: 'UX Designer', companyName: 'V' }] } as Resume,
        goal: null,
        expectedFitMin: 70,
        expectedGoalNull: true
      }
    ];

    for (const gc of goldenCases) {
      // 1. Engine
      const engineRes = CareerMatchEngineV3.calculate(gc.job, gc.resume, null, gc.goal);

      // 2. Persistência
      const matchDoc: Match = {
        id: `match-${gc.job.id}`,
        userId: gc.resume.userId,
        jobId: gc.job.id,
        resumeId: gc.resume.id,
        scoreOverall: engineRes.careerFitScore,
        scoreTechnical: engineRes.dimensions.skills,
        scoreBehavioral: engineRes.dimensions.experience,
        scoreSeniority: engineRes.dimensions.seniority,
        scoreLocation: engineRes.dimensions.context,
        scoreSalary: 80,
        missingSkills: engineRes.skillsAssessment.missing,
        matchedSkills: engineRes.skillsAssessment.matched,
        careerFitScore: engineRes.careerFitScore,
        careerGoalScore: engineRes.careerGoalScore,
        dimensions: engineRes.dimensions,
        transition: engineRes.transition,
        skillsAssessment: engineRes.skillsAssessment,
        createdAt: new Date().toISOString()
      };

      const retrieved = await UnifiedMatchService.getMatch(gc.resume.userId, gc.job, gc.resume, null, matchDoc, gc.goal);

      expect(retrieved.careerFitScore).toBe(engineRes.careerFitScore);
      expect(retrieved.careerGoalScore).toBe(engineRes.careerGoalScore);

      if (gc.expectedGoalNull) {
        expect(retrieved.careerGoalScore).toBeNull();
      }
      if (gc.expectedFitMin) {
        expect(retrieved.careerFitScore).toBeGreaterThanOrEqual(gc.expectedFitMin);
      }
      if (gc.expectedFitMax) {
        expect(retrieved.careerFitScore).toBeLessThanOrEqual(gc.expectedFitMax);
      }
      if (gc.expectedGoalMin) {
        expect(retrieved.careerGoalScore!).toBeGreaterThanOrEqual(gc.expectedGoalMin);
      }
      if (gc.expectedGoalMax) {
        expect(retrieved.careerGoalScore!).toBeLessThanOrEqual(gc.expectedGoalMax);
      }
    }
  });
});
