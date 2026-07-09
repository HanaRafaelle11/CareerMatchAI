import type { Job } from '../models/types';
import { BaseJobConnector, type JobSearchFilters } from './BaseJobConnector';

export class AdzunaConnector extends BaseJobConnector {
  readonly platformName = 'Adzuna';

  private appId: string;
  private appKey: string;

  constructor() {
    super();
    this.appId = (import.meta.env.VITE_ADZUNA_APP_ID as string) || '';
    this.appKey = (import.meta.env.VITE_ADZUNA_APP_KEY as string) || '';
  }

  async searchJobs(filters: JobSearchFilters): Promise<Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]> {
    // Se as chaves de API não estiverem configuradas, joga erro explícito que a UI captura
    if (!this.appId || !this.appKey) {
      throw new Error('API_NOT_CONFIGURED: As credenciais da API do Adzuna não estão configuradas no arquivo .env (VITE_ADZUNA_APP_ID / VITE_ADZUNA_APP_KEY).');
    }

    const keywords = filters.keywords && filters.keywords.length > 0
      ? filters.keywords
      : [filters.keyword || 'React'];
      
    const location = filters.location || 'Brasil';
    const pageNum = filters.page || 1;

    try {
      const promises = keywords.map(async (keyword) => {
        // Consultando Adzuna para o Brasil (country = br) na página correspondente
        const url = `https://api.adzuna.com/v1/api/jobs/br/search/${pageNum}?app_id=${this.appId}&app_key=${this.appKey}&results_per_page=15&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(location)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Falha ao consultar API do Adzuna para termo: ${keyword}`);
        }

        const data = await response.json();
        
        return (data.results || []).map((result: any) => {
          const title = result.title.replace(/<\/?[^>]+(>|$)/g, ""); // Limpar HTML
          const description = result.description.replace(/<\/?[^>]+(>|$)/g, "");
          
          let workMode: 'remote' | 'hybrid' | 'onsite' = 'onsite';
          if (title.toLowerCase().includes('remoto') || title.toLowerCase().includes('remote') || description.toLowerCase().includes('remoto')) {
            workMode = 'remote';
          } else if (title.toLowerCase().includes('hibrido') || title.toLowerCase().includes('híbrido') || description.toLowerCase().includes('híbrido')) {
            workMode = 'hybrid';
          }

          let seniority: 'junior' | 'pleno' | 'senior' | 'lead' | 'director' = 'pleno';
          const titleLower = title.toLowerCase();
          if (titleLower.includes('junior') || titleLower.includes('júnior') || titleLower.includes('jr')) {
            seniority = 'junior';
          } else if (titleLower.includes('senior') || titleLower.includes('sênior') || titleLower.includes('sr')) {
            seniority = 'senior';
          } else if (titleLower.includes('lead') || titleLower.includes('lider') || titleLower.includes('liderança')) {
            seniority = 'lead';
          } else if (titleLower.includes('diretor') || titleLower.includes('director')) {
            seniority = 'director';
          }

          const possibleReqs = [
            'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 
            'JavaScript', 'CSS', 'Figma', 'Git', 'Customer Success', 'Salesforce', 
            'SQL', 'SaaS', 'NPS', 'Churn', 'Onboarding', 'CSAT', 'Retention'
          ];
          const requirements = possibleReqs.filter(req => 
            new RegExp(`\\b${req}\\b`, 'i').test(title + ' ' + description)
          );

          return {
            companyId: 'adzuna',
            companyName: result.company?.display_name || 'Empresa Confidencial',
            title: title,
            description: description,
            requirements: requirements.length > 0 ? requirements : ['Tecnologia'],
            location: result.location?.display_name || 'Brasil',
            workMode: workMode,
            seniority: seniority,
            salaryMin: result.salary_min || undefined,
            salaryMax: result.salary_max || undefined,
            currency: 'BRL',
            sourceUrl: result.redirect_url,
            sourcePlatform: this.platformName,
            isActive: true
          };
        });
      });

      const resultsArray = await Promise.all(promises);
      const allJobs = resultsArray.flat();

      // Deduplicação semântica por título + empresa
      const seen = new Set<string>();
      const deduplicated: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [];
      for (const job of allJobs) {
        const key = `${job.title.toLowerCase()}|${job.companyName.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(job);
        }
      }

      // Filtrar apenas remotas se requisitado
      if (filters.remoteOnly) {
        return deduplicated.filter(j => j.workMode === 'remote');
      }

      return deduplicated;
    } catch (error) {
      console.error('Erro no conector Adzuna:', error);
      throw error;
    }
  }
}
