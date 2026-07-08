import type { Job, Resume, CareerProfile } from '../../domain/models/types';
import { MatchingEngine } from './matchingEngine';

export interface StrategyRecommendation {
  job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  scoreOverall: number;
  cpi: number;
  roi: number;
  priority: '🔥 Aplicar hoje' | '⚡ Preparar antes de aplicar' | '📚 Baixa aderência';
  matchedReasons: string[];
  warnings: string[];
  missingSkills: string[];
}

export class CandidateStrategyService {
  /**
   * Calcula o ROI da candidatura baseado em dados da vaga e do perfil de carreira.
   */
  static calculateROI(
    matchScore: number,
    salaryNumeric: number | undefined,
    stagesCount: number = 3,
    caseHours: number = 0,
    minSalaryExpectation: number = 0
  ): number {
    const matchFactor = matchScore;

    let salaryFactor = 50;
    if (salaryNumeric && minSalaryExpectation > 0) {
      if (salaryNumeric >= minSalaryExpectation * 1.3) {
        salaryFactor = 100;
      } else if (salaryNumeric >= minSalaryExpectation) {
        salaryFactor = 50 + Math.round(((salaryNumeric - minSalaryExpectation) / (minSalaryExpectation * 0.3)) * 50);
      } else {
        salaryFactor = Math.max(0, Math.round((salaryNumeric / minSalaryExpectation) * 50));
      }
    }

    const stageWeight = Math.max(10, 100 - ((stagesCount - 2) * 15));
    const caseWeight = Math.max(0, 100 - (caseHours * 5));
    const effortFactor = (stageWeight * 0.5) + (caseWeight * 0.5);

    const roi = (matchFactor * 0.40) + (salaryFactor * 0.30) + (effortFactor * 0.30);
    return Math.min(100, Math.max(0, Math.round(roi)));
  }

