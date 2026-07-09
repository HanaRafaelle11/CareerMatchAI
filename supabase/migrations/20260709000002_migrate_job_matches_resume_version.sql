-- Adiciona a coluna resume_version_id vinculada a resume_versions
ALTER TABLE public.job_matches ADD COLUMN resume_version_id uuid REFERENCES public.resume_versions(id) ON DELETE CASCADE;

-- Migra dados existentes usando a relação de career_profiles
UPDATE public.job_matches jm
SET resume_version_id = cp.resume_version_id
FROM public.career_profiles cp
WHERE jm.career_profile_id = cp.id;

-- Define a nova coluna como NOT NULL
ALTER TABLE public.job_matches ALTER COLUMN resume_version_id SET NOT NULL;

-- Remove a coluna legada career_profile_id
ALTER TABLE public.job_matches DROP COLUMN career_profile_id;

-- Adiciona a coluna error_message em ai_usage_logs
ALTER TABLE public.ai_usage_logs ADD COLUMN error_message text;
