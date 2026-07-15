-- 20260715040000_add_job_ingestion_columns.sql
-- Adiciona colunas para controle estruturado de senioridade e canal de origem das vagas

alter table public.jobs 
  add column if not exists seniority text,
  add column if not exists source_platform text default 'manual';
