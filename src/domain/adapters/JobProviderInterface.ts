import type { Job } from '../models/types';
import type { JobSearchFilters } from './BaseJobConnector';
import { extractSeniorityFromJob } from '../models/seniorityUtils';

export interface NormalizedJobResult {
  id: string; // Prefixed identifier (e.g., 'adzuna_123', 'jooble_456', 'serp_789')
  title: string;
  company: string;
  location: string;
  description: string; // Full sanitized text description
  url: string;
  seniority: 'junior' | 'pleno' | 'senior' | 'lead' | 'director';
  workMode: 'remote' | 'hybrid' | 'onsite';
  is_active: boolean;
  posted_at: string; // ISO timestamp or formatted string
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requirements?: string[];
  rawSource?: string;
  sources?: string[];
}

export interface JobProviderInterface {
  readonly providerName: string;
  searchJobs(filters: JobSearchFilters): Promise<{
    results: NormalizedJobResult[];
    count: number;
  }>;
  isAvailable(): boolean;
}

/** Utility converter to map NormalizedJobResult to Vocentro Job model */
export function mapNormalizedToVocentroJob(
  normalized: NormalizedJobResult
): Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return {
    companyId: normalized.company.toLowerCase().replace(/\s+/g, '_'),
    companyName: normalized.company || 'Empresa Confidencial',
    title: normalized.title,
    description: normalized.description,
    requirements: normalized.requirements && normalized.requirements.length > 0 ? normalized.requirements : ['Geral'],
    location: normalized.location || 'Brasil',
    workMode: normalized.workMode || 'onsite',
    seniority: extractSeniorityFromJob(normalized.title, normalized.description),
    salaryMin: normalized.salaryMin,
    salaryMax: normalized.salaryMax,
    currency: normalized.currency || 'BRL',
    sourceUrl: normalized.url,
    sourcePlatform: normalized.rawSource || 'JobAggregator',
    sources: normalized.sources && normalized.sources.length > 0 ? normalized.sources : [normalized.rawSource || 'JobAggregator'],
    isActive: normalized.is_active !== false,
  };
}
