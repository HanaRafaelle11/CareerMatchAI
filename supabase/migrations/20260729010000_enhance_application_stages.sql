-- 20260729010000_enhance_application_stages.sql

-- Adiciona colunas from_status e to_status para rastreamento completo da timeline do Pipeline
ALTER TABLE public.application_stages
ADD COLUMN IF NOT EXISTS from_status text,
ADD COLUMN IF NOT EXISTS to_status text;

-- Índice para consultas rápidas por candidatura e data de transição
CREATE INDEX IF NOT EXISTS idx_application_stages_app_date 
ON public.application_stages (application_id, stage_date desc);
