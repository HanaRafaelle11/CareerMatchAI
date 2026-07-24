import type { JobProviderInterface, NormalizedJobResult } from './JobProviderInterface';
import type { JobSearchFilters } from './BaseJobConnector';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { extractSeniorityFromJob } from '../models/seniorityUtils';

export class AdzunaAdapter implements JobProviderInterface {
  readonly providerName = 'ADZUNA';

  isAvailable(): boolean {
    return isSupabaseConfigured && Boolean(supabase);
  }

  async searchJobs(filters: JobSearchFilters): Promise<{ results: NormalizedJobResult[]; count: number }> {
    if (!this.isAvailable() || !supabase) {
      console.warn('[AdzunaAdapter] Supabase não está configurado. Retornando lista vazia.');
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

    const client = supabase;

    try {
      let totalCount = 0;
      const promises = keywords.map(async (keyword) => {
        const { data, error } = await client.functions.invoke('search-jobs', {
          body: { keyword, location, pageNum, provider: 'ADZUNA' }
        });

        if (error) {
          throw new Error(`[AdzunaAdapter] Erro na requisição: ${error.message}`);
        }

        if (data && typeof data.count === 'number') {
          totalCount = Math.max(totalCount, data.count);
        }

        console.log('[STAGE 2: ADZUNA ADAPTER RAW DATA]', JSON.stringify({
          providerName: this.providerName,
          count: data?.count,
          resultsLength: data?.results?.length,
          sampleFirst5: (data?.results || []).slice(0, 5).map((j: any) => ({
            title: j.title,
            company: j.company || j.companyName || j.companyNameNormalized,
            provider: j.sourcePlatform || j.rawSource,
            sourcePlatform: j.sourcePlatform,
            sources: j.sources,
            sourceUrl: j.sourceUrl,
            redirect_url: j.redirect_url,
            applyUrl: j.applyUrl,
            url: j.url
          }))
        }, null, 2));

        return (data?.results || []).map((res: any, idx: number): NormalizedJobResult => {
          const title = (res.title || '').replace(/<\/?[^>]+(>|$)/g, "").trim();
          const description = (res.description || '').replace(/<\/?[^>]+(>|$)/g, "").trim();
          const workMode = res.workModeNormalized || res.workMode || 'onsite';
          const seniority = extractSeniorityFromJob(title, description);
          const company = res.companyNameNormalized || res.companyName || res.company?.display_name || 'Empresa Confidencial';
          const locStr = res.locationNormalized || (typeof res.location === 'object' ? res.location?.display_name : res.location) || 'Brasil';
          const url = res.sourceUrl || res.redirect_url || '';

          return {
            id: `adzuna_${res.id || idx}_${Date.now()}`,
            title,
            company,
            location: locStr,
            description,
            url,
            seniority,
            workMode,
            is_active: res.isActive !== false,
            posted_at: res.created || new Date().toISOString(),
            salaryMin: res.salaryMinBRL || res.salaryMin || res.salary_min,
            salaryMax: res.salaryMaxBRL || res.salaryMax || res.salary_max,
            currency: res.currency || 'BRL',
            requirements: res.requirementsNormalized || res.requirements || [],
            rawSource: res.sourcePlatform || 'Adzuna',
            sources: res.sources && res.sources.length > 0 ? res.sources : [res.sourcePlatform || 'Adzuna']
          };
        });
      });

      const resultsArray = await Promise.all(promises);
      const allJobs = resultsArray.flat();
      return { results: allJobs, count: totalCount };
    } catch (err: any) {
      console.error('[AdzunaAdapter] Falha na busca:', err.message || err);
      return { results: [], count: 0 };
    }
  }
}
