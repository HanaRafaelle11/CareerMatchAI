-- 20260715020000_fix_profiles_recursion_and_assign_admin.sql

-- 1. Create a security definer function to check user roles without causing recursion
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop the recursive policy on public.profiles
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os perfis" ON public.profiles;

-- 3. Recreate the policy using the security definer function
CREATE POLICY "Administradores podem gerenciar todos os perfis" ON public.profiles
  FOR ALL USING (
    public.check_user_role(ARRAY['administrador'])
  );

-- 4. Update the user with email hanarafaelle11@gmail.com to be administrador
UPDATE public.profiles p
SET role = 'administrador'
FROM auth.users u
WHERE p.id = u.id AND (u.email = 'hanarafaelle11@gmail.com' OR u.email = 'hana@talenta.ai');

-- Also auto-assign other admin roles from existing users if they match
UPDATE public.profiles p
SET role = 'administrador'
FROM auth.users u
WHERE p.id = u.id AND (u.email LIKE '%admin%' OR u.email LIKE '%rafox%');

UPDATE public.profiles p
SET role = 'suporte'
FROM auth.users u
WHERE p.id = u.id AND u.email LIKE '%suporte%';
