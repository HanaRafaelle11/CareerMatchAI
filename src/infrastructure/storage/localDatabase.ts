import type { Resume, Job, Match, GapAnalysis, Application, Profile, CareerProfile, ApplicationStage, ResumeOptimization, CoverLetter, InterviewPreparation, InterviewSimulation, PostInterviewLog, Notification, InterviewPrep, CompanyProfile, WeeklyPlanner, WeeklyGoal, CareerGoal } from '../../domain/models/types';
import { mockResume, mockJobs, mockMatches, mockGapAnalyses, mockCoverLetters, mockInterviewPreps } from './mockData';

import { isSupabaseConfigured } from '../api/supabaseClient';

// Chaves do localStorage
const KEYS = {
  PROFILE: 'careermatch_profile',
  RESUMES: 'careermatch_resumes',
  JOBS: 'careermatch_jobs',
  MATCHES: 'careermatch_matches',
  GAPS: 'careermatch_gaps',
  LETTERS: 'careermatch_letters',
  PREPS: 'careermatch_preps',
  APPLICATIONS: 'careermatch_applications',
  CAREER_PROFILE: 'careermatch_career_profile',
  STAGES: 'careermatch_application_stages',
  OPTIMIZATIONS: 'careermatch_resume_optimizations',
  LETTERS_V2: 'careermatch_cover_letters_v2',
  PREPARATIONS: 'careermatch_interview_preparations',
  SIMULATIONS: 'careermatch_interview_simulations',
  POST_LOGS: 'careermatch_post_interview_logs',
  NOTIFICATIONS: 'careermatch_notifications',
  COMPANY_PROFILES: 'careermatch_company_profiles',
  WEEKLY_PLANNERS: 'careermatch_weekly_planners',
  WEEKLY_GOALS: 'careermatch_weekly_goals',
  CAREER_GOALS: 'careermatch_career_goals',
};

class LocalDatabase {
  private getActiveUserId(): string {
    try {
      const stored = localStorage.getItem('careermatch_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.id) return u.id;
      }
    } catch (_) {}
    return 'mock-user-id';
  }

