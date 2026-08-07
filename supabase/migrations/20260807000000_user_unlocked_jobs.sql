-- Migration: 20260807000000_user_unlocked_jobs.sql
-- Tabela para persistência autoritativa de vagas desbloqueadas por usuário por semana
-- Garante autoridade backend contra manipulação de localStorage, trocas de abas e duplo consumo.

CREATE TABLE IF NOT EXISTS public.user_unlocked_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_id text NOT NULL,
  week_start date NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_unlocked_jobs_unique UNIQUE (user_id, job_id, week_start)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_unlocked_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Usuário só lê e insere suas próprias vagas desbloqueadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_unlocked_jobs' AND policyname = 'user_unlocked_jobs_select_own'
  ) THEN
    CREATE POLICY user_unlocked_jobs_select_own ON public.user_unlocked_jobs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_unlocked_jobs' AND policyname = 'user_unlocked_jobs_insert_own'
  ) THEN
    CREATE POLICY user_unlocked_jobs_insert_own ON public.user_unlocked_jobs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Função RPC Atômica para Desbloquear Vaga de Forma Segura no Backend
CREATE OR REPLACE FUNCTION public.unlock_user_job_atomic(
  p_user_id uuid,
  p_job_id text,
  p_week_start date,
  p_max_limit integer DEFAULT 3
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_pro boolean := false;
  v_already_unlocked boolean := false;
  v_current_count integer := 0;
  v_sub_status text;
BEGIN
  -- 1. Verificar se o usuário possui plano PRO ativo
  SELECT status INTO v_sub_status
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND (status IN ('active', 'trialing') OR (current_period_end > now()))
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_sub_status IS NOT NULL THEN
    v_is_pro := true;
  END IF;

  -- Se for PRO, acesso é irrestrito
  IF v_is_pro THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_pro', true,
      'already_unlocked', true,
      'unlocked_count', 0
    );
  END IF;

  -- 2. Verificar se a vaga já foi desbloqueada pelo usuário nesta semana
  SELECT EXISTS (
    SELECT 1 FROM public.user_unlocked_jobs
    WHERE user_id = p_user_id AND job_id = p_job_id AND week_start = p_week_start
  ) INTO v_already_unlocked;

  IF v_already_unlocked THEN
    SELECT count(*)::integer INTO v_current_count
    FROM public.user_unlocked_jobs
    WHERE user_id = p_user_id AND week_start = p_week_start;

    RETURN jsonb_build_object(
      'success', true,
      'is_pro', false,
      'already_unlocked', true,
      'unlocked_count', v_current_count
    );
  END IF;

  -- 3. Contar quantas vagas diferentes já foram desbloqueadas nesta semana
  SELECT count(*)::integer INTO v_current_count
  FROM public.user_unlocked_jobs
  WHERE user_id = p_user_id AND week_start = p_week_start;

  -- 4. Se já atingiu o limite máximo (ex: 3), rejeitar o desbloqueio
  IF v_current_count >= p_max_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'is_pro', false,
      'already_unlocked', false,
      'unlocked_count', v_current_count,
      'error', 'limit_reached'
    );
  END IF;

  -- 5. Inserir atomicamente o desbloqueio
  INSERT INTO public.user_unlocked_jobs (user_id, job_id, week_start)
  VALUES (p_user_id, p_job_id, p_week_start)
  ON CONFLICT (user_id, job_id, week_start) DO NOTHING;

  SELECT count(*)::integer INTO v_current_count
  FROM public.user_unlocked_jobs
  WHERE user_id = p_user_id AND week_start = p_week_start;

  RETURN jsonb_build_object(
    'success', true,
    'is_pro', false,
    'already_unlocked', false,
    'unlocked_count', v_current_count
  );
END;
$$;
