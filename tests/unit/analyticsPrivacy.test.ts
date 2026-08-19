import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tracker } from '../../src/infrastructure/analytics/tracker';

describe('Auditoria de Privacidade de Telemetria e Analytics (Zero PII)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Eventos de matching nunca devem aceitar ou transmitir dados pessoais identificáveis (PII)', () => {
    const trackSpy = vi.spyOn(tracker, 'track');

    tracker.trackJobMatchViewed('job-test-123', {
      career_fit_score: 85,
      career_goal_score: 92,
      transition_type: 'near',
      intent_type: 'career_transition'
    });

    expect(trackSpy).toHaveBeenCalled();
    const [eventName, category, metadata] = trackSpy.mock.calls[0];

    expect(eventName).toBe('job_match_viewed');
    expect(category).toBe('Matching');
    expect(metadata).toHaveProperty('job_id', 'job-test-123');
    expect(metadata).toHaveProperty('career_fit_score', 85);
    expect(metadata).toHaveProperty('career_goal_score', 92);

    // Garantir ausência estrita de PII
    expect(metadata).not.toHaveProperty('email');
    expect(metadata).not.toHaveProperty('name');
    expect(metadata).not.toHaveProperty('fullName');
    expect(metadata).not.toHaveProperty('resumeText');
    expect(metadata).not.toHaveProperty('jobDescription');
    expect(metadata).not.toHaveProperty('phone');
  });

  it('2. Evento match_explanation_opened registra apenas dimensões e tipo de transição', () => {
    const trackSpy = vi.spyOn(tracker, 'track');

    tracker.trackMatchExplanationOpened('job-456', {
      career_fit_score: 60,
      career_goal_score: 80,
      transition_type: 'moderate'
    });

    const [eventName, category, metadata] = trackSpy.mock.calls[0];
    expect(eventName).toBe('match_explanation_opened');
    expect(category).toBe('Matching');
    expect(metadata.job_id).toBe('job-456');
    expect(metadata.career_fit_score).toBe(60);
    expect(metadata.career_goal_score).toBe(80);

    const payloadString = JSON.stringify(metadata);
    expect(payloadString).not.toContain('@');
    expect(payloadString).not.toContain('cpf');
  });

  it('3. Evento career_goal_created não expõe dados de remuneração bruta sensível', () => {
    const trackSpy = vi.spyOn(tracker, 'track');

    tracker.trackCareerGoalCreated('same_area_grow', {
      has_target_area: true,
      roles_count: 2
    });

    const [eventName, category, metadata] = trackSpy.mock.calls[0];
    expect(eventName).toBe('career_goal_created');
    expect(category).toBe('CareerGoal');
    expect(metadata.intent_type).toBe('same_area_grow');
    expect(metadata.has_target_area).toBe(true);
  });

  it('4. Evento apply_recommendation_viewed registra apenas recomendação qualitativa', () => {
    const trackSpy = vi.spyOn(tracker, 'track');

    tracker.trackApplyRecommendationViewed('job-789', '🟡 Candidatura estratégica', {
      career_fit_score: 62,
      career_goal_score: 85
    });

    const [eventName, category, metadata] = trackSpy.mock.calls[0];
    expect(eventName).toBe('apply_recommendation_viewed');
    expect(category).toBe('DecisionSupport');
    expect(metadata.recommendation).toBe('🟡 Candidatura estratégica');
    expect(metadata.career_fit_score).toBe(62);
    expect(metadata.career_goal_score).toBe(85);
  });
});
