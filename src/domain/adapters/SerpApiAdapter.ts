import type { JobProviderInterface, NormalizedJobResult } from './JobProviderInterface';
import type { JobSearchFilters } from './BaseJobConnector';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { extractSeniorityFromJob } from '../models/seniorityUtils';

export class SerpApiAdapter implements JobProviderInterface {
  readonly providerName = 'SERPAPI';

  isAvailable(): boolean {
    return isSupabaseConfigured && Boolean(supabase);
  }

  async searchJobs(filters: JobSearchFilters): Promise<{ results: NormalizedJobResult[]; count: number }> {
    if (!this.isAvailable() || !supabase) {
      console.warn('[SerpApiAdapter] Supabase não está configurado. Retornando lista vazia.');
      return { results: [], count: 0 };
    }

    const keyword = filters.keyword || (filters.keywords && filters.keywords[0]) || 'React';
    const location = filters.location || 'Brasil';
    const pageNum = filters.page || 1;

    try {
      const { data, error } = await supabase.functions.invoke('search-jobs', {
        body: { keyword, location, pageNum, provider: 'SERPAPI' }
      });

      if (error) {
        throw new Error(`[SerpApiAdapter] Erro na Edge Function: ${error.message}`);
      }

      console.log('[STAGE 2: SERPAPI ADAPTER RAW DATA]', JSON.stringify({
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

      const results = (data?.results || []).map((res: any, idx: number): NormalizedJobResult => {
        const title = (res.title || '').replace(/<\/?[^>]+(>|$)/g, "").trim();
        const description = (res.description || res.snippet || '').replace(/<\/?[^>]+(>|$)/g, "").trim();
        const company = res.company_name || res.company || 'Empresa Confidencial';
        const locStr = res.location || location;
        const url = res.sourceUrl || res.share_link || res.link || res.apply_options?.[0]?.link || '';
        const workMode = (locStr.toLowerCase().includes('remot') || title.toLowerCase().includes('remot') || res.detected_extensions?.work_from_home) ? 'remote' : 'onsite';
        const seniority = extractSeniorityFromJob(title, description);

        return {
          id: `serp_${res.job_id || idx}_${Date.now()}`,
          title,
          company,
          location: locStr,
          description,
          url,
          seniority,
          workMode,
          is_active: res.isActive !== false,
          posted_at: res.detected_extensions?.posted_at || new Date().toISOString(),
          salaryMin: res.salaryMin,
          salaryMax: res.salaryMax,
          currency: 'BRL',
          requirements: res.requirements || [],
          rawSource: res.sourcePlatform || 'Google Jobs (SerpApi)',
          sources: res.sources && res.sources.length > 0 ? res.sources : [res.sourcePlatform || 'Google Jobs (SerpApi)']
        };
      });

      return { results, count: data?.count || results.length };
    } catch (err: any) {
      console.error('[SerpApiAdapter] Falha na busca:', err.message || err);
      return { results: [], count: 0 };
    }
  }
}
