import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { ResumeOptimizationService } from '../services/ResumeOptimizationService';
import { InterviewPreparationService } from '../services/InterviewPreparationService';
import { InterviewSimulationService } from '../services/InterviewSimulationService';
import type { 
  Resume, Job, CoverLetter, InterviewPreparation, 
  InterviewSimulation, PostInterviewLog, Notification 
} from '../../domain/models/types';

// Helper para validar UUID do Postgres
const isValidUUID = (uuid: string) => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
};

export function useCoach(userId: string | undefined) {
  const queryClient = useQueryClient();

  // 1. Resume Optimization
  const getResumeOptimizationQuery = (
    resume: Resume | null, 
    job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | null
  ) => {
    return useQuery({
      queryKey: ['resume-optimization', resume?.id, (job as any)?.id],
      queryFn: async () => {
        if (!resume || !job) return null;
        if (isSupabaseConfigured && supabase && (job as any).id && isValidUUID((job as any).id)) {
          try {
            const { data, error } = await supabase
              .from('resume_optimizations')
              .select('*')
              .eq('resume_id', resume.id)
              .eq('job_id', (job as any).id)
              .maybeSingle();

            if (error) {
              console.error('[COACH] Erro ao buscar otimização:', error);
              return ResumeOptimizationService.optimizeForJob(resume, job);
            }
            if (!data) return ResumeOptimizationService.optimizeForJob(resume, job);
            return {
              id: data.id,
              resumeId: data.resume_id,
              jobId: data.job_id,
              optimizedSummary: data.optimized_summary,
              keyExperiences: data.key_experiences,
              missingKeywords: data.missing_keywords,
              redundantInfo: data.redundant_info,
              createdAt: data.created_at
            };
          } catch (err) {
            console.error('[COACH] Erro na consulta de otimização:', err);
            return ResumeOptimizationService.optimizeForJob(resume, job);
          }
        } else {
          return ResumeOptimizationService.optimizeForJob(resume, job);
        }
      },
      enabled: !!resume && !!job
    });
  };

  // 2. Cover Letter
  const getCoverLetterQuery = (applicationId: string | undefined) => {
    return useQuery<CoverLetter | null>({
      queryKey: ['cover-letter', applicationId],
      queryFn: async () => {
        if (!applicationId) return null;
        const isMock = applicationId.includes('mock') || !isValidUUID(applicationId);

        if (isSupabaseConfigured && supabase && !isMock) {
          try {
            const { data, error } = await supabase
              .from('cover_letters')
              .select('*')
              .eq('application_id', applicationId)
              .maybeSingle();

            if (error) {
              console.error('[COACH] Erro ao carregar carta de apresentação:', error);
              return null;
            }
            return data ? {
              id: data.id,
              applicationId: data.application_id,
              textFormal: data.text_formal,
              textDirect: data.text_direct,
              textExecutive: data.text_executive,
              createdAt: data.created_at
            } : null;
          } catch (err) {
            console.error('[COACH] Falha ao consultar cover_letters:', err);
            return null;
          }
        } else {
          return localDB.getCoverLetter(applicationId);
        }
      },
      enabled: !!applicationId
    });
  };

  const generateCoverLetterMutation = useMutation({
    mutationFn: async ({ applicationId, jobTitle, companyName }: { applicationId: string; jobTitle: string; companyName: string }) => {
      const letter: CoverLetter = {
        id: `letter-${Date.now()}`,
        applicationId,
        textFormal: `Prezada equipe de recrutamento da ${companyName},\n\nGostaria de formalizar meu interesse na posição de ${jobTitle}. Com ampla experiência em Customer Success no segmento SaaS...`,
        textDirect: `Olá time da ${companyName},\n\nVi a vaga para ${jobTitle} e me identifiquei muito. Sou especialista em CS com foco em redução de Churn e controle de NPS.`,
        textExecutive: `À Direção de Operações da ${companyName},\n\nEscrevo para apresentar minha candidatura à vaga de ${jobTitle}. Possuo histórico consolidado liderando equipes de CS e operando com Salesforce/SQL.`,
        createdAt: new Date().toISOString()
      };

      const isMock = applicationId.includes('mock') || !isValidUUID(applicationId);

      if (isSupabaseConfigured && supabase && !isMock) {
        const { error } = await supabase.from('cover_letters').insert({
          application_id: letter.applicationId,
          text_formal: letter.textFormal,
          text_direct: letter.textDirect,
          text_executive: letter.textExecutive
        });
        if (error) throw error;
      } else {
        localDB.saveCoverLetter(letter);
      }
      return letter;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cover-letter', variables.applicationId] });
    }
  });

  // 3. Interview Prep
  const getInterviewPrepQuery = (resume: Resume | null, job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | null) => {
    return useQuery<InterviewPreparation | null>({
      queryKey: ['interview-prep', (job as any)?.id],
      queryFn: async () => {
        if (!job) return null;
        if (isSupabaseConfigured && supabase && (job as any).id && isValidUUID((job as any).id)) {
          try {
            const { data, error } = await supabase
              .from('interview_preparations')
              .select('*')
              .eq('job_id', (job as any).id)
              .maybeSingle();

            if (error) {
              console.error('[COACH] Erro ao carregar prep:', error);
              return InterviewPreparationService.getPreparation(resume, job);
            }
            if (!data) return InterviewPreparationService.getPreparation(resume, job);
            return {
              id: data.id,
              jobId: data.job_id,
              questions: data.questions,
              createdAt: data.created_at
            };
          } catch (err) {
            console.error('[COACH] Erro na consulta de interview prep:', err);
            return InterviewPreparationService.getPreparation(resume, job);
          }
        } else {
          return InterviewPreparationService.getPreparation(resume, job);
        }
      },
      enabled: !!job
    });
  };

  // 4. Interview Simulation
  const getSimulationQuery = (applicationId: string | undefined) => {
    return useQuery<InterviewSimulation | null>({
      queryKey: ['simulation', applicationId],
      queryFn: async () => {
        if (!applicationId) return null;
        const isMock = applicationId.includes('mock') || !isValidUUID(applicationId);

        if (isSupabaseConfigured && supabase && !isMock) {
          try {
            const { data, error } = await supabase
              .from('interview_simulations')
              .select('*')
              .eq('application_id', applicationId)
              .maybeSingle();

            if (error) {
              console.error('[COACH] Erro ao carregar simulação:', error);
              return null;
            }
            return data ? {
              id: data.id,
              applicationId: data.application_id,
              chatHistory: data.chat_history,
              evaluations: data.evaluations,
              createdAt: data.created_at
            } : null;
          } catch (err) {
            console.error('[COACH] Erro na consulta de simulações:', err);
            return null;
          }
        } else {
          return InterviewSimulationService.getSimulation(applicationId);
        }
      },
      enabled: !!applicationId
    });
  };

  const startSimulationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const isMock = applicationId.includes('mock') || !isValidUUID(applicationId);

      if (isSupabaseConfigured && supabase && !isMock) {
        const sim = {
          application_id: applicationId,
          chat_history: [
            {
              role: 'interviewer',
              text: 'Olá! Seja bem-vindo à entrevista simulada. Vamos começar com uma apresentação rápida: conte-me sobre você.'
            }
          ]
        };
        const { data, error } = await supabase.from('interview_simulations').insert(sim).select().single();
        if (error) throw error;
        return data;
      } else {
        return InterviewSimulationService.startSimulation(applicationId);
      }
    },
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({ queryKey: ['simulation', applicationId] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sim, role, text }: { sim: InterviewSimulation; role: 'interviewer' | 'candidate'; text: string }) => {
      const updated = InterviewSimulationService.addMessage(sim, role, text);
      const isMock = sim.applicationId.includes('mock') || !isValidUUID(sim.applicationId);

      if (isSupabaseConfigured && supabase && !isMock) {
        const { error } = await supabase
          .from('interview_simulations')
          .update({
            chat_history: updated.chatHistory,
            evaluations: updated.evaluations
          })
          .eq('id', sim.id);
        if (error) throw error;
      }
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['simulation', data.applicationId] });
    }
  });

  // 5. Post Interview Log (AI Journal)
  const getPostLogQuery = (applicationId: string | undefined) => {
    return useQuery<PostInterviewLog | null>({
      queryKey: ['post-log', applicationId],
      queryFn: async () => {
        if (!applicationId) return null;
        const isMock = applicationId.includes('mock') || !isValidUUID(applicationId);

        if (isSupabaseConfigured && supabase && !isMock) {
          try {
            const { data, error } = await supabase
              .from('post_interview_logs')
              .select('*')
              .eq('application_id', applicationId)
              .maybeSingle();

            if (error) {
              console.error('[COACH] Erro ao carregar journal:', error);
              return null;
            }
            return data ? {
              id: data.id,
              applicationId: data.application_id,
              confidenceScore: data.confidence_score,
              difficultQuestions: data.difficult_questions,
              improvements: data.improvements,
              companyPerception: data.company_perception,
              createdAt: data.created_at,
              feeling: data.feeling || undefined,
              whatLearned: data.what_learned || undefined,
              doDifferent: data.do_different || undefined
            } : null;
          } catch (err) {
            console.error('[COACH] Erro na consulta de logs do diário:', err);
            return null;
          }
        } else {
          return localDB.getPostInterviewLog(applicationId);
        }
      },
      enabled: !!applicationId
    });
  };

  const savePostLogMutation = useMutation({
    mutationFn: async (log: Omit<PostInterviewLog, 'id' | 'createdAt'> & { id?: string }) => {
      const savedLog: PostInterviewLog = {
        id: log.id || `log-${Date.now()}`,
        ...log,
        createdAt: new Date().toISOString()
      };

      const isMock = log.applicationId.includes('mock') || !isValidUUID(log.applicationId);

      if (isSupabaseConfigured && supabase && !isMock) {
        const { error } = await supabase.from('post_interview_logs').upsert({
          id: savedLog.id,
          application_id: savedLog.applicationId,
          confidence_score: savedLog.confidenceScore,
          difficult_questions: savedLog.difficultQuestions,
          improvements: savedLog.improvements,
          company_perception: savedLog.companyPerception,
          feeling: savedLog.feeling || null,
          what_learned: savedLog.whatLearned || null,
          do_different: savedLog.doDifferent || null
        });
        if (error) throw error;
      } else {
        localDB.savePostInterviewLog(savedLog);
      }
      return savedLog;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['post-log', data.applicationId] });
    }
  });

  // 6. Notifications
  const notificationsQuery = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('[COACH] Erro ao buscar notificações:', error);
            return [];
          }
          return (data || []).map(d => ({
            id: d.id,
            userId: d.user_id,
            title: d.title,
            message: d.message,
            isRead: d.is_read,
            type: d.type,
            createdAt: d.created_at
          }));
        } catch (err) {
          console.error('[COACH] Erro na consulta de notificações:', err);
          return [];
        }
      } else {
        return localDB.getNotifications(userId);
      }
    },
    enabled: !!userId
  });

  const markNotificationAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured && supabase && isValidUUID(id)) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
        if (error) throw error;
      } else {
        localDB.markNotificationAsRead(id);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  });

  const triggerDailyChecksMutation = useMutation({
    mutationFn: async () => {
      if (isSupabaseConfigured && supabase) {
        // As Edge Functions fariam isso em produção. Simulando resposta.
        return { success: true, checked: new Date().toISOString() };
      } else {
        return { success: true, checked: new Date().toISOString() };
      }
    }
  });

  return {
    getResumeOptimizationQuery,
    getCoverLetterQuery,
    generateCoverLetter: generateCoverLetterMutation.mutateAsync,
    isGeneratingLetter: generateCoverLetterMutation.isPending,
    getInterviewPrepQuery,
    getSimulationQuery,
    startSimulation: startSimulationMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutateAsync,
    getPostLogQuery,
    savePostLog: savePostLogMutation.mutateAsync,
    notifications: notificationsQuery.data || [],
    isLoadingNotifications: notificationsQuery.isLoading,
    markNotificationAsRead: markNotificationAsReadMutation.mutateAsync,
    triggerDailyChecks: triggerDailyChecksMutation.mutateAsync
  };
}
