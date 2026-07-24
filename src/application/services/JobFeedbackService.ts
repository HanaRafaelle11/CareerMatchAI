import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Job, JobFeedbackAction, JobFeedbackReason, JobApplicationJourneyStatus, JobApplicationRecord } from '../../domain/models/types';

export class JobFeedbackService {
  /**
   * Registra a ação de feedback do usuário sobre a vaga
   */
  static async recordFeedback(
    userId: string,
    jobId: string,
    action: JobFeedbackAction,
    reason?: JobFeedbackReason
  ): Promise<void> {
    if (!userId || !jobId) return;

    const feedback = {
      id: `fb-${Date.now()}`,
      userId,
      jobId,
      action,
      reason,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('job_feedback').insert({
          user_id: userId,
          job_id: jobId,
          action,
          reason: reason || null
        });
      } catch (err) {
        console.warn('[JobFeedbackService] Erro ao registrar feedback no Supabase:', err);
      }
    }

    localDB.saveJobFeedback(feedback);

    // Mapear para eventos no Analytics Tracker
    const eventNameMap: Record<JobFeedbackAction, string> = {
      VIEWED: 'job_viewed',
      SAVED: 'job_saved',
      APPLIED: 'job_applied',
      REJECTED: 'job_rejected'
    };

    tracker.track(eventNameMap[action], 'JobFeedback', {
      job_id: jobId,
      action,
      reason: reason || 'N/A'
    });
  }

  /**
   * Atualiza ou registra o status de candidatura da jornada (job_applications)
   */
  static async updateApplicationStatus(
    userId: string,
    job: Job,
    status: JobApplicationJourneyStatus,
    notes?: string
  ): Promise<JobApplicationRecord> {
    const record: JobApplicationRecord = {
      id: `app-rec-${Date.now()}`,
      userId,
      jobId: job.id,
      companyName: job.companyName,
      jobTitle: job.title,
      jobUrl: job.sourceUrl,
      salaryRange: job.salary,
      status,
      notes,
      appliedAt: status === 'APPLIED' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existing } = await supabase
          .from('job_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('job_id', job.id)
          .maybeSingle();

        const payload = {
          user_id: userId,
          job_id: job.id,
          company_name: job.companyName,
          job_title: job.title,
          job_url: job.sourceUrl || null,
          salary_range: job.salary || null,
          status,
          notes: notes || null,
          applied_at: status === 'APPLIED' ? new Date().toISOString() : null
        };

        if (existing?.id) {
          await supabase.from('job_applications').update(payload).eq('id', existing.id);
        } else {
          await supabase.from('job_applications').insert(payload);
        }
      } catch (err) {
        console.warn('[JobFeedbackService] Erro ao atualizar jornada no Supabase:', err);
      }
    }

    localDB.saveJobApplicationRecord(record);

    if (status === 'APPLIED') {
      tracker.track('application_completed', 'CareerIntelligence', {
        job_id: job.id,
        company_name: job.companyName,
        job_title: job.title
      });
    } else if (status === 'SAVED' || status === 'DISCOVERED') {
      tracker.track('application_started', 'CareerIntelligence', {
        job_id: job.id,
        company_name: job.companyName,
        job_title: job.title
      });
    }

    return record;
  }
}

