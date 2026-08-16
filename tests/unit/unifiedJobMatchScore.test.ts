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

  it('garante que buildJobMatchScore faz fallback correto e respeita limites [0, 100]', () => {
    const minScore = buildJobMatchScore(-15, null, null);
    expect(minScore.total).toBe(0);
    expect(minScore.skills).toBe(0);
    expect(minScore.experience).toBe(0);

    const maxScore = buildJobMatchScore(150, null, null);
    expect(maxScore.total).toBe(100);
    expect(maxScore.skills).toBe(100);
    expect(maxScore.experience).toBe(100);

    const partialExplanation: JobMatchExplanation = {
      careerFitScore: 78,
      overallMatchReason: 'Match calculado com base em requisitos técnicos.',
      breakdown: {
        skillsScore: 82,
        experienceScore: 75,
        seniorityScore: 80,
        careerGoalScore: 70,
        salaryScore: 90,
        locationScore: 85,
        semanticScore: 78
      },
      strengths: [],
      gaps: [],
      recommendation: 'Recomendado',
      missingKeywords: [],
      redundantInfo: []
    };

    const syncedScore = buildJobMatchScore(78, partialExplanation, null);
    expect(syncedScore.total).toBe(78);
    expect(syncedScore.skills).toBe(82);
    expect(syncedScore.experience).toBe(75);
    expect(syncedScore.seniority).toBe(80);
    expect(syncedScore.location).toBe(85);
    expect(syncedScore.keywords).toBe(78);
    expect(syncedScore.explanation).toBe('Match calculado com base em requisitos técnicos.');
  });
});
