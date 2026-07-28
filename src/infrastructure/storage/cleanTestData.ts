import { isSupabaseConfigured, supabase } from '../api/supabaseClient';

export interface CleanReportItem {
  id: string;
  email?: string;
  fullName?: string;
  type: 'profile' | 'resume' | 'job_application' | 'analytics_event';
  reason: string;
}

export interface CleanReport {
  timestamp: string;
  dryRun: boolean;
  totalFound: number;
  items: CleanReportItem[];
}

const TEST_EMAIL_PATTERNS = [
  /test/i,
  /demo/i,
  /mock/i,
  /exemplo/i,
  /fake/i,
  /dummy/i,
  /user@example/i
];

export class TestDataCleaner {
  /**
   * Avalia e (se dryRun=false) exclui contas e registros de teste da base.
   */
  static async executeCleanup(options: { dryRun?: boolean } = {}): Promise<CleanReport> {
    const dryRun = options.dryRun !== false; // true por padrão
    const reportItems: CleanReportItem[] = [];

    let profiles: any[] = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('profiles').select('id, email, full_name');
        profiles = data || [];
      } catch (err) {
        console.warn('[TestDataCleaner] Erro ao listar profiles:', err);
      }
    }

    // Identificar perfis de teste
    const testProfileIds = new Set<string>();
    profiles.forEach(p => {
      const email = p.email || '';
      const name = p.full_name || '';
      const isTest = TEST_EMAIL_PATTERNS.some(pat => pat.test(email) || pat.test(name));
      if (isTest) {
        testProfileIds.add(p.id);
        reportItems.push({
          id: p.id,
          email: p.email,
          fullName: p.full_name,
          type: 'profile',
          reason: `Combinação com padrão de teste: ${email}`
        });
      }
    });

    const report: CleanReport = {
      timestamp: new Date().toISOString(),
      dryRun,
      totalFound: reportItems.length,
      items: reportItems
    };

    // 1. Salvar relatório no localStorage para inspeção do Admin
    try {
      localStorage.setItem('vocentro_cleanup_report', JSON.stringify(report, null, 2));
      console.log(`[TestDataCleaner] Relatório gerado (${dryRun ? 'DRY-RUN' : 'EXECUTA'}); Total achados: ${reportItems.length}`);
    } catch (_) {}

    // 2. Se for execução real (dryRun = false), salvar backup no localStorage antes de deletar do Supabase
    if (!dryRun && testProfileIds.size > 0 && isSupabaseConfigured && supabase) {
      try {
        const { data: profilesToBackup } = await supabase.from('profiles').select('*').in('id', Array.from(testProfileIds));
        localStorage.setItem(`vocentro_backup_${Date.now()}`, JSON.stringify(profilesToBackup, null, 2));

        // Excluir perfis de teste
        const { error } = await supabase.from('profiles').delete().in('id', Array.from(testProfileIds));
        if (error) {
          console.error('[TestDataCleaner] Erro ao excluir perfis de teste:', error);
        } else {
          console.log(`[TestDataCleaner] ${testProfileIds.size} contas de teste excluídas com sucesso.`);
        }
      } catch (err) {
        console.error('[TestDataCleaner] Falha na exclusão:', err);
      }
    }

    return report;
  }
}
