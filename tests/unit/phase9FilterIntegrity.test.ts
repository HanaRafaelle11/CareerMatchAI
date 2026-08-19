import { describe, it, expect } from 'vitest';
import { ProductJobRankingService } from '../../src/domain/services/ProductJobRankingService';
import { JobQualityService } from '../../src/domain/services/JobQualityService';
import type { Job, Resume, CareerGoal } from '../../src/domain/models/types';

describe('Phase 9 — Integridade de Filtros, Ordenação e Não-Regressão de Relevância', () => {

  const baseResume: Resume = {
    id: 'res-pm-1',
    userId: 'usr-1',
    fullName: 'Mariana PM',
    yearsOfExperience: 5,
    skills: [{ name: 'Product Discovery' }, { name: 'Roadmap' }, { name: 'SQL' }],
    experiences: [{ role: 'Product Manager Pleno', companyName: 'Fintech Hub' }],
    createdAt: new Date().toISOString()
  };

  const productGoal: CareerGoal = {
    id: 'goal-pm-sr',
    userId: 'usr-1',
    intentType: 'same_area_grow',
    targetArea: 'Produto',
    targetRoles: ['Product Manager Sênior'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('1. Invariante: Vagas de alto Fit e Goal nunca são descartadas por filtros padrão', () => {
    const excellentJob = {
      id: 'job-exc',
      title: 'Product Manager Sênior',
      companyName: 'Nubank',
      description: 'Liderar discovery e roadmap de produtos financeiros.',
      requirements: ['Product Discovery', 'Roadmap', 'SQL'],
      seniority: 'senior',
      location: 'São Paulo',
      workMode: 'hybrid',
      isActive: true,
      createdAt: '2026-08-15'
    } as any;

    const ranked = ProductJobRankingService.rankJobs([excellentJob], baseResume, null, productGoal, { filterLowQuality: true, minScoreCutoff: 30 });
    expect(ranked.length).toBe(1);
    expect(ranked[0].match.careerFitScore).toBeGreaterThanOrEqual(75);
    expect(ranked[0].match.careerGoalScore).toBeGreaterThanOrEqual(75);
  });

  it('2. Invariante: Filtro de baixa qualidade remove apenas vagas com dados corrompidos sem impactar vagas legítimas', () => {
    const goodJob = {
      id: 'job-good',
      title: 'Product Manager Pleno',
      companyName: 'Stone',
      description: 'Discovery e métricas de engajamento.',
      requirements: ['Product Discovery', 'SQL'],
      isActive: true
    } as any;

    const brokenJob = {
      id: 'job-broken',
      title: 'Vaga',
      companyName: 'Confidencial',
      description: 'Curta',
      requirements: [],
      isActive: true
    } as any;

    const ranked = ProductJobRankingService.rankJobs([goodJob, brokenJob], baseResume, null, productGoal, { filterLowQuality: true });
    expect(ranked.length).toBe(1);
    expect(ranked[0].job.id).toBe('job-good');
  });

  it('3. Invariante: Uma vaga pior nunca ultrapassa uma melhor por falha de desempate', () => {
    const strongJob = {
      id: 'job-strong',
      title: 'Product Manager Sênior',
      companyName: 'Nubank',
      description: 'Roadmap e discovery.',
      requirements: ['Product Discovery', 'Roadmap', 'SQL'],
      createdAt: '2026-08-01'
    } as any;

    const weakJob = {
      id: 'job-weak',
      title: 'Customer Success Manager',
      companyName: 'Totvs',
      description: 'Gestão de churn.',
      requirements: ['Customer Success', 'Churn'],
      createdAt: '2026-08-18' // Mais recente, porém com Fit muito inferior
    } as any;

    const ranked = ProductJobRankingService.rankJobs([weakJob, strongJob], baseResume, null, productGoal);
    expect(ranked[0].job.id).toBe('job-strong'); // Match forte lidera independentemente da data
  });
});
