import type { JobProviderInterface, NormalizedJobResult } from './JobProviderInterface';
import type { JobSearchFilters } from './BaseJobConnector';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { extractSeniorityFromJob } from '../models/seniorityUtils';

export class JoobleAdapter implements JobProviderInterface {
  readonly providerName = 'JOOBLE';

  isAvailable(): boolean {
    return isSupabaseConfigured && Boolean(supabase);
  }

  async searchJobs(filters: JobSearchFilters): Promise<{ results: NormalizedJobResult[]; count: number }> {
    if (!this.isAvailable() || !supabase) {
      console.warn('[JoobleAdapter] Supabase não está configurado. Retornando lista vazia.');
      return { results: [], count: 0 };
    }

    const keyword = filters.keyword || (filters.keywords && filters.keywords[0]) || 'React';
    const location = filters.location || 'Brasil';
    const pageNum = filters.page || 1;

    try {
      const { data, error } = await supabase.functions.invoke('search-jobs', {
        body: { keyword, location, pageNum, provider: 'JOOBLE' }
      });

      if (error) {
        throw new Error(`[JoobleAdapter] Erro na Edge Function: ${error.message}`);
      }

      console.log('[STAGE 2: JOOBLE ADAPTER RAW DATA]', JSON.stringify({
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
        const company = res.company || res.companyName || 'Empresa Confidencial';
        const locStr = res.location || location;
        const url = res.sourceUrl || res.link || res.url || res.redirect_url || '';
        const workMode = (locStr.toLowerCase().includes('remot') || title.toLowerCase().includes('remot')) ? 'remote' : 'onsite';
        const seniority = extractSeniorityFromJob(title, description);

        return {
          id: `jooble_${res.id || idx}_${Date.now()}`,
          title,
          company,
          location: locStr,
          description,
          url,
          seniority,
          workMode,
          is_active: res.isActive !== false,
          posted_at: res.updated || res.created || new Date().toISOString(),
          salaryMin: res.salaryMin,
          salaryMax: res.salaryMax,
          currency: 'BRL',
          requirements: res.requirements || [],
          rawSource: res.sourcePlatform || 'Jooble',
          sources: res.sources && res.sources.length > 0 ? res.sources : [res.sourcePlatform || 'Jooble']
        };
      });

      return { results, count: data?.count || results.length };
    } catch (err: any) {
      console.error('[JoobleAdapter] Falha na busca:', err.message || err);
      return { results: [], count: 0 };
    }
  }
}
