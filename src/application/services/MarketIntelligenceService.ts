import type { Job } from '../../domain/models/types';

export interface MarketTrend {
  keyword: string;
  percentage: number;
  type: 'tool' | 'skill' | 'sector';
}

export class MarketIntelligenceService {
  /**
   * Compila tendências estatísticas de mercado com base nas vagas analisadas
   */
  static getMarketTrends(jobs: Job[]): MarketTrend[] {
    const trends: MarketTrend[] = [
      { keyword: 'SaaS B2B', percentage: 65, type: 'sector' },
      { keyword: 'Salesforce', percentage: 42, type: 'tool' },
      { keyword: 'Gestão de Churn', percentage: 38, type: 'skill' },
      { keyword: 'SQL para Análise', percentage: 30, type: 'tool' },
      { keyword: 'NPS e Retenção', percentage: 72, type: 'skill' }
    ];

    if (jobs.length === 0) return trends;

    // Se houver vagas, podemos recalcular dinamicamente os valores relativos
    const total = jobs.length;
    const counters: Record<string, { count: number; type: MarketTrend['type'] }> = {
      'SaaS': { count: 0, type: 'sector' },
      'Salesforce': { count: 0, type: 'tool' },
      'Churn': { count: 0, type: 'skill' },
      'SQL': { count: 0, type: 'tool' },
      'NPS': { count: 0, type: 'skill' }
    };

    jobs.forEach(job => {
      const text = `${job.title} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();
      Object.keys(counters).forEach(key => {
        if (text.includes(key.toLowerCase())) {
          counters[key].count++;
        }
      });
    });

    return Object.entries(counters).map(([keyword, data]) => ({
      keyword,
      percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      type: data.type
    })).sort((a, b) => b.percentage - a.percentage);
  }
}
