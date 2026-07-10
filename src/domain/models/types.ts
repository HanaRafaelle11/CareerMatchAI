export interface Profile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  headline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
}

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  workMode: 'remote' | 'hybrid' | 'onsite';
  seniority: 'junior' | 'pleno' | 'senior' | 'lead' | 'director';
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  sourceUrl?: string;
  sourcePlatform?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  salary?: string;
  benefits?: string[];
  stagesCount?: number;
  caseHours?: number;
  salaryNumeric?: number;
}

export interface Resume {
  id: string;
  userId: string;
  resumeVersionId?: string;
  filePath?: string;
  fileName?: string;
  file_url?: string;
  storage_path?: string;
  rawText?: string;
  structuredSummary?: string;
  yearsOfExperience: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  experiences: Experience[];
  skills: Skill[];
  education: Education[];
  versionNumber?: number;
  versionLabel?: string;
  structured_data?: any;
}

export interface ResumeVersion {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  professionalGoal?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface JobMatch {
  id: string;
  userId: string;
  careerProfileId: string;
  jobId: string;
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  interviewProbability: number;
  recommendation: string;
  createdAt: string;
}

export interface Experience {
  id: string;
  companyName: string;
  role: string;
  description: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  highlights: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: 'hard_skill' | 'soft_skill' | 'tool' | 'language';
  proficiencyLevel?: 'básico' | 'intermediário' | 'avançado' | 'fluente';
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

export interface MatchExplanation {
  strengths: string[];
  weaknesses: string[];
  details: {
    technical: string;
    behavioral: string;
    seniority: string;
    salary: string;
    location: string;
  };
}

export interface Match {
  id: string;
  userId: string;
  resumeId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  scoreOverall: number;
  scoreTechnical: number;
  scoreBehavioral: number;
  scoreSeniority: number;
  scoreSalary?: number;
  scoreLocation: number;
  explanation: MatchExplanation;
  createdAt: string;
  processingTimeMs?: number;
}

export interface GapAnalysis {
  id: string;
  matchId: string;
  missingSkills: string[];
  skillsToLearn: string[];
  toIncludeInResume: string[];
  toExcludeFromResume: string[];
  repetitiveContent: string[];
  lowValueContent: string[];
}

export interface OptimizedResume {
  id: string;
  matchId: string;
  optimizedSummary: string;
  reorganizedExperience: Array<{
    experienceId: string;
    companyName: string;
    role: string;
    originalDescription: string;
    optimizedDescription: string;
    highlights: string[];
  }>;
  createdAt: string;
}

export interface CoverLetter {
  id: string;
  matchId?: string;
  content?: string;
  applicationId?: string;
  textFormal?: string;
  textDirect?: string;
  textExecutive?: string;
  createdAt: string;
}

export interface InterviewPrepQuestion {
  question: string;
  suggestedAnswer: string;
  type: 'technical' | 'behavioral' | 'fit';
}

export interface InterviewPrep {
  id: string;
  matchId: string;
  questions: InterviewPrepQuestion[];
  strengths: string[];
  weaknesses: string[];
  questionsToAsk: string[];
  createdAt: string;
}

export interface Application {
  id: string;
  userId: string;
  jobId?: string;
  matchId?: string;
  companyName: string;
  jobTitle: string;
  status: '🔎 Encontrada' | '⭐ Tenho interesse' | '📝 Vou me candidatar' | '📨 Me candidatei' | '⏳ Aguardando retorno' | '👥 Entrevista com recrutador' | '🎯 Entrevista com gestor' | '🧩 Case técnico' | '🤝 Fit cultural' | '🏆 Oferta recebida' | '✅ Aceita' | '❌ Rejeitada' | '🚫 Fora do meu objetivo' | '👻 Sem resposta';
  rejectionReason?: 'Experiência insuficiente' | 'Senioridade incompatível' | 'Pretensão salarial' | 'Falta de conhecimento técnico' | 'Idioma' | 'Cultura' | 'Empresa pausou vaga' | 'Sem retorno' | 'Outro';
  sourcePlatform?: string;
  resumeVersionId?: string;
  notes?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStage {
  id: string;
  applicationId: string;
  stageName: string;
  status: 'pending' | 'passed' | 'failed';
  notes?: string;
  stageDate: string;
  createdAt: string;
}

export interface CareerProfile {
  id: string;
  userId: string;
  resumeId: string;
  targetRoles: string[];
  seniority: string;
  industries: string[];
  skills: string[];
  tools: string[];
  languages: string[];
  preferredLocations: string[];
  preferredWorkModes: ('remote' | 'hybrid' | 'onsite')[];
  targetCompanies: string[];
  salaryExpectationMin: number;
  searchKeywords: string[];
  isApprovedByUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeOptimization {
  id: string;
  resumeId: string;
  jobId?: string;
  optimizedSummary: string;
  keyExperiences: { role: string; company: string; description: string }[];
  missingKeywords: string[];
  redundantInfo: string[];
  createdAt: string;
}


export interface InterviewPreparation {
  id: string;
  jobId: string;
  questions: {
    question: string;
    answerStar: { context: string; action: string; result: string };
    type: 'RH' | 'gestor' | 'tecnica' | 'cultura';
  }[];
  createdAt: string;
}

export interface InterviewSimulation {
  id: string;
  applicationId: string;
  chatHistory: { role: 'interviewer' | 'candidate'; text: string }[];
  evaluations?: {
    clarity: number;
    objectivity: number;
    adherence: number;
    strengths: string[];
    improvements: string[];
  };
  createdAt: string;
}

export interface PostInterviewLog {
  id: string;
  applicationId: string;
  confidenceScore: number;
  difficultQuestions: string[];
  improvements: string;
  companyPerception: string;
  createdAt: string;
  feeling?: 'happy' | 'neutral' | 'sad' | string;
  whatLearned?: string;
  doDifferent?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'job_alert' | 'inactivity' | 'desired_company';
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  industry?: string;
  size?: string;
  glassdoorRating?: number;
  interviewProcess?: string;
  benefits: string[];
  remotePolicy?: string;
  salaryRange?: string;
  userNotes?: string;
  wouldApplyAgain?: boolean;
  cultureScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPlanner {
  id: string;
  userId: string;
  weekNumber: number;
  plannerData: {
    [day: string]: {
      tasks: Array<{ id: string; text: string; completed: boolean }>;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyGoal {
  id: string;
  userId: string;
  weekNumber: number;
  targetApplications: number;
  targetInterviewsRh: number;
  targetInterviewsManager: number;
  createdAt: string;
  updatedAt: string;
}

export interface CareerGoal {
  id: string;
  userId: string;
  title: string;
  targetDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  value?: string | number;
}
