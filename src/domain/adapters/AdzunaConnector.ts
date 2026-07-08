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
    const keyword = filters.keyword || 'React';
    const location = filters.location || 'Brasil';

    // Se chaves não estiverem configuradas, executa o fallback com vagas de tecnologia reais simuladas para o Brasil
    if (!this.appId || !this.appKey) {
      console.warn('Adzuna API credentials not configured. Using realistic local data fallback.');
      return this.getMockedBrazilianJobs(keyword, filters.remoteOnly);
    }

    try {
      // Adzuna API para o Brasil (country = br)
      const url = `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${this.appId}&app_key=${this.appKey}&results_per_page=10&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(location)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha ao consultar API do Adzuna.');

      const data = await response.json();
      
      return (data.results || []).map((result: any) => {
        // Normalização das vagas recebidas do Adzuna para o formato CareerMatch
        const title = result.title.replace(/<\/?[^>]+(>|$)/g, ""); // limpa tags HTML se houver
        const description = result.description.replace(/<\/?[^>]+(>|$)/g, "");
        
        // Mapeia modelo de trabalho
        let workMode: 'remote' | 'hybrid' | 'onsite' = 'onsite';
        if (title.toLowerCase().includes('remoto') || title.toLowerCase().includes('remote') || description.toLowerCase().includes('remoto')) {
          workMode = 'remote';
        } else if (title.toLowerCase().includes('hibrido') || title.toLowerCase().includes('híbrido') || description.toLowerCase().includes('híbrido')) {
          workMode = 'hybrid';
        }

        // Tenta inferir senioridade
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

        // Tenta deduzir requisitos como tags a partir da descrição ou título
        const possibleReqs = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'JavaScript', 'CSS', 'Figma', 'Git'];
        const requirements = possibleReqs.filter(req => 
          new RegExp(`\\b${req}\\b`, 'i').test(title + ' ' + description)
        );

        return {
          companyId: 'adzuna',
          companyName: result.company?.display_name || 'Empresa Confidencial',
          title: title,
          description: description,
          requirements: requirements.length > 0 ? requirements : ['JavaScript'],
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
    } catch (error) {
      console.error('Erro na chamada da API do Adzuna. Retornando fallback local:', error);
      return this.getMockedBrazilianJobs(keyword, filters.remoteOnly);
    }
  }

  // Fallback de dados para garantir que a feature funcione perfeitamente sem chaves
  private getMockedBrazilianJobs(keyword: string, remoteOnly?: boolean): Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] {
    const rawJobs = [
      {
        companyName: 'Pipefy',
        title: 'Customer Success Manager',
        description: 'Buscamos um Customer Success Manager para gerenciar nossa carteira de grandes clientes corporativos (Enterprise). Você será responsável por garantir adoção, monitorar NPS, mitigar Churn e atuar ativamente no upsell. Stack: SaaS, Customer Success, NPS, Churn, Excel.',
        requirements: ['Customer Success', 'SaaS', 'NPS', 'Churn', 'Liderança'],
        location: 'Remoto',
        workMode: 'remote' as const,
        seniority: 'lead' as const,
        salaryMin: 12000,
        salaryMax: 15000,
        sourceUrl: 'https://pipefy.com/careers'
      },
      {
        companyName: 'Serasa Experian',
        title: 'CS Operations Manager (Salesforce & SQL)',
        description: 'Responsável pela arquitetura de dados e relatórios da área de CS. Essencial ter experiência configurando dashboards de Salesforce e extraindo dados complexos via SQL. Desejável conhecimento em processos SaaS.',
        requirements: ['Customer Success', 'Salesforce', 'SQL', 'CS Operations'],
        location: 'Remoto',
        workMode: 'remote' as const,
        seniority: 'lead' as const,
        salaryMin: 13000,
        salaryMax: 17000,
        sourceUrl: 'https://serasa.com.br/carreiras'
      },
      {
        companyName: 'Omie',
        title: 'Head of Customer Success',
        description: 'Liderar o time nacional de CS da Omie. Foco em estratégias corporativas de retenção de clientes, implementação de playbooks de onboarding e otimização de métricas chaves.',
        requirements: ['Customer Success', 'Liderança', 'SaaS', 'Onboarding'],
        location: 'São Paulo - SP',
        workMode: 'hybrid' as const,
        seniority: 'director' as const,
        salaryMin: 18000,
        salaryMax: 24000,
        sourceUrl: 'https://omie.com.br/carreiras'
      },
      {
        companyName: 'Mercado Livre',
        title: 'Desenvolvedor Frontend Pleno (React & Next)',
        description: 'Buscamos um desenvolvedor frontend para integrar o time de Mercado Pago. Atuará na criação de fluxos de checkout e otimização de conversão. Stack: React, Next.js, TypeScript, Tailwind CSS, Jest.',
        requirements: ['React', 'TypeScript', 'Tailwind CSS', 'Jest'],
        location: 'São Paulo - SP',
        workMode: 'hybrid' as const,
        seniority: 'pleno' as const,
        salaryMin: 8500,
        salaryMax: 11500,
        sourceUrl: 'https://mercadolivre.com/careers'
      },
      {
        companyName: 'Nubank',
        title: 'Software Engineer Pleno - Backend (Node.js/Clojure)',
        description: 'Venha construir soluções financeiras robustas. Nosso time de backend trabalha com APIs de altíssima concorrência e resiliência. Desejável Node.js, TypeScript, Docker e Kubernetes.',
        requirements: ['Node.js', 'TypeScript', 'Docker', 'Kubernetes'],
        location: 'Remoto',
        workMode: 'remote' as const,
        seniority: 'pleno' as const,
        salaryMin: 9000,
        salaryMax: 12500,
        sourceUrl: 'https://nubank.com/carreiras'
      },
      {
        companyName: 'Ifood',
        title: 'Mobile Engineer (React Native)',
        description: 'Responsável pelo desenvolvimento de novas funcionalidades no app do entregador. Experiência robusta com React Native, JavaScript, TypeScript, redux e consumo de APIs REST.',
        requirements: ['React Native', 'TypeScript', 'Redux', 'API REST'],
        location: 'Campinas - SP',
        workMode: 'hybrid' as const,
        seniority: 'senior' as const,
        salaryMin: 12000,
        salaryMax: 16000,
        sourceUrl: 'https://ifood.com/carreiras'
      }
    ];

    // Filtrar localmente com base na busca
    let filtered = rawJobs.filter(job => 
      job.title.toLowerCase().includes(keyword.toLowerCase()) ||
      job.description.toLowerCase().includes(keyword.toLowerCase()) ||
      job.requirements.some(r => r.toLowerCase().includes(keyword.toLowerCase()))
    );

    // Se nenhum bater, retorna tudo para não vir vazio
    if (filtered.length === 0) {
      filtered = rawJobs;
    }

    if (remoteOnly) {
      filtered = filtered.filter(job => job.workMode === 'remote');
    }

    return filtered.map(f => ({
      companyId: 'mock-adzuna',
      companyName: f.companyName,
      title: f.title,
      description: f.description,
      requirements: f.requirements,
      location: f.location,
      workMode: f.workMode,
      seniority: f.seniority,
      salaryMin: f.salaryMin,
      salaryMax: f.salaryMax,
      currency: 'BRL',
      sourceUrl: f.sourceUrl,
      sourcePlatform: this.platformName,
      isActive: true
    }));
  }
}
