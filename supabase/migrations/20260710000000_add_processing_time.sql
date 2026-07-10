-- 20260710000000_add_processing_time.sql
ALTER TABLE public.resume_versions ADD COLUMN IF NOT EXISTS processing_time_ms integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS processing_time_ms integer;
ALTER TABLE public.job_matches ADD COLUMN IF NOT EXISTS processing_time_ms integer;
