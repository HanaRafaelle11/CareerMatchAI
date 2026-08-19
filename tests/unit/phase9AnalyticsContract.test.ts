import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tracker } from '../../src/infrastructure/analytics/tracker';

describe('Phase 9 — Auditoria de Contrato de Telemetria de Valor e Feedback (Zero PII)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Deve registrar clique em resultado, início de candidatura e feedback explícito sem PII', () => {
    const trackSpy = vi.spyOn(tracker, 'track');

    // 1. Clique no resultado do Top 10
    tracker.trackJobResultClicked('job-nubank-pm-123', 1);

    // 2. Início de candidatura externa
    tracker.trackJobApplicationStarted('job-nubank-pm-123');

    // 3. Envio de feedback explícito do usuário (👍 / 👎)
    tracker.trackJobMatchFeedbackSubmitted('job-nubank-pm-123', false, 'Não tenho experiência suficiente');

    expect(trackSpy).toHaveBeenCalledTimes(3);

    const eventNames = trackSpy.mock.calls.map(c => c[0]);
    expect(eventNames).toEqual([
      'job_result_clicked',
      'job_application_started',
      'job_match_feedback_submitted'
    ]);

    // Verificação estrita de ausência de PII em todos os metadados
    trackSpy.mock.calls.forEach(([, category, metadata]) => {
      expect(category).toBe('UserValue');
      const json = JSON.stringify(metadata);
      expect(json).not.toContain('@');
      expect(json).not.toContain('cpf');
      expect(json).not.toContain('password');
      expect(json).not.toContain('resumeText');
      expect(json).not.toContain('fullJobDescription');
    });
  });
});
