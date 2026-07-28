-- 20260715030000_add_admin_dashboard_rpcs.sql

-- 1. FUNÇÃO RPC PARA CONSOLIDAÇÃO DO OVERVIEW OPERACIONAL
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_overview()
RETURNS json SECURITY DEFINER AS $$
DECLARE
  v_users_count bigint;
  v_resumes_count bigint;
  v_jobs_count bigint;
  v_matches_count bigint;
  v_avg_processing_time numeric;
  v_total_tokens bigint;
  v_success_rate numeric;
  v_total_uploads bigint;
  v_completed_pipeline bigint;
  v_failed_pipeline bigint;
  v_running_pipeline bigint;
BEGIN
  -- Segurança: Apenas administradores podem executar esta função
  IF NOT public.check_user_role(ARRAY['administrador']) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem acessar estatísticas do sistema.';
  END IF;

  SELECT count(*) INTO v_users_count FROM public.profiles;
  SELECT count(*) INTO v_resumes_count FROM public.resumes;
  SELECT count(*) INTO v_jobs_count FROM public.jobs;
  SELECT count(*) INTO v_matches_count FROM public.matches;
  
  SELECT COALESCE(avg(processing_time_ms) / 1000.0, 0.0) INTO v_avg_processing_time 
  FROM public.matches;
  
  SELECT COALESCE(sum(input_tokens + output_tokens), 0) INTO v_total_tokens 
  FROM public.ai_usage_logs;
  
  -- ETAPA CONCLUSIVA: Mede uploads iniciados vs finalizados no banco (save_completed / completed step)
  SELECT count(*) INTO v_total_uploads 
  FROM public.resume_processing_logs 
  WHERE step = 'uploaded';

  SELECT count(*) INTO v_completed_pipeline 
  FROM public.resume_processing_logs 
  WHERE step IN ('save_completed', 'completed') AND status IN ('completed', 'success');

  SELECT count(*) INTO v_failed_pipeline 
  FROM public.resume_processing_logs 
  WHERE step = 'failed' OR status IN ('failed', 'error');

  SELECT count(*) INTO v_running_pipeline 
  FROM public.resume_processing_logs 
  WHERE status = 'running';

  -- Se houver uploads iniciados, calcula a conversão de ponta a ponta (uploads que concluíram o salvamento)
  IF v_total_uploads > 0 THEN
    v_success_rate := round((v_completed_pipeline * 100.0) / nullif(v_total_uploads, 0), 1);
    IF v_success_rate > 100.0 THEN v_success_rate := 100.0; END IF;
  ELSE
    v_success_rate := 100.0;
  END IF;

  RETURN json_build_object(
    'users_count', v_users_count,
    'resumes_count', v_resumes_count,
    'jobs_count', v_jobs_count,
    'matches_count', v_matches_count,
    'avg_processing_time', round(v_avg_processing_time, 2),
    'total_tokens', v_total_tokens,
    'success_rate', v_success_rate,
    'status_breakdown', json_build_object(
      'total_uploads', v_total_uploads,
      'completed_pipeline', v_completed_pipeline,
      'failed_pipeline', v_failed_pipeline,
      'running_pipeline', v_running_pipeline
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 2. FUNÇÃO RPC PARA CONSOLIDAÇÃO DE MÉTRICAS DE IA E ENTREGA DE VALOR (ROI)
CREATE OR REPLACE FUNCTION public.get_admin_ia_analytics()
RETURNS json SECURITY DEFINER AS $$
DECLARE
  v_total_calls bigint;
  v_total_tokens bigint;
  v_total_cost numeric;
  v_avg_processing_time numeric;
  v_errors_count bigint;
  
  v_optimizations_count bigint;
  v_letters_count bigint;
  v_simulations_count bigint;
  v_matches_count bigint;
  
  v_avg_match_score numeric;
  v_hours_saved numeric;
BEGIN
  -- Segurança: Apenas administradores podem executar esta função
  IF NOT public.check_user_role(ARRAY['administrador']) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem acessar estatísticas do sistema.';
  END IF;

  -- Contagens de logs de IA
  SELECT COALESCE(count(*), 0) INTO v_total_calls FROM public.ai_usage_logs;
  SELECT COALESCE(sum(input_tokens + output_tokens), 0) INTO v_total_tokens FROM public.ai_usage_logs;
  SELECT COALESCE(sum(estimated_cost), 0.0) INTO v_total_cost FROM public.ai_usage_logs;
  
  -- Tempo médio de resposta
  SELECT COALESCE(avg(processing_time_ms) / 1000.0, 0.0) INTO v_avg_processing_time FROM public.matches;
  
  -- Contagem de erros de IA / Sistema
  SELECT COALESCE(count(*), 0) INTO v_errors_count 
  FROM public.application_errors 
  WHERE error_code LIKE '%AI%' OR error_code LIKE '%API%' OR error_code LIKE '%GEMINI%' OR error_code LIKE '%OPENAI%';

  -- Entregas de valor (counts)
  SELECT COALESCE(count(*), 0) INTO v_optimizations_count FROM public.resume_optimizations;
  SELECT COALESCE(count(*), 0) INTO v_letters_count FROM public.cover_letters;
  SELECT COALESCE(count(*), 0) INTO v_simulations_count FROM public.interview_simulations;
  SELECT COALESCE(count(*), 0) INTO v_matches_count FROM public.matches;
  
  SELECT COALESCE(avg(score_overall), 0.0) INTO v_avg_match_score FROM public.matches;

  -- Horas economizadas estimadas:
  -- Otimização de CV = 30 min (0.5h)
  -- Carta de Apresentação = 15 min (0.25h)
  -- Simulação STAR = 45 min (0.75h)
  -- Match calculado = 10 min (0.17h)
  v_hours_saved := (v_optimizations_count * 0.5) + (v_letters_count * 0.25) + (v_simulations_count * 0.75) + (v_matches_count * 0.17);

  RETURN json_build_object(
    'total_calls', v_total_calls,
    'total_tokens', v_total_tokens,
    'total_cost_brl', round(v_total_cost * 5.4, 2),
    'avg_processing_time', round(v_avg_processing_time, 2),
    'errors_count', v_errors_count,
    'optimizations_count', v_optimizations_count,
    'letters_count', v_letters_count,
    'simulations_count', v_simulations_count,
    'matches_count', v_matches_count,
    'avg_match_score', round(v_avg_match_score, 1),
    'hours_saved', round(v_hours_saved, 1)
  );
END;
$$ LANGUAGE plpgsql;

-- 3. PERMISSÕES DE EXECUÇÃO DAS FUNÇÕES
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_overview() FROM public;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_overview() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_admin_ia_analytics() FROM public;
GRANT EXECUTE ON FUNCTION public.get_admin_ia_analytics() TO authenticated;
