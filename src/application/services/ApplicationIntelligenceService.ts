import type { Job, Resume } from '../../domain/models/types';

export interface PreApplicationChecklist {
  requiredSkillsMet: string[];
  missingSkillsToHighlight: string[];
  checklistItems: Array<{ id: string; label: string; completed: boolean }>;
}

export interface ElevatorPitch {
  pitchText: string;
  keyHighlights: string[];
}

export class ApplicationIntelligenceService {
  /**
   * Gera o checklist pré-candidatura para garantir máxima taxa de resposta
   */
  static generatePreApplicationChecklist(job: Job, resume?: Resume | null): PreApplicationChecklist {
    const userSkills = (resume?.skills || []).map(s => s.name.toLowerCase());
    const reqs = job.requirements || [];

    const requiredSkillsMet = reqs.filter(r => userSkills.some(us => us.includes(r.toLowerCase())));
    const missingSkillsToHighlight = reqs.filter(r => !userSkills.some(us => us.includes(r.toLowerCase())));

    const checklistItems = [
      { id: '1', label: `Título do resumo adaptado para "${job.title}"`, completed: true },
      { id: '2', label: `Palavras-chave da vaga inseridas no currículo (${requiredSkillsMet.length} detectadas)`, completed: requiredSkillsMet.length > 0 },
      { id: '3', label: `Formatado em coluna única para aprovação ATS (${job.sourcePlatform || 'ATS'})`, completed: true },
      { id: '4', label: 'Revisão de pretensão salarial e modalidade de trabalho', completed: true }
    ];

    return {
      requiredSkillsMet,
      missingSkillsToHighlight,
      checklistItems
    };
  }

  /**
   * Sintetiza o Pitch Profissional (Elevator Pitch) ideal para abordagens no LinkedIn ou carta de apresentação
   */
  static generatePitchSummary(job: Job, resume?: Resume | null): ElevatorPitch {
    const title = job.title;
    const company = job.companyName;
    const summary = resume?.structuredSummary || 'profissional de tecnologia e gestão';

    const pitchText = `Olá! Acompanho a trajetória da ${company} e fiquei muito entusiasmado com a oportunidade para ${title}. Atuo como ${summary}, combinando vivência prática em gestão de processos e entrega de resultados focados em eficiência. Acredito que posso somar com a equipe desde o primeiro dia.`;

    return {
      pitchText,
      keyHighlights: [
        `Encaixe com o perfil de ${title}`,
        'Foco em resultados mensuráveis',
        `Interesse demonstrado na cultura da ${company}`
      ]
    };
  }
}
