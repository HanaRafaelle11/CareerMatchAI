export interface RawJob {
  title: string;
  description: string;
  companyName: string;
  location: string;
  workMode?: 'remote' | 'hybrid' | 'onsite';
  seniority?: 'junior' | 'pleno' | 'senior' | 'lead' | 'director';
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  sourceUrl: string;
  sourcePlatform: string;
  requirements?: string[];
  benefits?: string[];
  publishedAt?: string;
}

export interface JobIntent {
  canonical_key?: string;
  family: string;
  primary_titles: string[];
  secondary_titles: string[];
  negative_titles: string[];
  skills: string[];
  preferred_skills: string[];
  negative_keywords: string[];
  industry: string;
  department?: string;
  raw_query?: string;
}

export abstract class BaseJobConnector {
  abstract readonly platformName: string;
  abstract searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]>;
}
