-- 20260806000000_strictly_restrict_admin_to_hana.sql
-- Bloqueio estrito de segurança RBAC:
-- 1. Redefine o papel de TODOS os usuários existentes no sistema para 'user' (usuário comum).
-- 2. Concede papel 'administrador' EXCLUSIVAMENTE para a conta hanarafaelle11@gmail.com.
-- 3. Atualiza a função check_user_role para validar estritamente o e-mail hanarafaelle11@gmail.com.
-- 4. Altera o valor padrão da coluna role na tabela public.profiles para 'user'.

-- Step 1: Garantir que a coluna role tenha valor padrão 'user'
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'user';

-- Step 2: Redefinir o papel de TODOS os usuários para 'user'
UPDATE public.profiles
SET role = 'user'
WHERE role IS DISTINCT FROM 'user';

-- Step 3: Conceder papel 'administrador' EXCLUSIVAMENTE para hanarafaelle11@gmail.com
UPDATE public.profiles p
SET role = 'administrador'
FROM auth.users u
WHERE p.id = u.id
  AND LOWER(TRIM(u.email)) = 'hanarafaelle11@gmail.com';

-- Também atualizar a coluna email em public.profiles se sincronizada
UPDATE public.profiles p
SET role = 'administrador'
WHERE LOWER(TRIM(p.email)) = 'hanarafaelle11@gmail.com';

-- Step 4: Atualizar a função de checagem de papel de usuário (check_user_role)
-- Para requisições que exigem 'administrador', valida estritamente se auth.uid() pertence ao e-mail hanarafaelle11@gmail.com
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles text[])
RETURNS boolean AS $$
DECLARE
  calling_email text;
  has_matching_role boolean := false;
BEGIN
  -- Se o papel 'administrador' for exigido, valida estritamente se o e-mail do usuário é hanarafaelle11@gmail.com
  IF 'administrador' = ANY(required_roles) THEN
    SELECT LOWER(TRIM(u.email)) INTO calling_email
    FROM auth.users u
    WHERE u.id = auth.uid();

    IF calling_email IS NULL OR calling_email != 'hanarafaelle11@gmail.com' THEN
      RETURN false;
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = ANY(required_roles)
  ) INTO has_matching_role;

  RETURN has_matching_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 5: Atualizar RPC get_all_profiles_for_admin para exigir explicitamente que a chamada venha da administradora principal
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

  IF calling_email IS NULL OR calling_email != 'hanarafaelle11@gmail.com' THEN
    RAISE EXCEPTION 'Acesso negado: apenas a administradora principal (hanarafaelle11@gmail.com) pode acessar estes dados.';
  END IF;

  IF include_test_accounts THEN
    RETURN QUERY
      SELECT
        p.id,
        p.full_name,
        p.email,
        p.headline,
        p.role,
        p.created_at,
        p.updated_at,
        COALESCE(p.is_test_account, (
          p.email ILIKE '%example.com%'
          OR p.email ILIKE '%hardening%'
          OR p.email ILIKE '%.e2e.%'
          OR p.email ILIKE '%candidato.e2e%'
        ))::boolean AS is_test_account
      FROM public.profiles p
      ORDER BY p.created_at DESC;
  ELSE
    RETURN QUERY
      SELECT
        p.id,
        p.full_name,
        p.email,
        p.headline,
        p.role,
        p.created_at,
        p.updated_at,
        false::boolean AS is_test_account
      FROM public.profiles p
      WHERE COALESCE(p.is_test_account, false) = false
        AND p.email NOT ILIKE '%example.com%'
        AND p.email NOT ILIKE '%hardening%'
        AND p.email NOT ILIKE '%.e2e.%'
        AND p.email NOT ILIKE '%candidato.e2e%'
      ORDER BY p.created_at DESC;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_profiles_for_admin(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin(boolean) TO authenticated;
