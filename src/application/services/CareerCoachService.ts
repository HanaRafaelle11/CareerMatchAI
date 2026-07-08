import type { Resume, Job, CareerProfile } from '../../domain/models/types';
import { MatchingEngine } from './matchingEngine';

export interface CoachEvaluation {
  shouldApply: '🟢 Sim' | '🟡 Ajustar antes' | '🔴 Baixa aderência';
  reasons: string[];
  warnings: string[];
  recommendation: string;
}

export class CareerCoachService {
  /**
   * Avalia se vale a pena aplicar para a vaga com base no perfil de carreira, currículo e dados da vaga.
   */
  static evaluateCandidacy(
    resume: Resume | null,
    job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    profile: CareerProfile | null
  ): CoachEvaluation {
    if (!resume) {
      return {
        shouldApply: '🟡 Ajustar antes',
        reasons: ['Não há currículo ativo para análise.'],
        warnings: ['Faça o upload do seu currículo primeiro.'],
        recommendation: 'Cadastre seu currículo na aba Meu Perfil.'
      };
    }

    // Calcula compatibilidade básica síncrona
    const analysis = MatchingEngine.calculateMatchSync(resume, job);

    const reasons: string[] = [];
    const warnings: string[] = [];

    // Fatores de sucesso
    if (analysis.scoreOverall >= 85) {
      reasons.push(`${analysis.scoreOverall}% de aderência geral com seu histórico.`);
    }
    
    // Fit de senioridade
    if (profile) {
      const isSeniorityMatch = profile.seniority.toLowerCase() === job.seniority.toLowerCase();
      if (isSeniorityMatch) {
        reasons.push(`Senioridade compatível (${profile.seniority}).`);
      } else {
        warnings.push(`Senioridade sugerida difere da sua meta (${job.seniority}).`);
      }
    }

    // Mapeia competências chaves
    const userSkills = resume.skills.map(s => s.name.toLowerCase());
    const matchedSkills = job.requirements.filter(req => userSkills.includes(req.toLowerCase()));
    
    matchedSkills.slice(0, 2).forEach(sk => {
      reasons.push(`Experiência comprovada em ${sk}.`);
    });

    // Mapeia gaps chaves
    const missing = analysis.missingSkills;
    missing.slice(0, 2).forEach(sk => {
      warnings.push(`Falta comprovação explícita em ${sk}.`);
    });

    // Determina a resposta final
    let shouldApply: CoachEvaluation['shouldApply'] = '🔴 Baixa aderência';
    let recommendation = 'Recomendamos buscar outras oportunidades mais alinhadas ao seu perfil.';

    if (analysis.scoreOverall >= 85 && warnings.length <= 1) {
      shouldApply = '🟢 Sim';
      recommendation = 'Esta vaga está perfeitamente alinhada. Prossiga com o envio da candidatura.';
    } else if (analysis.scoreOverall >= 70) {
      shouldApply = '🟡 Ajustar antes';
      recommendation = `Ajuste seu currículo destacando as competências ausentes (${missing.slice(0, 2).join(', ')}) antes de enviar.`;
    }

    return {
      shouldApply,
      reasons: reasons.length > 0 ? reasons : ['Compatibilidade geral de perfil.'],
      warnings: warnings.length > 0 ? warnings : ['Sem pontos críticos de atenção.'],
      recommendation
    };
  }
}
