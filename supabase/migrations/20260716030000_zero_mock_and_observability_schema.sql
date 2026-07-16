-- 20260716030000_zero_mock_and_observability_schema.sql

-- 1. Tabela public.admin_user_sessions
CREATE TABLE IF NOT EXISTS public.admin_user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip text,
  city text,
  country text,
  browser text,
  device text,
  os text,
  login_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_activity timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  logout_at timestamp with time zone,
  status text CHECK (status IN ('active', 'expired', 'logged_out')) DEFAULT 'active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela public.user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela public.activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  entity text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  device text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela public.ai_telemetry
CREATE TABLE IF NOT EXISTS public.ai_telemetry (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  duration_ms integer NOT NULL,
  latency_ms integer NOT NULL,
  input_tokens integer NOT NULL,
  output_tokens integer NOT NULL,
  estimated_cost numeric(12, 8) NOT NULL,
  edge_function_name text NOT NULL,
  failures_count integer DEFAULT 0,
  retries_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.admin_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_telemetry ENABLE ROW LEVEL SECURITY;

-- 5. Criar Políticas de RLS

-- Políticas para admin_user_sessions
DROP POLICY IF EXISTS "Usuários gerenciam suas próprias sessões" ON public.admin_user_sessions;
CREATE POLICY "Usuários gerenciam suas próprias sessões ou administrador" ON public.admin_user_sessions
  FOR ALL USING (
    auth.uid() = user_id OR
    public.check_user_role(ARRAY['administrador', 'suporte', 'somente_leitura'])
  );

-- Políticas para user_preferences
DROP POLICY IF EXISTS "Usuários gerenciam suas próprias preferências" ON public.user_preferences;
CREATE POLICY "Usuários gerenciam suas próprias preferências ou administrador" ON public.user_preferences
  FOR ALL USING (
    auth.uid() = user_id OR
    public.check_user_role(ARRAY['administrador', 'suporte', 'somente_leitura'])
  );

-- Políticas para activity_logs
DROP POLICY IF EXISTS "Usuários visualizam seus próprios logs de atividade" ON public.activity_logs;
CREATE POLICY "Usuários visualizam seus próprios logs de atividade ou administrador" ON public.activity_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.check_user_role(ARRAY['administrador', 'suporte', 'somente_leitura'])
  );

DROP POLICY IF EXISTS "Qualquer usuário logado insere seus próprios logs de atividade" ON public.activity_logs;
CREATE POLICY "Qualquer usuário logado insere seus próprios logs de atividade" ON public.activity_logs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Políticas para ai_telemetry
DROP POLICY IF EXISTS "Usuários visualizam sua própria telemetria de IA" ON public.ai_telemetry;
CREATE POLICY "Usuários visualizam sua própria telemetria de IA ou administrador" ON public.ai_telemetry
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.check_user_role(ARRAY['administrador', 'suporte', 'financeiro', 'somente_leitura'])
  );

DROP POLICY IF EXISTS "Inserção de telemetria permitida para usuários logados" ON public.ai_telemetry;
CREATE POLICY "Inserção de telemetria permitida para usuários logados" ON public.ai_telemetry
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Triggers de data de modificação
DROP TRIGGER IF EXISTS update_user_preferences_modtime ON public.user_preferences;
CREATE TRIGGER update_user_preferences_modtime
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
