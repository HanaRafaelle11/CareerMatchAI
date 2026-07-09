import { BaseJobConnector, type JobSearchFilters } from '../../domain/adapters/BaseJobConnector';
import { AdzunaConnector } from '../../domain/adapters/AdzunaConnector';
import type { Job } from '../../domain/models/types';

export class JobDiscoveryService {
  private connectors: BaseJobConnector[] = [];

  constructor() {
    // Registra os conectores ativos (Fácil escalabilidade futura)
    this.connectors.push(new AdzunaConnector());
  }

  /**
   * Dispara buscas concorrentes em todas as plataformas configuradas e unifica os resultados.
   * Se um conector lançar API_NOT_CONFIGURED, o erro é propagado para o hook do cliente tratar.
   */
  async discoverJobs(filters: JobSearchFilters): Promise<{ results: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]; count: number }> {
    try {
      const searchPromises = this.connectors.map(connector =>
        connector.searchJobs(filters).catch(err => {
          if (err.message && err.message.includes('API_NOT_CONFIGURED')) {
            throw err; // Repropagar erro de configuração para a UI saber o que houve
          }
          console.error(`Erro ao consultar conector ${connector.platformName}:`, err);
          return { results: [], count: 0 };
        })
      );

      const resultsArray = await Promise.all(searchPromises);
      const unifiedJobs = resultsArray.flatMap(r => r.results);
      const totalCount = resultsArray.reduce((acc, r) => acc + r.count, 0);

      // Deduplicação semântica simples baseada em título + empresa
      const seen = new Set<string>();
      const deduplicated: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [];

      for (const job of unifiedJobs) {
        const key = `${job.title.toLowerCase()}|${job.companyName.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(job);
        }
      }

      return { results: deduplicated, count: totalCount };
    } catch (error) {
      console.error('Erro no JobDiscoveryService:', error);
      throw error; // Re-throw para propagar até o React Query
    }
  }
}

export const jobDiscoveryService = new JobDiscoveryService();
