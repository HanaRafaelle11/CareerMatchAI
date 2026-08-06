-- 20260806020000_fix_hana_admin_role_and_user_list.sql
-- 1. Garantir que a administradora principal hanarafaelle11@gmail.com tenha role='administrador' na tabela public.profiles
UPDATE public.profiles p
SET role = 'administrador', email = 'hanarafaelle11@gmail.com'
FROM auth.users u
WHERE (p.id = u.id AND LOWER(TRIM(u.email)) = 'hanarafaelle11@gmail.com')
   OR LOWER(TRIM(p.email)) = 'hanarafaelle11@gmail.com';

-- Se a linha do perfil de Hana não existir em public.profiles, inseri-la com role administrador
INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', 'Hana Rafaelle'), u.email, 'administrador', u.created_at, NOW()
FROM auth.users u
WHERE LOWER(TRIM(u.email)) = 'hanarafaelle11@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'administrador', email = EXCLUDED.email;

-- 2. Garantir que is_test_account seja false para contas reais que foram marcadas como teste erroneamente
UPDATE public.profiles
SET is_test_account = false
WHERE email NOT ILIKE '%example.com%'
  AND email NOT ILIKE '%hardening%'
  AND email NOT ILIKE '%.e2e.%';

-- 3. Recriar RPC get_all_profiles_for_admin trazendo todos os cadastros do auth.users + public.profiles
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

  RETURN QUERY
    SELECT
      COALESCE(p.id, u.id) AS id,
      COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1), 'Usuário Vocentro')::text AS full_name,
      COALESCE(p.email, u.email, '')::text AS email,
      COALESCE(p.headline, '')::text AS headline,
      CASE 
        WHEN LOWER(TRIM(COALESCE(p.email, u.email, ''))) = 'hanarafaelle11@gmail.com' THEN 'administrador'
        ELSE COALESCE(p.role, 'user')
      END::text AS role,
      COALESCE(p.created_at, u.created_at, NOW()) AS created_at,
      COALESCE(p.updated_at, NOW()) AS updated_at,
      COALESCE(p.is_test_account, false)::boolean AS is_test_account
    FROM auth.users u
    FULL OUTER JOIN public.profiles p ON p.id = u.id
    WHERE (u.id IS NOT NULL OR p.id IS NOT NULL)
      AND (
        include_test_accounts = true 
        OR (
          COALESCE(p.email, u.email, '') NOT ILIKE '%example.com%'
          AND COALESCE(p.email, u.email, '') NOT ILIKE '%hardening%'
          AND COALESCE(p.email, u.email, '') NOT ILIKE '%.e2e.%'
        )
      )
    ORDER BY COALESCE(p.created_at, u.created_at) DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_profiles_for_admin(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin(boolean) TO authenticated;
