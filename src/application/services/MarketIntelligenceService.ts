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
  static getMarketTrends(jobs: Job[], careerProfileNew?: any): MarketTrend[] {
    if (!jobs || jobs.length === 0) {
      if (careerProfileNew && careerProfileNew.skills && careerProfileNew.skills.length > 0) {
        return careerProfileNew.skills.slice(0, 5).map((s: any, idx: number) => ({
          keyword: s.name,
          percentage: 95 - idx * 8,
          type: 'skill'
        }));
      }
      return [];
    }

    const total = jobs.length;
    const counters: Record<string, { count: number; type: MarketTrend['type'] }> = {};

    jobs.forEach(job => {
      const skills = [...(job.requirements || [])];
      skills.forEach(skill => {
        const cleanSkill = skill.trim();
        if (!cleanSkill) return;
        const key = cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1).toLowerCase();
        if (!counters[key]) {
          counters[key] = { count: 0, type: 'skill' };
        }
        counters[key].count++;
      });
    });

    const results = Object.entries(counters).map(([keyword, data]) => ({
      keyword,
      percentage: total > 0 ? Math.min(100, Math.round((data.count / total) * 100)) : 0,
      type: data.type
    })).sort((a, b) => b.percentage - a.percentage);

    if (results.length > 0) return results.slice(0, 6);

    return [];
  }
}

