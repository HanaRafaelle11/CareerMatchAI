import { BaseJobParser, type IngestionResult } from './BaseJobParser';
import { supabase, isSupabaseConfigured } from '../../../infrastructure/api/supabaseClient';

export class PdfParser extends BaseJobParser {
  async parse(file: File): Promise<IngestionResult> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Conexão com o Supabase offline ou não configurada para importação de PDF.');
    }

    const base64 = await this.fileToBase64(file);

    const { data, error } = await supabase.functions.invoke('parse-job', {
      body: { type: 'pdf', fileBase64: base64 }
    });

    if (error) {
      throw new Error(error.message || 'Falha ao processar o upload do PDF.');
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Nenhum dado retornado da extração do PDF.');
    }

    return {
      title: data.title || 'Vaga Extraída de PDF',
      companyName: data.company_name || 'Empresa não Identificada',
      description: data.description || '',
      requirements: data.requirements || [],
      location: data.location || 'Remoto',
      workMode: data.work_mode || 'remote',
      seniority: data.seniority || 'senior',
      salary: data.salary || undefined,
      salaryNumeric: data.salary_numeric || undefined,
      benefits: data.benefits || [],
      sourcePlatform: 'pdf'
    };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}
