export type CandidateCohort = 'activated' | 'not_activated' | 'beta_general';

export interface CandidateCohortParams {
  id: string;
  email?: string | null;
  full_name?: string | null;
  primary_resume_id?: string | null;
}

export function isTestAccount(email?: string | null, fullName?: string | null): boolean {
  const e = (email || '').toLowerCase();
  const n = (fullName || '').toLowerCase();
  const testPatterns = ['e2e', 'hardening', 'test', 'admin', 'vocentro.com.br', 'example.com', 'demo', 'qa'];
  return testPatterns.some(pat => e.includes(pat) || n.includes(pat));
}

/**
 * Single Source of Truth (SSOT) logic for Candidate Cohort classification.
 * Evaluates whether a profile is 'activated' vs 'not_activated'.
 */
export function determineCandidateCohort(
  candidate: CandidateCohortParams,
  activeUserIds: Set<string>
): CandidateCohort {
  const isActivated = Boolean(candidate.primary_resume_id) || activeUserIds.has(candidate.id);
  return isActivated ? 'activated' : 'not_activated';
}
