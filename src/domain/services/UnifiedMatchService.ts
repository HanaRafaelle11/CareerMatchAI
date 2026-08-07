import { localDB } from '../../infrastructure/storage/localDatabase';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
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

    // 1. Se já existe um match oficial salvo para ESTE currículo ativo: usa o scoreOverall salvo no banco como FONTE ÚNICA DE VERDADE
    if (existingMatch && (existingMatch.resumeId === resume?.id || (existingMatch as any).resume_id === resume?.id || (existingMatch as any).resumeVersionId === activeResumeVersionId)) {
      const score = existingMatch.scoreOverall;

      const explanation = await JobMatchExplanationService.getOrGenerateExplanation(
        userId,
        job,
        resume,
        careerProfileNew,
        activeResumeVersionId
      ).catch(() => null);

      return {
        scoreOverall: score,
        confidence: 'high',
        explanation,
        missingSkills: (existingMatch as any).gap_analysis?.missingSkills || (existingMatch as any).missingSkills || [],
        matchedSkills: (existingMatch as any).gap_analysis?.matchedSkills || (existingMatch as any).matchedSkills || [],
        reason: explanation?.overallMatchReason || `Match de ${score}% com o currículo ativo.`
      };
    }

    // 2. Se não há match salvo no banco: retorna não calculado (0%) sem gerar números falsos preliminares
    return {
      scoreOverall: 0,
      confidence: 'low',
      explanation: null,
      missingSkills: [],
      matchedSkills: [],
      reason: 'Nenhum match calculado para esta vaga. Clique em "Calcular Match" para analisar.'
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
