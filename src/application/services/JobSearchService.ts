import type { Job } from '../../domain/models/types';
import type { JobSearchFilters } from '../../domain/adapters/BaseJobConnector';
import { 
  type NormalizedJobResult, 
  mapNormalizedToVocentroJob 
} from '../../domain/adapters/JobProviderInterface';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { extractSeniorityFromJob } from '../../domain/models/seniorityUtils';

export interface ProviderDiagnostic {
  name: string;
  tier: 'A' | 'B' | 'C';
  status: 'ok' | 'skipped' | 'failed' | 'timeout' | 'no_results' | 'no_key';
  apiKeyPresent: boolean;
  httpStatus: number | null;
  responseTimeMs: number;
  rawJobsReturned: number;
  validJobsAfterNorm: number;
  discardedCount: number;
  discardReasons: Record<string, number>;
  errorType: string | null;
  errorMessage: string | null;
}

export interface AggregatorResult {
  results: NormalizedJobResult[];
  count: number;
  providerUsed: string;
  diagnostics: ProviderDiagnostic[];
  pipelineStats: {
    totalRaw: number;
    afterDedup: number;
    afterDescFilter: number;
    afterUserFilters: number;
    totalTimeMs: number;
  };
}

export class JobSearchService {
  /**
   * Executa busca agregada — UMA ÚNICA chamada à Edge Function que orquestra todos os provedores tiered.
   * Eliminada a duplicação de 3 adapters chamando a Edge Function separadamente.
   */
  static async searchJobs(filters: JobSearchFilters): Promise<{ 
    results: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]; 
    count: number;
    providerUsed: string;
    diagnostics?: ProviderDiagnostic[];
  }> {
    const startTime = Date.now();
    console.log(`[JobSearchService] Iniciando busca agregada unificada`);

    if (!isSupabaseConfigured || !supabase) {
      console.warn('[JobSearchService] Supabase não está configurado.');
      return { results: [], count: 0, providerUsed: 'NONE', diagnostics: [] };
    }

    // Build keywords array
    let keywordsToSearch = filters.keywords && filters.keywords.length > 0
      ? filters.keywords
      : [filters.keyword || 'Vagas'];

    if (filters.remoteOnly) {
      keywordsToSearch = keywordsToSearch.map(kw => {
        const kwLower = kw.toLowerCase();
        if (kwLower.includes('remoto') || kwLower.includes('remote')) return kw;
        return `${kw} remoto`;
      });
    }

    // Single call to Edge Function — no provider filter, all tiers run
    try {
      const { data, error } = await supabase.functions.invoke('search-jobs', {
        body: { 
          keyword: keywordsToSearch[0],
          keywords: keywordsToSearch,
          location: filters.location || 'Brasil', 
          pageNum: filters.page || 1
          // NO "provider" parameter — Edge Function runs ALL tiered connectors
        }
      });

      if (error) {
        console.error('[JobSearchService] Edge Function error:', error.message);
        return { results: [], count: 0, providerUsed: 'ERROR', diagnostics: [] };
      }

      const rawResults: NormalizedJobResult[] = (data?.results || []).map((res: any, idx: number): NormalizedJobResult => {
        const title = (res.title || '').replace(/<\/?[^>]+(>|$)/g, "").trim();
        const description = (res.description || '').replace(/<\/?[^>]+(>|$)/g, "").trim();
        const company = res.companyNameNormalized || res.companyName || res.company?.display_name || 'Empresa Confidencial';
        const locStr = res.locationNormalized || (typeof res.location === 'object' ? res.location?.display_name : res.location) || 'Brasil';
        const url = res.sourceUrl || res.redirect_url || res.link || res.url || '';
        const workMode = res.workModeNormalized || res.workMode || 'onsite';
        const seniority = extractSeniorityFromJob(title, description);

        return {
          id: `agg_${res.id || idx}_${Date.now()}`,
          title,
          company,
          location: locStr,
          description,
          url,
          seniority,
          workMode,
          is_active: res.isActive !== false,
          posted_at: res.publishedAt || res.created || new Date().toISOString(),
          salaryMin: res.salaryMinBRL || res.salaryMin || res.salary_min,
          salaryMax: res.salaryMaxBRL || res.salaryMax || res.salary_max,
          currency: res.currency || 'BRL',
          requirements: res.requirementsNormalized || res.requirements || [],
          rawSource: res.sourcePlatform || res.provider || 'JobAggregator',
          sources: res.sources && res.sources.length > 0 ? res.sources : [res.sourcePlatform || 'JobAggregator'],
          scoreOverall: res.scores?.overall ?? res.scoreOverall ?? 50,
          scores: res.scores || { overall: res.scoreOverall || 50 }
        };
      });

      // Deduplication
      const deduplicated = this.deduplicateJobs(rawResults);
      
      // Description filter
      const enriched = this.enrichAndFilterDescriptions(deduplicated);
      
      // User filters
      const filtered = this.applyFilters(enriched, filters);

      const totalTimeMs = Date.now() - startTime;

      console.log(`
========== SEARCH PIPELINE (UNIFIED) ==========
Edge Function returned: ${rawResults.length}
After deduplication: ${deduplicated.length}
After description filter: ${enriched.length}
After user filters: ${filtered.length}
Total time: ${totalTimeMs}ms
================================================
      `);

      // Provider stats log
      const providerStats: Record<string, number> = {};
      rawResults.forEach(j => {
        const src = j.rawSource || 'Desconhecido';
        providerStats[src] = (providerStats[src] || 0) + 1;
      });
      console.log(`[JobSearchService AUDIT] Vagas por provedor:`, providerStats);

      // Map to Vocentro Job model
      const mapped = filtered.map(mapNormalizedToVocentroJob);

      return {
        results: mapped,
        count: data?.count || mapped.length,
        providerUsed: 'UNIFIED_AGGREGATED',
        diagnostics: data?.diagnostics || []
      };
    } catch (err: any) {
      console.error('[JobSearchService] Falha na busca:', err.message || err);
      return { results: [], count: 0, providerUsed: 'ERROR', diagnostics: [] };
    }
  }

  /**
   * Deduplica lista de vagas normalizadas por (empresa + título + localização)
   */
  static deduplicateJobs(jobs: NormalizedJobResult[]): NormalizedJobResult[] {
    const map = new Map<string, NormalizedJobResult>();

    for (const job of jobs) {
      const cleanTitle = job.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanCompany = job.company.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLoc = job.location.toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `${cleanCompany}|${cleanTitle}|${cleanLoc}`;

      const currentSource = job.rawSource || 'Desconhecido';
      const itemSources = job.sources && job.sources.length > 0 ? job.sources : [currentSource];

      if (map.has(key)) {
        const existing = map.get(key)!;
        if (!existing.sources) existing.sources = [existing.rawSource || 'Desconhecido'];
        
        itemSources.forEach(s => {
          if (!existing.sources!.includes(s)) {
            existing.sources!.push(s);
          }
        });

        // Prefer direct URL over Adzuna redirect
        const existingIsAdzuna = (existing.url || '').includes('adzuna.com');
        const newIsNotAdzuna = job.url && !job.url.includes('adzuna.com');
        if (existingIsAdzuna && newIsNotAdzuna) {
          existing.url = job.url;
          existing.rawSource = currentSource;
        }
      } else {
        map.set(key, { ...job, sources: [...itemSources] });
      }
    }

    return Array.from(map.values());
  }

  /**
   * Remove vagas com descrições insignificantes (< 30 caracteres)
   */
  static enrichAndFilterDescriptions(jobs: NormalizedJobResult[]): NormalizedJobResult[] {
    return jobs.filter(job => {
      if (!job.description) return false;
      const cleanDesc = job.description.replace(/<\/?[^>]+(>|$)/g, '').trim();
      return cleanDesc.length >= 30;
    });
  }

  /**
   * Filtra resultados por status ativo, modalidade e senioridade
   */
  static applyFilters(jobs: NormalizedJobResult[], filters: JobSearchFilters): NormalizedJobResult[] {
    let result = jobs.filter(j => j.is_active !== false);

    if (filters.remoteOnly) {
      result = result.filter(j => j.workMode === 'remote');
    }

    if (filters.workModes && filters.workModes.length > 0) {
      result = result.filter(j => filters.workModes!.includes(j.workMode));
    }

    if (filters.seniority && filters.seniority !== 'all') {
      const targetSen = filters.seniority.toLowerCase();
      result = result.filter(j => {
        const jSen = j.seniority.toLowerCase();
        return jSen.includes(targetSen) || targetSen.includes(jSen);
      });
    }

    return result;
  }
}
