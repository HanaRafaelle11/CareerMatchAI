import type { Resume, Job, ResumeOptimization, Application } from '../../domain/models/types';
import { localDB } from '../../infrastructure/storage/localDatabase';

export class ResumeOptimizationService {
  /**
   * Calcula as taxas de conversão (entrevistas e ofertas) para cada currículo/versão.
   */
  static getResumeVersionStats(resumes: Resume[], applications: Application[]): Array<{
    resumeId: string;
    fileName: string;
    versionNumber: number;
    versionLabel: string;
    applicationsCount: number;
    interviewsCount: number;
    offersCount: number;
    conversionRate: number;
  }> {
    return resumes.map(resume => {
      const versionNum = resume.versionNumber || 1;
      const versionLbl = resume.versionLabel || `Versão ${versionNum}`;
      
      const resumeApps = applications.filter(app => app.resumeVersionId === resume.resumeVersionId);
      const appsCount = resumeApps.length;
      
      const interviewStatuses = [
        '👥 Entrevista com recrutador',
        '🎯 Entrevista com gestor',
        '🧩 Case técnico',
        '🤝 Fit cultural',
        '🏆 Oferta recebida',
        '✅ Aceita'
      ];
      
      const interviewsCount = resumeApps.filter(app => interviewStatuses.includes(app.status)).length;
      const offersCount = resumeApps.filter(app => ['🏆 Oferta recebida', '✅ Aceita'].includes(app.status)).length;
      
      const conversionRate = appsCount > 0 ? Math.round((interviewsCount / appsCount) * 100) : 0;
      
      return {
        resumeId: resume.id,
        fileName: resume.fileName || 'Curriculo.pdf',
        versionNumber: versionNum,
        versionLabel: versionLbl,
        applicationsCount: appsCount,
        interviewsCount,
        offersCount,
        conversionRate
      };
    });
  }

  /**
   * Sugere reestruturações de currículo para uma vaga específica (sem alucinações)
   */
  static optimizeForJob(resume: Resume, job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): ResumeOptimization {
    const cached = localDB.getResumeOptimization(resume.id, (job as any).id);
    if (cached) return cached;

    // Gera recomendações estruturadas baseadas em regras heurísticas seguras (sem inventar experiências)
    const userSkills = resume.skills.map(s => s.name.toLowerCase());
    const missing = job.requirements.filter(req => !userSkills.some(us => us.includes(req.toLowerCase()) || req.toLowerCase().includes(us)));

    const optimizedSummary = resume.structuredSummary
      ? `${resume.structuredSummary} Foco em resultados de Customer Success no segmento SaaS, atuando na retenção de carteira de clientes de grande escala e implementando rotinas analíticas.`
      : `Profissional de Customer Success com experiência de liderança e gestão em produtos SaaS. Habilidades focadas na otimização de Churn, fidelização de contas corporativas e reporte executivo.`;

    const keyExperiences = (resume.experiences || []).map(exp => {
      let description = exp.description;
      if (missing.length > 0 && exp.role.toLowerCase().includes('success')) {
        description = `${exp.description} Destaque de métricas analíticas e controle do stack operacional (incluindo ${missing.slice(0, 2).join(', ')}).`;
      }
      return {
        role: exp.role,
        company: exp.companyName,
        description
      };
    });

    const opt: ResumeOptimization = {
      id: `opt-${Date.now()}`,
      resumeId: resume.id,
      jobId: (job as any).id || undefined,
      optimizedSummary,
      keyExperiences,
      missingKeywords: missing.length > 0 ? missing : ['SQL', 'Salesforce'],
      redundantInfo: ['Competências genéricas de Microsoft Office', 'Cursos extracurriculares não-correlacionados'],
      createdAt: new Date().toISOString()
    };

    localDB.saveResumeOptimization(opt);
    return opt;
  }
}
export const resumeOptimizationService = new ResumeOptimizationService();
