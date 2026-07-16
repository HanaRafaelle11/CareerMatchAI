-- 20260716050000_job_aggregator_observability.sql

-- 1. Indexação otimizada para a telemetria do Agregador de Vagas
CREATE INDEX IF NOT EXISTS idx_analytics_events_job_search 
ON public.analytics_events (category, event_name, created_at);

-- 2. Garantir permissões de leitura/escrita no cache de busca para funções edge
GRANT ALL ON TABLE public.job_search_cache TO postgres, service_role, authenticated;
