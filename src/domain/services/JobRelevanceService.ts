export interface JobRelevanceBreakdown {
  relevanceScore: number;
  careerFitContribution: number;
  jobQualityContribution: number;
  freshnessContribution: number;
}

/**
 * Calcula o Relevance Score Composto para ranking padrão de vagas.
 * Fórmula: (Career Fit Score * 0.70) + (Job Score * 0.20) + (Freshness Score * 0.10)
 */
export function calculateJobRelevanceScore(
  careerFitScore: number,
  jobScore: number,
  postedAt?: string
): JobRelevanceBreakdown {
  const safeCareerFit = Math.min(100, Math.max(0, careerFitScore || 50));
  const safeJobQuality = Math.min(100, Math.max(0, jobScore || 75));

  // Calculate Freshness Score (100 for today, decaying to 50 over 30 days)
  let freshnessScore = 80;
  if (postedAt) {
    const postDate = new Date(postedAt).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, (now - postDate) / (1000 * 60 * 60 * 24));
    freshnessScore = Math.max(40, Math.round(100 - diffDays * 2));
  }

  const careerFitContribution = Math.round(safeCareerFit * 0.70);
  const jobQualityContribution = Math.round(safeJobQuality * 0.20);
  const freshnessContribution = Math.round(freshnessScore * 0.10);

  const relevanceScore = careerFitContribution + jobQualityContribution + freshnessContribution;

  return {
    relevanceScore,
    careerFitContribution,
    jobQualityContribution,
    freshnessContribution
  };
}

/**
 * Utilitário para ordenar lista de vagas por Relevance Score decrescente.
 */
export function rankJobsByRelevance<T extends { id: string; scores?: { overall?: number }; posted_at?: string; created_at?: string }>(
  jobs: T[],
  getCareerFitScore: (jobId: string) => number
): Array<T & { relevanceBreakdown: JobRelevanceBreakdown }> {
  return jobs
    .map(job => {
      const fitScore = getCareerFitScore(job.id);
      const jobScore = job.scores?.overall ?? 85;
      const dateStr = (job as any).posted_at || (job as any).postedAt || job.created_at;
      const breakdown = calculateJobRelevanceScore(fitScore, jobScore, dateStr);
      return {
        ...job,
        relevanceBreakdown: breakdown
      };
    })
    .sort((a, b) => b.relevanceBreakdown.relevanceScore - a.relevanceBreakdown.relevanceScore);
}
