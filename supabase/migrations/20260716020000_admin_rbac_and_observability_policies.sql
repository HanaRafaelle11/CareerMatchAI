-- 20260716020000_admin_rbac_and_observability_policies.sql

-- 1. Upgrade public.profiles select policy to allow admins and support roles to read all users
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil ou administrador todos" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    public.check_user_role(ARRAY['administrador', 'suporte', 'financeiro', 'somente_leitura'])
  );

-- 2. Upgrade public.resumes policy to allow admins/support to view all
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios currículos" ON public.resumes;
CREATE POLICY "Usuários podem gerenciar seus próprios currículos ou administrador" ON public.resumes
  FOR ALL USING (
    auth.uid() = user_id OR 
    public.check_user_role(ARRAY['administrador', 'suporte', 'somente_leitura'])
  );

-- 3. Upgrade public.career_profiles policy to allow admins/support to view all
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios perfis de carreira" ON public.career_profiles;
CREATE POLICY "Usuários podem gerenciar seus próprios perfis de carreira ou administrador" ON public.career_profiles
  FOR ALL USING (
    auth.uid() = user_id OR 
    public.check_user_role(ARRAY['administrador', 'suporte', 'somente_leitura'])
  );

-- 4. Upgrade public.applications policy to allow admins/support to view all
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias candidaturas" ON public.applications;
CREATE POLICY "Usuários podem gerenciar suas próprias candidaturas ou administrador" ON public.applications
  FOR ALL USING (
    auth.uid() = user_id OR 
    public.check_user_role(ARRAY['administrador', 'suporte', 'somente_leitura'])
  );

-- 5. Upgrade public.ai_usage_logs policy to allow admins/support/finance to view all
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios logs de IA" ON public.ai_usage_logs;
CREATE POLICY "Usuários podem visualizar seus próprios logs de IA ou administrador" ON public.ai_usage_logs
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.check_user_role(ARRAY['administrador', 'suporte', 'financeiro', 'somente_leitura'])
  );

-- 6. Upgrade public.application_errors policy to allow admins/support to view all
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios logs de erro" ON public.application_errors;
CREATE POLICY "Usuários podem visualizar seus próprios logs de erro ou administrador" ON public.application_errors
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.check_user_role(ARRAY['administrador', 'suporte', 'somente_leitura'])
  );

-- 7. Upgrade public.resume_processing_logs policy to allow admins/support to view all
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios logs de processamento" ON public.resume_processing_logs;
CREATE POLICY "Usuários podem visualizar seus próprios logs de processamento ou administrador" ON public.resume_processing_logs
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.check_user_role(ARRAY['administrador', 'suporte', 'somente_leitura'])
  );
