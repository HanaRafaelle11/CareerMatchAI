// src/application/hooks/useUserPreferences.ts
import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface UserPreferences {
  theme?: 'dark' | 'light' | 'system';
  strategy_column_overrides?: Record<string, 'hot' | 'warm' | 'cold'>;
  kanban_column_order?: string[];
  collapsed_widgets?: string[];
  last_visited_tab?: string;
  [key: string]: any;
}

export function useUserPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences
  useEffect(() => {
    if (!userId) {
      setPreferences({});
      setIsLoading(false);
      return;
    }

    const loadPrefs = async () => {
      setIsLoading(true);
      
      // Fallback local key
      const localKey = `vocentro_user_prefs_${userId}`;
      const localRaw = localStorage.getItem(localKey);
      let localPrefs: UserPreferences = {};
      if (localRaw) {
        try {
          localPrefs = JSON.parse(localRaw);
        } catch (_) {}
      }

      if (!isSupabaseConfigured || !supabase) {
        setPreferences(localPrefs);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data && data.preferences) {
          setPreferences(data.preferences as UserPreferences);
          // Sync back to localstorage for fallback consistency
          localStorage.setItem(localKey, JSON.stringify(data.preferences));
        } else {
          // If no row exists, initialize with local preferences
          setPreferences(localPrefs);
          await supabase.from('user_preferences').insert({
            user_id: userId,
            preferences: localPrefs
          });
        }
      } catch (err) {
        console.error('[Preferences] Error loading user preferences:', err);
        // Fallback to local
        setPreferences(localPrefs);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrefs();
  }, [userId]);

  // Update preferences helper
  const updatePreferences = async (newUpdates: Partial<UserPreferences>) => {
    if (!userId) return;

    const merged = { ...preferences, ...newUpdates };
    setPreferences(merged);

    // Save locally
    const localKey = `vocentro_user_prefs_${userId}`;
    localStorage.setItem(localKey, JSON.stringify(merged));

    // Theme changes apply immediately to document elements
    if (newUpdates.theme) {
      applyTheme(newUpdates.theme);
    }

    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preferences: merged,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('[Preferences] Error updating user preferences in DB:', err);
    }
  };

  const applyTheme = (theme: 'dark' | 'light' | 'system') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  return {
    preferences,
    updatePreferences,
    isLoading
  };
}
