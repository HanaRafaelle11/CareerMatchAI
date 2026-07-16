-- 20260716040000_job_providers_and_email_sync.sql

-- 1. Adicionar coluna 'email' na tabela public.profiles se não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Atualizar e-mail de perfis existentes a partir de auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Criar tabela de cache de buscas de vagas
CREATE TABLE IF NOT EXISTS public.job_search_cache (
  query_key text PRIMARY KEY,
  results jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Habilitar Row Level Security na tabela de cache
ALTER TABLE public.job_search_cache ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de RLS para a tabela de cache
DROP POLICY IF EXISTS "Qualquer usuário autenticado pode interagir com o cache" ON public.job_search_cache;
CREATE POLICY "Qualquer usuário autenticado pode interagir com o cache" ON public.job_search_cache
  FOR ALL USING (
    auth.role() = 'authenticated'
  );
