import { localDB } from '../../infrastructure/storage/localDatabase';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { JobMatchExplanationService } from '../../application/services/JobMatchExplanationService';
import type { Job, Resume, Match, JobMatchExplanation, JobMatchScore } from '../models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';

export interface UnifiedMatchResult {
  scoreOverall: number;
  confidence: 'high' | 'medium' | 'low';
  explanation?: JobMatchExplanation | null;
  missingSkills: string[];
  matchedSkills: string[];
  reason: string;
  jobMatchScore: JobMatchScore;
}

export function buildJobMatchScore(
  totalScore: number,
  explanation?: JobMatchExplanation | null,
  match?: Match | null
): JobMatchScore {
  const total = Math.max(0, Math.min(100, Math.round(totalScore)));
  const skills = explanation?.breakdown?.skillsScore ?? match?.scoreTechnical ?? (total > 0 ? total : 0);
  const experience = explanation?.breakdown?.experienceScore ?? match?.scoreBehavioral ?? (total > 0 ? total : 0);
  const seniority = explanation?.breakdown?.seniorityScore ?? match?.scoreSeniority ?? (total > 0 ? total : 0);
  const location = explanation?.breakdown?.locationScore ?? match?.scoreLocation ?? (total > 0 ? total : 0);
  const keywords = explanation?.breakdown?.semanticScore ?? (total > 0 ? total : 0);
  const explanationText = explanation?.overallMatchReason || (total > 0 ? `Match de ${total}% com seu perfil.` : 'Nenhum match calculado para esta vaga.');

  return {
    total,
    skills,
    experience,
    seniority,
    location,
    keywords,
    explanation: explanationText,
    breakdown: explanation?.breakdown
  };
}

export class UnifiedMatchService {
  /**
   * Fonte Única de Verdade para cálculo e recuperação do Match de uma vaga com o currículo ativo.
   * Garante isolamento estrito por resumeVersionId em todas as telas.
   */
  static async getMatch(
    userId: string | undefined,
    job: Job,
    resume: Resume | null | undefined,
    careerProfileNew?: CareerProfileNew | null,
    existingMatch?: Match | null
  ): Promise<UnifiedMatchResult> {
    if (!userId || !job) {
      const fallbackScore = (job as any)?.scoreOverall ?? (job as any)?.scores?.overall ?? 0;
      const jobMatchScore = buildJobMatchScore(fallbackScore, null, existingMatch);
      return {
        scoreOverall: jobMatchScore.total,
        confidence: 'medium',
        explanation: null,
        missingSkills: [],
        matchedSkills: [],
        reason: 'Aguardando seleção de currículo',
        jobMatchScore
      };
    }

    const activeResumeVersionId = resume?.resumeVersionId || resume?.id;

    // 1. Se já existe um match oficial salvo para ESTE currículo ativo: usa o scoreOverall salvo no banco como FONTE ÚNICA DE VERDADE
    if (existingMatch && (existingMatch.resumeId === resume?.id || (existingMatch as any).resume_id === resume?.id || (existingMatch as any).resumeVersionId === activeResumeVersionId)) {
      const score = existingMatch.scoreOverall;

      const explanation = await JobMatchExplanationService.getOrGenerateExplanation(
        userId,
        job,
        resume,
        careerProfileNew,
        activeResumeVersionId,
        score
      ).catch(() => null);

      const jobMatchScore = buildJobMatchScore(score, explanation, existingMatch);

      return {
        scoreOverall: jobMatchScore.total,
        confidence: 'high',
        explanation,
        missingSkills: (existingMatch as any).gap_analysis?.missingSkills || (existingMatch as any).missingSkills || [],
        matchedSkills: (existingMatch as any).gap_analysis?.matchedSkills || (existingMatch as any).matchedSkills || [],
        reason: explanation?.overallMatchReason || `Match de ${jobMatchScore.total}% com o currículo ativo.`,
        jobMatchScore
      };
    }

    // 2. Se não há match salvo no banco: retorna não calculado (0%) sem gerar números falsos preliminares
    const emptyMatchScore = buildJobMatchScore(0, null, null);
    return {
      scoreOverall: 0,
      confidence: 'low',
      explanation: null,
      missingSkills: [],
      matchedSkills: [],
      reason: 'Nenhum match calculado para esta vaga. Clique em "Calcular Match" para analisar.',
      jobMatchScore: emptyMatchScore
    };
  }

  /**
   * Invalida e limpa qualquer resíduo de cache de match quando um currículo é alterado ou excluído.
   */
  static async clearStaleMatchesForUser(userId?: string, targetResumeId?: string): Promise<void> {
    if (!userId) return;
    try {
      if (isSupabaseConfigured && supabase) {
        if (targetResumeId) {
          await supabase.from('matches').delete().eq('user_id', userId).eq('resume_id', targetResumeId);
        }
        await supabase.from('job_match_explanations').delete().eq('user_id', userId);
      }
      localDB.clearJobExplanations(userId);
    } catch (err) {
      console.warn('[UnifiedMatchService] Erro ao limpar cache de match:', err);
    }
  }
}