  private init() {
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    
    // Se o Supabase estiver configurado no ambiente, ou se não for ambiente de desenvolvimento, inicia o banco local vazio para não contaminar com dados mock
    if (isSupabaseConfigured || !isDev) {
      if (!localStorage.getItem(KEYS.PROFILE)) localStorage.setItem(KEYS.PROFILE, 'null');
      if (!localStorage.getItem(KEYS.RESUMES)) localStorage.setItem(KEYS.RESUMES, '[]');
      if (!localStorage.getItem(KEYS.JOBS)) localStorage.setItem(KEYS.JOBS, '[]');
      if (!localStorage.getItem(KEYS.MATCHES)) localStorage.setItem(KEYS.MATCHES, '[]');
      if (!localStorage.getItem(KEYS.GAPS)) localStorage.setItem(KEYS.GAPS, '[]');
      if (!localStorage.getItem(KEYS.APPLICATIONS)) localStorage.setItem(KEYS.APPLICATIONS, '[]');
      if (!localStorage.getItem(KEYS.CAREER_PROFILE)) localStorage.setItem(KEYS.CAREER_PROFILE, 'null');
      return;
    }

    if (!localStorage.getItem(KEYS.PROFILE)) {
      const defaultProfile: Profile = {
        id: this.getActiveUserId(),
        fullName: 'Alexandre Silva',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        headline: 'Software Engineer | React, Node.js & AWS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(defaultProfile));
    }

    if (!localStorage.getItem(KEYS.RESUMES)) {
      localStorage.setItem(KEYS.RESUMES, JSON.stringify([{ ...mockResume, versionNumber: 1, versionLabel: 'Versão Inicial' }]));
    }

    if (!localStorage.getItem(KEYS.CAREER_PROFILE)) {
      const defaultCareerProfile: CareerProfile = {
        id: 'cp-default',
        userId: this.getActiveUserId(),
        resumeId: 'resume-123',
        targetRoles: ['Head of Customer Success', 'Customer Success Manager', 'CS Operations Manager'],
        seniority: 'Manager',
        industries: ['SaaS', 'Fintech', 'Technology'],
        skills: ['Customer Success', 'SaaS', 'Churn', 'NPS', 'Leadership'],
        tools: ['Salesforce', 'SQL'],
        languages: ['Inglês', 'Espanhol'],
        preferredLocations: ['Remoto', 'São Paulo'],
        preferredWorkModes: ['remote', 'hybrid'],
        targetCompanies: ['Pipefy', 'Serasa Experian', 'Omie', 'Creditas', 'iFood'],
        salaryExpectationMin: 12000,
        searchKeywords: ['Customer Success', 'Customer Success Manager', 'CS Operations'],
        isApprovedByUser: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.CAREER_PROFILE, JSON.stringify(defaultCareerProfile));
    }

    if (!localStorage.getItem(KEYS.JOBS)) {
      localStorage.setItem(KEYS.JOBS, JSON.stringify(mockJobs));
    }

    if (!localStorage.getItem(KEYS.MATCHES)) {
      localStorage.setItem(KEYS.MATCHES, JSON.stringify(mockMatches));
    }

    if (!localStorage.getItem(KEYS.GAPS)) {
      localStorage.setItem(KEYS.GAPS, JSON.stringify(mockGapAnalyses));
    }

    if (!localStorage.getItem(KEYS.LETTERS)) {
      localStorage.setItem(KEYS.LETTERS, JSON.stringify(mockCoverLetters));
    }

    if (!localStorage.getItem(KEYS.PREPS)) {
      localStorage.setItem(KEYS.PREPS, JSON.stringify(mockInterviewPreps));
    }

    if (!localStorage.getItem(KEYS.APPLICATIONS)) {
      const defaultApps: Application[] = [
        {
          id: 'app-1',
          userId: this.getActiveUserId(),
          matchId: 'match-job-1',
          jobId: 'job-1',
          jobTitle: 'Desenvolvedor Full Stack Senior (React & Node)',
          companyName: 'Stripe Brasil',
          status: '📨 Me candidatei',
          appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Conexão via recrutador no LinkedIn. Primeira conversa agendada para semana que vem.',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(defaultApps));
    }

    if (!localStorage.getItem(KEYS.STAGES)) {
      const defaultStages: ApplicationStage[] = [
        {
          id: 'stage-1',
          applicationId: 'app-1',
          stageName: '📨 Me candidatei',
          status: 'passed',
          notes: 'Candidatura enviada pelo site oficial.',
          stageDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'stage-2',
          applicationId: 'app-1',
          stageName: '👥 Entrevista com recrutador',
          status: 'pending',
          notes: 'Agendada conversa rápida de alinhamento com a RH.',
          stageDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(KEYS.STAGES, JSON.stringify(defaultStages));
    }

    if (!localStorage.getItem(KEYS.COMPANY_PROFILES)) {
      const defaultCompanies: CompanyProfile[] = [
        {
          id: 'cp-company-1',
          userId: this.getActiveUserId(),
          companyName: 'Stripe Brasil',
          industry: 'Fintech',
          size: 'Grande',
          glassdoorRating: 4.8,
          interviewProcess: '3 etapas (RH, Técnico, Gestor)',
          benefits: ['Vale Refeição', 'Plano de Saúde', 'Previdência Privada', 'Stock Options'],
          remotePolicy: 'Híbrido',
          salaryRange: '14k - 18k BRL',
          userNotes: 'Processo organizado, responderam em 2 dias com feedback positivo.',
          wouldApplyAgain: true,
          cultureScore: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cp-company-2',
          userId: this.getActiveUserId(),
          companyName: 'Linear Technologies',
          industry: 'Technology',
          size: 'Média',
          glassdoorRating: 4.5,
          interviewProcess: 'Case prático de 20 horas e apresentação de fit.',
          benefits: ['Gympass', 'Auxílio Home Office', 'Plano de Saúde'],
          remotePolicy: 'Remoto',
          salaryRange: '15k BRL',
          userNotes: 'Muito ghosting no início, mas o time de engenharia é excelente.',
          wouldApplyAgain: true,
          cultureScore: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(KEYS.COMPANY_PROFILES, JSON.stringify(defaultCompanies));
    }

    if (!localStorage.getItem(KEYS.WEEKLY_PLANNERS)) {
      const defaultPlanner: WeeklyPlanner = {
        id: 'wp-default',
        userId: this.getActiveUserId(),
        weekNumber: 202628,
        plannerData: {
          'Segunda-feira': {
            tasks: [
              { id: 'task-1', text: 'Buscar 18 vagas compatíveis', completed: true },
              { id: 'task-2', text: 'Aplicar para 4 vagas prioritárias', completed: true }
            ]
          },
          'Terça-feira': {
            tasks: [
              { id: 'task-3', text: 'Estudar arquitetura Stripe e preparar pitch', completed: true }
            ]
          },
          'Quarta-feira': {
            tasks: [
              { id: 'task-4', text: 'Entrevista técnica Stripe (React/Node)', completed: false }
            ]
          },
          'Quinta-feira': {
            tasks: [
              { id: 'task-5', text: 'Networking no LinkedIn e follow-ups', completed: false }
            ]
          },
          'Sexta-feira': {
            tasks: [
              { id: 'task-6', text: 'Revisar metas da semana e planejar próxima', completed: false }
            ]
          },
          'Sábado': { tasks: [] },
          'Domingo': { tasks: [] }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.WEEKLY_PLANNERS, JSON.stringify([defaultPlanner]));
    }

    if (!localStorage.getItem(KEYS.WEEKLY_GOALS)) {
      const defaultGoal: WeeklyGoal = {
        id: 'wg-default',
        userId: this.getActiveUserId(),
        weekNumber: 202628,
        targetApplications: 10,
        targetInterviewsRh: 3,
        targetInterviewsManager: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.WEEKLY_GOALS, JSON.stringify([defaultGoal]));
    }

    if (!localStorage.getItem(KEYS.CAREER_GOALS)) {
      const defaultCareerGoals: CareerGoal[] = [
        {
          id: 'cg-default',
          userId: this.getActiveUserId(),
          title: 'Conseguir emprego em Customer Success / Dev até Outubro',
          targetDate: '2026-10-31',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(KEYS.CAREER_GOALS, JSON.stringify(defaultCareerGoals));
    }
  }

  constructor() {
    this.init();
  }

  // Profile API
  getProfile(): Profile {
    return JSON.parse(localStorage.getItem(KEYS.PROFILE) || '{}');
  }

  updateProfile(profile: Partial<Profile>): Profile {
    const current = this.getProfile();
    const updated = { ...current, ...profile, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  }

  // Resumes API
  getResumes(): Resume[] {
    const all = JSON.parse(localStorage.getItem(KEYS.RESUMES) || '[]');
    const activeUserId = this.getActiveUserId();
    return all.filter((r: Resume) => r.userId === activeUserId);
  }

  getPrimaryResume(): Resume | undefined {
    return this.getResumes().find(r => r.isPrimary);
  }

  saveResume(resume: Resume): Resume {
    const resumes = JSON.parse(localStorage.getItem(KEYS.RESUMES) || '[]');
    if (resume.isPrimary) {
      resumes.forEach((r: any) => {
        if (r.userId === resume.userId) {
          r.isPrimary = false;
        }
      });
    }
    const index = resumes.findIndex((r: any) => r.id === resume.id);
    if (index >= 0) {
      resumes[index] = resume;
    } else {
      resumes.push(resume);
    }
    localStorage.setItem(KEYS.RESUMES, JSON.stringify(resumes));
    return resume;
  }

  deleteResume(id: string): void {
    let resumes = this.getResumes();
    resumes = resumes.filter(r => r.id !== id);
    localStorage.setItem(KEYS.RESUMES, JSON.stringify(resumes));
    if (resumes.length === 0) {
      localStorage.setItem(KEYS.CAREER_PROFILE, 'null');
      localStorage.setItem(KEYS.MATCHES, '[]');
      localStorage.setItem(KEYS.GAPS, '[]');
      localStorage.setItem(KEYS.OPTIMIZATIONS, '[]');
      localStorage.setItem(KEYS.PREPARATIONS, '[]');
      localStorage.setItem(KEYS.SIMULATIONS, '[]');
      localStorage.setItem(KEYS.LETTERS_V2, '[]');
    }
  }

  // Jobs API
  getJobs(): Job[] {
    return JSON.parse(localStorage.getItem(KEYS.JOBS) || '[]');
  }

  getJob(id: string): Job | undefined {
    return this.getJobs().find(j => j.id === id);
  }

  saveJob(job: Job): Job {
    const jobs = JSON.parse(localStorage.getItem(KEYS.JOBS) || '[]');
    const index = jobs.findIndex((j: any) => j.id === job.id);
    if (index >= 0) {
      jobs[index] = job;
    } else {
      jobs.push(job);
    }
    localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
    return job;
  }

  deleteJob(id: string): void {
    const jobs = JSON.parse(localStorage.getItem(KEYS.JOBS) || '[]');
    const filtered = jobs.filter((j: any) => j.id !== id);
    localStorage.setItem(KEYS.JOBS, JSON.stringify(filtered));
  }

  // Matches API
  getMatches(): Match[] {
    const all = JSON.parse(localStorage.getItem(KEYS.MATCHES) || '[]');
    const activeUserId = this.getActiveUserId();
    return all.filter((m: Match) => m.userId === activeUserId);
  }

  getMatch(id: string): Match | undefined {
    return this.getMatches().find(m => m.id === id);
  }

  getMatchForJob(jobId: string): Match | undefined {
    return this.getMatches().find(m => m.jobId === jobId);
  }

  saveMatch(match: Match): Match {
    const matches = JSON.parse(localStorage.getItem(KEYS.MATCHES) || '[]');
    const index = matches.findIndex((m: any) => m.id === match.id);
    if (index >= 0) {
      matches[index] = match;
    } else {
      matches.push(match);
    }
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
    return match;
  }

  // Gap Analysis API
  getGapAnalyses(): Record<string, GapAnalysis> {
    return JSON.parse(localStorage.getItem(KEYS.GAPS) || '{}');
  }

  getGapAnalysis(matchId: string): GapAnalysis | undefined {
    return this.getGapAnalyses()[matchId];
  }

  saveGapAnalysis(gap: GapAnalysis): GapAnalysis {
    const gaps = this.getGapAnalyses();
    gaps[gap.matchId] = gap;
    localStorage.setItem(KEYS.GAPS, JSON.stringify(gaps));
    return gap;
  }

  // Cover Letter API
  getCoverLetters(): Record<string, CoverLetter> {
    return JSON.parse(localStorage.getItem(KEYS.LETTERS) || '{}');
  }

  getLegacyCoverLetter(matchId: string): CoverLetter | undefined {
    return this.getCoverLetters()[matchId];
  }

  saveLegacyCoverLetter(letter: CoverLetter): CoverLetter {
    const letters = this.getCoverLetters();
    letters[letter.matchId || ''] = letter;
    localStorage.setItem(KEYS.LETTERS, JSON.stringify(letters));
    return letter;
  }

  // Interview Prep API
  getInterviewPreps(): Record<string, InterviewPrep> {
    return JSON.parse(localStorage.getItem(KEYS.PREPS) || '{}');
  }

  getLegacyInterviewPrep(matchId: string): InterviewPrep | undefined {
    return this.getInterviewPreps()[matchId];
  }

  saveLegacyInterviewPrep(prep: InterviewPrep): InterviewPrep {
    const preps = this.getInterviewPreps();
    const key = prep.matchId || prep.jobId || prep.id;
    if (key) {
      preps[key] = prep;
      localStorage.setItem(KEYS.PREPS, JSON.stringify(preps));
    }
    return prep;
  }

  // Applications API
  getApplications(): Application[] {
    const all = JSON.parse(localStorage.getItem(KEYS.APPLICATIONS) || '[]');
    const activeUserId = this.getActiveUserId();
    return all.filter((a: Application) => a.userId === activeUserId);
  }

  getApplication(id: string): Application | undefined {
    return this.getApplications().find(a => a.id === id);
  }

  saveApplication(app: Application): Application {
    const apps = JSON.parse(localStorage.getItem(KEYS.APPLICATIONS) || '[]');
    const index = apps.findIndex((a: any) => a.id === app.id);
    if (index >= 0) {
      apps[index] = { ...app, updatedAt: new Date().toISOString() };
    } else {
      apps.push(app);
    }
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(apps));
    return app;
  }

  deleteApplication(id: string): void {
    let apps = this.getApplications();
    apps = apps.filter(a => a.id !== id);
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(apps));
  }

  // Career Profile API
  getCareerProfile(userId: string): CareerProfile | null {
    const raw = localStorage.getItem(KEYS.CAREER_PROFILE);
    if (!raw) return null;
    const profile = JSON.parse(raw) as CareerProfile;
    if (profile.userId !== userId) return null;
    return profile;
  }

  saveCareerProfile(profile: CareerProfile): CareerProfile {
    localStorage.setItem(KEYS.CAREER_PROFILE, JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }));
    return profile;
  }

  // Reset database helper
  reset() {
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.RESUMES);
    localStorage.removeItem(KEYS.JOBS);
    localStorage.removeItem(KEYS.MATCHES);
    localStorage.removeItem(KEYS.GAPS);
    localStorage.removeItem(KEYS.LETTERS);
    localStorage.removeItem(KEYS.PREPS);
    localStorage.removeItem(KEYS.APPLICATIONS);
    localStorage.removeItem(KEYS.CAREER_PROFILE);
    localStorage.removeItem(KEYS.STAGES);
    localStorage.removeItem(KEYS.OPTIMIZATIONS);
    localStorage.removeItem(KEYS.LETTERS_V2);
    localStorage.removeItem(KEYS.PREPARATIONS);
    localStorage.removeItem(KEYS.SIMULATIONS);
    localStorage.removeItem(KEYS.POST_LOGS);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    localStorage.removeItem(KEYS.COMPANY_PROFILES);
    localStorage.removeItem(KEYS.WEEKLY_PLANNERS);
    localStorage.removeItem(KEYS.WEEKLY_GOALS);
    localStorage.removeItem(KEYS.CAREER_GOALS);
    this.init();
  }

  // Stages API
  getApplicationStages(applicationId: string): ApplicationStage[] {
    const raw = localStorage.getItem(KEYS.STAGES) || '[]';
    const all = JSON.parse(raw) as ApplicationStage[];
    return all.filter(s => s.applicationId === applicationId);
  }

  saveApplicationStage(stage: ApplicationStage): ApplicationStage {
    const raw = localStorage.getItem(KEYS.STAGES) || '[]';
    const all = JSON.parse(raw) as ApplicationStage[];
    const index = all.findIndex(s => s.id === stage.id);
    if (index >= 0) {
      all[index] = stage;
    } else {
      all.push(stage);
    }
    localStorage.setItem(KEYS.STAGES, JSON.stringify(all));
    return stage;
  }

  deleteApplicationStage(id: string): void {
    const raw = localStorage.getItem(KEYS.STAGES) || '[]';
    const all = JSON.parse(raw) as ApplicationStage[];
    const filtered = all.filter(s => s.id !== id);
    localStorage.setItem(KEYS.STAGES, JSON.stringify(filtered));
  }

  getMockMyProfileAi(userId: string, resumeVersionId?: string | null): any {
    const resumes = this.getResumes();
    if (resumes.length === 0) {
      return { profile: null, insights: null };
    }

    const key = `careermatch_my_profile_ai_${resumeVersionId || 'default'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
    }

    const mockProfile = {
      id: `cp-new-${resumeVersionId || 'default'}`,
      userId: userId,
      resumeVersionId: resumeVersionId || 'rv-default',
      personal: {
        fullName: 'Alexandre Silva',
        headline: 'Software Engineer | React | TypeScript | Node.js',
        email: 'alexandre.silva@exemplo.com',
        phone: '+55 11 99999-9999',
        linkedin: 'https://linkedin.com/in/alexandresilva',
        website: 'https://alexandresilva.dev',
        location: 'São Paulo, Brasil',
        preferences: {
          seniority: 'Pleno',
          tools: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
          preferredWorkModes: ['remote', 'hybrid'],
          preferredLocations: ['São Paulo', 'Remoto'],
          targetCompanies: ['Stripe Brasil', 'Linear Technologies', 'Nubank'],
          salaryExpectationMin: 12000,
          targetRoles: ['Software Engineer Pleno', 'Frontend Engineer', 'Full Stack Developer']
        }
      },
      summary: 'Desenvolvedor Full Stack com mais de 5 anos de experiência prática na criação de aplicações web escaláveis. Especialista em ecossistemas React, Node.js e computação em nuvem (AWS). Apaixonado por metodologias ágeis, Clean Code e otimização de performance.',
      experience: [
        {
          companyName: 'TechFlow Solutions',
          role: 'Software Engineer Pleno',
          startDate: '2023-02-15',
          endDate: null,
          isCurrent: true,
          description: 'Liderança no desenvolvimento de novos módulos de uma plataforma SaaS corporativa utilizando React, TypeScript e Next.js. Otimização do tempo de carregamento da aplicação em 35% por meio de code-splitting e lazy loading.',
          highlights: [
            'Otimizou performance em 35% com lazy loading.',
            'Desenvolveu microserviços em Node.js altamente resilientes.'
          ]
        },
        {
          companyName: 'Codex Dev Studio',
          role: 'Desenvolvedor Frontend Junior',
          startDate: '2021-01-10',
          endDate: '2023-02-01',
          isCurrent: false,
          description: 'Desenvolvimento de interfaces responsivas para clientes de e-commerce utilizando React, Tailwind CSS e Redux Toolkit.',
          highlights: [
            'Aumentou cobertura de testes unitários para 80%.',
            'Refatorou 4 legados de sites complexos para React.'
          ]
        }
      ],
      education: [
        {
          institution: 'Universidade Federal de Santa Catarina',
          degree: 'Bacharelado em Ciência da Computação',
          fieldOfStudy: 'Ciência da Computação',
          startDate: '2017-03-01',
          endDate: '2021-12-15'
        }
      ],
      skills: [
        { name: 'React', proficiency: 'Avançado' },
        { name: 'TypeScript', proficiency: 'Avançado' },
        { name: 'Node.js', proficiency: 'Avançado' },
        { name: 'Tailwind CSS', proficiency: 'Avançado' },
        { name: 'AWS', proficiency: 'Intermediário' }
      ],
      soft_skills: ['Comunicação', 'Trabalho em Equipe', 'Resolução de Problemas', 'Liderança'],
      languages: [
        { language: 'Inglês', proficiency: 'Avançado' },
        { language: 'Português', proficiency: 'Nativo' }
      ],
      certifications: ['AWS Certified Cloud Practitioner'],
      ats_keywords: {
        existing_keywords: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind', 'SaaS'],
        missing_keywords: ['Docker', 'GraphQL', 'CI/CD'],
        recommended_keywords: ['Docker', 'GraphQL', 'Kubernetes', 'Microservices']
      },
      createdAt: new Date().toISOString()
    };

    const mockInsights = {
      id: `ci-new-${resumeVersionId || 'default'}`,
      userId: userId,
      resumeVersionId: resumeVersionId || 'rv-default',
      seniority_prediction: {
        value: 'Pleno-Avançado / Software Engineer Pleno',
        confidence: 0.92,
        reason: 'O candidato possui 5 anos de experiência comprovada com tecnologias modernas (React/Node) e liderou otimizações importantes em projetos SaaS.',
        source_type: 'inferred'
      },
      industry_prediction: {
        value: 'Tecnologia / SaaS / Finanças',
        confidence: 0.88,
        reason: 'Grande parte do histórico profissional envolve desenvolvimento de sistemas SaaS complexos e plataformas digitais na Codex e TechFlow.',
        source_type: 'inferred'
      },
      methodologies: [
        { methodology_name: 'Scrum', confidence: 0.95, source_type: 'extracted' },
        { methodology_name: 'Kanban', confidence: 0.90, source_type: 'extracted' },
        { methodology_name: 'XP (Extreme Programming)', confidence: 0.75, source_type: 'inferred' }
      ],
      recommended_keywords: {
        value: ['Kubernetes', 'CI/CD', 'Automated Testing', 'Docker', 'GraphQL'],
        confidence: 0.85,
        reason: 'Essas habilidades complementariam as stacks de React/Node em vagas altamente sênior.',
        source_type: 'recommended'
      },
      missing_skills: {
        value: ['Docker', 'GraphQL', 'CI/CD Pipelines'],
        confidence: 0.90,
        reason: 'Esses tópicos aparecem de forma recorrente como lacunas técnicas no perfil atual em comparação com vagas sênior consultadas.',
        source_type: 'recommended'
      },
      confidence_scores: {
        value: { technical: 90, behavioral: 92, overall: 91 },
        confidence: 0.90,
        reason: 'O currículo possui excelente estruturação de conquistas e dados numéricos comprováveis.',
        source_type: 'inferred'
      },
      createdAt: new Date().toISOString()
    };

    const result = { profile: mockProfile, insights: mockInsights };
    localStorage.setItem(key, JSON.stringify(result));
    return result;
  }

  // Resume Optimizations API
  getResumeOptimization(resumeId: string, jobId?: string): ResumeOptimization | null {
    const all = JSON.parse(localStorage.getItem(KEYS.OPTIMIZATIONS) || '[]') as ResumeOptimization[];
    const found = all.find(o => o.resumeId === resumeId && (!jobId || o.jobId === jobId));
    return found || null;
  }

  saveResumeOptimization(opt: ResumeOptimization): ResumeOptimization {
    const all = JSON.parse(localStorage.getItem(KEYS.OPTIMIZATIONS) || '[]') as ResumeOptimization[];
    const idx = all.findIndex(o => o.id === opt.id);
    if (idx >= 0) all[idx] = opt;
    else all.push(opt);
    localStorage.setItem(KEYS.OPTIMIZATIONS, JSON.stringify(all));
    return opt;
  }

  // Cover Letters API
  getCoverLetter(applicationId: string): CoverLetter | null {
    const all = JSON.parse(localStorage.getItem(KEYS.LETTERS_V2) || '[]') as CoverLetter[];
    return all.find(l => l.applicationId === applicationId) || null;
  }

  saveCoverLetter(letter: CoverLetter): CoverLetter {
    const all = JSON.parse(localStorage.getItem(KEYS.LETTERS_V2) || '[]') as CoverLetter[];
    const idx = all.findIndex(l => l.id === letter.id);
    if (idx >= 0) all[idx] = letter;
    else all.push(letter);
    localStorage.setItem(KEYS.LETTERS_V2, JSON.stringify(all));
    return letter;
  }

  // Interview Preparations API
  getInterviewPreparation(jobId: string): InterviewPreparation | null {
    const all = JSON.parse(localStorage.getItem(KEYS.PREPARATIONS) || '[]') as InterviewPreparation[];
    return all.find(p => p.jobId === jobId) || null;
  }

  saveInterviewPreparation(prep: InterviewPreparation): InterviewPreparation {
    const all = JSON.parse(localStorage.getItem(KEYS.PREPARATIONS) || '[]') as InterviewPreparation[];
    const idx = all.findIndex(p => p.id === prep.id);
    if (idx >= 0) all[idx] = prep;
    else all.push(prep);
    localStorage.setItem(KEYS.PREPARATIONS, JSON.stringify(all));
    return prep;
  }

  // Interview Simulations API
  getInterviewSimulation(applicationId: string): InterviewSimulation | null {
    const all = JSON.parse(localStorage.getItem(KEYS.SIMULATIONS) || '[]') as InterviewSimulation[];
    return all.find(s => s.applicationId === applicationId) || null;
  }

  saveInterviewSimulation(sim: InterviewSimulation): InterviewSimulation {
    const all = JSON.parse(localStorage.getItem(KEYS.SIMULATIONS) || '[]') as InterviewSimulation[];
    const idx = all.findIndex(s => s.id === sim.id);
    if (idx >= 0) all[idx] = sim;
    else all.push(sim);
    localStorage.setItem(KEYS.SIMULATIONS, JSON.stringify(all));
    return sim;
  }

  // Post Interview Logs API
  getPostInterviewLog(applicationId: string): PostInterviewLog | null {
    const all = JSON.parse(localStorage.getItem(KEYS.POST_LOGS) || '[]') as PostInterviewLog[];
    return all.find(l => l.applicationId === applicationId) || null;
  }

  savePostInterviewLog(log: PostInterviewLog): PostInterviewLog {
    const all = JSON.parse(localStorage.getItem(KEYS.POST_LOGS) || '[]') as PostInterviewLog[];
    const idx = all.findIndex(l => l.id === log.id);
    if (idx >= 0) all[idx] = log;
    else all.push(log);
    localStorage.setItem(KEYS.POST_LOGS, JSON.stringify(all));
    return log;
  }

  // Notifications API
  getNotifications(userId: string): Notification[] {
    const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]') as Notification[];
    return all.filter(n => n.userId === userId);
  }

  saveNotification(notif: Notification): Notification {
    const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]') as Notification[];
    const idx = all.findIndex(n => n.id === notif.id);
    if (idx >= 0) all[idx] = notif;
    else all.push(notif);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(all));
    return notif;
  }

  deleteNotification(id: string): void {
    const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]') as Notification[];
    const filtered = all.filter(n => n.id !== id);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(filtered));
  }

  markNotificationAsRead(id: string): void {
    const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]') as Notification[];
    const idx = all.findIndex(n => n.id === id);
    if (idx >= 0) {
      all[idx].isRead = true;
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(all));
    }
  }

  // Company Profiles API
  getCompanyProfiles(): CompanyProfile[] {
    const all = JSON.parse(localStorage.getItem(KEYS.COMPANY_PROFILES) || '[]');
    const activeUserId = this.getActiveUserId();
    return all.filter((c: CompanyProfile) => c.userId === activeUserId);
  }

  saveCompanyProfile(profile: CompanyProfile): CompanyProfile {
    const all = JSON.parse(localStorage.getItem(KEYS.COMPANY_PROFILES) || '[]');
    const index = all.findIndex((c: any) => c.id === profile.id || (c.companyName.toLowerCase() === profile.companyName.toLowerCase() && c.userId === profile.userId));
    if (index >= 0) {
      all[index] = { ...all[index], ...profile, updatedAt: new Date().toISOString() };
    } else {
      all.push({ ...profile, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(KEYS.COMPANY_PROFILES, JSON.stringify(all));
    return profile;
  }

  deleteCompanyProfile(id: string): void {
    const all = JSON.parse(localStorage.getItem(KEYS.COMPANY_PROFILES) || '[]');
    const filtered = all.filter((c: any) => c.id !== id);
    localStorage.setItem(KEYS.COMPANY_PROFILES, JSON.stringify(filtered));
  }

  // Weekly Planner API
  getWeeklyPlanners(): WeeklyPlanner[] {
    const all = JSON.parse(localStorage.getItem(KEYS.WEEKLY_PLANNERS) || '[]');
    const activeUserId = this.getActiveUserId();
    return all.filter((p: WeeklyPlanner) => p.userId === activeUserId);
  }

  getWeeklyPlanner(userId: string, weekNumber: number): WeeklyPlanner | null {
    const all = this.getWeeklyPlanners();
    return all.find((p: any) => p.userId === userId && p.weekNumber === weekNumber) || null;
  }

  saveWeeklyPlanner(planner: WeeklyPlanner): WeeklyPlanner {
    const all = JSON.parse(localStorage.getItem(KEYS.WEEKLY_PLANNERS) || '[]');
    const index = all.findIndex((p: any) => p.userId === planner.userId && p.weekNumber === planner.weekNumber);
    if (index >= 0) {
      all[index] = { ...planner, updatedAt: new Date().toISOString() };
    } else {
      all.push({ ...planner, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(KEYS.WEEKLY_PLANNERS, JSON.stringify(all));
    return planner;
  }

  // Weekly Goals API
  getWeeklyGoals(): WeeklyGoal[] {
    const all = JSON.parse(localStorage.getItem(KEYS.WEEKLY_GOALS) || '[]');
    const activeUserId = this.getActiveUserId();
    return all.filter((g: WeeklyGoal) => g.userId === activeUserId);
  }

  getWeeklyGoal(userId: string, weekNumber: number): WeeklyGoal | null {
    const all = this.getWeeklyGoals();
    return all.find((g: any) => g.userId === userId && g.weekNumber === weekNumber) || null;
  }

  saveWeeklyGoal(goal: WeeklyGoal): WeeklyGoal {
    const all = JSON.parse(localStorage.getItem(KEYS.WEEKLY_GOALS) || '[]');
    const index = all.findIndex((g: any) => g.userId === goal.userId && g.weekNumber === goal.weekNumber);
    if (index >= 0) {
      all[index] = { ...goal, updatedAt: new Date().toISOString() };
    } else {
      all.push({ ...goal, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(KEYS.WEEKLY_GOALS, JSON.stringify(all));
    return goal;
  }

  // Career Goals API
  getCareerGoals(userId: string): CareerGoal[] {
    const all = JSON.parse(localStorage.getItem(KEYS.CAREER_GOALS) || '[]') as CareerGoal[];
    return all.filter(g => g.userId === userId);
  }

  saveCareerGoal(goal: CareerGoal): CareerGoal {
    const all = JSON.parse(localStorage.getItem(KEYS.CAREER_GOALS) || '[]') as CareerGoal[];
    const index = all.findIndex(g => g.id === goal.id);
    if (index >= 0) {
      all[index] = { ...goal, updatedAt: new Date().toISOString() };
    } else {
      all.push(goal);
    }
    localStorage.setItem(KEYS.CAREER_GOALS, JSON.stringify(all));
    return goal;
  }

  deleteCareerGoal(id: string): void {
    const all = JSON.parse(localStorage.getItem(KEYS.CAREER_GOALS) || '[]') as CareerGoal[];
    const filtered = all.filter(g => g.id !== id);
    localStorage.setItem(KEYS.CAREER_GOALS, JSON.stringify(filtered));
  }
}

export const localDB = new LocalDatabase();
