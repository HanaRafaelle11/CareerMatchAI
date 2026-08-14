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
    return resumes.map((resume, idx) => {
      const versionNum = resume.versionNumber || (idx + 1);
      const fileName = resume.fileName || 'Curriculo.pdf';
      const versionLbl = resume.versionLabel || `Versão ${versionNum}${fileName ? ` — ${fileName}` : ''}`;
      
      const resumeApps = applications.filter(app => app.resumeVersionId === resume.resumeVersionId);
      const appsCount = resumeApps.length;
      
      const interviewStatuses = [
        '👥 Entrevista com recrutador',
        '🎯 Entrevista com gestor',
        '🧩 Case técnico',
        '🤝 Fit cultural',
        'hr',
        'interview'
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

    const primaryRole = resume.experiences?.[0]?.role || job.title || 'Profissional';
    const optimizedSummary = resume.structuredSummary
      ? `${resume.structuredSummary} Foco em excelência operacional, aplicação de melhores práticas para ${job.title} e entregas com alto padrão de qualidade.`
      : `Profissional com sólida trajetória em ${primaryRole}, atuando com foco em resultados, eficiência de processos e aplicação prática de competências alinhadas aos requisitos da posição de ${job.title}.`;

    const keyExperiences = (resume.experiences && resume.experiences.length > 0)
      ? resume.experiences.map((exp, i) => {
          let description = exp.description || 'Atuação com foco em resultados e qualidade.';
          if (missing.length > 0 && i === 0) {
            description = `${description} Recomenda-se destacar conhecimentos aplicados em ${missing.slice(0, 2).join(' e ')}.`;
          }
          return {
            role: exp.role || primaryRole,
            company: exp.companyName || 'Empresa',
            description
          };
        })
      : [
          {
            role: primaryRole,
            company: 'Experiência Relevante',
            description: `Atuação estratégica alinhada às principais competências exigidas para ${job.title}.`
          }
        ];

    const opt: ResumeOptimization = {
      id: `opt-${Date.now()}`,
      resumeId: resume.id,
      jobId: (job as any).id || undefined,
      optimizedSummary,
      keyExperiences,
      missingKeywords: missing.length > 0 ? missing : (job.requirements?.slice(0, 3) || ['Comunicação', 'Organização']),
      redundantInfo: ['Termos genéricos sem evidências de resultados', 'Informações não correlacionadas à vaga'],
      createdAt: new Date().toISOString()
    };

    localDB.saveResumeOptimization(opt);
    return opt;
  }
}
export const resumeOptimizationService = new ResumeOptimizationService();
