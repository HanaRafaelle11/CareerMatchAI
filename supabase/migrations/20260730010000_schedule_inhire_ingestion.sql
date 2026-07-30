-- 20260730010000_schedule_inhire_ingestion.sql

-- Enable pg_cron and pg_net extensions for automated Edge Function invocation
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily InHire discovery & job ingestion at 03:00 AM UTC
SELECT cron.schedule(
  'inhire-daily-job-ingestion',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      url:='https://bdlpfrwebsmpohtclnxf.supabase.co/functions/v1/ingest-inhire-jobs',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:='{}'::jsonb
    )
  $$
);
