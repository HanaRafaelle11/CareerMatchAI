-- 20260730030000_get_all_profiles_for_admin_rpc.sql
-- RPC SECURITY DEFINER para que administradores/suporte/financeiro/somente_leitura
-- possam listar todos os perfis do sistema sem expor auth.users diretamente
-- e sem depender de políticas RLS que poderiam ser contornadas.

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
  -- Autorização: apenas roles administrativos podem chamar esta função
  IF NOT public.check_user_role(ARRAY['administrador', 'suporte', 'financeiro', 'somente_leitura']) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem listar todos os perfis.';
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

-- Revogar acesso público para garantir que apenas chamadas autenticadas passem
REVOKE ALL ON FUNCTION public.get_all_profiles_for_admin(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin(boolean) TO authenticated;
