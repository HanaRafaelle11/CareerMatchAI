-- 20260728190000_add_is_test_account_to_profiles.sql

-- 1. Adicionar a coluna is_test_account na tabela profiles (se não existir)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT false;

-- 2. Atualizar perfis existentes identificados como teste/automação E2E
UPDATE public.profiles
SET is_test_account = true
WHERE email ILIKE '%example.com%'
   OR email ILIKE '%test%'
   OR email ILIKE '%hardening%'
   OR full_name ILIKE '%test%'
   OR full_name ILIKE '%hardening%'
   OR full_name ILIKE '%dummy%';
