import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  const globalObj = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {};
  const proc = globalObj.process as { env?: Record<string, string | undefined> } | undefined;
  if (proc?.env?.[key]) {
    return proc.env[key] as string;
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

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
