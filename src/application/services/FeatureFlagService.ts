import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';

export class FeatureFlagService {
  /**
   * Verifica se uma feature flag está ativa
   */
  static async isEnabled(key: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('enabled')
          .eq('key', key)
          .maybeSingle();

        if (!error && data) {
          return data.enabled;
        }
      } catch (_) {}
    }

    return localDB.getFeatureFlag(key);
  }
}
