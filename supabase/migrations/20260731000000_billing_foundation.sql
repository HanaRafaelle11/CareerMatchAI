-- Migration: 20260731000000_billing_foundation.sql
-- Descrição: Fundação da Arquitetura Enterprise de Billing (Plans, Entitlements, Customers, Subscriptions, Invoices, Transactions e Webhook Logs)

-- 1. Tabela de Clientes nos Gateways de Pagamento (Multi-gateway)
CREATE TABLE IF NOT EXISTS public.payment_customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  gateway_name text NOT NULL CHECK (gateway_name IN ('asaas', 'stripe', 'mercadopago')),
  gateway_customer_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT payment_customers_user_gateway_unique UNIQUE (user_id, gateway_name),
  CONSTRAINT payment_customers_gateway_id_unique UNIQUE (gateway_name, gateway_customer_id)
);

-- 2. Tabela de Planos (Plans)
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0.00,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0.00,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir Seed de Planos Padrão (Free, Pro, Enterprise)
INSERT INTO public.plans (slug, name, price_monthly, price_yearly, active)
VALUES 
  ('free', 'Plano Gratuito', 0.00, 0.00, true),
  ('pro', 'Plano Profissional', 29.90, 299.00, true),
  ('enterprise', 'Plano Corporativo', 99.90, 999.00, true)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, 
    price_monthly = EXCLUDED.price_monthly, 
    price_yearly = EXCLUDED.price_yearly;

-- 3. Tabela de Capacidades / Recursos (Entitlements)
CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  value_type text NOT NULL CHECK (value_type IN ('boolean', 'numeric', 'unlimited')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir Seed de Entitlements Padrão
INSERT INTO public.entitlements (key, name, description, value_type)
VALUES
  ('resume_export_pdf', 'Exportação de Currículo em PDF', 'Permite exportar currículos em PDF customizado', 'boolean'),
  ('advanced_matching', 'Matching Avançado IA Gemini', 'Compatibilidade avançada com análise profunda de requisitos', 'boolean'),
  ('star_simulations', 'Simulações de Entrevista STAR', 'Quantidade mensal de simulações comportamentais', 'numeric'),
  ('cover_letter_generation', 'Geração de Cartas de Apresentação', 'Quantidade mensal de cartas de apresentação por IA', 'numeric'),
  ('resume_versions', 'Versões de Currículo Salvas', 'Número máximo de versões de currículos mantidas', 'numeric'),
  ('analytics_dashboard', 'Painel de Métricas de Carreira', 'Acesso ao dashboard detalhado de evolução profissional', 'boolean'),
  ('job_connectors', 'Conectores de Vagas Ativos', 'Número de plataformas integradas simultaneamente', 'numeric')
ON CONFLICT (key) DO NOTHING;

-- 4. Tabela de Vínculo entre Planos e Entitlements
CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  entitlement_id uuid REFERENCES public.entitlements(id) ON DELETE CASCADE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT plan_entitlements_unique UNIQUE (plan_id, entitlement_id)
);

-- Seed de Valores de Entitlements por Plano
DO $$
DECLARE
  v_free_id uuid;
  v_pro_id uuid;
  v_ent_pdf uuid;
  v_ent_match uuid;
  v_ent_star uuid;
  v_ent_cover uuid;
  v_ent_resumes uuid;
  v_ent_analytics uuid;
  v_ent_connectors uuid;
