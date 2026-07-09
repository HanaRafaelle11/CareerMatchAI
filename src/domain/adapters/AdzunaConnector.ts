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

    const keywords = filters.keywords && filters.keywords.length > 0
      ? filters.keywords
      : [filters.keyword || 'React'];
      
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
            'SQL', 'SaaS', 'NPS', 'Churn', 'Onboarding', 'CSAT', 'Retention'
          ];
          const requirements = possibleReqs.filter(req => 
            new RegExp(`\\b${req}\\b`, 'i').test(title + ' ' + description)
          );

          return {
            companyId: 'adzuna',
            companyName: result.company?.display_name || 'Empresa Confidencial',
            title: title,
            description: description,
            requirements: requirements.length > 0 ? requirements : ['Tecnologia'],
            location: result.location?.display_name || 'Brasil',
            workMode: workMode,
            seniority: seniority,
            salaryMin: result.salary_min || undefined,
            salaryMax: result.salary_max || undefined,
            currency: 'BRL',
            sourceUrl: result.redirect_url,
            sourcePlatform: this.platformName,
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
