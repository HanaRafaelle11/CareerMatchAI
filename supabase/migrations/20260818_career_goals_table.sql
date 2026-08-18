-- ============================================================================
-- Migration: 20260818_career_goals_table.sql
-- Tabela: career_goals (Objetivo Profissional desacoplado do Histórico)
-- RLS: Isolamento estrito por usuário (auth.uid() = user_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.career_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intent_type VARCHAR(50) NOT NULL DEFAULT 'same_area_continue',
    target_area VARCHAR(150),
    target_roles TEXT[] DEFAULT '{}',
    target_seniority VARCHAR(50),
    target_location VARCHAR(150),
    target_work_modes TEXT[] DEFAULT '{}',
    target_industries TEXT[] DEFAULT '{}',
    desired_salary_min NUMERIC,
    desired_salary_max NUMERIC,
    salary_currency VARCHAR(3) DEFAULT 'BRL',
    desired_salary VARCHAR(100),
    transferable_skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Garantir colunas se a tabela já existia anteriormente
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS intent_type VARCHAR(50) DEFAULT 'same_area_continue';
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS target_area VARCHAR(150);
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT '{}';
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS target_seniority VARCHAR(50);
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS target_location VARCHAR(150);
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS target_work_modes TEXT[] DEFAULT '{}';
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS target_industries TEXT[] DEFAULT '{}';
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS desired_salary_min NUMERIC;
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS desired_salary_max NUMERIC;
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(3) DEFAULT 'BRL';
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS desired_salary VARCHAR(100);
ALTER TABLE public.career_goals ADD COLUMN IF NOT EXISTS transferable_skills TEXT[] DEFAULT '{}';

-- Remover restrições NOT NULL de colunas legadas se existirem
ALTER TABLE public.career_goals ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.career_goals ALTER COLUMN target_date DROP NOT NULL;

-- Limpar eventuais duplicatas legadas mantendo o registro mais recente por usuário
DELETE FROM public.career_goals a
USING public.career_goals b
WHERE a.user_id = b.user_id
  AND a.created_at < b.created_at;

-- Garantir constraint UNIQUE(user_id) de forma idempotente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'career_goals_user_id_key' 
          AND conrelid = 'public.career_goals'::regclass
    ) THEN
        ALTER TABLE public.career_goals ADD CONSTRAINT career_goals_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 1. Habilitar Row Level Security (RLS)
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

-- 2. Policy de Leitura: Usuário A NUNCA lê objetivo do Usuário B
DROP POLICY IF EXISTS "Users can read own career goals" ON public.career_goals;
CREATE POLICY "Users can read own career goals"
ON public.career_goals
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Policy de Inserção: Usuário A NUNCA insere dados em nome do Usuário B
DROP POLICY IF EXISTS "Users can insert own career goals" ON public.career_goals;
CREATE POLICY "Users can insert own career goals"
ON public.career_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Policy de Atualização: Usuário A NUNCA altera objetivo do Usuário B
DROP POLICY IF EXISTS "Users can update own career goals" ON public.career_goals;
CREATE POLICY "Users can update own career goals"
ON public.career_goals
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Policy de Deleção: Usuário A NUNCA deleta objetivo do Usuário B
DROP POLICY IF EXISTS "Users can delete own career goals" ON public.career_goals;
CREATE POLICY "Users can delete own career goals"
ON public.career_goals
FOR DELETE
USING (auth.uid() = user_id);

-- Índice para consultas de alta performance por usuário
CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON public.career_goals(user_id);
