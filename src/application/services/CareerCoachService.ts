import type { Resume, Job, CareerProfile } from '../../domain/models/types';
import type { CareerProfileNew } from '../hooks/useMyProfileAi';
import { MatchingEngine, buildFlatSkillsFromProfile } from './matchingEngine';

export interface CoachEvaluation {
  shouldApply: '🟢 Sim' | '🟡 Ajustar antes' | '🔴 Baixa aderência';
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

    // Calcula compatibilidade usando o perfil consolidado como fonte primária ou aproveita o match override
    const analysis = matchOverride
      ? {
          scoreOverall: matchOverride.scoreOverall ?? 0,
          scoreTechnical: matchOverride.scoreTechnical ?? 0,
          scoreBehavioral: matchOverride.scoreBehavioral ?? 70,
          scoreSeniority: matchOverride.scoreSeniority ?? 100,
          scoreLocation: matchOverride.scoreLocation ?? 100,
          missingSkills: matchOverride.gap_analysis?.missingSkills ?? [],
          matchedSkills: matchOverride.gap_analysis?.matchedSkills ?? [],
          yearsOfExperience: matchOverride.gap_analysis?.yearsOfExperience ?? 0
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
      reasons.push(`${analysis.scoreOverall}% de aderência geral — perfil altamente compatível com esta vaga.`);
    } else if (analysis.scoreOverall >= 70) {
      reasons.push(`${analysis.scoreOverall}% de aderência — boa compatibilidade com a vaga.`);
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
    matched.slice(0, 3).forEach(sk => {
      reasons.push(`Experiência comprovada em ${sk}.`);
    });

    // ── Competências ausentes (construtivo, sem afirmar ausência de algo presente) ──
    const missing = analysis.missingSkills || [];

    if (consolidatedProfile) {
      // Com o perfil consolidado disponível, checamos se os "ausentes" realmente não
      // aparecem em nenhuma parte do perfil antes de reportar como gap
      const flatSkills = buildFlatSkillsFromProfile(consolidatedProfile);
      const reallyMissing = missing.filter(sk => {
        const skLow = sk.toLowerCase();
        // Dupla verificação: se aparecer em qualquer parte do texto do perfil, não é ausente
        const inSkills = flatSkills.some(s => s.includes(skLow) || skLow.includes(s));
        const inExpText = consolidatedProfile.experience.some(e =>
          [e.description || '', ...(e.highlights || []), e.role || '']
            .join(' ').toLowerCase().includes(skLow)
        );
        return !inSkills && !inExpText;
      });

      // Para skills presentes no perfil mas "ausentes" no match (diferença semântica):
      const semanticPresent = missing.filter(sk => !reallyMissing.includes(sk));
      semanticPresent.slice(0, 2).forEach(sk => {
        warnings.push(`Encontramos ${sk} no seu perfil. Para maximizar a aderência, destaque resultados mensuráveis relacionados a ${sk} no currículo.`);
      });

      // Para gaps reais:
      reallyMissing.slice(0, 2).forEach(sk => {
        warnings.push(`A vaga exige ${sk}, que não identificamos no seu perfil atual. Considere adicionar projetos ou certificações relacionados.`);
      });
    } else {
      // Fallback sem perfil consolidado — usa linguagem construtiva
      missing.slice(0, 2).forEach(sk => {
        warnings.push(`Para aumentar a aderência, vale destacar experiências relacionadas a ${sk} no currículo.`);
      });
    }

    // ── Veredicto final ──
    let shouldApply: CoachEvaluation['shouldApply'] = '🔴 Baixa aderência';
    let recommendation = 'Recomendamos buscar outras oportunidades mais alinhadas ao seu perfil atual.';

    const criticalWarnings = warnings.filter(w => w.includes('não identificamos') || w.includes('exige'));

    if (analysis.scoreOverall >= 85 && criticalWarnings.length <= 1) {
      shouldApply = '🟢 Sim';
      recommendation = 'Excelente aderência! Esta vaga está alinhada ao seu perfil. Prossiga com o envio da candidatura, destacando os pontos fortes identificados.';
    } else if (analysis.scoreOverall >= 65) {
      shouldApply = '🟡 Ajustar antes';
      const toHighlight = missing.filter(sk => {
        if (!consolidatedProfile) return true;
        const flat = buildFlatSkillsFromProfile(consolidatedProfile);
        return !flat.some(s => s.includes(sk.toLowerCase()));
      }).slice(0, 2);
      recommendation = toHighlight.length > 0
        ? `Boa aderência! Antes de enviar, ajuste o currículo para destacar ${toHighlight.join(' e ')} — isso pode elevar significativamente a taxa de resposta.`
        : 'Boa aderência! Revise o currículo para ressaltar os pontos mais relevantes para esta vaga antes de enviar.';
    }

    return {
      shouldApply,
      reasons: reasons.length > 0 ? reasons : ['Compatibilidade geral de perfil identificada.'],
      warnings: warnings.length > 0 ? warnings : ['Sem pontos críticos de atenção identificados.'],
      recommendation
    };
  }
}
