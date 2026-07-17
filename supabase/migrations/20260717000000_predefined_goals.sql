-- 20260717000000_predefined_goals.sql
-- Tabela para salvar modelos de objetivos pré-definidos dos usuários
CREATE TABLE IF NOT EXISTS public.predefined_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.predefined_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuários podem gerenciar seus modelos de metas" ON public.predefined_goals
  FOR ALL USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_predefined_goals_user ON public.predefined_goals(user_id);
