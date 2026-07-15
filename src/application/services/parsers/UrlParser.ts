import { BaseJobParser, type IngestionResult } from './BaseJobParser';
import { supabase, isSupabaseConfigured } from '../../../infrastructure/api/supabaseClient';

export class UrlParser extends BaseJobParser {
  async parse(url: string): Promise<IngestionResult> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Conexão com o Supabase offline ou não configurada para importação remota.');
    }

    const { data, error } = await supabase.functions.invoke('parse-job', {
      body: { type: 'url', url }
    });

    if (error) {
      throw new Error(error.message || 'Falha ao processar a importação por link.');
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Nenhum dado retornado da extração da URL.');
    }

    return {
      title: data.title || 'Vaga Importada',
      companyName: data.company_name || 'Empresa não Identificada',
      description: data.description || '',
      requirements: data.requirements || [],
      location: data.location || 'Remoto',
      workMode: data.work_mode || 'remote',
      seniority: data.seniority || 'senior',
      salary: data.salary || undefined,
      salaryNumeric: data.salary_numeric || undefined,
      benefits: data.benefits || [],
      sourceUrl: url,
      sourcePlatform: 'url'
    };
  }
}
