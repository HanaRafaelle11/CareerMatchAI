import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface AdminAccessLogItem {
  id: string;
  adminId: string;
  targetUserId: string;
  action: 'view_resume' | 'download_resume' | 'change_role' | 'delete_user';
  details?: string;
  createdAt: string;
  adminEmail?: string;
  targetUserEmail?: string;
}

export class AdminAuditService {
  /**
   * Registra auditoria obrigatória de acesso do admin a currículos ou ações sensíveis
   */
  static async logAccess(params: {
    adminId: string;
    targetUserId: string;
    action: 'view_resume' | 'download_resume' | 'change_role' | 'delete_user';
    details?: string;
  }): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('admin_access_logs').insert({
          admin_id: params.adminId,
          target_user_id: params.targetUserId,
          action: params.action,
          details: params.details || null
        });
      } catch (err) {
        console.warn('[AdminAuditService] Erro ao gravar log de auditoria no Supabase:', err);
      }
    }

    // Backup local no localStorage
    try {
      const logs = JSON.parse(localStorage.getItem('vocentro_admin_access_logs') || '[]');
      logs.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        adminId: params.adminId,
        targetUserId: params.targetUserId,
        action: params.action,
        details: params.details,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('vocentro_admin_access_logs', JSON.stringify(logs));
    } catch (_) {}
  }

  /**
   * Lista histórico de auditoria de acessos para o módulo de Infraestrutura/Operações
   */
  static async getAccessLogs(): Promise<AdminAccessLogItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('admin_access_logs')
          .select('*, profiles!admin_access_logs_admin_id_fkey(email), target_profile:profiles!admin_access_logs_target_user_id_fkey(email)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (data && data.length > 0) {
          return data.map((item: any) => ({
            id: item.id,
            adminId: item.admin_id,
            targetUserId: item.target_user_id,
            action: item.action,
            details: item.details,
            createdAt: item.created_at,
            adminEmail: item.profiles?.email || item.admin_id,
            targetUserEmail: item.target_profile?.email || item.target_user_id
          }));
        }
      } catch (_) {}
    }

    try {
      const stored = JSON.parse(localStorage.getItem('vocentro_admin_access_logs') || '[]');
      return stored;
    } catch (_) {
      return [];
    }
  }

  /**
   * Filtro Universal de Contas Internas / Teste (Item 9)
   */
  static isTestOrInternalAccount(user: { email?: string | null; is_test_account?: boolean | null } | null | undefined): boolean {
    if (!user) return false;
    if (user.is_test_account === true) return true;
    const email = (user.email || '').toLowerCase().trim();
    if (!email) return false;
    return (
      email.includes('teste') ||
      email.includes('test') ||
      email.includes('admin@') ||
      email.endsWith('@vocentro.com.br') ||
      email.includes('qa') ||
      email.includes('exemplo') ||
      email.includes('demo')
    );
  }
}

