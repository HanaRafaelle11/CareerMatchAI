import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JobMatchExplanationService } from '../services/JobMatchExplanationService';
import { AdaptiveResumeService } from '../services/AdaptiveResumeService';
import { JobFeedbackService } from '../services/JobFeedbackService';
import type { Job, Resume, JobFeedbackAction, JobFeedbackReason, JobApplicationJourneyStatus } from '../../domain/models/types';
import type { CareerProfileNew } from './useMyProfileAi';

export function useCareerIntelligence(
  userId: string | undefined,
  selectedJob: Job | null,
  resume?: Resume | null,
  careerProfileNew?: CareerProfileNew | null
) {
  const queryClient = useQueryClient();

  // ── 1. EXPLICAÇÃO LAZY DA VAGA (ON-DEMAND QUANDO VAGA É SELECIONADA) ──
  const explanationQuery = useQuery({
    queryKey: ['job-explanation', userId, selectedJob?.id],
    queryFn: async () => {
      if (!userId || !selectedJob) return null;
      return await JobMatchExplanationService.getOrGenerateExplanation(
        userId,
        selectedJob,
        resume,
        careerProfileNew
      );
    },
    enabled: !!userId && !!selectedJob,
    staleTime: 1000 * 60 * 60, // 1 hora de cache
  });

  // ── 2. ADAPTAÇÃO DE CURRÍCULO SUGESTIVA (ON-DEMAND) ──
  const adaptationQuery = useQuery({
    queryKey: ['resume-adaptation', userId, selectedJob?.id],
    queryFn: async () => {
      if (!userId || !selectedJob) return null;
      return await AdaptiveResumeService.generateAdaptationSuggestions(
        userId,
        selectedJob,
        resume
      );
    },
    enabled: !!userId && !!selectedJob,
    staleTime: 1000 * 60 * 30,
  });

  // ── 3. MUTATION PARA APROVAR/DESCARTAR SUGESTÕES DE CURRÍCULO ──
  const updateAdaptationStatusMutation = useMutation({
    mutationFn: async ({ adaptationId, status }: { adaptationId: string; status: 'PENDING' | 'APPLIED' | 'DISMISSED' }) => {
      await AdaptiveResumeService.updateStatus(adaptationId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-adaptation', userId, selectedJob?.id] });
    }
  });

  // ── 4. MUTATION PARA FEEDBACK LOOP (ACTION & REASON) ──
  const recordFeedbackMutation = useMutation({
    mutationFn: async ({ jobId, action, reason }: { jobId: string; action: JobFeedbackAction; reason?: JobFeedbackReason }) => {
      if (!userId) return;
      await JobFeedbackService.recordFeedback(userId, jobId, action, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-feedback', userId] });
    }
  });

  // ── 5. MUTATION PARA JORNADA DA CANDIDATURA ──
  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ job, status, notes }: { job: Job; status: JobApplicationJourneyStatus; notes?: string }) => {
      if (!userId) return;
      return await JobFeedbackService.updateApplicationStatus(userId, job, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
    }
  });

  return {
    explanation: explanationQuery.data,
    isLoadingExplanation: explanationQuery.isLoading,
    explanationError: explanationQuery.error,

    adaptation: adaptationQuery.data,
    isLoadingAdaptation: adaptationQuery.isLoading,
    updateAdaptationStatus: updateAdaptationStatusMutation.mutateAsync,

    recordFeedback: recordFeedbackMutation.mutateAsync,
    updateApplicationStatus: updateApplicationStatusMutation.mutateAsync
  };
}
