-- 20260806030000_permanent_fix_admin_access_and_full_visibility.sql
-- Correção permanente de permissões RLS e restauração de visibilidade total para a administradora principal

-- 1. Sincronizar e-mails e papéis na tabela public.profiles
-- Garantir que a administradora principal hanarafaelle11@gmail.com tenha role = 'administrador'
UPDATE public.profiles p
SET role = 'administrador', email = 'hanarafaelle11@gmail.com'
FROM auth.users u
WHERE (p.id = u.id AND LOWER(TRIM(u.email)) = 'hanarafaelle11@gmail.com')
   OR LOWER(TRIM(p.email)) = 'hanarafaelle11@gmail.com';

-- Caso o perfil de Hana não exista na tabela profiles, inseri-lo a partir de auth.users
INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', 'Hana Oliveira'), u.email, 'administrador', u.created_at, NOW()
FROM auth.users u
WHERE LOWER(TRIM(u.email)) = 'hanarafaelle11@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'administrador', email = 'hanarafaelle11@gmail.com';

-- 2. Garantir que todos os outros usuários autenticados tenham role = 'user' (se nulo ou não definido)
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL OR role = '';

-- 3. Recriar a função check_user_role sem dependências externas instáveis
-- Esta função é utilizada por TODAS as políticas RLS (profiles, activity_logs, ai_usage_logs, analytics_events, subscriptions, etc.)
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
      AND (
        role = ANY(required_roles)
        OR (email = 'hanarafaelle11@gmail.com' AND ('administrador' = ANY(required_roles) OR 'suporte' = ANY(required_roles) OR 'financeiro' = ANY(required_roles) OR 'somente_leitura' = ANY(required_roles)))
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Recriar get_all_profiles_for_admin para consulta irrestrita do Command Center
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
BEGIN
  -- Validar autorização
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'administrador' OR email = 'hanarafaelle11@gmail.com')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores autorizados podem listar os perfis.';
  END IF;

  RETURN QUERY
    SELECT
      p.id,
      COALESCE(p.full_name, 'Usuário Vocentro')::text AS full_name,
      COALESCE(p.email, '')::text AS email,
      COALESCE(p.headline, '')::text AS headline,
      CASE 
        WHEN LOWER(TRIM(COALESCE(p.email, ''))) = 'hanarafaelle11@gmail.com' THEN 'administrador'
        ELSE COALESCE(p.role, 'user')
      END::text AS role,
      COALESCE(p.created_at, NOW()) AS created_at,
      COALESCE(p.updated_at, NOW()) AS updated_at,
      COALESCE(p.is_test_account, false)::boolean AS is_test_account
    FROM public.profiles p
    WHERE (
      include_test_accounts = true 
      OR (
        COALESCE(p.is_test_account, false) = false
        AND COALESCE(p.email, '') NOT ILIKE '%example.com%'
        AND COALESCE(p.email, '') NOT ILIKE '%hardening%'
        AND COALESCE(p.email, '') NOT ILIKE '%.e2e.%'
      )
    )
    ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_profiles_for_admin(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin(boolean) TO authenticated;
