export interface IngestionResult {
  title: string;
  companyName: string;
  description: string;
  requirements: string[];
  location: string;
  workMode: 'remote' | 'hybrid' | 'onsite';
  seniority: 'junior' | 'pleno' | 'senior' | 'lead' | 'director';
  salary?: string;
  salaryNumeric?: number;
  benefits?: string[];
  sourceUrl?: string;
  sourcePlatform: string;
}

export abstract class BaseJobParser {
  abstract parse(input: any): Promise<IngestionResult>;
}
