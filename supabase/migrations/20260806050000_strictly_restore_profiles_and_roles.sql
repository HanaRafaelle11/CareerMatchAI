-- 20260806050000_strictly_restore_profiles_and_roles.sql
-- REGRA MANDATÓRIA DE SEGURANÇA RBAC:
-- NUNCA EXECUTAR UPDATE OU DELETE EM public.profiles OU OUTRAS TABELAS DE PRODUÇÃO SEM UMA CLÁUSULA WHERE RESTRITA E EXPLÍCITA POR ID (p.id = ... OU p.id IN (...)).
-- NUNCA SOBRESCREVER A COLUNA email COM VALORES FIXOS EM MASSA.
-- NUNCA UTILIZAR CONDIÇÕES OR GENÉRICAS EM JUNÇÕES SEM VÍNCULO CHAVE PRIMÁRIA / ESTRITO POR ID.

-- 1. Restaurar os e-mails reais de cada usuário na tabela public.profiles a partir da tabela auth.users (fonte da verdade) usando unicamente a chave primária p.id = u.id
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '' OR p.email = 'hanarafaelle11@gmail.com')
  AND LOWER(TRIM(u.email)) <> 'hanarafaelle11@gmail.com';

-- 2. Redefinir o papel de TODOS os outros usuários para 'user' usando filtro estrito por ID (excluindo explicitamente a administradora Hana pelo ID de auth.users)
UPDATE public.profiles p
SET role = 'user'
WHERE p.role = 'administrador'
  AND p.id <> (
    SELECT u.id 
    FROM auth.users u 
    WHERE LOWER(TRIM(u.email)) = 'hanarafaelle11@gmail.com'
    LIMIT 1
  );

-- 3. Garantir que a administradora principal hanarafaelle11@gmail.com possua o papel 'administrador' e e-mail correto usando filtro estrito por ID
UPDATE public.profiles p
SET role = 'administrador', email = 'hanarafaelle11@gmail.com', is_test_account = false
WHERE p.id = (
  SELECT u.id 
  FROM auth.users u 
  WHERE LOWER(TRIM(u.email)) = 'hanarafaelle11@gmail.com'
  LIMIT 1
);

-- 4. Atualizar a RPC get_all_profiles_for_admin com validação estrita de segurança e filtro por ID
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
  -- Validar autorização estrita por ID no public.profiles
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
      AND (p.role = 'administrador' OR LOWER(TRIM(p.email)) = 'hanarafaelle11@gmail.com')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores autorizados podem listar os perfis.';
  END IF;

  RETURN QUERY
    SELECT
      p.id,
      COALESCE(p.full_name, 'Usuário Vocentro')::text AS full_name,
      COALESCE(p.email, '')::text AS email,
      COALESCE(p.headline, '')::text AS headline,
      COALESCE(p.role, 'user')::text AS role,
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
        AND COALESCE(p.email, '') NOT ILIKE '%candidato.e2e%'
      )
    )
    ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_profiles_for_admin(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin(boolean) TO authenticated;
