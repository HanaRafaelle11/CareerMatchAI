-- ============================================================================
-- Migration: 2026081801_career_goals_legacy_cleanup.sql
-- Remover NOT NULL de title/target_date e garantir UNIQUE(user_id)
-- ============================================================================

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
