/**
 * Taxonomy and Schema for Product Analytics and Telemetry in VoCentro
 * Single Source of Truth for analytical event names, categories, and payloads.
 */

export const ANALYTICS_EVENT_NAMES = {
  // Autenticação
  AUTH_SIGNUP_STARTED: 'auth_signup_started',
  AUTH_SIGNUP_COMPLETED: 'auth_signup_completed',
  AUTH_LOGIN: 'auth_login',
  AUTH_LOGOUT: 'auth_logout',

  // Onboarding & Perfil
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PROFILE_CREATED: 'profile_created',
  CAREER_GOAL_DEFINED: 'career_goal_defined',
  RESUME_UPLOADED: 'resume_uploaded',
  RESUME_PROCESSING_STARTED: 'resume_processing_started',
  RESUME_PROCESSING_COMPLETED: 'resume_processing_completed',
  RESUME_PROCESSING_FAILED: 'resume_processing_failed',

  // Descoberta & Vagas
  JOB_SEARCH: 'job_search',
  JOB_FILTER_APPLIED: 'job_filter_applied',
  JOB_VIEWED: 'job_viewed',
  JOB_MATCH_VIEWED: 'job_match_viewed',
  JOB_SAVED: 'job_saved',
  JOB_REJECTED: 'job_rejected',

  // Match
  MATCH_GENERATED: 'match_generated',
  MATCH_VIEWED: 'match_viewed',
  MATCH_EXPLANATION_VIEWED: 'match_explanation_viewed',

  // Candidaturas & Pipeline
  APPLICATION_CREATED: 'application_created',
  APPLICATION_STATUS_CHANGED: 'application_status_changed',
  APPLICATION_INTERVIEW_SCHEDULED: 'application_interview_scheduled',
  APPLICATION_OFFER_RECEIVED: 'application_offer_received',
  APPLICATION_COMPLETED: 'application_completed',

  // Monetização & Conversão
  PAYWALL_VIEWED: 'paywall_viewed',
  PRICING_VIEWED: 'pricing_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_FAILED: 'subscription_failed',

  // Inteligência Artificial
  AI_PROMPT_SUBMITTED: 'ai_prompt_submitted',
  AI_RESPONSE_STARTED: 'ai_response_started',
  AI_RESPONSE_COMPLETED: 'ai_response_completed',
  AI_RESPONSE_FAILED: 'ai_response_failed',
  COVER_LETTER_GENERATED: 'cover_letter_generated',
  RESUME_OPTIMIZATION_GENERATED: 'resume_optimization_generated',
  INTERVIEW_SIMULATION_STARTED: 'interview_simulation_started',

  // Erros & Diagnóstico
  RESUME_PROCESSING_ERROR: 'resume_processing_error',
  MATCH_ERROR: 'match_error',
  JOB_SEARCH_ERROR: 'job_search_error',
  PAYMENT_ERROR: 'payment_error',
  AI_ERROR: 'ai_error'
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENT_NAMES[keyof typeof ANALYTICS_EVENT_NAMES] | string;

export interface CanonicalAnalyticsEvent {
  event: AnalyticsEventName;
  userId?: string | null;
  sessionId?: string;
  timestamp: string;
  category: 'Auth' | 'Onboarding' | 'Discovery' | 'Matching' | 'Strategy' | 'Monetization' | 'AI' | 'Error' | 'UserResearch';
  properties?: Record<string, unknown>;
  device?: string;
  browser?: string;
  os?: string;
}

/**
 * Validador estrito de eventos de telemetria
 */
export class AnalyticsEventValidator {
  private static FORBIDDEN_PII_KEYS = new Set([
    'password',
    'senha',
    'token',
    'raw_resume',
    'full_resume_text',
    'credit_card',
    'card_number',
    'cvv',
    'cpf',
    'rg',
    'phone_number'
  ]);

  /**
   * Valida se um evento está em conformidade com o schema e não possui PII proibida
   */
  static validate(event: CanonicalAnalyticsEvent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.event || typeof event.event !== 'string') {
      errors.push('O campo "event" é obrigatório e deve ser uma string não vazia.');
    }

    if (!event.timestamp || isNaN(new Date(event.timestamp).getTime())) {
      errors.push('O campo "timestamp" deve ser uma string de data ISO válida.');
    }

    if (!event.category) {
      errors.push('O campo "category" é obrigatório.');
    }

    // Varredura de PII em properties
    if (event.properties && typeof event.properties === 'object') {
      const checkObject = (obj: Record<string, unknown>, path = '') => {
        for (const [key, val] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (this.FORBIDDEN_PII_KEYS.has(lowerKey)) {
            errors.push(`Propriedade proibida contendo PII detectada no payload: "${path ? `${path}.${key}` : key}".`);
          }
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            checkObject(val as Record<string, unknown>, path ? `${path}.${key}` : key);
          }
        }
      };

      checkObject(event.properties);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
