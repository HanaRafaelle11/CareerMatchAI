import type { Job } from '../models/types';

export interface JobSearchFilters {
  keyword?: string;
  keywords?: string[]; // Múltiplas palavras-chave de busca geradas em paralelo
  location?: string;
  remoteOnly?: boolean;
  page?: number; // Suporte à paginação
}

export abstract class BaseJobConnector {
  abstract readonly platformName: string;
  
  // Conecta e busca vagas públicas normalizando-as para o formato padrão do CareerMatch AI
  abstract searchJobs(filters: JobSearchFilters): Promise<Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]>;
}
