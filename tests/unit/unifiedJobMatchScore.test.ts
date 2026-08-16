import { describe, it, expect } from 'vitest';
import { buildJobMatchScore } from '../../src/domain/services/UnifiedMatchService';
import { JobMatchExplanationService } from '../../src/application/services/JobMatchExplanationService';
import type { Match, JobMatchExplanation } from '../../src/domain/models/types';

describe('Unificação Canônica de Cálculo de Match (JobMatchScore)', () => {
  it('garante que jobMatchScore.total seja a fonte única da verdade e consistente com a explicação', () => {
    const mockExplanation: JobMatchExplanation = {
      careerFitScore: 85,
      overallMatchReason: 'Forte aderência técnica e comportamental com a vaga.',
      breakdown: {
        skillsScore: 90,
        experienceScore: 80,
        seniorityScore: 85,
        careerGoalScore: 85,
        salaryScore: 75,
        locationScore: 90,
        semanticScore: 85
      },
      strengths: [{ skill: 'TypeScript', reason: 'Ampla experiência' }],
      gaps: [{ requirement: 'GraphQL', suggestion: 'Realizar curso introdutório', impact: 'Baixo' }],
      recommendation: 'Candidatura altamente recomendada.',
      missingKeywords: ['GraphQL'],
      redundantInfo: []
    };

    const mockMatch: Match = {
      id: 'm1',
      jobId: 'j1',
      resumeId: 'r1',
      scoreOverall: 85,
      scoreTechnical: 90,
      scoreBehavioral: 80,
      scoreSeniority: 85,
      scoreLocation: 90,
      processingTimeMs: 1200,
      calculatedAt: new Date().toISOString()
    };

    const score = buildJobMatchScore(85, mockExplanation, mockMatch);

    expect(score.total).toBe(85);
    expect(score.skills).toBe(90);
    expect(score.experience).toBe(80);
    expect(score.seniority).toBe(85);
    expect(score.location).toBe(90);
    expect(score.explanation).toBe('Forte aderência técnica e comportamental com a vaga.');
    expect(score.breakdown?.salaryScore).toBe(75);
    expect(score.breakdown?.semanticScore).toBe(85);
  });

  it('JobMatchExplanationService sincroniza careerFitScore e overallMatchReason com o targetOverallScore', async () => {
    const mockResume: any = { id: 'r1', skills: ['React', 'Node.js'], yearsOfExperience: 5 };
    const mockJob: any = { id: 'j1', title: 'Senior Frontend Engineer', requirements: ['React', 'TypeScript'] };

    const explanation = await JobMatchExplanationService.getOrGenerateExplanation(
      'test-user-id',
      mockJob,
      mockResume,
      null,
      undefined,
      78 // target overall score
    );

    expect(explanation.careerFitScore).toBe(78);
    expect(explanation.breakdown).toBeDefined();
    expect(explanation.breakdown.skillsScore).toBeGreaterThanOrEqual(0);
    expect(explanation.breakdown.experienceScore).toBeGreaterThanOrEqual(0);
  });
});
