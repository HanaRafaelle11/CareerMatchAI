import type { Job, Resume, CareerGoal } from '../models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { CareerMatchEngineV3, type CareerMatchV3Result } from './CareerMatchEngineV3';
import { JobDeduplicationService, type CanonicalJob } from './JobDeduplicationService';
import { JobQualityService, type JobQualityAssessment } from './JobQualityService';

export interface RankedJobItem {
  job: CanonicalJob;
  match: CareerMatchV3Result;
  quality: JobQualityAssessment;
  rankingScore: number;
}

export class ProductJobRankingService {
  /**
   * Orquestra a apresentação de vagas combinando:
   * 1. Deduplicação canônica cross-provider (JobDeduplicationService)
   * 2. Avaliação de qualidade de dados da vaga (JobQualityService)
   * 3. Cálculo determinístico intocado (CareerMatchEngineV3)
   * 4. Ordenação orientada à intenção estratégica do candidato
   */
  public static rankJobs(
    rawJobs: (Job & { provider?: string; url?: string })[],
    resume: Resume | null,
    profile: CareerProfileNew | null,
    careerGoal: CareerGoal | null,
    options: { filterLowQuality?: boolean; minScoreCutoff?: number } = {}
  ): RankedJobItem[] {
    // 1. Deduplica na camada de produto
    const canonicalJobs = JobDeduplicationService.deduplicateJobs(rawJobs);

    const isTransition = careerGoal && (careerGoal.intentType === 'career_transition');
    const minCutoff = options.minScoreCutoff ?? 15;

    const rankedList: RankedJobItem[] = [];

    for (const job of canonicalJobs) {
      // Avalia qualidade do dado da vaga
      const quality = JobQualityService.evaluateJobQuality(job);

      if (options.filterLowQuality && quality.level === 'LOW_QUALITY') {
        continue;
      }

      // Executa V3 puro
      const match = CareerMatchEngineV3.calculate(job, resume, profile, careerGoal);

      // Descarte de vagas totalmente zeradas ou abaixo do corte mínimo de ruído
      if (match.careerFitScore < minCutoff && (match.careerGoalScore === null || match.careerGoalScore < minCutoff)) {
        continue;
      }

      // Ordenação estratégica:
      // Se está em transição de carreira, o ranking da lista prioriza o GoalScore (com bônus de desempate por Fit e Qualidade da Vaga)
      // Se está em continuidade ou promoção, prioriza o FitScore (com GoalScore como alinhamento secundário)
      // Se não tem objetivo, 100% FitScore
      let rankingScore = match.careerFitScore;

      if (careerGoal && match.careerGoalScore !== null) {
        if (isTransition || match.transition.isCareerTransition) {
          // Prioridade 1: Potencial para o Objetivo
          rankingScore = match.careerGoalScore;
        } else {
          // Prioridade 1: Aderência Atual + Alavancagem
          rankingScore = Math.round((match.careerFitScore * 0.7) + (match.careerGoalScore * 0.3));
        }
      }

      // Penalidade leve no ranking para vagas de baixa qualidade de dados para não poluir o topo
      if (quality.level === 'LOW_QUALITY') {
        rankingScore -= 10;
      }

      rankedList.push({
        job,
        match,
        quality,
        rankingScore
      });
    }

    // Ordenação decrescente: maior rankingScore primeiro, desempate por Fit, depois por data
    rankedList.sort((a, b) => {
      if (b.rankingScore !== a.rankingScore) {
        return b.rankingScore - a.rankingScore;
      }
      if (b.match.careerFitScore !== a.match.careerFitScore) {
        return b.match.careerFitScore - a.match.careerFitScore;
      }
      return (b.job.createdAt || '').localeCompare(a.job.createdAt || '');
    });

    return rankedList;
  }
}
