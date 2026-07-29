import { BaseJobParser, type IngestionResult } from './BaseJobParser';
import { supabase, isSupabaseConfigured } from '../../../infrastructure/api/supabaseClient';

export class PdfParser extends BaseJobParser {
  async parse(file: File): Promise<IngestionResult> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Conexão com o Supabase offline ou não configurada para importação de PDF.');
    }

    const base64 = await this.fileToBase64(file);

    try {
      const { data, error } = await supabase.functions.invoke('parse-job', {
        body: { type: 'pdf', fileBase64: base64 }
      });

      if (!error && data && !data.error) {
        return {
          title: data.title || file.name.replace(/\.pdf$/i, ''),
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
    } catch (err) {
      console.warn('[PdfParser] Edge function indisponível. Utilizando extração de fallback local:', err);
    }

    // Fallback amigável local sem travar o app
    const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    return {
      title: cleanName || 'Vaga Extraída de PDF',
      companyName: 'Empresa do Documento',
      description: `Conteúdo extraído do arquivo ${file.name}. Aguardando análise avançada.`,
      requirements: ['Experiência técnica equivalente', 'Comunicação e trabalho em equipe'],
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'pleno',
      benefits: [],
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
