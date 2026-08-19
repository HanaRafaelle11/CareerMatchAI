import type { Job, Resume, CareerGoal } from '../../src/domain/models/types';
import type { CareerProfileNew } from '../../src/application/hooks/useMyProfileAi';

export type OrdinalLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type TransitionLevel = 'none' | 'near' | 'moderate' | 'challenging' | 'distant';

export interface RealWorldMatchingCase {
  id: string;
  name: string;
  group: 'A_Continuity' | 'B_Promotion' | 'C_NearTransition' | 'D_ModerateTransition' | 'E_DistantTransition' | 'F_IncompleteData';
  job: Job;
  resume: Resume;
  profile?: CareerProfileNew | null;
  careerGoal?: CareerGoal | null;
  expected: {
    fit: OrdinalLevel;
    goal: OrdinalLevel | null;
    transition: TransitionLevel;
  };
}

export function scoreToOrdinal(score: number | null): OrdinalLevel | null {
  if (score === null || score === undefined) return null;
  if (score >= 75) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'very_low';
}

export const REAL_WORLD_MATCHING_CASES: RealWorldMatchingCase[] = [
  // ── GRUPO A: CONTINUIDADE ──
  {
    id: 'A1',
    name: 'CSM Senior → CSM Senior',
    group: 'A_Continuity',
    resume: {
      id: 'res-a1',
      userId: 'usr-a1',
      resumeVersionId: 'ver-a1',
      fileName: 'cv_csm_senior.pdf',
      fullName: 'Carlos Mendes',
      yearsOfExperience: 6,
      skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Churn Management' }, { name: 'Jira' }, { name: 'NPS' }],
      experiences: [{ role: 'Senior Customer Success Manager', companyName: 'SaaS Alpha', description: 'Gestão de contas enterprise e retenção.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-a1',
      title: 'Senior Customer Success Manager (Enterprise)',
      companyName: 'CloudCorp',
      seniority: 'senior',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Customer Success', 'Onboarding', 'Churn Management', 'NPS'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-a1',
      userId: 'usr-a1',
      intentType: 'same_area_continue',
      targetArea: 'Customer Success',
      targetRoles: ['Senior Customer Success Manager'],
      targetSeniority: 'senior',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'very_high', goal: 'very_high', transition: 'none' }
  },
  {
    id: 'A2',
    name: 'Customer Success Manager → CSM B2B',
    group: 'A_Continuity',
    resume: {
      id: 'res-a2',
      userId: 'usr-a2',
      resumeVersionId: 'ver-a2',
      fileName: 'cv_csm.pdf',
      fullName: 'Beatriz Lima',
      yearsOfExperience: 4,
      skills: [{ name: 'Customer Success' }, { name: 'Gestão de Contas' }, { name: 'Onboarding' }],
      experiences: [{ role: 'Customer Success Manager', companyName: 'Beta CRM', description: 'Atendimento a clientes B2B.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-a2',
      title: 'Customer Success Manager B2B',
      companyName: 'TechSales',
      seniority: 'pleno',
      location: 'São Paulo, SP',
      workMode: 'hybrid',
      requirements: ['Customer Success', 'Gestão de Contas', 'Onboarding'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-a2',
      userId: 'usr-a2',
      intentType: 'same_area_continue',
      targetArea: 'Customer Success',
      targetRoles: ['Customer Success Manager'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'very_high', goal: 'very_high', transition: 'none' }
  },
  {
    id: 'A3',
    name: 'Product Manager → Product Manager',
    group: 'A_Continuity',
    resume: {
      id: 'res-a3',
      userId: 'usr-a3',
      resumeVersionId: 'ver-a3',
      fileName: 'cv_pm.pdf',
      fullName: 'Diego Ramos',
      yearsOfExperience: 5,
      skills: [{ name: 'Product Discovery' }, { name: 'Roadmap' }, { name: 'Product Analytics' }, { name: 'Scrum' }],
      experiences: [{ role: 'Product Manager', companyName: 'Fintech Gamma', description: 'Liderança de discovery e roadmap de pagamentos.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-a3',
      title: 'Product Manager (Plataforma)',
      companyName: 'E-commerce Delta',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Product Discovery', 'Roadmap', 'Product Analytics'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-a3',
      userId: 'usr-a3',
      intentType: 'same_area_continue',
      targetArea: 'Gestão de Produto',
      targetRoles: ['Product Manager'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'very_high', goal: 'very_high', transition: 'none' }
  },
  {
    id: 'A4',
    name: 'Backend Developer → Backend Developer',
    group: 'A_Continuity',
    resume: {
      id: 'res-a4',
      userId: 'usr-a4',
      resumeVersionId: 'ver-a4',
      fileName: 'cv_backend.pdf',
      fullName: 'Eduardo Costa',
      yearsOfExperience: 4,
      skills: [{ name: 'Node.js' }, { name: 'TypeScript' }, { name: 'PostgreSQL' }, { name: 'Docker' }],
      experiences: [{ role: 'Backend Developer Pleno', companyName: 'Tech Solutions', description: 'APIs RESTful em Node.js e banco PostgreSQL.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-a4',
      title: 'Backend Developer (Node.js & TypeScript)',
      companyName: 'Logistics AI',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Node.js', 'TypeScript', 'PostgreSQL'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-a4',
      userId: 'usr-a4',
      intentType: 'same_area_continue',
      targetArea: 'Desenvolvimento Backend',
      targetRoles: ['Backend Developer'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'very_high', goal: 'very_high', transition: 'none' }
  },

  // ── GRUPO B: PROMOÇÃO ──
  {
    id: 'B1',
    name: 'CSM Pleno → CSM Senior',
    group: 'B_Promotion',
    resume: {
      id: 'res-b1',
      userId: 'usr-b1',
      resumeVersionId: 'ver-b1',
      fileName: 'cv_csm_pleno.pdf',
      fullName: 'Fernanda Rocha',
      yearsOfExperience: 3,
      skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'NPS' }],
      experiences: [{ role: 'Customer Success Specialist Pleno', companyName: 'SaaS Alpha', description: 'Atendimento a clientes e métricas de satisfação.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-b1',
      title: 'Senior Customer Success Manager',
      companyName: 'Global Cloud',
      seniority: 'senior',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Customer Success', 'Onboarding', 'Gestão de Contas Enterprise', 'Liderança de Squad'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-b1',
      userId: 'usr-b1',
      intentType: 'same_area_grow',
      targetArea: 'Customer Success',
      targetRoles: ['Senior Customer Success Manager'],
      targetSeniority: 'senior',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'high', transition: 'none' }
  },
  {
    id: 'B2',
    name: 'CSM Senior → CS Lead',
    group: 'B_Promotion',
    resume: {
      id: 'res-b2',
      userId: 'usr-b2',
      resumeVersionId: 'ver-b2',
      fileName: 'cv_csm_sr.pdf',
      fullName: 'Gabriel Souza',
      yearsOfExperience: 6,
      skills: [{ name: 'Customer Success' }, { name: 'Gestão de Contas' }, { name: 'Mentoria' }],
      experiences: [{ role: 'Senior Customer Success Manager', companyName: 'CRM Labs', description: 'Gestão estratégica e mentoria técnica de novatos.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-b2',
      title: 'Customer Success Team Lead',
      companyName: 'Fintech Prime',
      seniority: 'lead',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Customer Success', 'Liderança de Equipe', 'Gestão de Indicadores'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-b2',
      userId: 'usr-b2',
      intentType: 'same_area_grow',
      targetArea: 'Liderança em CS',
      targetRoles: ['CS Lead', 'Head of CS'],
      targetSeniority: 'lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'high', transition: 'none' }
  },
  {
    id: 'B3',
    name: 'Product Analyst → Product Manager',
    group: 'B_Promotion',
    resume: {
      id: 'res-b3',
      userId: 'usr-b3',
      resumeVersionId: 'ver-b3',
      fileName: 'cv_pa.pdf',
      fullName: 'Helena Martins',
      yearsOfExperience: 2,
      skills: [{ name: 'Product Analytics' }, { name: 'SQL' }, { name: 'Mapeamento de Processos' }],
      experiences: [{ role: 'Product Analyst Júnior', companyName: 'App Store Co', description: 'Análise de funil de produto e métricas de engajamento.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-b3',
      title: 'Product Manager Pleno',
      companyName: 'HealthTech Hub',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Product Discovery', 'Product Analytics', 'Roadmap', 'SQL'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-b3',
      userId: 'usr-b3',
      intentType: 'same_area_grow',
      targetArea: 'Gestão de Produto',
      targetRoles: ['Product Manager'],
      targetSeniority: 'pleno',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'very_high', transition: 'none' }
  },
  {
    id: 'B4',
    name: 'Developer Pleno → Tech Lead',
    group: 'B_Promotion',
    resume: {
      id: 'res-b4',
      userId: 'usr-b4',
      resumeVersionId: 'ver-b4',
      fileName: 'cv_dev_pl.pdf',
      fullName: 'Igor Ferreira',
      yearsOfExperience: 4,
      skills: [{ name: 'React' }, { name: 'Node.js' }, { name: 'TypeScript' }],
      experiences: [{ role: 'Full Stack Developer Pleno', companyName: 'Web Systems', description: 'Desenvolvimento e code review.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-b4',
      title: 'Tech Lead Full Stack',
      companyName: 'Venture Studio',
      seniority: 'lead',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['React', 'Node.js', 'Liderança Técnica', 'Arquitetura de Software'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-b4',
      userId: 'usr-b4',
      intentType: 'same_area_grow',
      targetArea: 'Liderança Técnica',
      targetRoles: ['Tech Lead'],
      targetSeniority: 'lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'very_high', transition: 'none' }
  },

  // ── GRUPO C: TRANSIÇÃO PRÓXIMA ──
  {
    id: 'C1',
    name: 'Customer Success → Product Manager',
    group: 'C_NearTransition',
    resume: {
      id: 'res-c1',
      userId: 'usr-c1',
      resumeVersionId: 'ver-c1',
      fileName: 'cv_cs_to_pm.pdf',
      fullName: 'Juliana Pires',
      yearsOfExperience: 4,
      skills: [{ name: 'Customer Success' }, { name: 'Onboarding' }, { name: 'Visão do Cliente' }, { name: 'Comunicação' }],
      experiences: [{ role: 'Customer Success Manager', companyName: 'SaaS Alpha', description: 'Gestão de clientes e priorização de feedbacks de produto.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-c1',
      title: 'Product Manager (SaaS B2B)',
      companyName: 'Fintech Prime',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Product Discovery', 'Product Analytics', 'Gestão de Stakeholders', 'Visão do Cliente'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-c1',
      userId: 'usr-c1',
      intentType: 'career_transition',
      targetArea: 'Gestão de Produto',
      targetRoles: ['Product Manager', 'Associate Product Manager'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'very_high', transition: 'near' }
  },
  {
    id: 'C2',
    name: 'Customer Success → Product Operations',
    group: 'C_NearTransition',
    resume: {
      id: 'res-c2',
      userId: 'usr-c2',
      resumeVersionId: 'ver-c2',
      fileName: 'cv_cs_ops.pdf',
      fullName: 'Lucas Neves',
      yearsOfExperience: 3,
      skills: [{ name: 'Customer Success' }, { name: 'Jira' }, { name: 'Mapeamento de Processos' }],
      experiences: [{ role: 'Customer Success Specialist', companyName: 'EdTech Labs', description: 'Documentação de processos e suporte à operação.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-c2',
      title: 'Product Operations Analyst',
      companyName: 'ScaleUp Corp',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Product Operations', 'Jira', 'Processos Ágeis', 'Mapeamento de Processos'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-c2',
      userId: 'usr-c2',
      intentType: 'career_transition',
      targetArea: 'Product Operations',
      targetRoles: ['Product Operations Specialist'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'high', transition: 'challenging' }
  },
  {
    id: 'C3',
    name: 'Operations → Project Manager',
    group: 'C_NearTransition',
    resume: {
      id: 'res-c3',
      userId: 'usr-c3',
      resumeVersionId: 'ver-c3',
      fileName: 'cv_ops.pdf',
      fullName: 'Mariana Duarte',
      yearsOfExperience: 4,
      skills: [{ name: 'Gestão de Processos' }, { name: 'Planejamento' }, { name: 'Organização' }],
      experiences: [{ role: 'Operations Analyst Pleno', companyName: 'Logistics SA', description: 'Planejamento de rotinas operacionais e cronogramas.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-c3',
      title: 'Project Manager (Operações & Projetos)',
      companyName: 'Global Services',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Gestão de Projetos', 'Planejamento', 'Cronogramas', 'Organização'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-c3',
      userId: 'usr-c3',
      intentType: 'career_transition',
      targetArea: 'Gestão de Projetos',
      targetRoles: ['Project Manager'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'very_high', goal: 'very_high', transition: 'near' }
  },
  {
    id: 'C4',
    name: 'Sales → Customer Success',
    group: 'C_NearTransition',
    resume: {
      id: 'res-c4',
      userId: 'usr-c4',
      resumeVersionId: 'ver-c4',
      fileName: 'cv_sales.pdf',
      fullName: 'Otávio Silveira',
      yearsOfExperience: 3,
      skills: [{ name: 'Vendas B2B' }, { name: 'Negociação' }, { name: 'Comunicação' }, { name: 'CRM' }],
      experiences: [{ role: 'Inside Sales Executive', companyName: 'B2B Software', description: 'Prospecção e negociação de contratos comerciais.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-c4',
      title: 'Customer Success Manager (Onboarding & Expansão)',
      companyName: 'Cloud Solutions',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Customer Success', 'Negociação', 'Comunicação', 'Gestão de Contas'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-c4',
      userId: 'usr-c4',
      intentType: 'career_transition',
      targetArea: 'Customer Success',
      targetRoles: ['Customer Success Manager'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'very_high', transition: 'challenging' }
  },

  // ── GRUPO D: TRANSIÇÃO MODERADA ──
  {
    id: 'D1',
    name: 'Legal → Privacy/DPO',
    group: 'D_ModerateTransition',
    resume: {
      id: 'res-d1',
      userId: 'usr-d1',
      resumeVersionId: 'ver-d1',
      fileName: 'cv_legal.pdf',
      fullName: 'Patricia Alencar',
      yearsOfExperience: 5,
      skills: [{ name: 'Direito Digital' }, { name: 'Contratos' }, { name: 'Compliance' }],
      experiences: [{ role: 'Advogada Corporativa', companyName: 'Escritório Alencar', description: 'Assessoria jurídica em conformidade e contratos.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-d1',
      title: 'Privacy & Data Protection Analyst (DPO)',
      companyName: 'Fintech Segura',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['LGPD', 'Privacidade de Dados', 'Compliance', 'Direito Digital'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-d1',
      userId: 'usr-d1',
      intentType: 'career_transition',
      targetArea: 'Privacidade de Dados & DPO',
      targetRoles: ['Data Protection Officer', 'Privacy Analyst'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'very_high', transition: 'near' }
  },
  {
    id: 'D2',
    name: 'Operations → Product',
    group: 'D_ModerateTransition',
    resume: {
      id: 'res-d2',
      userId: 'usr-d2',
      resumeVersionId: 'ver-d2',
      fileName: 'cv_ops_pm.pdf',
      fullName: 'Renato Farias',
      yearsOfExperience: 4,
      skills: [{ name: 'Operações' }, { name: 'Excel Avançado' }, { name: 'Análise de Indicadores' }],
      experiences: [{ role: 'Analista de Operações', companyName: 'Varejo Online', description: 'Monitoramento de SLAs e otimização operacional.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-d2',
      title: 'Associate Product Manager',
      companyName: 'Platform Labs',
      seniority: 'junior',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Product Discovery', 'Análise de Indicadores', 'Roadmap'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-d2',
      userId: 'usr-d2',
      intentType: 'career_transition',
      targetArea: 'Gestão de Produto',
      targetRoles: ['Associate Product Manager', 'Product Manager'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'high', transition: 'challenging' }
  },
  {
    id: 'D3',
    name: 'Marketing → Customer Success',
    group: 'D_ModerateTransition',
    resume: {
      id: 'res-d3',
      userId: 'usr-d3',
      resumeVersionId: 'ver-d3',
      fileName: 'cv_mkt_cs.pdf',
      fullName: 'Sabrina Toledo',
      yearsOfExperience: 3,
      skills: [{ name: 'Marketing de Conteúdo' }, { name: 'Copywriting' }, { name: 'Comunicação' }],
      experiences: [{ role: 'Analista de Marketing', companyName: 'Agência Criativa', description: 'Criação de campanhas e relacionamento com audiência.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-d3',
      title: 'Customer Success Specialist (Educação do Cliente)',
      companyName: 'SaaS Builder',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Customer Success', 'Educação do Cliente', 'Comunicação'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-d3',
      userId: 'usr-d3',
      intentType: 'career_transition',
      targetArea: 'Customer Success',
      targetRoles: ['Customer Success Specialist'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'high', transition: 'challenging' }
  },
  {
    id: 'D4',
    name: 'Finance → Operations',
    group: 'D_ModerateTransition',
    resume: {
      id: 'res-d4',
      userId: 'usr-d4',
      resumeVersionId: 'ver-d4',
      fileName: 'cv_fin.pdf',
      fullName: 'Tiago Bueno',
      yearsOfExperience: 4,
      skills: [{ name: 'Modelagem Financeira' }, { name: 'DRE' }, { name: 'Excel Avançado' }],
      experiences: [{ role: 'Analista Financeiro Pleno', companyName: 'Banco Invest', description: 'Controle de fluxo de caixa e relatórios gerenciais.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-d4',
      title: 'Business Operations Analyst',
      companyName: 'Fintech Hub',
      seniority: 'pleno',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['Business Operations', 'Análise de Dados', 'Excel Avançado'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-d4',
      userId: 'usr-d4',
      intentType: 'career_transition',
      targetArea: 'Business Operations',
      targetRoles: ['Operations Analyst'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'high', goal: 'very_high', transition: 'moderate' }
  },

  // ── GRUPO E: TRANSIÇÃO DISTANTE (Incompatíveis) ──
  {
    id: 'E1',
    name: 'Backend Developer → Enfermeiro UTI',
    group: 'E_DistantTransition',
    resume: {
      id: 'res-e1',
      userId: 'usr-e1',
      resumeVersionId: 'ver-e1',
      fileName: 'cv_dev_to_nurse.pdf',
      fullName: 'Valter Gomes',
      yearsOfExperience: 4,
      skills: [{ name: 'Python' }, { name: 'Django' }, { name: 'SQL' }],
      experiences: [{ role: 'Python Developer', companyName: 'Tech Delta', description: 'Desenvolvimento backend.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-e1',
      title: 'Enfermeiro de UTI Geral',
      companyName: 'Hospital São Lucas',
      seniority: 'pleno',
      location: 'São Paulo, SP',
      workMode: 'onsite',
      requirements: ['COREN Ativo', 'UTI Adulto', 'Cuidados Críticos'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-e1',
      userId: 'usr-e1',
      intentType: 'career_transition',
      targetArea: 'Enfermagem Hospitalar',
      targetRoles: ['Enfermeiro'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'very_low', goal: 'medium', transition: 'distant' }
  },
  {
    id: 'E2',
    name: 'Advogado → Engenheiro Civil',
    group: 'E_DistantTransition',
    resume: {
      id: 'res-e2',
      userId: 'usr-e2',
      resumeVersionId: 'ver-e2',
      fileName: 'cv_law_to_eng.pdf',
      fullName: 'Wagner Prado',
      yearsOfExperience: 6,
      skills: [{ name: 'Direito Trabalhista' }, { name: 'Contencioso' }],
      experiences: [{ role: 'Advogado Trabalhista', companyName: 'Prado Advocacia' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-e2',
      title: 'Engenheiro Civil de Obras',
      companyName: 'Construtora Horizonte',
      seniority: 'senior',
      location: 'Curitiba, PR',
      workMode: 'onsite',
      requirements: ['CREA Ativo', 'Cálculo Estrutural', 'AutoCAD', 'Gestão de Canteiro'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-e2',
      userId: 'usr-e2',
      intentType: 'career_transition',
      targetArea: 'Engenharia Civil',
      targetRoles: ['Engenheiro Civil'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'very_low', goal: 'medium', transition: 'distant' }
  },
  {
    id: 'E3',
    name: 'Designer → Médico Clínico',
    group: 'E_DistantTransition',
    resume: {
      id: 'res-e3',
      userId: 'usr-e3',
      resumeVersionId: 'ver-e3',
      fileName: 'cv_des_to_med.pdf',
      fullName: 'Yasmin Sampaio',
      yearsOfExperience: 3,
      skills: [{ name: 'Figma' }, { name: 'Design Gráfico' }, { name: 'Ilustração' }],
      experiences: [{ role: 'Graphic Designer', companyName: 'Studio Y', description: 'Identidade visual e peças publicitárias.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-e3',
      title: 'Médico Clínico Geral',
      companyName: 'Clínica Vida',
      seniority: 'pleno',
      location: 'Rio de Janeiro, RJ',
      workMode: 'onsite',
      requirements: ['CRM Ativo', 'Atendimento Ambulatorial', 'Prescrição Médica'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-e3',
      userId: 'usr-e3',
      intentType: 'career_transition',
      targetArea: 'Medicina',
      targetRoles: ['Médico Clínico Geral'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'very_low', goal: 'medium', transition: 'distant' }
  },
  {
    id: 'E4',
    name: 'Operador de Caixa → Cloud Architect',
    group: 'E_DistantTransition',
    resume: {
      id: 'res-e4',
      userId: 'usr-e4',
      resumeVersionId: 'ver-e4',
      fileName: 'cv_caixa.pdf',
      fullName: 'Ziraldo Nunes',
      yearsOfExperience: 2,
      skills: [{ name: 'Atendimento ao Cliente' }, { name: 'Abertura de Caixa' }],
      experiences: [{ role: 'Operador de Caixa', companyName: 'Supermercado Central', description: 'Registro de produtos e recebimento de pagamentos.' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-e4',
      title: 'Principal Cloud Architect (AWS & Terraform)',
      companyName: 'Enterprise Cloud',
      seniority: 'lead',
      location: 'Remoto',
      workMode: 'remote',
      requirements: ['AWS Certified Solutions Architect', 'Terraform', 'Kubernetes', 'Arquitetura Multi-Cloud'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: {
      id: 'goal-e4',
      userId: 'usr-e4',
      intentType: 'career_transition',
      targetArea: 'Cloud Architecture',
      targetRoles: ['Cloud Architect'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    expected: { fit: 'very_low', goal: 'medium', transition: 'distant' }
  },

  // ── GRUPO F: DADOS INCOMPLETOS ──
  {
    id: 'F1',
    name: 'Currículo muito curto',
    group: 'F_IncompleteData',
    resume: {
      id: 'res-f1',
      userId: 'usr-f1',
      resumeVersionId: 'ver-f1',
      fileName: 'cv_curto.pdf',
      fullName: 'Aline Dias',
      yearsOfExperience: 0,
      skills: [],
      experiences: [],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-f1',
      title: 'Product Manager',
      companyName: 'Tech Co',
      seniority: 'pleno',
      requirements: ['Product Discovery', 'SQL'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: null,
    expected: { fit: 'low', goal: null, transition: 'none' }
  },
  {
    id: 'F2',
    name: 'Vaga com descrição curta',
    group: 'F_IncompleteData',
    resume: {
      id: 'res-f2',
      userId: 'usr-f2',
      resumeVersionId: 'ver-f2',
      fileName: 'cv_f2.pdf',
      fullName: 'Bernardo Cruz',
      yearsOfExperience: 3,
      skills: [{ name: 'React' }],
      experiences: [{ role: 'Frontend Dev', companyName: 'X' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-f2',
      title: 'Desenvolvedor',
      requirements: [],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: null,
    expected: { fit: 'very_low', goal: null, transition: 'none' }
  },
  {
    id: 'F3',
    name: 'Vaga sem senioridade explícita',
    group: 'F_IncompleteData',
    resume: {
      id: 'res-f3',
      userId: 'usr-f3',
      resumeVersionId: 'ver-f3',
      fileName: 'cv_f3.pdf',
      fullName: 'Carla Prado',
      yearsOfExperience: 3,
      skills: [{ name: 'Python' }, { name: 'Django' }],
      experiences: [{ role: 'Python Developer', companyName: 'Y' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-f3',
      title: 'Python Developer',
      requirements: ['Python', 'Django'],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: null,
    expected: { fit: 'very_high', goal: null, transition: 'none' }
  },
  {
    id: 'F4',
    name: 'Vaga sem requisitos claros',
    group: 'F_IncompleteData',
    resume: {
      id: 'res-f4',
      userId: 'usr-f4',
      resumeVersionId: 'ver-f4',
      fileName: 'cv_f4.pdf',
      fullName: 'Danilo Melo',
      yearsOfExperience: 4,
      skills: [{ name: 'Customer Success' }],
      experiences: [{ role: 'Customer Success Specialist', companyName: 'Z' }],
      createdAt: new Date().toISOString()
    },
    job: {
      id: 'job-f4',
      title: 'Profissional de Sucesso do Cliente',
      requirements: [],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    careerGoal: null,
    expected: { fit: 'very_low', goal: null, transition: 'none' }
  }
];
