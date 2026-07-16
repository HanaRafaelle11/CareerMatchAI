import type { Job } from '../models/types';
import { BaseJobConnector, type JobSearchFilters } from './BaseJobConnector';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export class AdzunaConnector extends BaseJobConnector {
  readonly platformName = 'Adzuna';

  async searchJobs(filters: JobSearchFilters): Promise<{ results: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]; count: number }> {
    const supabaseClient = supabase;
    if (!isSupabaseConfigured || !supabaseClient) {
      console.warn('[AdzunaConnector] Supabase não está configurado. Retornando lista de vagas vazia.');
      return { results: [], count: 0 };
    }

    let keywords = filters.keywords && filters.keywords.length > 0
      ? filters.keywords
      : [filters.keyword || 'React'];
      
    if (filters.remoteOnly) {
      keywords = keywords.map(kw => {
        const kwLower = kw.toLowerCase();
        if (kwLower.includes('remoto') || kwLower.includes('remote')) {
          return kw;
        }
        return `${kw} remoto`;
      });
    }
      
    const location = filters.location || 'Brasil';
    const pageNum = filters.page || 1;

    try {
      let totalCount = 0;
      const promises = keywords.map(async (keyword) => {
        // Invoca a Edge Function de forma segura para ocultar as chaves de API
        const { data, error } = await supabaseClient.functions.invoke('search-jobs', {
          body: { keyword, location, pageNum }
        });

        if (error) {
          throw new Error(`Erro na busca de vagas via Edge Function: ${error.message}`);
        }

        if (data && typeof data.count === 'number') {
          totalCount = Math.max(totalCount, data.count);
        }
        
        return (data.results || []).map((result: any) => {
          const title = result.title.replace(/<\/?[^>]+(>|$)/g, ""); // Limpar HTML
          const description = result.description.replace(/<\/?[^>]+(>|$)/g, "");
          
          let workMode: 'remote' | 'hybrid' | 'onsite' = 'onsite';
          if (title.toLowerCase().includes('remoto') || title.toLowerCase().includes('remote') || description.toLowerCase().includes('remoto')) {
            workMode = 'remote';
          } else if (title.toLowerCase().includes('hibrido') || title.toLowerCase().includes('híbrido') || description.toLowerCase().includes('híbrido')) {
            workMode = 'hybrid';
          }

          let seniority: 'junior' | 'pleno' | 'senior' | 'lead' | 'director' = 'pleno';
          const titleLower = title.toLowerCase();
          if (titleLower.includes('junior') || titleLower.includes('júnior') || titleLower.includes('jr')) {
            seniority = 'junior';
          } else if (titleLower.includes('senior') || titleLower.includes('sênior') || titleLower.includes('sr')) {
            seniority = 'senior';
          } else if (titleLower.includes('lead') || titleLower.includes('lider') || titleLower.includes('liderança')) {
            seniority = 'lead';
          } else if (titleLower.includes('diretor') || titleLower.includes('director')) {
            seniority = 'director';
          }

          const possibleReqs = [
            'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 
            'JavaScript', 'CSS', 'Figma', 'Git', 'Customer Success', 'Salesforce', 
            'SQL', 'SaaS', 'NPS', 'Churn', 'Onboarding', 'CSAT', 'Retention',
            'Farmácia', 'Estética', 'Cosméticos', 'Saúde', 'Dermocosméticos',
            'Vendas', 'Atendimento', 'Clínica', 'Biologia', 'Química', 'Gestão',
            'Farmacêutico', 'Farmacêutica', 'Procedimentos', 'CRM', 'Marketing'
          ];
          const requirements = possibleReqs.filter(req => 
            new RegExp(`\\b${req}\\b`, 'i').test(title + ' ' + description)
          );

          let defaultReq = 'Geral';
          const titleDesc = (title + ' ' + description).toLowerCase();
          if (/\b(farmac|estet|saude|saúde|cosmet|medico|médica|psicol|hospitalar|clinica|clínica)\b/i.test(titleDesc)) {
            defaultReq = 'Saúde';
          } else if (/\b(venda|sales|comercial|negoc|comercio|comércio|telemarketing|atendimento)\b/i.test(titleDesc)) {
            defaultReq = 'Vendas';
          } else if (/\b(react|typescript|ts|node|nodejs|developer|desenvolvedor|programador|software|engineer|engenheiro|tech|ti|it|tecnologia|computa|sistemas|front|back|fullstack)\b/i.test(titleDesc)) {
            defaultReq = 'Tecnologia';
          }

          return {
            companyId: result.companyId || 'adzuna',
            companyName: result.companyName || result.company?.display_name || 'Empresa Confidencial',
            title: title,
            description: description,
            requirements: result.requirements || (requirements.length > 0 ? requirements : [defaultReq]),
            location: typeof result.location === 'object' ? result.location?.display_name : (result.location || 'Brasil'),
            workMode: result.workMode || workMode,
            seniority: result.seniority || seniority,
            salaryMin: result.salaryMin || result.salary_min || undefined,
            salaryMax: result.salaryMax || result.salary_max || undefined,
            currency: result.currency || 'BRL',
            sourceUrl: result.sourceUrl || result.redirect_url,
            sourcePlatform: result.sourcePlatform || this.platformName,
            isActive: true
          };
        });
      });

      const resultsArray = await Promise.all(promises);
      const allJobs = resultsArray.flat();

      // Deduplicação semântica por título + empresa
      const seen = new Set<string>();
      const deduplicated: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [];
      for (const job of allJobs) {
        const key = `${job.title.toLowerCase()}|${job.companyName.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(job);
        }
      }

      // Filtrar apenas remotas se requisitado
      const filtered = filters.remoteOnly
        ? deduplicated.filter(j => j.workMode === 'remote')
        : deduplicated;

      return { results: filtered, count: totalCount };
    } catch (error) {
      console.error('Erro no conector Adzuna:', error);
      throw error;
    }
  }
}
