import type { Resume, Job, Match, GapAnalysis, Application, Profile, CareerProfile, ApplicationStage, ResumeOptimization, CoverLetter, InterviewPreparation, InterviewSimulation, PostInterviewLog, Notification, InterviewPrep, CompanyProfile, WeeklyPlanner, WeeklyGoal, CareerGoal } from '../../domain/models/types';
import { mockResume, mockJobs, mockMatches, mockGapAnalyses, mockCoverLetters, mockInterviewPreps } from './mockData';

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
  private init() {
    if (!localStorage.getItem(KEYS.PROFILE)) {
      const defaultProfile: Profile = {
        id: 'user-default',
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
        userId: 'user-default',
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
          userId: 'user-default',
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
          userId: 'user-default',
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
          userId: 'user-default',
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
        userId: 'user-default',
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
              { id: 'task-3', text: 'Conversa com RH (Stripe Brasil)', completed: false }
            ]
          },
          'Quarta-feira': {
            tasks: [
              { id: 'task-4', text: 'Atualizar currículo para versão V2 (ênfase em Node.js)', completed: false }
            ]
          },
          'Quinta-feira': {
            tasks: [
              { id: 'task-5', text: 'Fazer simulador de entrevista sobre SQL', completed: false }
            ]
          },
          'Sexta-feira': {
            tasks: [
              { id: 'task-6', text: 'Treinar framework STAR com Coach', completed: false }
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
        userId: 'user-default',
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
          userId: 'user-default',
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
    return JSON.parse(localStorage.getItem(KEYS.RESUMES) || '[]');
  }

  getPrimaryResume(): Resume | undefined {
    return this.getResumes().find(r => r.isPrimary);
  }

  saveResume(resume: Resume): Resume {
    const resumes = this.getResumes();
    if (resume.isPrimary) {
      resumes.forEach(r => r.isPrimary = false);
    }
    const index = resumes.findIndex(r => r.id === resume.id);
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
  }

  // Jobs API
  getJobs(): Job[] {
    return JSON.parse(localStorage.getItem(KEYS.JOBS) || '[]');
  }

  getJob(id: string): Job | undefined {
    return this.getJobs().find(j => j.id === id);
  }

  saveJob(job: Job): Job {
    const jobs = this.getJobs();
    const index = jobs.findIndex(j => j.id === job.id);
    if (index >= 0) {
      jobs[index] = job;
    } else {
      jobs.push(job);
    }
    localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
    return job;
  }

  // Matches API
  getMatches(): Match[] {
    return JSON.parse(localStorage.getItem(KEYS.MATCHES) || '[]');
  }

  getMatch(id: string): Match | undefined {
    return this.getMatches().find(m => m.id === id);
  }

  getMatchForJob(jobId: string): Match | undefined {
    return this.getMatches().find(m => m.jobId === jobId);
  }

  saveMatch(match: Match): Match {
    const matches = this.getMatches();
    const index = matches.findIndex(m => m.id === match.id);
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
    preps[prep.matchId] = prep;
    localStorage.setItem(KEYS.PREPS, JSON.stringify(preps));
    return prep;
  }

  // Applications API
  getApplications(): Application[] {
    return JSON.parse(localStorage.getItem(KEYS.APPLICATIONS) || '[]');
  }

  getApplication(id: string): Application | undefined {
    return this.getApplications().find(a => a.id === id);
  }

  saveApplication(app: Application): Application {
    const apps = this.getApplications();
    const index = apps.findIndex(a => a.id === app.id);
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

  // Company Profiles API
  getCompanyProfiles(): CompanyProfile[] {
    return JSON.parse(localStorage.getItem(KEYS.COMPANY_PROFILES) || '[]');
  }

  saveCompanyProfile(profile: CompanyProfile): CompanyProfile {
    const all = this.getCompanyProfiles();
    const index = all.findIndex(c => c.id === profile.id || (c.companyName.toLowerCase() === profile.companyName.toLowerCase() && c.userId === profile.userId));
    if (index >= 0) {
      all[index] = { ...all[index], ...profile, updatedAt: new Date().toISOString() };
    } else {
      all.push({ ...profile, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(KEYS.COMPANY_PROFILES, JSON.stringify(all));
    return profile;
  }

  deleteCompanyProfile(id: string): void {
    const all = this.getCompanyProfiles();
    const filtered = all.filter(c => c.id !== id);
    localStorage.setItem(KEYS.COMPANY_PROFILES, JSON.stringify(filtered));
  }

  // Weekly Planner API
  getWeeklyPlanners(): WeeklyPlanner[] {
    return JSON.parse(localStorage.getItem(KEYS.WEEKLY_PLANNERS) || '[]');
  }

  getWeeklyPlanner(userId: string, weekNumber: number): WeeklyPlanner | null {
    const all = this.getWeeklyPlanners();
    return all.find(p => p.userId === userId && p.weekNumber === weekNumber) || null;
  }

  saveWeeklyPlanner(planner: WeeklyPlanner): WeeklyPlanner {
    const all = this.getWeeklyPlanners();
    const index = all.findIndex(p => p.userId === planner.userId && p.weekNumber === planner.weekNumber);
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
    return JSON.parse(localStorage.getItem(KEYS.WEEKLY_GOALS) || '[]');
  }

  getWeeklyGoal(userId: string, weekNumber: number): WeeklyGoal | null {
    const all = this.getWeeklyGoals();
    return all.find(g => g.userId === userId && g.weekNumber === weekNumber) || null;
  }

  saveWeeklyGoal(goal: WeeklyGoal): WeeklyGoal {
    const all = this.getWeeklyGoals();
    const index = all.findIndex(g => g.userId === goal.userId && g.weekNumber === goal.weekNumber);
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
