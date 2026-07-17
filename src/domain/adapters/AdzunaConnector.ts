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
          const title = (result.title || '').replace(/<\/?[^>]+(>|$)/g, "");
          const description = (result.description || '').replace(/<\/?[^>]+(>|$)/g, "");
          
          // Trust the aggregator's normalized fields, with client-side fallbacks
          const workMode = result.workModeNormalized || result.workMode || 'onsite';
          const seniority = result.seniorityNormalized || result.seniority || 'pleno';
          const requirements = result.requirementsNormalized || result.requirements || [];
          const location = result.locationNormalized || 
            (typeof result.location === 'object' ? result.location?.display_name : result.location) || 'Brasil';

          return {
            companyId: result.companyId || result.sourcePlatform || 'aggregator',
            companyName: result.companyNameNormalized || result.companyName || result.company?.display_name || 'Empresa Confidencial',
            title,
            description,
            requirements: requirements.length > 0 ? requirements : ['Geral'],
            location,
            workMode,
            seniority,
            salaryMin: result.salaryMinBRL || result.salaryMin || result.salary_min || undefined,
            salaryMax: result.salaryMaxBRL || result.salaryMax || result.salary_max || undefined,
            currency: result.currency || 'BRL',
            sourceUrl: result.sourceUrl || result.redirect_url || '',
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
