import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tracker } from '../../src/infrastructure/analytics/tracker';

describe('Auditoria de Contrato de Telemetria e Inteligência de Produto (Fase 7)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Deve suportar ciclo analítico completo do funil de conversão sem PII', () => {
    const trackSpy = vi.spyOn(tracker, 'track');

    // 1. Visualizar match
    tracker.trackJobMatchViewed('job-nubank-pm', {
      career_fit_score: 65,
      career_goal_score: 91,
      transition_type: 'near',
      intent_type: 'career_transition'
    });

    // 2. Abrir explicação
    tracker.trackMatchExplanationOpened('job-nubank-pm', {
      career_fit_score: 65,
      career_goal_score: 91,
      transition_type: 'near'
    });

    // 3. Salvar vaga
    tracker.trackJobSaved('job-nubank-pm', {
      career_fit_score: 65,
      career_goal_score: 91
    });

    // 4. Gerar carta
    tracker.trackCoverLetterGenerated('job-nubank-pm', {
      style: 'formal',
      fit_score: 65
    });

    // 5. Criar candidatura no Kanban
    tracker.trackApplicationCreated('job-nubank-pm', {
      stage: 'applied',
      fit_score: 65
    });

    expect(trackSpy).toHaveBeenCalledTimes(5);

    const eventNames = trackSpy.mock.calls.map(call => call[0]);
    expect(eventNames).toEqual([
      'job_match_viewed',
      'match_explanation_opened',
      'job_saved',
      'cover_letter_generated',
      'application_created'
    ]);

    // Garantir ausência estrita de dados sensíveis em todos os payloads
    trackSpy.mock.calls.forEach(([, , metadata]) => {
      const payloadStr = JSON.stringify(metadata);
      expect(payloadStr).not.toContain('@');
      expect(payloadStr).not.toContain('cpf');
      expect(payloadStr).not.toContain('password');
      expect(payloadStr).not.toContain('resumeText');
    });
  });

  it('2. Deve registrar intenções de carreira com métricas estratégicas desacopladas', () => {
    const trackSpy = vi.spyOn(tracker, 'track');

    tracker.trackCareerGoalCreated('career_transition', {
      has_target_area: true,
      roles_count: 2
    });

    const [eventName, category, metadata] = trackSpy.mock.calls[0];
    expect(eventName).toBe('career_goal_created');
    expect(category).toBe('CareerGoal');
    expect(metadata.intent_type).toBe('career_transition');
    expect(metadata.has_target_area).toBe(true);
    expect(metadata.roles_count).toBe(2);
  });
});
