-- 20260730010000_schedule_inhire_ingestion.sql

-- Enable pg_cron and pg_net extensions for automated Edge Function invocation
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Ingestão Diária de Vagas (sobre tenants já cadastrados) — Todo dia às 03:00 UTC
SELECT cron.schedule(
  'inhire-daily-job-ingestion',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      url:='https://bdlpfrwebsmpohtclnxf.supabase.co/functions/v1/ingest-inhire-jobs?mode=ingest',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:='{}'::jsonb
    )
  $$
);

-- 2. Descoberta Semanal de Novos Tenants (Wayback / urlscan / Common Crawl) — Todo domingo às 04:00 UTC
SELECT cron.schedule(
  'inhire-weekly-tenant-discovery',
  '0 4 * * 0',
  $$
    SELECT net.http_post(
      url:='https://bdlpfrwebsmpohtclnxf.supabase.co/functions/v1/ingest-inhire-jobs?mode=discover',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:='{}'::jsonb
    )
  $$
);