  /**
   * Calcula o CPI e gera justificativas detalhadas para listagens e painéis estratégicos
   */
  static calculateCPI(
    resume: Resume,
    job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    profile: CareerProfile | null
  ): StrategyRecommendation {
    // 1. Executa o casamento de compatibilidade síncrono da Engine
    const matchAnalysis = MatchingEngine.calculateMatchSync(resume, job);
    
    // 2. Pontua os fatores individuais do CPI
    const scoreOverall = matchAnalysis.scoreOverall;

    // Seniority Fit (15 pts)
    let seniorityScore = 0;
    if (profile) {
      const profSeniority = profile.seniority.toLowerCase();
      const jobSeniority = job.seniority.toLowerCase();
      if (profSeniority === jobSeniority) {
        seniorityScore = 100;
      } else if (
        (profSeniority.includes('senior') && jobSeniority.includes('manager')) ||
        (profSeniority.includes('pleno') && jobSeniority.includes('senior')) ||
        (profSeniority.includes('junior') && jobSeniority.includes('pleno'))
      ) {
        seniorityScore = 50; // Desvio suave de 1 degrau
      }
    } else {
      seniorityScore = 100;
    }

    // Gaps de Ferramentas (15 pts)
    let toolsScore = 100;
    if (profile && profile.tools.length > 0) {
      const missingTools = job.requirements.filter(req => 
        profile.tools.some(t => t.toLowerCase() === req.toLowerCase()) && 
        matchAnalysis.missingSkills.some(m => m.toLowerCase() === req.toLowerCase())
      );
      toolsScore = Math.max(0, 100 - (missingTools.length * 30));
    }

    // Preferências de Trabalho (10 pts)
    let workModeScore = 0;
    if (profile) {
      const isRemoteMatch = profile.preferredWorkModes.includes(job.workMode as any);
      const isLocationMatch = profile.preferredLocations.some(loc => 
        job.location.toLowerCase().includes(loc.toLowerCase()) || 
        loc.toLowerCase() === 'brasil inteiro'
      );
      workModeScore = (isRemoteMatch ? 60 : 0) + (isLocationMatch ? 40 : 0);
    } else {
      workModeScore = 100;
    }

    // Empresa Alvo (5 pts bônus)
    let companyBonus = 0;
    if (profile && profile.targetCompanies.some(c => job.companyName.toLowerCase().includes(c.toLowerCase()))) {
      companyBonus = 5;
    }

    // Recência (5 pts)
    const recencyBonus = 5; // Simulado +5 para vagas recém-buscadas ou integradas

    // Fórmula Ponderada do CPI:
    // CPI = (ScoreMatch * 0.50) + (Seniority * 0.15) + (Tools * 0.15) + (WorkMode * 0.10) + CompanyBonus + RecencyBonus
    const rawCpi = (scoreOverall * 0.50) + 
                   (seniorityScore * 0.15) + 
                   (toolsScore * 0.15) + 
                   (workModeScore * 0.10) + 
                   companyBonus + 
                   recencyBonus;

    const cpi = Math.min(100, Math.round(rawCpi));

    // Calcular ROI
    const salaryNumeric = job.salaryNumeric || (job as any).salaryMax || (job as any).salaryMin || undefined;
    const stagesCount = job.stagesCount || 3;
    const caseHours = job.caseHours || 0;
    const minSalaryExpectation = profile ? profile.salaryExpectationMin : 0;

    const roi = this.calculateROI(
      scoreOverall,
      salaryNumeric,
      stagesCount,
      caseHours,
      minSalaryExpectation
    );

    // Categorização por faixa de pontuação
    let priority: StrategyRecommendation['priority'] = '📚 Baixa aderência';
    if (cpi >= 85) {
      priority = '🔥 Aplicar hoje';
    } else if (cpi >= 70) {
      priority = '⚡ Preparar antes de aplicar';
    }

    // Gerar justificativas contextuais baseadas nas competências
    const matchedReasons: string[] = [];
    const warnings: string[] = [];

    // Mapear pontos positivos
    const resumeSkills = resume.skills.map(s => s.name.toLowerCase());
    job.requirements.slice(0, 3).forEach(req => {
      if (resumeSkills.includes(req.toLowerCase())) {
        matchedReasons.push(`Domínio de ${req}`);
      }
    });

    if (matchedReasons.length === 0) {
      matchedReasons.push('Experiência geral em engenharia/gestão de valor');
    }

    // Adiciona fit de empresa se houver
    if (companyBonus > 0) {
      matchedReasons.push('Empresa catalogada nos seus alvos de interesse');
    }

    // Mapear alertas/gaps
    matchAnalysis.missingSkills.slice(0, 2).forEach(req => {
      warnings.push(`${req} solicitado na vaga`);
    });

    if (seniorityScore === 50) {
      warnings.push(`Senioridade sugerida difere levemente da meta (${job.seniority})`);
    }

    return {
      job,
      scoreOverall,
      cpi,
      roi,
      priority,
      matchedReasons,
      warnings,
      missingSkills: matchAnalysis.missingSkills
    };
  }

  /**
   * Agrupa e ordena as vagas com base nas colunas CPI da raia Kanban
   */
  static groupJobs(
    resume: Resume | null,
    jobsList: (Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>)[],
    profile: CareerProfile | null
  ): Record<'hot' | 'warm' | 'cold', StrategyRecommendation[]> {
    const result: Record<'hot' | 'warm' | 'cold', StrategyRecommendation[]> = {
      hot: [],
      warm: [],
      cold: []
    };

    if (!resume) return result;

    jobsList.forEach(job => {
      const rec = this.calculateCPI(resume, job, profile);
      if (rec.priority === '🔥 Aplicar hoje') {
        result.hot.push(rec);
      } else if (rec.priority === '⚡ Preparar antes de aplicar') {
        result.warm.push(rec);
      } else {
        result.cold.push(rec);
      }
    });

    // Ordena do maior CPI para o menor dentro de cada lista
    result.hot.sort((a, b) => b.cpi - a.cpi);
    result.warm.sort((a, b) => b.cpi - a.cpi);
    result.cold.sort((a, b) => b.cpi - a.cpi);

    return result;
  }
}
