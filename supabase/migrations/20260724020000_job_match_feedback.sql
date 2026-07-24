-- Migration: 20260724020000_job_match_feedback.sql
-- Descrição: Tabela para feedback explícito de qualidade do Match IA e motivos de rejeição

CREATE TABLE IF NOT EXISTS job_match_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  job_id TEXT NOT NULL,
  career_fit_score INTEGER NOT NULL,
  job_score INTEGER NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  reason TEXT CHECK (reason IN ('seniority_mismatch', 'skill_gap', 'career_direction', 'location', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_match_feedback_user ON job_match_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_job_match_feedback_job ON job_match_feedback(job_id);

ALTER TABLE job_match_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários enviam feedback de match IA" ON job_match_feedback FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Usuários leem seus feedbacks de match IA" ON job_match_feedback FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
