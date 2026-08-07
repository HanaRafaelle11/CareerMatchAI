import { localDB } from '../../infrastructure/storage/localDatabase';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { MatchingEngine } from '../../application/services/matchingEngine';
import { JobMatchExplanationService } from '../../application/services/JobMatchExplanationService';
import type { Job, Resume, Match, JobMatchExplanation } from '../models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';

export interface UnifiedMatchResult {
  scoreOverall: number;
  confidence: 'high' | 'medium' | 'low';
  explanation?: JobMatchExplanation | null;
  missingSkills: string[];
  matchedSkills: string[];
  reason: string;
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
      return {
        scoreOverall: (job as any)?.scoreOverall ?? (job as any)?.scores?.overall ?? 50,
        confidence: 'medium',
        explanation: null,
        missingSkills: [],
        matchedSkills: [],
        reason: 'Aguardando seleção de currículo'
      };
    }

    const activeResumeVersionId = resume?.resumeVersionId || resume?.id;

    // 1. Se já existe um match oficial salvo para ESTE currículo ativo
    if (existingMatch && (existingMatch.resumeId === resume?.id || (existingMatch as any).resumeVersionId === activeResumeVersionId)) {
      const explanation = await JobMatchExplanationService.getOrGenerateExplanation(
        userId,
        job,
        resume,
        careerProfileNew,
        activeResumeVersionId
      ).catch(() => null);

      const score = existingMatch.scoreOverall ?? explanation?.careerFitScore ?? 50;

      return {
        scoreOverall: score,
        confidence: 'high',
        explanation,
        missingSkills: (existingMatch as any).missingSkills || [],
        matchedSkills: (existingMatch as any).matchedSkills || [],
        reason: explanation?.overallMatchReason || `Match de ${score}% com o currículo ativo.`
      };
    }

    // 2. Se não há match salvo, calcula deterministicamente com os dados do currículo ATIVO
    let calculatedScore = (job as any).scoreOverall ?? (job as any).scores?.overall ?? 50;
    let missingSkills: string[] = [];

    if (resume) {
      const calculated = await MatchingEngine.calculateMatch(resume, job, careerProfileNew).catch(() => null);
      if (calculated?.match) {
        calculatedScore = calculated.match.scoreOverall;
        missingSkills = calculated.gapAnalysis?.missingSkills || [];
      }
    }
    
    // Tenta obter/gerar explicação garantindo o escopo por activeResumeVersionId
    const explanation = await JobMatchExplanationService.getOrGenerateExplanation(
      userId,
      job,
      resume,
      careerProfileNew,
      activeResumeVersionId
    ).catch(() => null);

    const finalScore = explanation?.careerFitScore ?? calculatedScore;

    return {
      scoreOverall: finalScore,
      confidence: 'medium',
      explanation,
      missingSkills,
      matchedSkills: [],
      reason: explanation?.overallMatchReason || `Match de ${finalScore}% com o currículo ativo.`
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
