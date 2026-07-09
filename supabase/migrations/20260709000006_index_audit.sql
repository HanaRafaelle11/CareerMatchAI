-- 20260709000006_index_audit.sql
-- Índices de performance para queries críticas de produção

-- 1. Índices para tabelas de currículo (polling de status e listagem)
create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_resume_versions_user_id on public.resume_versions(user_id);
create index if not exists idx_resume_versions_status on public.resume_versions(status);

-- 2. Índices para logs de processamento (polling em loop)
create index if not exists idx_resume_processing_logs_version_id on public.resume_processing_logs(resume_version_id);
create index if not exists idx_resume_processing_errors_version_id on public.resume_processing_errors(resume_version_id);

-- 3. Índices para perfis de carreira (lookup por resume_version_id)
create index if not exists idx_career_profiles_resume_version_id on public.career_profiles(resume_version_id);
create index if not exists idx_career_insights_resume_version_id on public.career_insights(resume_version_id);
create index if not exists idx_career_profiles_user_id on public.career_profiles(user_id);
create index if not exists idx_career_insights_user_id on public.career_insights(user_id);

-- 4. Índice composto para rate limiting (query crítica em cada chamada de IA)
create index if not exists idx_ai_usage_logs_rate_limit on public.ai_usage_logs(user_id, feature, created_at desc);

-- 5. Índices para matches e jobs
create index if not exists idx_matches_resume_id on public.matches(resume_id);
create index if not exists idx_matches_job_id on public.matches(job_id);
create index if not exists idx_jobs_user_id on public.jobs(user_id);

-- 6. Índices para tabelas de telemetria (consultas administrativas)
create index if not exists idx_application_events_user_id on public.application_events(user_id);
create index if not exists idx_application_events_event_name on public.application_events(event_name);
create index if not exists idx_career_match_logs_user_id on public.career_match_logs(user_id);
create index if not exists idx_application_errors_user_id on public.application_errors(user_id);

-- 7. Índices para candidaturas e stages
create index if not exists idx_applications_user_id on public.applications(user_id);
create index if not exists idx_application_stages_application_id on public.application_stages(application_id);

-- 8. Cache de IA (lookup por hash composto — já existe como unique, verificar)
-- idx_analysis_cache_hashes já criado na migration anterior
