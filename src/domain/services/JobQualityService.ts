import type { Job } from '../models/types';

export type JobQualityLevel = 'HIGH_QUALITY' | 'MEDIUM_QUALITY' | 'LOW_QUALITY';

export interface JobQualityAssessment {
  level: JobQualityLevel;
  completenessScore: number; // 0 a 100
  issues: string[];
}

export class JobQualityService {
  /**
   * Avalia a qualidade e completude dos dados de uma vaga.
   * Não afeta o score de compatibilidade do candidato.
   */
  public static evaluateJobQuality(job: Partial<Job>): JobQualityAssessment {
    const issues: string[] = [];
    let completenessScore = 100;

    const title = job.title?.trim() || '';
    const company = job.companyName?.trim() || '';
    const desc = job.description?.trim() || '';
    const reqs = job.requirements || [];
    const seniority = job.seniority;
    const location = job.location?.trim() || '';

    // 1. Título
    if (!title || title.length < 3) {
      issues.push('Título ausente ou excessivamente curto');
      completenessScore -= 30;
    }

    // 2. Empresa
    if (!company || company.toLowerCase().includes('confidencial')) {
      issues.push('Empresa não identificada ou confidencial');
      completenessScore -= 15;
    }

    // 3. Descrição
    if (!desc || desc.length < 40) {
      issues.push('Descrição da vaga ausente ou curta demais');
      completenessScore -= 25;
    }

    // 4. Requisitos
    if (!reqs || reqs.length === 0) {
      issues.push('Nenhum requisito técnico ou comportamental estruturado');
      completenessScore -= 20;
    }

    // 5. Senioridade
    if (!seniority) {
      issues.push('Senioridade não especificada');
      completenessScore -= 5;
    }

    // 6. Localização
    if (!location && !job.workMode) {
      issues.push('Localização ou modalidade de trabalho ausente');
      completenessScore -= 5;
    }

    completenessScore = Math.max(0, Math.min(100, completenessScore));

    let level: JobQualityLevel = 'HIGH_QUALITY';
    if (completenessScore < 50 || !desc || reqs.length === 0) {
      level = 'LOW_QUALITY';
    } else if (completenessScore < 80) {
      level = 'MEDIUM_QUALITY';
    }

    return {
      level,
      completenessScore,
      issues
    };
  }
}
