-- 20260715000000_add_role_and_rbac_to_profiles.sql

-- 1. Adicionar coluna 'role' na tabela public.profiles se não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Atualizar o primeiro usuário administrativo baseado no e-mail
-- (Executa joins com auth.users se possível, caso contrário o hook tratará os logins)
UPDATE public.profiles p
SET role = 'administrador'
FROM auth.users u
WHERE p.id = u.id AND (u.email LIKE '%admin%' OR u.email LIKE '%rafox%');

UPDATE public.profiles p
SET role = 'suporte'
FROM auth.users u
WHERE p.id = u.id AND u.email LIKE '%suporte%';

-- Adicionar política RLS para permitir que administradores alterem e gerenciem perfis de outros usuários
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os perfis" ON public.profiles;
CREATE POLICY "Administradores podem gerenciar todos os perfis" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
    )
  );

-- 3. Criar tabelas de faturamento (Billing)
-- Tabela de Assinaturas (Subscriptions)
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('Free', 'Pro', 'Enterprise')),
  status text NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  amount numeric(10,2) NOT NULL DEFAULT 0.00,
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Transações (Transactions)
CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'processing', 'refunded')),
  payment_method text NOT NULL DEFAULT 'credit_card',
  provider text NOT NULL DEFAULT 'stripe',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Triggers para atualização automática de data de modificação
CREATE TRIGGER update_billing_subscriptions_modtime
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Habilitar RLS nas tabelas financeiras
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Assinaturas
CREATE POLICY "Usuários podem ver sua própria assinatura" ON public.billing_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Administradores/Suporte/Financeiro podem ver todas as assinaturas" ON public.billing_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('administrador', 'suporte', 'financeiro', 'somente_leitura')
    )
  );

-- Políticas de RLS para Transações
CREATE POLICY "Usuários podem ver suas próprias transações" ON public.billing_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Administradores/Suporte/Financeiro podem ver todas as transações" ON public.billing_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('administrador', 'suporte', 'financeiro', 'somente_leitura')
    )
  );

-- 4. Inserir dados mockados para alimentação inicial da aba Financeira
-- Nota: estes registros utilizam IDs dos perfis que existirem no banco. 
-- Criamos transações genéricas atreladas aos administradores ou perfis existentes.
DO $$
DECLARE
  prof_rec RECORD;
  sub_id uuid;
BEGIN
  -- Iterar sobre os usuários existentes e assinar alguns no plano Pro/Enterprise
  FOR prof_rec IN SELECT id FROM public.profiles LIMIT 10 LOOP
    -- Inserir assinatura
    INSERT INTO public.billing_subscriptions (user_id, plan, status, amount, interval)
    VALUES (
      prof_rec.id, 
      CASE (random() * 2)::integer 
        WHEN 0 THEN 'Free' 
        WHEN 1 THEN 'Pro' 
        ELSE 'Enterprise' 
      END,
      'active',
      CASE (random() * 2)::integer 
        WHEN 0 THEN 0.00 
        WHEN 1 THEN 49.90 
        ELSE 249.90 
      END,
      'month'
    )
    RETURNING id INTO sub_id;

    -- Se a assinatura não for gratuita, inserir algumas transações bem-sucedidas e uma com falha
    IF sub_id IS NOT NULL THEN
      INSERT INTO public.billing_transactions (user_id, subscription_id, amount, status, payment_method)
      VALUES 
        (prof_rec.id, sub_id, 49.90, 'succeeded', 'credit_card'),
        (prof_rec.id, sub_id, 49.90, 'succeeded', 'pix');
        
      IF random() > 0.7 THEN
        INSERT INTO public.billing_transactions (user_id, subscription_id, amount, status, payment_method)
        VALUES (prof_rec.id, sub_id, 49.90, 'failed', 'credit_card');
      END IF;
    END IF;
  END LOOP;
END $$;
