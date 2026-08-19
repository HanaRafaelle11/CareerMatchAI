import { describe, it, expect } from 'vitest';
import { ProductJobRankingService } from '../../src/domain/services/ProductJobRankingService';
import { JobQualityService } from '../../src/domain/services/JobQualityService';
import { JobDeduplicationService } from '../../src/domain/services/JobDeduplicationService';
import type { Job, Resume, CareerGoal } from '../../src/domain/models/types';

describe('Phase 8 — Matriz Completa de Qualidade de Ranking, Deduplicação e Relevância', () => {

  const baseResume: Resume = {
    id: 'res-1',
    userId: 'usr-1',
    fullName: 'Ana Silva',
    yearsOfExperience: 4,
    skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Jira' }],
    experiences: [{ role: 'Customer Success Specialist', companyName: 'SaaS Alpha' }],
    createdAt: new Date().toISOString()
  };

  const transitionGoal: CareerGoal = {
    id: 'goal-pm',
    userId: 'usr-1',
    intentType: 'career_transition',
    targetArea: 'Gestão de Produto',
    targetRoles: ['Product Manager', 'Associate Product Manager'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const continueGoal: CareerGoal = {
    id: 'goal-cs',
    userId: 'usr-1',
    intentType: 'same_area_continue',
    targetArea: 'Customer Success',
    targetRoles: ['Customer Success Specialist', 'CS Manager'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1 & 13. Duplicata exata e Provider duplicado
  it('1 & 13. Duplicata exata de diferentes providers é unificada e mantém provedores combinados', () => {
    const rawJobs = [
      { id: 'j1', title: 'Product Manager', companyName: 'Nubank', location: 'SP', provider: 'LinkedIn', requirements: ['SQL'] },
      { id: 'j2', title: 'Product Manager', companyName: 'Nubank', location: 'SP', provider: 'Glassdoor', requirements: ['SQL'] }
    ] as any;

    const ranked = ProductJobRankingService.rankJobs(rawJobs, baseResume, null, transitionGoal);
    expect(ranked.length).toBe(1);
    expect(ranked[0].job.providers).toEqual(['LinkedIn', 'Glassdoor']);
    expect(ranked[0].job.duplicateCount).toBe(2);
  });

  // 2. Duplicata provável
  it('2. Duplicata provável (título com variação de parênteses) é agregada', () => {
    const rawJobs = [
      { id: 'j1', title: 'Product Manager', companyName: 'Nubank', location: 'Remoto', provider: 'LinkedIn', requirements: ['SQL'] },
      { id: 'j2', title: 'Product Manager (B2B SaaS)', companyName: 'Nubank', location: 'Remoto', provider: 'Catho', requirements: ['SQL'] }
    ] as any;

    const ranked = ProductJobRankingService.rankJobs(rawJobs, baseResume, null, transitionGoal);
    expect(ranked.length).toBe(1);
  });

  // 3. Vaga distinta
  it('3. Vagas distintas em empresas diferentes permanecem separadas', () => {
    const rawJobs = [
      { id: 'j1', title: 'Product Manager', companyName: 'Nubank', location: 'Remoto', requirements: ['SQL'] },
      { id: 'j2', title: 'Product Manager', companyName: 'Stone', location: 'Remoto', requirements: ['SQL'] }
    ] as any;

    const ranked = ProductJobRankingService.rankJobs(rawJobs, baseResume, null, transitionGoal);
    expect(ranked.length).toBe(2);
  });

  // 4 & 15. Vaga baixa qualidade / descrição curta
  it('4 & 15. Vaga de baixa qualidade (sem requisitos ou descrição curta) é detectada e rebaixada', () => {
    const badJob = { title: 'Analista', companyName: 'Confidencial', description: 'Curta' };
    const quality = JobQualityService.evaluateJobQuality(badJob as any);

    expect(quality.level).toBe('LOW_QUALITY');
    expect(quality.issues.length).toBeGreaterThan(0);
  });

  // 5. Vaga alta qualidade
  it('5. Vaga de alta qualidade com requisitos estruturados recebe nível HIGH_QUALITY', () => {
    const goodJob = {
      title: 'Senior Product Manager',
      companyName: 'Nubank',
      description: 'Liderança de squads ágeis e discovery de crédito digital.',
      requirements: ['Product Discovery', 'SQL', 'Roadmap'],
      seniority: 'senior' as any,
      location: 'São Paulo'
    };
    const quality = JobQualityService.evaluateJobQuality(goodJob as any);
    expect(quality.level).toBe('HIGH_QUALITY');
    expect(quality.completenessScore).toBeGreaterThanOrEqual(80);
  });

  // 6. Fit alto + Goal alto
  it('6. Fit alto + Goal alto aparece com topo absoluto em Continuidade', () => {
    const directJob = { id: 'j-dir', title: 'Customer Success Specialist', companyName: 'SaaS Alpha', requirements: ['Customer Success', 'Onboarding', 'Jira'] } as any;
    const ranked = ProductJobRankingService.rankJobs([directJob], baseResume, null, continueGoal);

    expect(ranked[0].match.careerFitScore).toBeGreaterThanOrEqual(80);
    expect(ranked[0].match.careerGoalScore).toBeGreaterThanOrEqual(80);
  });

  // 7. Fit baixo + Goal alto (Transição estratégica)
  it('7. Fit baixo + Goal alto aparece no topo quando usuário está em transição', () => {
    const pmJob = { id: 'j-pm', title: 'Product Manager (SaaS B2B)', companyName: 'Fintech X', requirements: ['Product Discovery', 'SQL'] } as any;
    const csJob = { id: 'j-cs', title: 'Customer Success Specialist', companyName: 'SaaS Alpha', requirements: ['Customer Success', 'Onboarding'] } as any;

    const ranked = ProductJobRankingService.rankJobs([csJob, pmJob], baseResume, null, transitionGoal);
    expect(ranked[0].job.id).toBe('j-pm'); // PM lidera a lista de transição
    expect(ranked[0].match.careerGoalScore).toBeGreaterThan(70);
  });

  // 8. Fit alto + Goal null (Sem objetivo)
  it('8. Fit alto + Goal null ordena puramente por Fit sem gerar números artificiais de Goal', () => {
    const csJob = { id: 'j-cs', title: 'Customer Success Specialist', companyName: 'SaaS Alpha', requirements: ['Customer Success', 'Onboarding'] } as any;
    const ranked = ProductJobRankingService.rankJobs([csJob], baseResume, null, null);

    expect(ranked[0].match.careerGoalScore).toBeNull();
    expect(ranked[0].match.careerFitScore).toBeGreaterThanOrEqual(80);
  });

  // 9 & 11. Fit baixo + Goal baixo (Transição distante)
  it('9 & 11. Vaga incompatível (Enfermeiro) é descartada pelo corte de ruído', () => {
    const nurseJob = { id: 'j-nurse', title: 'Enfermeiro UTI', companyName: 'Hospital', requirements: ['COREN Ativo'] } as any;
    const ranked = ProductJobRankingService.rankJobs([nurseJob], baseResume, null, continueGoal, { minScoreCutoff: 30 });

    expect(ranked.length).toBe(0); // Filtrado abaixo do corte
  });

  // 10. Transição próxima
  it('10. Transição próxima (CS para Product Ops) possui alta competitividade de ranking', () => {
    const popsJob = { id: 'j-pops', title: 'Product Operations Analyst', companyName: 'iFood', requirements: ['Product Operations', 'Jira', 'Processos'] } as any;
    const popsGoal: CareerGoal = {
      id: 'goal-pops',
      userId: 'usr-1',
      intentType: 'career_transition',
      targetArea: 'Product Operations',
      targetRoles: ['Product Operations Analyst'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const ranked = ProductJobRankingService.rankJobs([popsJob], baseResume, null, popsGoal);

    expect(ranked.length).toBe(1);
    expect(ranked[0].match.careerGoalScore).toBeGreaterThanOrEqual(70);
  });

  // 12. Desempate
  it('12. Desempate de scores idênticos prioriza a vaga mais recente e de melhor qualidade', () => {
    const jobA = { id: 'ja', title: 'Product Manager', companyName: 'A', requirements: ['SQL'], createdAt: '2026-08-01' } as any;
    const jobB = { id: 'jb', title: 'Product Manager', companyName: 'B', requirements: ['SQL'], createdAt: '2026-08-15' } as any;

    const ranked = ProductJobRankingService.rankJobs([jobA, jobB], baseResume, null, transitionGoal);
    expect(ranked[0].job.id).toBe('jb'); // Mais recente primeiro
  });

  // 14. Vaga sem senioridade
  it('14. Vaga sem senioridade explícita continua sendo avaliada com resiliência', () => {
    const job = { id: 'j-noseniority', title: 'Customer Success Specialist', companyName: 'Beta', requirements: ['Customer Success'] } as any;
    const ranked = ProductJobRankingService.rankJobs([job], baseResume, null, continueGoal);

    expect(ranked.length).toBe(1);
    expect(ranked[0].match.dimensions.seniority).toBeGreaterThan(0);
  });
});
