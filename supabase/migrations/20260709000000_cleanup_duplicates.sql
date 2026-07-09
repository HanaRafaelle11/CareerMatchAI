-- 20260709000000_cleanup_duplicates.sql
-- 1. Remover perfis de carreira vazios ou incompletos (cascas vazias)
DELETE FROM public.career_profiles
WHERE (personal->>'fullName' = 'Profissional' OR personal->>'fullName' IS NULL)
  AND (experience IS NULL OR jsonb_array_length(experience) = 0)
  AND (skills IS NULL OR jsonb_array_length(skills) = 0);

-- 2. Garantir unicidade: manter apenas o career_profile mais recente para cada resume_version_id
DELETE FROM public.career_profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (resume_version_id) id
  FROM public.career_profiles
  ORDER BY resume_version_id, created_at DESC
);
