-- 20260711000000_add_avatar_url_to_profiles.sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
