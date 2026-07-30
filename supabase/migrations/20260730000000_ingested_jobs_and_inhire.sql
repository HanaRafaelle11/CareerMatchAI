-- 20260730000000_ingested_jobs_and_inhire.sql

-- 1. Tabela de vagas ingeridas de fontes com scraping/background sync (ex: InHire, Gupy)
CREATE TABLE IF NOT EXISTS public.ingested_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id text NOT NULL,
  source_platform text NOT NULL, -- 'inhire', 'gupy', etc.
  title text NOT NULL,
  company_name text NOT NULL DEFAULT 'Empresa Parceira',
  location text NOT NULL DEFAULT 'Brasil',
  work_mode text NOT NULL DEFAULT 'onsite', -- 'remote', 'hybrid', 'onsite'
  url text NOT NULL,
  description text DEFAULT '',
  salary_min numeric,
  salary_max numeric,
  is_active boolean DEFAULT true NOT NULL,
  last_seen_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT ingested_jobs_external_source_unique UNIQUE (external_id, source_platform)
);

-- Habilitar RLS
ALTER TABLE public.ingested_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ler vagas ingeridas" ON public.ingested_jobs;
CREATE POLICY "Qualquer usuário autenticado pode ler vagas ingeridas" ON public.ingested_jobs
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 2. Tabela de Tenants da InHire descobertos
CREATE TABLE IF NOT EXISTS public.inhire_tenants (
  slug text PRIMARY KEY,
  company_name text,
  is_active boolean DEFAULT true NOT NULL,
  last_validated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inhire_tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ler tenants da InHire" ON public.inhire_tenants;
CREATE POLICY "Qualquer usuário autenticado pode ler tenants da InHire" ON public.inhire_tenants
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Índices de busca rápida
CREATE INDEX IF NOT EXISTS idx_ingested_jobs_active ON public.ingested_jobs (is_active);
CREATE INDEX IF NOT EXISTS idx_ingested_jobs_search ON public.ingested_jobs (title, company_name);
