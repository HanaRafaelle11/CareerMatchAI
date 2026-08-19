import { describe, it, expect } from 'vitest';
import { JobDeduplicationService } from '../../src/domain/services/JobDeduplicationService';
import type { Job } from '../../src/domain/models/types';

describe('JobDeduplicationService — Auditoria e Canonicalização de Vagas (Fase 8)', () => {
  it('1. Deve identificar duplicata exata da mesma vaga em dois providers diferentes', () => {
    const jobA: Job = {
      id: 'job-li-1',
      title: 'Senior Product Manager',
      companyName: 'Nubank',
      location: 'São Paulo, SP',
      requirements: ['Product Discovery', 'SQL'],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    const jobB: Job = {
      id: 'job-catho-1',
      title: 'Senior Product Manager',
      companyName: 'Nubank',
      location: 'São Paulo, SP',
      requirements: ['Product Discovery', 'SQL'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const classification = JobDeduplicationService.classifyDuplicate(jobA, jobB);
    expect(classification).toBe('EXACT_DUPLICATE');
  });

  it('2. Deve tolerar pequenas diferenças no título, acentuação e capitalização (PROBABLE_DUPLICATE)', () => {
    const jobA = { title: 'Gerente de Produto Sênior', companyName: 'Fintech S.A.', location: 'Remoto' };
    const jobB = { title: 'Gerente de Produto Senior (B2B)', companyName: 'Fintech SA', location: 'Remoto' };

    const classification = JobDeduplicationService.classifyDuplicate(jobA, jobB);
    expect(classification).toBe('PROBABLE_DUPLICATE');
  });

  it('3. Deve classificar como DISTINCT vagas em empresas diferentes com mesmo título', () => {
    const jobA = { title: 'Senior Product Manager', companyName: 'Nubank', location: 'São Paulo' };
    const jobB = { title: 'Senior Product Manager', companyName: 'Stone', location: 'São Paulo' };

    const classification = JobDeduplicationService.classifyDuplicate(jobA, jobB);
    expect(classification).toBe('DISTINCT');
  });

  it('4. Deve classificar como DISTINCT vagas com cargos diferentes na mesma empresa', () => {
    const jobA = { title: 'Backend Developer', companyName: 'Nubank', location: 'São Paulo' };
    const jobB = { title: 'Product Manager', companyName: 'Nubank', location: 'São Paulo' };

    const classification = JobDeduplicationService.classifyDuplicate(jobA, jobB);
    expect(classification).toBe('DISTINCT');
  });

  it('5. deduplicateJobs deve agrupar múltiplos providers e enriquecer requisitos sem perder dados', () => {
    const rawJobs = [
      { id: 'j1', title: 'Senior Product Manager', companyName: 'Nubank', location: 'São Paulo', provider: 'LinkedIn', url: 'https://linkedin.com/j1', requirements: ['SQL'], isActive: true },
      { id: 'j2', title: 'Senior Product Manager', companyName: 'Nubank', location: 'São Paulo', provider: 'Glassdoor', url: 'https://glassdoor.com/j2', requirements: ['SQL', 'Product Discovery', 'Roadmap'], salary: 'R$ 20.000', isActive: true },
      { id: 'j3', title: 'Customer Success Manager', companyName: 'Totvs', location: 'Remoto', provider: 'LinkedIn', url: 'https://linkedin.com/j3', requirements: ['NPS'], isActive: true }
    ];

    const deduplicated = JobDeduplicationService.deduplicateJobs(rawJobs as any);

    expect(deduplicated.length).toBe(2);
    const nubankJob = deduplicated.find(j => j.companyName === 'Nubank')!;
    expect(nubankJob.duplicateCount).toBe(2);
    expect(nubankJob.providers).toEqual(['LinkedIn', 'Glassdoor']);
    expect(nubankJob.sourceUrls).toEqual(['https://linkedin.com/j1', 'https://glassdoor.com/j2']);
    expect(nubankJob.requirements).toHaveLength(3); // Enriquecido com os 3 requisitos do Glassdoor
    expect(nubankJob.salary).toBe('R$ 20.000');
  });
});
