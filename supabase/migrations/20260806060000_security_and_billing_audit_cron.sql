-- Migration: 20260806060000_security_and_billing_audit_cron.sql
-- Description: Configures pg_cron hourly security audit job for admin count and billing status anomalies

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Função RPC para verificação e auditoria contínua
CREATE OR REPLACE FUNCTION public.security_audit_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_count integer;
  v_non_hana_admins text[];
  v_anomalous_subs integer;
  v_result jsonb;
BEGIN
  -- Auditoria 1: Conta total de administradores (deve ser exatamente 1: hanarafaelle11@gmail.com)
  SELECT count(*), array_agg(email) FILTER (WHERE email != 'hanarafaelle11@gmail.com')
  INTO v_admin_count, v_non_hana_admins
  FROM public.profiles
  WHERE role = 'administrador';

  -- Auditoria 2: Assinaturas ativas com data de vencimento no passado sem renovação
  SELECT count(*)
  INTO v_anomalous_subs
  FROM public.subscriptions
  WHERE status = 'active' AND current_period_end < NOW();

  v_result := jsonb_build_object(
    'checked_at', NOW(),
    'admin_count', v_admin_count,
    'unauthorized_admins', COALESCE(v_non_hana_admins, ARRAY[]::text[]),
    'anomalous_subscriptions', v_anomalous_subs,
    'status', CASE WHEN v_admin_count = 1 AND v_anomalous_subs = 0 THEN 'OK' ELSE 'ALERT' END
  );

  RETURN v_result;
END;
$$;

-- 2. Expor consulta do status do pg_cron para o painel admin
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  active boolean,
  jobname text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jobid, schedule, command, active, jobname
  FROM cron.job;
$$;

-- 3. Agendamento do Cron Job no pg_cron (Execução a cada hora: 0 * * * *)
SELECT cron.schedule(
  'security-and-billing-audit-hourly',
  '0 * * * *',
  $$
    SELECT public.security_audit_check();
  $$
);
