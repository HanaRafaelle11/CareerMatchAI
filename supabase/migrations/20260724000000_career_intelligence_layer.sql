-- Migration: 20260724000000_career_intelligence_layer.sql
-- Descrição: Tabelas do ecossistema de Inteligência de Carreira e Career Copilot

-- 1. Snapshot do Perfil no Momento da Análise
CREATE TABLE IF NOT EXISTS career_profile_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_version_id UUID,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index para buscas rápidas de snapshot por usuário
CREATE INDEX IF NOT EXISTS idx_career_profile_snapshots_user ON career_profile_snapshots(user_id);

-- 2. Explicações do Match da Vaga
CREATE TABLE IF NOT EXISTS job_match_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  career_profile_snapshot_id UUID REFERENCES career_profile_snapshots(id) ON DELETE SET NULL,
  overall_match_reason TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendation TEXT NOT NULL,
  confidence_score INTEGER NOT NULL DEFAULT 85,
  career_fit_score INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_job_explanation UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_match_explanations_user_job ON job_match_explanations(user_id, job_id);

-- 3. Transparência do Detalhamento do Career Fit Score (7 Fatores)
CREATE TABLE IF NOT EXISTS career_fit_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_match_explanation_id UUID NOT NULL REFERENCES job_match_explanations(id) ON DELETE CASCADE,
  skills_score INTEGER NOT NULL DEFAULT 80,
  experience_score INTEGER NOT NULL DEFAULT 80,
  seniority_score INTEGER NOT NULL DEFAULT 80,
  career_goal_score INTEGER NOT NULL DEFAULT 80,
  salary_score INTEGER NOT NULL DEFAULT 80,
  location_score INTEGER NOT NULL DEFAULT 80,
  semantic_score INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_fit_breakdowns_explanation ON career_fit_breakdowns(job_match_explanation_id);

-- 4. Feedback Loop de Aprendizado
CREATE TABLE IF NOT EXISTS job_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('VIEWED', 'SAVED', 'APPLIED', 'REJECTED')),
  reason TEXT CHECK (reason IN ('LOW_SALARY', 'BAD_LOCATION', 'BAD_MATCH', 'WRONG_LEVEL', 'ALREADY_APPLIED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_feedback_user_action ON job_feedback(user_id, action);

-- 5. Sugestões Aprováveis de Currículo Adaptativo
CREATE TABLE IF NOT EXISTS resume_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  original_resume_id TEXT,
  adapted_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords_added JSONB NOT NULL DEFAULT '[]'::jsonb,
  ats_improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPLIED', 'DISMISSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_adaptations_user_job ON resume_adaptations(user_id, job_id);

-- 6. Jornada do Usuário & Snapshot da Candidatura
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  salary_range TEXT,
  status TEXT NOT NULL DEFAULT 'DISCOVERED' CHECK (status IN ('DISCOVERED', 'SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED')),
  notes TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_job_application UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_status ON job_applications(user_id, status);

-- Row Level Security (RLS)
ALTER TABLE career_profile_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_match_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_fit_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários gerenciam seus snapshots" ON career_profile_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários gerenciam suas explicações de vagas" ON job_match_explanations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários leem seus breakdowns" ON career_fit_breakdowns FOR ALL USING (
  EXISTS (SELECT 1 FROM job_match_explanations e WHERE e.id = career_fit_breakdowns.job_match_explanation_id AND e.user_id = auth.uid())
);
CREATE POLICY "Usuários gerenciam seus feedbacks" ON job_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários gerenciam suas adaptações de currículo" ON resume_adaptations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários gerenciam suas candidaturas" ON job_applications FOR ALL USING (auth.uid() = user_id);
