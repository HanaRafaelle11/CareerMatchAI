-- Migration: 20260724010000_product_readiness_beta.sql
-- Descrição: Tabelas de Feature Flags, Beta Feedback e suporte ao Product Readiness do VoCentro

-- 1. Tabela de Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir flag inicial do Beta da Inteligência de Carreira
INSERT INTO feature_flags (key, enabled)
VALUES ('career_intelligence_beta', true)
ON CONFLICT (key) DO NOTHING;

-- 2. Tabela de Feedback do Beta
CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL DEFAULT 'career_intelligence',
  rating TEXT NOT NULL CHECK (rating IN ('POSITIVE', 'NEGATIVE', 'NEUTRAL')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_user ON beta_feedback(user_id);

-- Row Level Security
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de feature flags" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "Usuários enviam feedback do beta" ON beta_feedback FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Usuários leem seus feedbacks do beta" ON beta_feedback FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
