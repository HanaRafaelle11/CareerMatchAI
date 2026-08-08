-- =============================================================================
-- Migration: Subscription Grace Period Support
-- Date: 2026-08-08
-- Description: Adiciona suporte a grace period de 1 dia após vencimento de pagamento.
--   - grace_period_end: timestamp até quando o usuário mantém acesso Pro após PAYMENT_OVERDUE
--   - overdue_at: timestamp de quando o pagamento foi marcado como vencido
-- =============================================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS grace_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS overdue_at timestamptz;

-- Índice para consultas eficientes por grace_period_end (usado no useEntitlements)
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period_end
  ON public.subscriptions (grace_period_end)
  WHERE grace_period_end IS NOT NULL;

-- Comentários descritivos para documentação do esquema
COMMENT ON COLUMN public.subscriptions.grace_period_end IS
  'Timestamp até quando o usuário mantém acesso Pro após PAYMENT_OVERDUE (grace period de 1 dia). NULL quando não há grace period ativo.';

COMMENT ON COLUMN public.subscriptions.overdue_at IS
  'Timestamp de quando o pagamento foi marcado como vencido pelo gateway (Asaas). Usado para auditoria e cálculo do grace period.';
