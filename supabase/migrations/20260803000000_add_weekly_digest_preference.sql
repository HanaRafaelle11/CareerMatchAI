-- 20260803000000_add_weekly_digest_preference.sql
-- Adiciona preferência de recebimento do resumo semanal de vagas por e-mail

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_digest_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.weekly_digest_enabled IS
  'Se o usuário recebe o resumo semanal de vagas por e-mail (opt-out disponível em Configurações)';

-- Default true = opt-out (todo usuário recebe até desativar manualmente em Configurações → Notificações)