BEGIN
  SELECT id INTO v_free_id FROM public.plans WHERE slug = 'free';
  SELECT id INTO v_pro_id FROM public.plans WHERE slug = 'pro';

  SELECT id INTO v_ent_pdf FROM public.entitlements WHERE key = 'resume_export_pdf';
  SELECT id INTO v_ent_match FROM public.entitlements WHERE key = 'advanced_matching';
  SELECT id INTO v_ent_star FROM public.entitlements WHERE key = 'star_simulations';
  SELECT id INTO v_ent_cover FROM public.entitlements WHERE key = 'cover_letter_generation';
  SELECT id INTO v_ent_resumes FROM public.entitlements WHERE key = 'resume_versions';
  SELECT id INTO v_ent_analytics FROM public.entitlements WHERE key = 'analytics_dashboard';
  SELECT id INTO v_ent_connectors FROM public.entitlements WHERE key = 'job_connectors';

  -- Matriz de Recursos para Plano Free
  IF v_free_id IS NOT NULL THEN
    INSERT INTO public.plan_entitlements (plan_id, entitlement_id, value) VALUES
      (v_free_id, v_ent_pdf, 'false'),
      (v_free_id, v_ent_match, 'false'),
      (v_free_id, v_ent_star, '3'),
      (v_free_id, v_ent_cover, '1'),
      (v_free_id, v_ent_resumes, '1'),
      (v_free_id, v_ent_analytics, 'false'),
      (v_free_id, v_ent_connectors, '2')
    ON CONFLICT (plan_id, entitlement_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Matriz de Recursos para Plano Pro
  IF v_pro_id IS NOT NULL THEN
    INSERT INTO public.plan_entitlements (plan_id, entitlement_id, value) VALUES
      (v_pro_id, v_ent_pdf, 'true'),
      (v_pro_id, v_ent_match, 'true'),
      (v_pro_id, v_ent_star, 'unlimited'),
      (v_pro_id, v_ent_cover, 'unlimited'),
      (v_pro_id, v_ent_resumes, '10'),
      (v_pro_id, v_ent_analytics, 'true'),
      (v_pro_id, v_ent_connectors, '10')
    ON CONFLICT (plan_id, entitlement_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;
END $$;

-- 5. Tabela de Sobreposições / Exceções Individuais de Recursos (User Overrides)
CREATE TABLE IF NOT EXISTS public.user_entitlement_overrides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entitlement_id uuid REFERENCES public.entitlements(id) ON DELETE CASCADE NOT NULL,
  custom_value text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_entitlement_overrides_unique UNIQUE (user_id, entitlement_id)
);

-- 6. Tabela de Assinaturas (Subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  payment_customer_id uuid REFERENCES public.payment_customers(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE RESTRICT NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'paused', 'expired')) DEFAULT 'active',
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')) DEFAULT 'MONTHLY',
  gateway_subscription_id text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  trial_consumed boolean DEFAULT false NOT NULL,
  current_period_start timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela de Faturas / Cobranças (Invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  gateway_invoice_id text,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'refunded', 'expired', 'canceled')) DEFAULT 'pending',
  pix_copy_paste text,
  pix_qr_code_url text,
  bank_slip_url text,
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabela de Transações Financeiras Liquidadas (Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'processing', 'refunded')) DEFAULT 'processing',
  payment_method text NOT NULL DEFAULT 'PIX' CHECK (payment_method IN ('PIX', 'CREDIT_CARD', 'BOLETO')),
  gateway_name text NOT NULL DEFAULT 'asaas',
  gateway_transaction_id text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Tabela de Logs e Auditoria de Webhooks (Idempotência)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway_name text NOT NULL,
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored', 'pending')),
  error_message text,
  processed_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Triggers de Atualização Automática de 'updated_at'
CREATE OR REPLACE FUNCTION update_billing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_customers_modtime ON public.payment_customers;
CREATE TRIGGER trg_payment_customers_modtime
  BEFORE UPDATE ON public.payment_customers
  FOR EACH ROW EXECUTE FUNCTION update_billing_timestamp();

DROP TRIGGER IF EXISTS trg_plans_modtime ON public.plans;
CREATE TRIGGER trg_plans_modtime
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_billing_timestamp();

DROP TRIGGER IF EXISTS trg_subscriptions_modtime ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_modtime
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_billing_timestamp();

-- 11. Habilitar RLS e Criar Políticas de Segurança
ALTER TABLE public.payment_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlement_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para Leitura Pública / Usuários Autenticados
CREATE POLICY "Leitura de Planos para Todos" ON public.plans
  FOR SELECT USING (true);

CREATE POLICY "Leitura de Entitlements para Todos" ON public.entitlements
  FOR SELECT USING (true);

CREATE POLICY "Leitura de Plan Entitlements para Todos" ON public.plan_entitlements
  FOR SELECT USING (true);

-- Políticas Próprias do Usuário (Dono dos Dados)
CREATE POLICY "Usuarios leem proprios dados em payment_customers" ON public.payment_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios leem proprios user_entitlement_overrides" ON public.user_entitlement_overrides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios leem proprias assinaturas" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios leem proprias faturas" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios leem proprias transacoes" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas Administrativas (Apenas Admins gerenciam / leem tudo)
CREATE POLICY "Administradores gerenciam billing completo" ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
    )
  );
