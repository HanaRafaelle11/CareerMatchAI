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
    reason?: JobFeedbackReason,
    jobTitle?: string,
    companyName?: string
  ): Promise<void> {
    if (!userId || !jobId) return;

    const feedback = {
      id: `fb-${Date.now()}`,
      userId,
      jobId,
      action,
      reason,
      jobTitle,
      companyName,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        let dbReason: any = reason || null;
        if (jobTitle || companyName) {
          const rBase = reason || 'feedback';
          dbReason = `${rBase}|jobTitle:${jobTitle || ''}|companyName:${companyName || ''}`;
        }

        await supabase.from('job_feedback').insert({
          user_id: userId,
          job_id: jobId,
          action,
          reason: dbReason as any
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

        // Also save to public.applications for Strategy / Kanban Journey View
        const dbStatusMap: Record<string, string> = {
          SAVED: '⭐ Tenho interesse',
          APPLIED: '📨 Me candidatei',
          INTERVIEWING: '👥 Entrevista com recrutador',
          REJECTED: '❌ Rejeitada',
          DISCOVERED: '🔎 Encontrada'
        };

        const appStatus = dbStatusMap[status] || '🔎 Encontrada';
        const { data: existingApp } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', userId)
          .eq('job_id', job.id)
          .maybeSingle();

        if (existingApp?.id) {
          await supabase.from('applications').update({
            status: appStatus,
            company_name: job.companyName,
            job_title: job.title,
            applied_at: status === 'APPLIED' ? new Date().toISOString() : null
          }).eq('id', existingApp.id);
        } else {
          await supabase.from('applications').insert({
            user_id: userId,
            job_id: job.id,
            company_name: job.companyName,
            job_title: job.title,
            status: appStatus,
            applied_at: status === 'APPLIED' ? new Date().toISOString() : null
          });
        }
      } catch (err) {
        console.warn('[JobFeedbackService] Erro ao atualizar jornada no Supabase:', err);
      }
    }

    localDB.saveJobApplicationRecord(record);

    // Save to localDB applications list as well
    const dbStatusMapLocal: Record<string, any> = {
      SAVED: '⭐ Tenho interesse',
      APPLIED: '📨 Me candidatei',
      INTERVIEWING: '👥 Entrevista com recrutador',
      REJECTED: '❌ Rejeitada',
      DISCOVERED: '🔎 Encontrada'
    };

    localDB.saveApplication({
      id: record.id,
      userId,
      jobId: job.id,
      companyName: job.companyName,
      jobTitle: job.title,
      status: dbStatusMapLocal[status] || '🔎 Encontrada',
      appliedAt: record.appliedAt,
      createdAt: record.createdAt,
      updatedAt: record.createdAt
    });

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

