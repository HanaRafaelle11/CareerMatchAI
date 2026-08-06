-- 20260806010000_fix_subscriptions_and_admin_rpc.sql
-- Correção de permissões administrativas e assinaturas de planos:
-- 1. Apenas hanarafaelle11@gmail.com e rafaelaletbey@gmail.com permanecem em plano PAGO (status='active').
-- 2. Todos os demais usuários são redefinidos para o plano FREE (status='canceled' / plan='Free').
-- 3. A RPC get_all_profiles_for_admin e a função check_user_role são atualizadas para retornar TODOS os perfis sem perdas de registros (com FULL OUTER JOIN em auth.users).

-- Step 1: Atualizar assinaturas ativas na tabela public.subscriptions
UPDATE public.subscriptions s
SET status = 'canceled'
FROM auth.users u
WHERE s.user_id = u.id
  AND LOWER(TRIM(u.email)) NOT IN ('hanarafaelle11@gmail.com', 'rafaelaletbey@gmail.com');

UPDATE public.subscriptions s
SET status = 'canceled'
FROM public.profiles p
WHERE s.user_id = p.id
  AND LOWER(TRIM(p.email)) NOT IN ('hanarafaelle11@gmail.com', 'rafaelaletbey@gmail.com');

UPDATE public.subscriptions s
SET status = 'active'
FROM auth.users u
WHERE s.user_id = u.id
  AND LOWER(TRIM(u.email)) IN ('hanarafaelle11@gmail.com', 'rafaelaletbey@gmail.com');

-- Step 2: Atualizar assinaturas ativas na tabela public.billing_subscriptions
UPDATE public.billing_subscriptions bs
SET status = 'canceled', plan = 'Free'
FROM auth.users u
WHERE bs.user_id = u.id
  AND LOWER(TRIM(u.email)) NOT IN ('hanarafaelle11@gmail.com', 'rafaelaletbey@gmail.com');

UPDATE public.billing_subscriptions bs
SET status = 'canceled', plan = 'Free'
FROM public.profiles p
WHERE bs.user_id = p.id
  AND LOWER(TRIM(p.email)) NOT IN ('hanarafaelle11@gmail.com', 'rafaelaletbey@gmail.com');

UPDATE public.billing_subscriptions bs
SET status = 'active', plan = 'Pro'
FROM auth.users u
WHERE bs.user_id = u.id
  AND LOWER(TRIM(u.email)) IN ('hanarafaelle11@gmail.com', 'rafaelaletbey@gmail.com');

-- Step 3: Atualizar a função check_user_role para garantir que a administradora principal hanarafaelle11@gmail.com tenha acesso total incondicional
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles text[])
RETURNS boolean AS $$
DECLARE
  calling_email text;
BEGIN
  SELECT LOWER(TRIM(u.email)) INTO calling_email
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF calling_email IS NULL THEN
    SELECT LOWER(TRIM(p.email)) INTO calling_email
    FROM public.profiles p
    WHERE p.id = auth.uid();
  END IF;

  -- Administradora principal possui permissão irrestrita para todas as checagens administrativas
  IF calling_email = 'hanarafaelle11@gmail.com' THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 4: Garantir que public.profiles tenha role = 'administrador' para hanarafaelle11@gmail.com
UPDATE public.profiles p
SET role = 'administrador'
FROM auth.users u
WHERE p.id = u.id AND LOWER(TRIM(u.email)) = 'hanarafaelle11@gmail.com';

-- Step 5: Recriar get_all_profiles_for_admin com FULL OUTER JOIN para trazer todos os usuários existentes
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin(
  include_test_accounts boolean DEFAULT false
)
RETURNS TABLE (
  id            uuid,
  full_name     text,
  email         text,
  headline      text,
  role          text,
  created_at    timestamptz,
  updated_at    timestamptz,
  is_test_account boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_email text;
BEGIN
  SELECT LOWER(TRIM(u.email)) INTO calling_email
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF calling_email IS NULL THEN
    SELECT LOWER(TRIM(p.email)) INTO calling_email
    FROM public.profiles p
    WHERE p.id = auth.uid();
  END IF;

  IF calling_email IS NULL OR calling_email != 'hanarafaelle11@gmail.com' THEN
    RAISE EXCEPTION 'Acesso negado: apenas a administradora principal (hanarafaelle11@gmail.com) pode acessar estes dados.';
  END IF;

  IF include_test_accounts THEN
    RETURN QUERY
      SELECT
        COALESCE(p.id, u.id) AS id,
        COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1), 'Usuário Vocentro')::text AS full_name,
        COALESCE(p.email, u.email, '')::text AS email,
        COALESCE(p.headline, '')::text AS headline,
        COALESCE(p.role, 'user')::text AS role,
        COALESCE(p.created_at, u.created_at, NOW()) AS created_at,
        COALESCE(p.updated_at, NOW()) AS updated_at,
        COALESCE(p.is_test_account, (
          COALESCE(p.email, u.email, '') ILIKE '%example.com%'
          OR COALESCE(p.email, u.email, '') ILIKE '%hardening%'
          OR COALESCE(p.email, u.email, '') ILIKE '%.e2e.%'
          OR COALESCE(p.email, u.email, '') ILIKE '%candidato.e2e%'
        ))::boolean AS is_test_account
      FROM public.profiles p
      FULL OUTER JOIN auth.users u ON u.id = p.id
      WHERE u.id IS NOT NULL OR p.id IS NOT NULL
      ORDER BY COALESCE(p.created_at, u.created_at) DESC;
  ELSE
    RETURN QUERY
      SELECT
        COALESCE(p.id, u.id) AS id,
        COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1), 'Usuário Vocentro')::text AS full_name,
        COALESCE(p.email, u.email, '')::text AS email,
        COALESCE(p.headline, '')::text AS headline,
        COALESCE(p.role, 'user')::text AS role,
        COALESCE(p.created_at, u.created_at, NOW()) AS created_at,
        COALESCE(p.updated_at, NOW()) AS updated_at,
        false::boolean AS is_test_account
      FROM public.profiles p
      FULL OUTER JOIN auth.users u ON u.id = p.id
      WHERE (u.id IS NOT NULL OR p.id IS NOT NULL)
        AND COALESCE(p.is_test_account, false) = false
        AND COALESCE(p.email, u.email, '') NOT ILIKE '%example.com%'
        AND COALESCE(p.email, u.email, '') NOT ILIKE '%hardening%'
        AND COALESCE(p.email, u.email, '') NOT ILIKE '%.e2e.%'
        AND COALESCE(p.email, u.email, '') NOT ILIKE '%candidato.e2e%'
      ORDER BY COALESCE(p.created_at, u.created_at) DESC;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_profiles_for_admin(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin(boolean) TO authenticated;
