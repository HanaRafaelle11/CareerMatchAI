-- Adiciona coluna resume_version_id vinculada à tabela resume_versions
ALTER TABLE public.applications ADD COLUMN resume_version_id uuid REFERENCES public.resume_versions(id) ON DELETE SET NULL;

-- Migra dados existentes de resume_used_id para resume_version_id
-- O mapeamento é feito relacionando public.resumes e public.resume_versions pelo file_url ou file_name
UPDATE public.applications a
SET resume_version_id = rv.id
FROM public.resumes r
JOIN public.resume_versions rv ON (rv.file_url = r.file_url OR rv.file_name = r.file_name)
WHERE a.resume_used_id = r.id;

-- Remove a coluna legada resume_used_id
ALTER TABLE public.applications DROP COLUMN resume_used_id;
