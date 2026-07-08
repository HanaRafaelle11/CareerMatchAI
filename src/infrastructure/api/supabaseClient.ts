import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

const isValidUrl = (url: string) => {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'undefined' &&
  supabaseUrl !== 'null' &&
  isValidUrl(supabaseUrl) &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'undefined' &&
  supabaseAnonKey !== 'null'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
