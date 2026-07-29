-- 20260729000000_add_unique_constraint_to_applications.sql

-- Garante que cada candidato (user_id) tenha no máximo 1 registro por vaga (job_id) no PostgreSQL
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_applications_user_job 
ON public.applications (user_id, job_id);
