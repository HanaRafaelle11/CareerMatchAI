-- supabase/migrations/20260728_clean_test_data.sql
-- Migration revisável para expurgo seguro de perfis e dados de teste genéricos.

-- 1. Criação da tabela de auditoria de acessos de admins aos currículos dos candidatos
CREATE TABLE IF NOT EXISTS public.admin_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'view_resume' | 'download_resume'
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance para relatórios de auditoria
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_admin_id ON public.admin_access_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_target_user_id ON public.admin_access_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_created_at ON public.admin_access_logs(created_at DESC);

-- Habilitar RLS na tabela de auditoria (somente administradores podem consultar)
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente admins consultam logs de auditoria" ON public.admin_access_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'administrador', 'manager')
        )
    );

CREATE POLICY "Admins podem inserir registros de auditoria" ON public.admin_access_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Function RPC para expurgo seguro de teste (somente executada via admin)
CREATE OR REPLACE FUNCTION public.clean_test_users_dry_run()
RETURNS TABLE (
    user_id UUID,
    user_email VARCHAR,
    user_name VARCHAR,
    reason TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.email AS user_email,
        p.full_name AS user_name,
        'Contém padrão de e-mail/nome de teste'::TEXT AS reason
    FROM public.profiles p
    WHERE p.email ILIKE '%test%' 
       OR p.email ILIKE '%demo%' 
       OR p.email ILIKE '%mock%' 
       OR p.email ILIKE '%exemplo%' 
       OR p.email ILIKE '%fake%'
       OR p.full_name ILIKE '%teste%'
       OR p.full_name ILIKE '%demo%';
END;
$$;
