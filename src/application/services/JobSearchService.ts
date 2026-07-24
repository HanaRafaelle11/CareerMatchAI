import type { Job } from '../../domain/models/types';
import type { JobSearchFilters } from '../../domain/adapters/BaseJobConnector';
import { 
  type JobProviderInterface, 
  type NormalizedJobResult, 
  mapNormalizedToVocentroJob 
} from '../../domain/adapters/JobProviderInterface';
import { AdzunaAdapter } from '../../domain/adapters/AdzunaAdapter';
import { JoobleAdapter } from '../../domain/adapters/JoobleAdapter';
import { SerpApiAdapter } from '../../domain/adapters/SerpApiAdapter';

export type PrimaryProviderStrategy = 'SERPAPI' | 'JOOBLE' | 'ADZUNA' | 'AGGREGATED' | 'MULTIPLE_AGGREGATED';

export class JobSearchService {
  private static providers: Record<string, JobProviderInterface> = {
    ADZUNA: new AdzunaAdapter(),
    JOOBLE: new JoobleAdapter(),
    SERPAPI: new SerpApiAdapter(),
  };

  /**
   * Obtém a estratégia padrão de provedor das variáveis de ambiente (padrão: AGGREGATED)
   */
  static getPrimaryStrategy(): PrimaryProviderStrategy {
    const envStrategy = (import.meta.env.VITE_PRIMARY_JOB_PROVIDER || 'AGGREGATED').toUpperCase();
    if (['SERPAPI', 'JOOBLE', 'ADZUNA', 'AGGREGATED'].includes(envStrategy)) {
      return envStrategy as PrimaryProviderStrategy;
    }
    return 'AGGREGATED';
  }

  /**
   * Deduplica lista de vagas normalizadas por (empresa + título + localização)
   * Preserva a lista completa de origens (sources) e dá preferência a URLs diretas
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

        // Se a URL existente for de um agregador (Adzuna) e a nova for de outra fonte direta (Jooble, SerpApi, Gupy), preferir a URL direta
        const existingIsAdzuna = (existing.url || '').includes('adzuna.com');
        const newIsNotAdzuna = job.url && !job.url.includes('adzuna.com');
        if (existingIsAdzuna && newIsNotAdzuna) {
          existing.url = job.url;
          existing.rawSource = currentSource;
        }
      } else {
        map.set(key, {
          ...job,
          sources: [...itemSources]
        });
      }
    }

    return Array.from(map.values());
  }

  /**
   * Garante enriquecimento de descrição e remove apenas vagas vazias ou com descrições insignificantes (< 30 caracteres)
   */
  static enrichAndFilterDescriptions(jobs: NormalizedJobResult[]): NormalizedJobResult[] {
    return jobs.filter(job => {
      if (!job.description) return false;
      const cleanDesc = job.description.replace(/<\/?[^>]+(>|$)/g, '').trim();
      return cleanDesc.length >= 30;
    });
  }

  /**
   * Filtra resultados por status ativo e senioridade (se solicitada)
   */
  static applyFilters(jobs: NormalizedJobResult[], filters: JobSearchFilters): NormalizedJobResult[] {
    let result = jobs.filter(j => j.is_active !== false);

    if (filters.remoteOnly) {
      result = result.filter(j => j.workMode === 'remote');
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

  /**
   * Executa busca multi-provedor com estratégia de Fallback / Waterfall e Agregação
   */
  static async searchJobs(filters: JobSearchFilters): Promise<{ 
    results: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]; 
    count: number;
    providerUsed: string;
  }> {
    const strategy = this.getPrimaryStrategy();
    console.log(`[JobSearchService] Iniciando busca com estratégia: ${strategy}`);

    let rawResults: NormalizedJobResult[] = [];
    let providerUsed = strategy;

    if (strategy === 'AGGREGATED') {
      // ── Execução Paralela em Todos os Provedores Disponíveis ──
      const activeProviders = Object.values(this.providers).filter(p => p.isAvailable());
      const searchPromises = activeProviders.map(async p => {
        try {
          const res = await p.searchJobs(filters);
          console.log(`[JobSearchService Provider] Provedor ${p.providerName} retornou ${res.results.length} vagas.`);
          return res.results;
        } catch (err) {
          console.warn(`[JobSearchService] Falha no provedor ${p.providerName}:`, err);
          return [];
        }
      });

      const allResults = await Promise.all(searchPromises);
      rawResults = allResults.flat();
      providerUsed = 'MULTIPLE_AGGREGATED';
    } else {
      // ── Execução Waterfall (Fallback) ──
      const waterfallOrder: PrimaryProviderStrategy[] = [
        strategy,
        ...(['SERPAPI', 'JOOBLE', 'ADZUNA'] as PrimaryProviderStrategy[]).filter(s => s !== strategy)
      ];

      for (const currentProvKey of waterfallOrder) {
        const provider = this.providers[currentProvKey];
        if (provider && provider.isAvailable()) {
          try {
            console.log(`[JobSearchService Waterfall] Testando provedor: ${currentProvKey}...`);
            const res = await provider.searchJobs(filters);
            
            // Valida se retornou resultados com descrições ricas (> 200 caracteres)
            const enriched = this.enrichAndFilterDescriptions(res.results);
            if (enriched.length > 0) {
              rawResults = res.results;
              providerUsed = currentProvKey;
              console.log(`[JobSearchService Waterfall] Sucesso no provedor ${currentProvKey} (${rawResults.length} vagas encontradas)`);
              break;
            } else {
              console.warn(`[JobSearchService Waterfall] Provedor ${currentProvKey} retornou 0 vagas válidas (> 200 chars). Acionando fallback...`);
            }
          } catch (err) {
            console.warn(`[JobSearchService Waterfall] Erro no provedor ${currentProvKey}. Acionando fallback...`, err);
          }
        }
      }
    }

    // ── Log Estatístico de Vagas por Provedor ──
    const providerStats: Record<string, number> = {};
    rawResults.forEach(j => {
      const src = j.rawSource || 'Desconhecido';
      providerStats[src] = (providerStats[src] || 0) + 1;
    });
    console.log(`[JobSearchService AUDIT] Total de ${rawResults.length} vagas recebidas de provedores. Detalhamento:`, providerStats);

    // ── Enriquecimento, Deduplicação e Filtragem ──
    const deduplicated = this.deduplicateJobs(rawResults);
    const enriched = this.enrichAndFilterDescriptions(deduplicated);
    const filtered = this.applyFilters(enriched, filters);

    console.log(`
========== SEARCH PIPELINE ==========
Provider received: ${rawResults.length}
After deduplication: ${deduplicated.length}
After description filter: ${enriched.length}
After user filters: ${filtered.length}
Final returned: ${filtered.length}
=====================================
    `);

    // Mapeia para o modelo Vocentro Job
    const mapped = filtered.map(mapNormalizedToVocentroJob);

    console.log('[STAGE 3: JOB_SEARCH_SERVICE OUTPUT]', JSON.stringify({
      providerUsed,
      count: mapped.length,
      sampleFirst5: mapped.slice(0, 5).map(j => ({
        title: j.title,
        company: j.companyName,
        provider: j.sourcePlatform,
        sourcePlatform: j.sourcePlatform,
        sources: j.sources,
        sourceUrl: j.sourceUrl,
        redirect_url: (j as any).redirect_url,
        applyUrl: (j as any).applyUrl,
        url: (j as any).url
      }))
    }, null, 2));

    return {
      results: mapped,
      count: mapped.length,
      providerUsed
    };
  }
}
