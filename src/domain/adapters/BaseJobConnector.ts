import type { Job } from '../models/types';

export interface JobSearchFilters {
  keyword?: string;
  keywords?: string[]; // Múltiplas palavras-chave de busca geradas em paralelo
  location?: string;
  remoteOnly?: boolean;
  workModes?: string[]; // Modalidades selecionadas: remote, hybrid, onsite
  minSalary?: number;
  page?: number; // Suporte à paginação
}

export abstract class BaseJobConnector {
  abstract readonly platformName: string;
  
  // Conecta e busca vagas públicas normalizando-as para o formato padrão do Vocentro
  abstract searchJobs(filters: JobSearchFilters): Promise<{ results: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]; count: number }>;
}
