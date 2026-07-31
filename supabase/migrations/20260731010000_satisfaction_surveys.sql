-- Migration: 20260731010000_satisfaction_surveys.sql
-- Descrição: Tabela de Pesquisas de Satisfação (NPS/CSAT) e Bucket público 'resumes'

-- 1. Tabela de Pesquisas de Satisfação
CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  visit_number integer NOT NULL DEFAULT 1,
  ease_rating integer NOT NULL CHECK (ease_rating >= 1 AND ease_rating <= 5),
  experience_rating text NOT NULL,
  matches_rating text NOT NULL,
  comment text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela satisfaction_surveys
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer usuário autenticado pode criar resposta de pesquisa" ON public.satisfaction_surveys;
CREATE POLICY "Qualquer usuário autenticado pode criar resposta de pesquisa"
  ON public.satisfaction_surveys FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Leitura de pesquisas para administradores e suporte" ON public.satisfaction_surveys;
CREATE POLICY "Leitura de pesquisas para administradores e suporte"
  ON public.satisfaction_surveys FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('administrador', 'suporte', 'financeiro', 'somente_leitura')
      )
    )
  );

-- 2. Garantir criação e permissão do bucket 'resumes' no Storage do Supabase
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  10485760,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET public = true;
