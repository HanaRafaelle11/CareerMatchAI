-- 20260709000003_application_errors.sql
CREATE TABLE IF NOT EXISTS public.application_errors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  error_code text NOT NULL,
  component text NOT NULL,
  message text NOT NULL,
  stack_trace text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved boolean DEFAULT false NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.application_errors ENABLE ROW LEVEL SECURITY;

-- Política de RLS para inserção
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios logs de erro" ON public.application_errors;
CREATE POLICY "Usuários podem inserir seus próprios logs de erro" ON public.application_errors
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política de RLS para leitura
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios logs de erro" ON public.application_errors;
CREATE POLICY "Usuários podem visualizar seus próprios logs de erro" ON public.application_errors
  FOR SELECT USING (auth.uid() = user_id);
