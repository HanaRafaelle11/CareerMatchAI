import type { Resume, Job, CareerProfile, CareerGoal } from '../../domain/models/types';
import type { CareerProfileNew } from '../hooks/useMyProfileAi';
import { MatchingEngine, buildFlatSkillsFromProfile } from './matchingEngine';

export interface CoachEvaluation {
  shouldApply: '🟢 Sim' | '🟡 Ajustar antes' | '🔴 Match baixo com a vaga';
  reasons: string[];
  warnings: string[];
  recommendation: string;
}

export class CareerCoachService {
  /**
   * Avalia se vale a pena aplicar para a vaga.
   * Usa o CareerProfileNew (career_profiles + career_insights) como fonte primária
   * quando disponível, integrando Fit Atual e Potencial de Carreira.
   */
  static evaluateCandidacy(
    resume: Resume | null,
    job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    profile: CareerProfile | null,
    consolidatedProfile?: CareerProfileNew | null,
    matchOverride?: any | null,
    _careerGoal?: CareerGoal | null
  ): CoachEvaluation {
    if (!resume && !consolidatedProfile) {
      return {
        shouldApply: '🟡 Ajustar antes',
        reasons: ['Não há currículo ativo para análise.'],
        warnings: ['Faça o upload do seu currículo primeiro.'],
        recommendation: 'Cadastre seu currículo na aba Meu Perfil.'
      };
    }

    // Identifica Fit Score e Goal Score
    const fitScore = matchOverride?.careerFitScore ?? matchOverride?.scoreOverall ?? 0;
    const goalScore = matchOverride?.careerGoalScore !== undefined ? matchOverride.careerGoalScore : null;

    // Calcula Match da vaga usando o perfil consolidado como fonte primária ou aproveita o match override
    const analysis = matchOverride
      ? {
          scoreOverall: fitScore,
          scoreTechnical: matchOverride.scoreTechnical ?? matchOverride.dimensions?.skills ?? 0,
          scoreBehavioral: matchOverride.scoreBehavioral ?? matchOverride.dimensions?.experience ?? 70,
          scoreSeniority: matchOverride.scoreSeniority ?? matchOverride.dimensions?.seniority ?? 100,
          scoreLocation: matchOverride.scoreLocation ?? matchOverride.dimensions?.context ?? 100,
          missingSkills: matchOverride.skillsAssessment?.missing ?? matchOverride.gap_analysis?.missingSkills ?? matchOverride.gapAnalysis?.missingSkills ?? [],
          matchedSkills: matchOverride.skillsAssessment?.matched ?? matchOverride.gap_analysis?.matchedSkills ?? matchOverride.gapAnalysis?.matchedSkills ?? [],
          yearsOfExperience: matchOverride.gap_analysis?.yearsOfExperience ?? matchOverride.gapAnalysis?.yearsOfExperience ?? 0
        }
      : resume
      ? MatchingEngine.calculateMatchSync(resume, job, consolidatedProfile)
      : {
          scoreOverall: 0,
          scoreTechnical: 0,
          scoreBehavioral: 70,
          scoreSeniority: 100,
          scoreLocation: 100,
          missingSkills: [],
          matchedSkills: [],
          yearsOfExperience: 0
        };

    const reasons: string[] = [];
    const warnings: string[] = [];

    // ── Score geral e Fit de Carreira ──
    if (fitScore >= 85) {
      reasons.push(`${fitScore}% de Compatibilidade Atual — perfil com forte aderência direta ao histórico.`);
    } else if (fitScore >= 70) {
      reasons.push(`${fitScore}% de Compatibilidade Atual — boa sintonia de competências profissionais.`);
    }

    if (goalScore && goalScore >= 75) {
      reasons.push(`${goalScore}% de Potencial para seu Objetivo — oportunidade altamente conectada ao seu alvo de carreira.`);
    }

    // ── Fit de senioridade ──
    const senioritySource = consolidatedProfile ? null : profile;
    if (senioritySource) {
      const isSeniorityMatch = senioritySource.seniority.toLowerCase() === job.seniority.toLowerCase();
      if (isSeniorityMatch) {
        reasons.push(`Senioridade compatível (${senioritySource.seniority}).`);
      } else {
        warnings.push(`Nível da vaga (${job.seniority}) difere da sua senioridade-alvo. Verifique se é uma progressão desejada.`);
      }
    }

    // ── Anos de experiência ──
    const exp = analysis.yearsOfExperience;
    if (exp > 0) {
      reasons.push(`${exp} anos de experiência confirmados no histórico profissional.`);
    }

    // ── Competências encontradas (construtivo) ──
    const matched = analysis.matchedSkills || [];
    matched.slice(0, 3).forEach((sk: string) => {
      reasons.push(`Experiência comprovada em ${sk}.`);
    });

    // ── Gaps de competências ──
    const missing = analysis.missingSkills || [];

    if (consolidatedProfile) {
      const flatSkills = buildFlatSkillsFromProfile(consolidatedProfile);

      missing.forEach((sk: string) => {
        const skLower = sk.toLowerCase();
        const found = flatSkills.some(userSk => userSk.includes(skLower));
        if (found) {
          reasons.push(`Você já possui experiência com ${sk} cadastrada no perfil.`);
        } else {
          warnings.push(`A vaga exige ${sk}, competência ainda não destacada no seu perfil.`);
        }
      });
    } else {
      missing.slice(0, 2).forEach((sk: string) => {
        warnings.push(`Para elevar seu Match com a vaga, vale destacar experiências relacionadas a ${sk} no currículo.`);
      });
    }

    // ── Veredicto final combinado (Fit + Goal + Gaps + Senioridade) ──
    let shouldApply: CoachEvaluation['shouldApply'] = '🔴 Match baixo com a vaga';
    let recommendation = 'Recomendamos priorizar outras oportunidades com maior sintonia com seu perfil e objetivo.';

    const criticalWarnings = warnings.filter(w => w.includes('não identificamos') || w.includes('exige'));

    if (fitScore >= 80 && (goalScore === null || goalScore >= 70) && criticalWarnings.length <= 1) {
      shouldApply = '🟢 Sim';
      recommendation = 'Forte recomendação! A vaga combina com seu histórico profissional e está alinhada ao seu objetivo. Prossiga com o envio da candidatura.';
    } else if (goalScore && goalScore >= 75 && fitScore < 65) {
      shouldApply = '🟡 Ajustar antes';
      recommendation = 'Candidatura estratégica! Embora a aderência direta ao histórico seja inicial, a vaga representa uma ponte sólida para seu objetivo. Destaque competências transferíveis.';
    } else if (fitScore >= 65 || (goalScore && goalScore >= 65)) {
      shouldApply = '🟡 Ajustar antes';
      const toHighlight = missing.filter((sk: string) => {
        if (!consolidatedProfile) return true;
        const flat = buildFlatSkillsFromProfile(consolidatedProfile);
        return !flat.some(s => s.includes(sk.toLowerCase()));
      }).slice(0, 2);
      recommendation = toHighlight.length > 0
        ? `Match relevante! Antes de enviar, ajuste o currículo para destacar ${toHighlight.join(' e ')} — isso elevará significativamente sua taxa de conversão.`
        : 'Match relevante! Revise o currículo para ressaltar os pontos mais relevantes para esta oportunidade antes de submeter.';
    }

    return {
      shouldApply,
      reasons: reasons.length > 0 ? reasons : ['Match com a vaga verificado.'],
      warnings: warnings.length > 0 ? warnings : ['Sem pontos críticos de atenção identificados.'],
      recommendation
    };
  }
}
