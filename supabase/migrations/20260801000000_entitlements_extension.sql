-- Migration: 20260801000000_entitlements_extension.sql
-- Adds entitlements for weekly action quota, AI training, and PDF export

INSERT INTO public.entitlements (key, name, description, value_type)
VALUES 
  ('weekly_action_quota', 'Cota Semanal de Ações', 'Número de vagas/ações (melhorar currículo, carta de recomendação) liberadas por semana de calendário', 'numeric'),
  ('ia_training', 'Treinamento & Simulações com IA', 'Permite utilizar o simulador de entrevistas e coaching STAR com IA', 'boolean'),
  ('pdf_export', 'Exportação de Documentos em PDF', 'Permite exportar currículos e cartas em formato PDF ATS', 'boolean')
ON CONFLICT (key) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  value_type = EXCLUDED.value_type;

-- Vincular entitlements aos planos
DO $$
DECLARE
  free_plan_id UUID;
  pro_plan_id UUID;
  quota_id UUID;
  ai_id UUID;
  pdf_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;
  SELECT id INTO pro_plan_id FROM public.plans WHERE slug = 'pro' LIMIT 1;
  
  SELECT id INTO quota_id FROM public.entitlements WHERE key = 'weekly_action_quota' LIMIT 1;
  SELECT id INTO ai_id FROM public.entitlements WHERE key = 'ia_training' LIMIT 1;
  SELECT id INTO pdf_id FROM public.entitlements WHERE key = 'pdf_export' LIMIT 1;

  IF free_plan_id IS NOT NULL THEN
    IF quota_id IS NOT NULL THEN
      INSERT INTO public.plan_entitlements (plan_id, entitlement_id, value)
      VALUES (free_plan_id, quota_id, '3')
      ON CONFLICT (plan_id, entitlement_id) DO UPDATE SET value = '3';
    END IF;
    IF ai_id IS NOT NULL THEN
      INSERT INTO public.plan_entitlements (plan_id, entitlement_id, value)
      VALUES (free_plan_id, ai_id, 'false')
      ON CONFLICT (plan_id, entitlement_id) DO UPDATE SET value = 'false';
    END IF;
    IF pdf_id IS NOT NULL THEN
      INSERT INTO public.plan_entitlements (plan_id, entitlement_id, value)
      VALUES (free_plan_id, pdf_id, 'false')
      ON CONFLICT (plan_id, entitlement_id) DO UPDATE SET value = 'false';
    END IF;
  END IF;

  IF pro_plan_id IS NOT NULL THEN
    IF quota_id IS NOT NULL THEN
      INSERT INTO public.plan_entitlements (plan_id, entitlement_id, value)
      VALUES (pro_plan_id, quota_id, 'unlimited')
      ON CONFLICT (plan_id, entitlement_id) DO UPDATE SET value = 'unlimited';
    END IF;
    IF ai_id IS NOT NULL THEN
      INSERT INTO public.plan_entitlements (plan_id, entitlement_id, value)
      VALUES (pro_plan_id, ai_id, 'true')
      ON CONFLICT (plan_id, entitlement_id) DO UPDATE SET value = 'true';
    END IF;
    IF pdf_id IS NOT NULL THEN
      INSERT INTO public.plan_entitlements (plan_id, entitlement_id, value)
      VALUES (pro_plan_id, pdf_id, 'true')
      ON CONFLICT (plan_id, entitlement_id) DO UPDATE SET value = 'true';
    END IF;
  END IF;
END $$;
