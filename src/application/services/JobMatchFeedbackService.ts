import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export type JobMatchFeedbackType = 'positive' | 'negative';
export type JobMatchRejectionReason = 'seniority_mismatch' | 'skill_gap' | 'career_direction' | 'location' | 'other';

export interface JobMatchFeedbackRecord {
  id: string;
  userId?: string;
  jobId: string;
  careerFitScore: number;
  jobScore: number;
  feedbackType: JobMatchFeedbackType;
  reason?: JobMatchRejectionReason;
  jobTitle?: string;
  companyName?: string;
  createdAt: string;
}

export class JobMatchFeedbackService {
  /**
   * Salva o feedback de qualidade do Match IA (Sim/Não) e motivo opcional de rejeição
   */
  static async recordMatchFeedback(params: {
    userId?: string;
    jobId: string;
    careerFitScore: number;
    jobScore: number;
    feedbackType: JobMatchFeedbackType;
    reason?: JobMatchRejectionReason;
    jobTitle?: string;
    companyName?: string;
  }): Promise<JobMatchFeedbackRecord> {
    const record: JobMatchFeedbackRecord = {
      id: `match-fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      jobId: params.jobId,
      careerFitScore: params.careerFitScore,
      jobScore: params.jobScore,
      feedbackType: params.feedbackType,
      reason: params.reason,
      jobTitle: params.jobTitle,
      companyName: params.companyName,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        let feedbackReason = params.reason || (params.feedbackType === 'positive' ? 'positive' : 'negative');
        if (params.jobTitle || params.companyName) {
          feedbackReason = `${feedbackReason}|jobTitle:${params.jobTitle || ''}|companyName:${params.companyName || ''}` as any;
        }

        const insertPayload: any = {
          job_id: params.jobId,
          reason: feedbackReason
        };
        if (params.userId) {
          insertPayload.user_id = params.userId;
        }

        const { error } = await supabase.from('job_feedback').insert(insertPayload);
        if (error) {
          console.warn('[JobMatchFeedbackService] Erro ao salvar feedback no Supabase:', error);
        } else {
          console.log('[JobMatchFeedbackService] Feedback de vaga salvo no Supabase com sucesso!');
        }
      } catch (err) {
        console.warn('[JobMatchFeedbackService] Erro ao salvar feedback no Supabase:', err);
      }
    }

    // Salvar backup local no localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('vocentro_job_match_feedback') || '[]');
      stored.push(record);
      localStorage.setItem('vocentro_job_match_feedback', JSON.stringify(stored));
    } catch (_) {}

    return record;
  }

  /**
   * Busca métricas de feedbacks salvos para o Admin Dashboard
   */
  static async getFeedbackStats(): Promise<{
    positiveCount: number;
    negativeCount: number;
    totalCount: number;
    rejectionReasons: Record<string, number>;
  }> {
    let positiveCount = 0;
    let negativeCount = 0;
    const rejectionReasons: Record<string, number> = {
      seniority_mismatch: 0,
      skill_gap: 0,
      career_direction: 0,
      location: 0,
      other: 0
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('job_feedback').select('*');
        if (data && data.length > 0) {
          data.forEach(item => {
            const r = item.reason || '';
            if (r === 'positive' || item.feedback_type === 'positive') {
              positiveCount++;
            } else {
              negativeCount++;
            }
            if (r && rejectionReasons[r] !== undefined) {
              rejectionReasons[r]++;
            } else if (r === 'negative' || (r && r !== 'positive')) {
              rejectionReasons.other++;
            }
          });
          return {
            positiveCount,
            negativeCount,
            totalCount: data.length,
            rejectionReasons
          };
        }
      } catch (err) {
        console.warn('[JobMatchFeedbackService] Erro ao buscar stats do Supabase:', err);
      }
    }

    // Fallback local
    try {
      const stored: JobMatchFeedbackRecord[] = JSON.parse(localStorage.getItem('vocentro_job_match_feedback') || '[]');
      stored.forEach(item => {
        if (item.feedbackType === 'positive') positiveCount++;
        if (item.feedbackType === 'negative') negativeCount++;
        if (item.reason && rejectionReasons[item.reason] !== undefined) {
          rejectionReasons[item.reason]++;
        } else if (item.feedbackType === 'negative') {
          rejectionReasons.other++;
        }
      });
      return {
        positiveCount,
        negativeCount,
        totalCount: stored.length,
        rejectionReasons
      };
    } catch (_) {
      return { positiveCount: 0, negativeCount: 0, totalCount: 0, rejectionReasons };
    }
  }

  /**
   * Traz histórico detalhado de rastreabilidade de avaliações por usuário para o Admin
   */
  static async getEvaluationsTraceability(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('job_feedback')
          .select('*, profiles(full_name, email), jobs(title, company_name)')
          .order('created_at', { ascending: false })
          .limit(50);
        if (data && data.length > 0) return data;
      } catch (_) {}
    }

    try {
      const stored: JobMatchFeedbackRecord[] = JSON.parse(localStorage.getItem('vocentro_job_match_feedback') || '[]');
      return stored.map(item => ({
        id: item.id,
        created_at: item.createdAt,
        user_id: item.userId || 'usr-beta',
        reason: item.reason || 'other',
        feedback_type: item.feedbackType,
        profiles: { full_name: 'Usuário Beta', email: 'beta@vocentro.com.br' },
        jobs: { title: 'Vaga Avaliada', company_name: 'Empresa' }
      }));
    } catch (_) {
      return [];
    }
  }
}
