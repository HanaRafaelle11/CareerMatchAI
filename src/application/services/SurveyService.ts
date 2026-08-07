// src/application/services/SurveyService.ts
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

const DEFAULT_SURVEY_VERSION = 'v1_founders_validation';

export class SurveyService {
  /**
   * Centralized Single Source of Truth to determine if a user has already completed a given survey version.
   * Checks local storage cache first, then queries Supabase `survey_responses` table.
   */
  static async hasCompletedSurvey(userId: string, surveyVersion: string = DEFAULT_SURVEY_VERSION): Promise<boolean> {
    if (!userId) return false;

    const cacheKeyVersion = `survey_completed_${userId}_${surveyVersion}`;
    const cacheKeyGeneral = `survey_completed_${userId}`;
    const cacheKeyLegacy = `vocentro_survey_completed_${userId}`;

    // 1. Check local storage cache
    if (
      localStorage.getItem(cacheKeyVersion) === 'true' ||
      localStorage.getItem(cacheKeyGeneral) === 'true' ||
      localStorage.getItem(cacheKeyLegacy) === 'true'
    ) {
      return true;
    }

    // 2. Query Supabase survey_responses table
    if (!isSupabaseConfigured || !supabase) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', userId)
        .eq('survey_version', surveyVersion)
        .maybeSingle();

      if (error) {
        console.warn('[SurveyService] Warning checking survey completion:', error);
        return false;
      }

      if (data) {
        // Sync cache to all local storage keys
        this.markSurveyCompleted(userId, surveyVersion);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[SurveyService] Error checking survey completion:', err);
      return false;
    }
  }

  /**
   * Caches completion status in localStorage across all key variations.
   */
  static markSurveyCompleted(userId: string, surveyVersion: string = DEFAULT_SURVEY_VERSION): void {
    if (!userId) return;
    localStorage.setItem(`survey_completed_${userId}_${surveyVersion}`, 'true');
    localStorage.setItem(`survey_completed_${userId}`, 'true');
    localStorage.setItem(`vocentro_survey_completed_${userId}`, 'true');
    sessionStorage.setItem(`survey_completed_${userId}`, 'true');
  }
}
