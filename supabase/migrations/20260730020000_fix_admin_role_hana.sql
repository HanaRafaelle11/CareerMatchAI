-- 20260730020000_fix_admin_role_hana.sql
-- Correção emergencial: garante que a administradora principal tenha role='administrador'
-- no banco, permitindo que a política RLS autorize a leitura de todos os perfis.

-- 1. Corrigir o role da administradora principal por ID de e-mail exato
UPDATE public.profiles p
SET role = 'administrador'
FROM auth.users u
WHERE p.id = u.id
  AND u.email IN (
    'hanarafaelle11@gmail.com',
    'hana@vocentro.ai'
  );

-- 2. Remover role de administrador de contas de teste/e2e que receberam esse role indevidamente
UPDATE public.profiles p
SET role = 'user'
WHERE (
  p.email ILIKE '%example.com%'
  OR p.email ILIKE '%e2e%'
  OR p.email ILIKE '%hardening%'
  OR p.email ILIKE '%candidato.e2e%'
)
AND p.role = 'administrador';

-- 3. Registrar no log quem foi corrigido (informativo)
DO $$
DECLARE
  updated_count integer;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE u.email = 'hanarafaelle11@gmail.com' AND p.role = 'administrador';

  RAISE NOTICE 'Registros com role=administrador para hanarafaelle11@gmail.com: %', updated_count;
END $$;
