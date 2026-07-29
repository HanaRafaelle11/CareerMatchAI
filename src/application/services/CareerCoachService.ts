import type { Resume, Job, CareerProfile } from '../../domain/models/types';
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
   * quando disponível, garantindo consistência com o Meu Perfil IA.
   */
  static evaluateCandidacy(
    resume: Resume | null,
    job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    profile: CareerProfile | null,
    consolidatedProfile?: CareerProfileNew | null,
    matchOverride?: any | null
  ): CoachEvaluation {
    if (!resume && !consolidatedProfile) {
      return {
        shouldApply: '🟡 Ajustar antes',
        reasons: ['Não há currículo ativo para análise.'],
        warnings: ['Faça o upload do seu currículo primeiro.'],
        recommendation: 'Cadastre seu currículo na aba Meu Perfil.'
      };
    }

    // Calcula Match da vaga usando o perfil consolidado como fonte primária ou aproveita o match override
    const analysis = matchOverride
      ? {
          scoreOverall: matchOverride.scoreOverall ?? 0,
          scoreTechnical: matchOverride.scoreTechnical ?? 0,
          scoreBehavioral: matchOverride.scoreBehavioral ?? 70,
          scoreSeniority: matchOverride.scoreSeniority ?? 100,
          scoreLocation: matchOverride.scoreLocation ?? 100,
          missingSkills: matchOverride.gap_analysis?.missingSkills ?? matchOverride.gapAnalysis?.missingSkills ?? [],
          matchedSkills: matchOverride.gap_analysis?.matchedSkills ?? matchOverride.gapAnalysis?.matchedSkills ?? [],
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

    // ── Score geral ──
    if (analysis.scoreOverall >= 85) {
      reasons.push(`${analysis.scoreOverall}% de Match com a vaga — perfil com forte adequação.`);
    } else if (analysis.scoreOverall >= 70) {
      reasons.push(`${analysis.scoreOverall}% de Match com a vaga — boa sintonia de competências.`);
    }

    // ── Fit de senioridade ──
    const senioritySource = consolidatedProfile ? null : profile; // usa insights se disponível
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
      // Fallback sem perfil consolidado — usa linguagem construtiva
      missing.slice(0, 2).forEach((sk: string) => {
        warnings.push(`Para elevar seu Match com a vaga, vale destacar experiências relacionadas a ${sk} no currículo.`);
      });
    }

    // ── Veredicto final ──
    let shouldApply: CoachEvaluation['shouldApply'] = '🔴 Match baixo com a vaga';
    let recommendation = 'Recomendamos buscar outras oportunidades com maior Match da vaga.';

    const criticalWarnings = warnings.filter(w => w.includes('não identificamos') || w.includes('exige'));

    if (analysis.scoreOverall >= 85 && criticalWarnings.length <= 1) {
      shouldApply = '🟢 Sim';
      recommendation = 'Match alto com a vaga! Esta posição combina com seu perfil. Prossiga com o envio da candidatura, destacando os pontos fortes identificados.';
    } else if (analysis.scoreOverall >= 65) {
      shouldApply = '🟡 Ajustar antes';
      const toHighlight = missing.filter((sk: string) => {
        if (!consolidatedProfile) return true;
        const flat = buildFlatSkillsFromProfile(consolidatedProfile);
        return !flat.some(s => s.includes(sk.toLowerCase()));
      }).slice(0, 2);
      recommendation = toHighlight.length > 0
        ? `Match relevante! Antes de enviar, ajuste o currículo para destacar ${toHighlight.join(' e ')} — isso pode elevar significativamente a taxa de resposta.`
        : 'Match relevante! Revise o currículo para ressaltar os pontos mais relevantes para esta vaga antes de enviar.';
    }

    return {
      shouldApply,
      reasons: reasons.length > 0 ? reasons : ['Match com a vaga verificado.'],
      warnings: warnings.length > 0 ? warnings : ['Sem pontos críticos de atenção identificados.'],
      recommendation
    };
  }
}
