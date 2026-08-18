import { describe, it, expect } from 'vitest';
import { CareerMatchEngineV3 } from '../../src/domain/services/CareerMatchEngineV3';
import type { Job, Resume, CareerGoal } from '../../src/domain/models/types';
import type { CareerProfileNew } from '../../src/application/hooks/useMyProfileAi';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BATERIA DE CASOS DE REFERÊNCIA ("GOLDEN CASES") — CareerMatchEngineV3
 * 
 * Avalia prioritariamente a RELAÇÃO ORDINAL e o COMPORTAMENTO dos resultados:
 * - Match Direto vs Promoção vs Transição vs Incompatibilidade
 * - GoalScore(Mais Aderente ao Objetivo) > GoalScore(Menos Aderente)
 * - Explicabilidade determinística e rastreabilidade de evidências
 * ─────────────────────────────────────────────────────────────────────────────
 */

describe('Golden Cases — Avaliação Comportamental e Ordinal V3', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 1: MATCH DIRETO (Senior Dev React -> Senior Dev React)
  // ─────────────────────────────────────────────────────────────────────────
  it('Golden Case 1: Match Direto deve ter Fit Alto (>= 80) e Goal Alto (>= 80)', () => {
    const candidateResume: Resume = {
      id: 'gc-dev-sr',
      userId: 'usr-gc-1',
      fileName: 'cv_dev.pdf',
      fullName: 'Lucas Ferreira',
      yearsOfExperience: 6,
      skills: [
        { name: 'React', category: 'hard_skill' },
        { name: 'TypeScript', category: 'hard_skill' },
        { name: 'Node.js', category: 'hard_skill' },
        { name: 'GraphQL', category: 'hard_skill' }
      ],
      experiences: [
        {
          role: 'Senior Frontend Engineer',
          companyName: 'Fintech X',
          description: 'Desenvolvimento e arquitetura de SPAs em React e TypeScript.'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const directJob: Job = {
      id: 'job-gc-direct',
      title: 'Senior Frontend Engineer (React/TypeScript)',
      companyName: 'Banco Digital Alpha',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'senior',
      requirements: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const sameAreaGoal: CareerGoal = {
      id: 'goal-gc-1',
      userId: 'usr-gc-1',
      intentType: 'same_area_grow',
      targetArea: 'Engenharia de Software Frontend',
      targetRoles: ['Senior Frontend Engineer', 'Staff Engineer'],
      targetSeniority: 'senior',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(directJob, candidateResume, null, sameAreaGoal);

    // Avaliação Comportamental
    expect(result.careerFitScore).toBeGreaterThanOrEqual(80);
    expect(result.careerGoalScore).toBeGreaterThanOrEqual(80);
    expect(result.transition.type).toBe('none');
    expect(result.skillsAssessment.missing.length).toBe(0);
    expect(result.skillsAssessment.matched.length).toBe(4);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 2: PROMOÇÃO DE SENIORIDADE (Pleno Dev -> Tech Lead)
  // Relação Ordinal: Fit(Pleno) > Fit(Lead), mas Goal(Lead) é Alto para Ambição de Liderança
  // ─────────────────────────────────────────────────────────────────────────
  it('Golden Case 2: Promoção de Senioridade deve apresentar Fit Moderado e Goal Alto alinhado ao objetivo', () => {
    const candidateResume: Resume = {
      id: 'gc-dev-pl',
      userId: 'usr-gc-2',
      fileName: 'cv_pleno.pdf',
      fullName: 'Beatriz Lima',
      yearsOfExperience: 4,
      skills: [
        { name: 'TypeScript', category: 'hard_skill' },
        { name: 'Node.js', category: 'hard_skill' },
        { name: 'PostgreSQL', category: 'hard_skill' },
        { name: 'Docker', category: 'hard_skill' }
      ],
      experiences: [
        {
          role: 'Backend Developer Pleno',
          companyName: 'Tech Hub',
          description: 'Construção de APIs e mentoria técnica de desenvolvedores juniores.'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const leadJob: Job = {
      id: 'job-gc-lead',
      title: 'Tech Lead Backend (Node.js)',
      companyName: 'SaaS Global',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'lead',
      requirements: ['Node.js', 'PostgreSQL', 'Liderança Técnica', 'Arquitetura de Microsserviços'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const leadershipGoal: CareerGoal = {
      id: 'goal-gc-2',
      userId: 'usr-gc-2',
      intentType: 'same_area_grow',
      targetArea: 'Liderança Técnica em Engenharia',
      targetRoles: ['Tech Lead', 'Engineering Lead'],
      targetSeniority: 'lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(leadJob, candidateResume, null, leadershipGoal);

    // Avaliação Ordinal
    // O Fit Atual reconhece o gap de senioridade (Lead vs Pleno), mas o Goal Score reconhece o alinhamento
    expect(result.careerGoalScore).toBeGreaterThanOrEqual(75);
    expect(result.dimensions.seniority).toBeLessThan(100);
    expect(result.skillsAssessment.transferable.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 3: TRANSIÇÃO PRÓXIMA (Customer Success -> Product Manager)
  // Relação Ordinal: GoalScore(Vaga PM) > GoalScore(Vaga Engenharia Backend)
  // ─────────────────────────────────────────────────────────────────────────
  it('Golden Case 3: Validação Ordinal — Transição de CS para PM deve pontuar mais em vaga de PM do que em Dev Backend', () => {
    const csProfile: CareerProfileNew = {
      id: 'prof-cs-gc',
      userId: 'usr-gc-3',
      personal: {
        fullName: 'Juliana CS',
        headline: 'Customer Success Manager Pleno'
      },
      summary: 'Profissional de CS com 4 anos de experiência em retenção, métricas SaaS, discovery com usuários e rituais ágeis.',
      skills: ['Customer Success', 'Onboarding', 'Jira', 'Churn', 'NPS', 'Comunicação'],
      experience: [
        {
          role: 'Customer Success Manager',
          companyName: 'Cloud SaaS',
          description: 'Gestão de contas, análise de feedback de produto e acompanhamento de métricas de engajamento.',
          isCurrent: true
        }
      ]
    };

    const csToPmGoal: CareerGoal = {
      id: 'goal-cs-pm',
      userId: 'usr-gc-3',
      intentType: 'career_transition',
      targetArea: 'Gestão de Produto (Product Management)',
      targetRoles: ['Product Manager', 'Associate Product Manager', 'Product Owner'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pmJob: Job = {
      id: 'job-pm-target',
      title: 'Product Manager Jr/Pleno',
      companyName: 'Fintech Hub',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'pleno',
      requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Metodologias Ágeis'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const devBackendJob: Job = {
      id: 'job-dev-unrelated',
      title: 'Senior Go / C++ Backend Developer',
      companyName: 'Infra Systems',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'senior',
      requirements: ['Golang', 'C++', 'Kubernetes', 'gRPC', 'Kernel Linux'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const resultPm = CareerMatchEngineV3.calculate(pmJob, null, csProfile, csToPmGoal);
    const resultDev = CareerMatchEngineV3.calculate(devBackendJob, null, csProfile, csToPmGoal);

    // RELAÇÃO ORDINAL CRÍTICA:
    // GoalScore(Vaga Alinhada ao Objetivo) DEVE ser expressivamente MAIOR que GoalScore(Vaga Desalinhada)
    expect(resultPm.careerGoalScore!).toBeGreaterThan(resultDev.careerGoalScore!);
    expect(resultPm.careerGoalScore!).toBeGreaterThanOrEqual(75);
    expect(resultDev.careerGoalScore!).toBeLessThan(50);
    expect(resultPm.transition.type).toMatch(/near|moderate/);
    expect(resultDev.transition.type).toBe('distant');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 4: TRANSIÇÃO MODERADA (Advogado Corporativo -> Especialista em DPO / Privacidade)
  // Relação Ordinal: GoalScore(DPO) > GoalScore(Cozinheiro)
  // ─────────────────────────────────────────────────────────────────────────
  it('Golden Case 4: Transição com base jurídica para Privacidade de Dados (DPO) deve reconhecer competências transferíveis', () => {
    const lawyerProfile: CareerProfileNew = {
      id: 'prof-lawyer-gc',
      userId: 'usr-gc-4',
      personal: {
        fullName: 'Rodrigo Direito',
        headline: 'Advogado Corporativo & Contratos'
      },
      summary: '5 anos de atuação em direito empresarial, análise de contratos, compliance normativo e governança.',
      skills: ['Direito Empresarial', 'Contratos', 'Compliance', 'Auditoria', 'Governança'],
      experience: [
        {
          role: 'Advogado Pleno',
          companyName: 'Escritório & Consultoria',
          description: 'Adequação regulatória, pareceres jurídicos e gestão de riscos corporativos.',
          isCurrent: true
        }
      ]
    };

    const dpoGoal: CareerGoal = {
      id: 'goal-lawyer-dpo',
      userId: 'usr-gc-4',
      intentType: 'career_transition',
      targetArea: 'Privacidade de Dados e Segurança da Informação',
      targetRoles: ['Data Protection Officer (DPO)', 'Analista de Privacidade', 'Consultor LGPD'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const dpoJob: Job = {
      id: 'job-dpo-lgpd',
      title: 'Consultor de Privacidade e LGPD / DPO',
      companyName: 'Tech Privacy Latam',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'pleno',
      requirements: ['LGPD', 'Governança de Dados', 'Compliance', 'Gestão de Riscos', 'Auditoria Regulatória'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const chefJob: Job = {
      id: 'job-chef-dist',
      title: 'Chefe de Cozinha / Sushiman',
      companyName: 'Restaurante Sushi',
      location: 'São Paulo',
      workMode: 'onsite',
      seniority: 'pleno',
      requirements: ['Culinária Japonesa', 'Corte de Peixes', 'Manipulação Higiênica'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const resultDpo = CareerMatchEngineV3.calculate(dpoJob, null, lawyerProfile, dpoGoal);
    const resultChef = CareerMatchEngineV3.calculate(chefJob, null, lawyerProfile, dpoGoal);

    // Validação Ordinal e de Transferabilidade
    expect(resultDpo.careerGoalScore!).toBeGreaterThan(resultChef.careerGoalScore!);
    expect(resultDpo.careerGoalScore!).toBeGreaterThanOrEqual(70);
    expect(resultDpo.skillsAssessment.transferable.length).toBeGreaterThan(0);
    expect(resultChef.careerGoalScore!).toBeLessThan(40);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 5: TRANSIÇÃO DISTANTE / INCOMPATÍVEL
  // Validação: Fit Baixo (< 30) e Goal Baixo (< 45) com classificação 'distant'
  // ─────────────────────────────────────────────────────────────────────────
  it('Golden Case 5: Vaga totalmente incompatível deve retornar scores baixos e classificação distante', () => {
    const devResume: Resume = {
      id: 'res-dev-back',
      userId: 'usr-gc-5',
      fileName: 'cv_dev.pdf',
      fullName: 'Marcos Dev',
      yearsOfExperience: 3,
      skills: [{ name: 'Python', category: 'hard_skill' }, { name: 'Django', category: 'hard_skill' }],
      experiences: [{ role: 'Python Developer', companyName: 'Software Ltda' }],
      createdAt: new Date().toISOString()
    };

    const nurseJob: Job = {
      id: 'job-enfermagem',
      title: 'Enfermeiro UTI Adulto',
      companyName: 'Hospital Central',
      location: 'Curitiba, PR',
      workMode: 'onsite',
      seniority: 'pleno',
      requirements: ['COREN Ativo', 'Cuidados Críticos', 'Farmacologia Hospitalar', 'Ventilação Mecânica'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const transitionToHealthGoal: CareerGoal = {
      id: 'goal-dev-health',
      userId: 'usr-gc-5',
      intentType: 'career_transition',
      targetArea: 'Enfermagem & Saúde Hospitalar',
      targetRoles: ['Enfermeiro', 'Técnico de Enfermagem'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(nurseJob, devResume, null, transitionToHealthGoal);

    expect(result.careerFitScore).toBeLessThan(30);
    expect(result.careerGoalScore).toBeLessThanOrEqual(50);
    expect(result.transition.type).toBe('distant');
    expect(result.skillsAssessment.matched.length).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 6: OBJETIVO SEM DADOS SUFICIENTES (careerGoal = null)
  // Validação: Fit normal, Goal estritamente null, sem erros
  // ─────────────────────────────────────────────────────────────────────────
  it('Golden Case 6: Perfil sem objetivo definido calcula FitScore e preserva GoalScore como null', () => {
    const designerResume: Resume = {
      id: 'res-design',
      userId: 'usr-gc-6',
      fileName: 'cv_ux.pdf',
      fullName: 'Clara UX',
      yearsOfExperience: 5,
      skills: [
        { name: 'Figma', category: 'hard_skill' },
        { name: 'UX Research', category: 'hard_skill' },
        { name: 'Design System', category: 'hard_skill' }
      ],
      experiences: [
        {
          role: 'Product Designer',
          companyName: 'Design Studio',
          description: 'Criação de design system e fluxos de usuário.'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const designJob: Job = {
      id: 'job-ux-sr',
      title: 'Senior Product Designer',
      companyName: 'Fintech Studio',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'senior',
      requirements: ['Figma', 'UX Research', 'Design System'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(designJob, designerResume, null, null);

    expect(result.careerFitScore).toBeGreaterThanOrEqual(75);
    expect(result.careerGoalScore).toBeNull();
    expect(result.explanation.goalHeadline).toContain('Defina seu objetivo profissional');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 7: AUDITORIA DE EXPLICABILIDADE DA ÁRVORE DE DECISÃO
  // Validação: Cada score deve ser decomposto e rastreável até suas evidências
  // ─────────────────────────────────────────────────────────────────────────
  it('Golden Case 7: Auditoria de Explicabilidade — Decomposição completa em 5 Dimensões e Evidências', () => {
    const candidateResume: Resume = {
      id: 'res-audit-01',
      userId: 'usr-gc-7',
      fileName: 'cv_audit.pdf',
      fullName: 'Gabriel Audit',
      yearsOfExperience: 5,
      skills: [
        { name: 'React', category: 'hard_skill' },
        { name: 'TypeScript', category: 'hard_skill' }
      ],
      experiences: [
        {
          role: 'Frontend Engineer',
          companyName: 'Tech Corp',
          description: 'Aplicações web em React e TypeScript.'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const job: Job = {
      id: 'job-audit',
      title: 'Frontend Engineer Pleno',
      companyName: 'App Store',
      location: 'Remoto',
      workMode: 'remote',
      seniority: 'pleno',
      requirements: ['React', 'TypeScript', 'TailwindCSS'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const goal: CareerGoal = {
      id: 'goal-audit',
      userId: 'usr-gc-7',
      intentType: 'same_area_grow',
      targetArea: 'Frontend Engineering',
      targetRoles: ['Frontend Engineer Pleno', 'Senior Frontend Engineer'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = CareerMatchEngineV3.calculate(job, candidateResume, null, goal);

    // 1. Árvore de 5 Dimensões presente
    expect(result.dimensions).toHaveProperty('skills');
    expect(result.dimensions).toHaveProperty('experience');
    expect(result.dimensions).toHaveProperty('seniority');
    expect(result.dimensions).toHaveProperty('context');
    expect(result.dimensions).toHaveProperty('careerGoal');

    // 2. Rastreabilidade de Features e Evidências
    expect(result.skillsAssessment.matched).toEqual(expect.arrayContaining(['React', 'TypeScript']));
    expect(result.skillsAssessment.missing).toEqual(expect.arrayContaining(['TailwindCSS']));
    expect(result.explanation.fitHeadline).toBeDefined();
    expect(result.explanation.strengths.length).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(80);
  });
});
