import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { ResumeOptimizationService } from '../services/ResumeOptimizationService';
import { InterviewPreparationService } from '../services/InterviewPreparationService';
import { InterviewSimulationService } from '../services/InterviewSimulationService';
import type { 
  Resume, Job, CoverLetter, 
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
              return null;
            }
            if (!data) return null;
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
            return null;
          }
        } else {
          return localDB.getResumeOptimization(resume.id, (job as any).id);
        }
      },
      enabled: !!resume && !!job
    });
  };

  const generateResumeOptimizationMutation = useMutation({
    mutationFn: async ({ resumeId, resumeVersionId, jobId }: { resumeId: string; resumeVersionId: string; jobId: string }) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.functions.invoke('match-job', {
          body: {
            resumeId,
            resumeVersionId,
            jobId,
            operation: 'optimize-cv'
          }
        });
        if (error) throw error;
        return data;
      } else {
        const resume = localDB.getResumes().find(r => r.id === resumeId);
        const job = localDB.getJob(jobId);
        if (!resume || !job) throw new Error('Currículo ou vaga local não encontrados.');
        return ResumeOptimizationService.optimizeForJob(resume, job);
      }
    },
    onSuccess: (data: any, variables) => {
      const isMock = variables.jobId.includes('mock') || !isValidUUID(variables.jobId);
      if (isMock && data) {
        localDB.saveResumeOptimization({
          id: data.id || `opt-mock-${Date.now()}`,
          resumeId: variables.resumeId,
          jobId: variables.jobId,
          optimizedSummary: data.optimizedSummary || data.optimized_summary || '',
          keyExperiences: data.keyExperiences || data.key_experiences || [],
          missingKeywords: data.missingKeywords || data.missing_keywords || [],
          redundantInfo: data.redundantInfo || data.redundant_info || [],
          createdAt: new Date().toISOString()
        });
      }
      queryClient.invalidateQueries({ queryKey: ['resume-optimization', variables.resumeId, variables.jobId] });
    }
  });

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
    mutationFn: async ({ resumeId, resumeVersionId, jobId, applicationId }: { resumeId: string; resumeVersionId: string; jobId?: string; applicationId: string }) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.functions.invoke('match-job', {
          body: {
            resumeId,
            resumeVersionId,
            jobId,
            applicationId,
            operation: 'cover-letter'
          }
        });
        if (error) throw error;
        return data;
      } else {
        const letter: CoverLetter = {
          id: `letter-${Date.now()}`,
          applicationId,
          textFormal: `Prezada equipe de recrutamento,\n\nGostaria de formalizar meu interesse nesta vaga...`,
          textDirect: `Olá time,\n\nVi a vaga e me identifiquei muito. Sou especialista na minha área de atuação...`,
          textExecutive: `À Direção de Operações,\n\nEscrevo para apresentar minha candidatura. Possuo histórico consolidado liderando projetos...`,
          createdAt: new Date().toISOString()
        };
        localDB.saveCoverLetter(letter);
        return letter;
      }
    },
    onSuccess: (data: any, variables) => {
      const isMock = variables.applicationId.includes('mock') || !isValidUUID(variables.applicationId);
      if (isMock && data) {
        localDB.saveCoverLetter({
          id: data.id || `letter-mock-${Date.now()}`,
          applicationId: variables.applicationId,
          textFormal: data.textFormal || data.text_formal || '',
          textDirect: data.textDirect || data.text_direct || '',
          textExecutive: data.textExecutive || data.text_executive || '',
          createdAt: new Date().toISOString()
        });
      }
      queryClient.invalidateQueries({ queryKey: ['cover-letter', variables.applicationId] });
    }
  });

  // 3. Interview Prep
  const getInterviewPrepQuery = (_resume: Resume | null, job: Job | Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | null) => {
    return useQuery<any | null>({
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
              return null;
            }
            if (!data) return null;
            
            // Suporta o novo formato com introdução
            const isLegacyFormat = Array.isArray(data.questions);
            return {
              id: data.id,
              jobId: data.job_id,
              questions: isLegacyFormat ? data.questions : (data.questions.questions || []),
              introduction: isLegacyFormat ? undefined : data.questions.introduction,
              createdAt: data.created_at
            };
          } catch (err) {
            console.error('[COACH] Erro na consulta de interview prep:', err);
            return null;
          }
        } else {
          const prep = localDB.getInterviewPreparation((job as any).id);
          if (!prep) return null;
          return {
            id: prep.id,
            jobId: prep.jobId,
            questions: prep.questions,
            createdAt: prep.createdAt
          };
        }
      },
      enabled: !!job
    });
  };

  const generateInterviewPrepMutation = useMutation({
    mutationFn: async ({ resumeId, resumeVersionId, jobId }: { resumeId: string; resumeVersionId: string; jobId: string }) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.functions.invoke('match-job', {
          body: {
            resumeId,
            resumeVersionId,
            jobId,
            operation: 'interview-prep'
          }
        });
        if (error) throw error;
        
        const isLegacyFormat = Array.isArray(data.questions);
        return {
          id: data.id,
          jobId: data.job_id,
          questions: isLegacyFormat ? data.questions : (data.questions.questions || []),
          introduction: isLegacyFormat ? undefined : data.questions.introduction,
          createdAt: data.created_at
        };
      } else {
        const resume = localDB.getResumes().find(r => r.id === resumeId);
        const job = localDB.getJob(jobId);
        if (!job) throw new Error('Vaga local não encontrada.');
        return InterviewPreparationService.getPreparation(resume || null, job);
      }
    },
    onSuccess: (data: any, variables) => {
      const isMock = variables.jobId.includes('mock') || !isValidUUID(variables.jobId);
      if (isMock && data) {
        localDB.saveInterviewPreparation({
          id: data.id || `prep-mock-${Date.now()}`,
          jobId: variables.jobId,
          questions: data.questions || [],
          createdAt: new Date().toISOString()
        });
      }
      queryClient.invalidateQueries({ queryKey: ['interview-prep', variables.jobId] });
    }
  });

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
    mutationFn: async (args: string | { applicationId: string; reset?: boolean }) => {
      const applicationId = typeof args === 'string' ? args : args.applicationId;
      const reset = typeof args === 'string' ? false : !!args.reset;
      const isMock = applicationId.includes('mock') || !isValidUUID(applicationId);

      if (isSupabaseConfigured && supabase && !isMock) {
        if (reset) {
          // Deleta a simulação existente para iniciar do zero
          await supabase
            .from('interview_simulations')
            .delete()
            .eq('application_id', applicationId);
        } else {
          // Verificar se já existe uma simulação para evitar duplicatas
          const { data: existing } = await supabase
            .from('interview_simulations')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

          if (existing) {
            return {
              id: existing.id,
              applicationId: existing.application_id,
              chatHistory: existing.chat_history,
              evaluations: existing.evaluations,
              createdAt: existing.created_at
            };
          }
        }

        // Buscar cargo da vaga
        const { data: appData } = await supabase
          .from('applications')
          .select('job_title')
          .eq('id', applicationId)
          .maybeSingle();

        const jobTitle = appData?.job_title || 'esta vaga';
        const isPharmacy = /farmac|estet|saude|saúde/i.test(jobTitle);

        const defaultHistory = [
          {
            role: 'interviewer',
            text: isPharmacy
              ? `Olá! Seja bem-vindo à entrevista simulada para a vaga de ${jobTitle}. Para começar, conte-me um pouco sobre você e como suas qualificações na área de saúde e estética se conectam com o nosso perfil.`
              : `Olá! Seja bem-vindo à entrevista simulada para a vaga de ${jobTitle}. Para começar, conte-me um pouco sobre você e como suas experiências se conectam com os requisitos da vaga.`
          }
        ];

        const sim = {
          application_id: applicationId,
          chat_history: defaultHistory
        };
        const { data, error } = await supabase.from('interview_simulations').insert(sim).select().single();
        if (error) throw error;
        return {
          id: data.id,
          applicationId: data.application_id,
          chatHistory: data.chat_history,
          evaluations: data.evaluations,
          createdAt: data.created_at
        };
      } else {
        if (reset) {
          localDB.deleteInterviewSimulation(applicationId);
        }
        return InterviewSimulationService.startSimulation(applicationId);
      }
    },
    onSuccess: (data) => {
      const appId = (data as any)?.applicationId || (data as any)?.application_id;
      if (appId) {
        queryClient.invalidateQueries({ queryKey: ['simulation', appId] });
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sim, role, text }: { sim: InterviewSimulation; role: 'interviewer' | 'candidate'; text: string }) => {
      const isMock = sim.applicationId.includes('mock') || !isValidUUID(sim.applicationId);
      let updated: InterviewSimulation;

      if (isSupabaseConfigured && supabase && !isMock) {
        const { data: appData } = await supabase
          .from('applications')
          .select('job_title')
          .eq('id', sim.applicationId)
          .maybeSingle();
        
        const jobTitle = appData?.job_title || 'esta vaga';
        const isPharmacy = /farmac|estet|saude|saúde/i.test(jobTitle);

        const updatedHistory = [...sim.chatHistory, { role, text }];
        let evaluations = sim.evaluations;

        if (updatedHistory.filter(h => h.role === 'candidate').length >= 2) {
          const candidateReplies = updatedHistory.filter(h => h.role === 'candidate').map(h => h.text);
          let totalLength = 0;
          let hasInappropriateWords = false;
          let usesStarWords = false;

          const badWords = [/xingar/i, /ofender/i, /bater/i, /gritar/i, /palavrão/i, /ofensa/i, /agredir/i, /insultar/i, /ignorar/i];
          const starWords = [/resultado/i, /ação/i, /acao/i, /situação/i, /situacao/i, /meta/i, /objetivo/i, /consegui/i, /resolvi/i, /aprendi/i, /indicador/i];

          for (const reply of candidateReplies) {
            totalLength += reply.length;
            if (badWords.some(r => r.test(reply))) hasInappropriateWords = true;
            if (starWords.some(r => r.test(reply))) usesStarWords = true;
          }

          const avgLength = candidateReplies.length > 0 ? totalLength / candidateReplies.length : 0;
          let clarity = 75;
          let objectivity = 75;
          let adherence = 75;
          let strengths: string[] = [];
          let improvements: string[] = [];

          if (hasInappropriateWords) {
            clarity = 10;
            objectivity = 15;
            adherence = 0;
            strengths = ['Nenhum ponto forte identificado. Comportamento e linguajar inadequados.'];
            improvements = [
              'COMPORTAMENTO INACEITÁVEL: Respostas agressivas, violentas ou contendo xingamentos/ameaças resultam em reprovação imediata.',
              'Mantenha a inteligência emocional sob pressão e responda de maneira profissional.',
              'Pratique a resolução diplomática de conflitos através de comunicação assertiva.'
            ];
          } else {
            if (avgLength < 15) {
              clarity -= 35;
              objectivity += 15;
              adherence -= 30;
              improvements.push('Respostas extremamente superficiais. Desenvolva mais suas respostas com exemplos reais.');
            } else if (avgLength > 150) {
              clarity += 10;
              objectivity -= 20;
              improvements.push('Sua resposta foi muito longa e pode dispersar o entrevistador. Seja mais conciso e focado.');
            } else {
              clarity += 10;
              objectivity += 10;
              strengths.push('Boa extensão de resposta, mantendo-se focado no assunto sem prolixidade.');
            }

            if (usesStarWords) {
              adherence += 15;
              clarity += 5;
              strengths.push('Demonstrou uso de estrutura clara de causa, ação e resultados (Método STAR).');
            } else {
              adherence -= 10;
              improvements.push('Tente estruturar suas respostas usando o método STAR (Situação, Desafio, Ação e Resultados obtidos).');
            }

            if (isPharmacy) {
              strengths.push('Alinhamento satisfatório com diretrizes de atendimento ao paciente e biossegurança.');
            } else {
              strengths.push('Demonstrou senso prático para lidar com desafios operacionais corporativos.');
            }
          }

          evaluations = {
            clarity: Math.max(0, Math.min(100, clarity)),
            objectivity: Math.max(0, Math.min(100, objectivity)),
            adherence: Math.max(0, Math.min(100, adherence)),
            strengths,
            improvements
          };
        } else if (role === 'candidate') {
          updatedHistory.push({
            role: 'interviewer',
            text: isPharmacy
              ? 'Excelente. Como você lidaria com uma situação de insatisfação ou reclamação de um paciente após um procedimento estético?'
              : 'Excelente. Como você lidaria com um conflito ou desafio técnico sob pressão no dia a dia da equipe?'
          });
        }

        const { error } = await supabase
          .from('interview_simulations')
          .update({
            chat_history: updatedHistory,
            evaluations: evaluations
          })
          .eq('id', sim.id);
        if (error) throw error;

        updated = {
          ...sim,
          chatHistory: updatedHistory,
          evaluations
        };
      } else {
        updated = InterviewSimulationService.addMessage(sim, role, text);
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

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured && supabase && isValidUUID(id)) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } else {
        localDB.deleteNotification(id);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  });

  const markAllNotificationsAsReadMutation = useMutation({
    mutationFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false);
        if (error) throw error;
      } else {
        const unread = localDB.getNotifications(userId || '').filter(n => !n.isRead);
        unread.forEach(n => localDB.markNotificationAsRead(n.id));
      }
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  });

  const triggerDailyChecksMutation = useMutation({
    mutationFn: async () => {
      // Invalida o cache de descoberta de vagas e de compatibilidades para forçar um refetch limpo da Adzuna
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      return { success: true, checked: new Date().toISOString() };
    }
  });

  return {
    getResumeOptimizationQuery,
    generateResumeOptimization: generateResumeOptimizationMutation.mutateAsync,
    isGeneratingOptimization: generateResumeOptimizationMutation.isPending,
    getCoverLetterQuery,
    generateCoverLetter: generateCoverLetterMutation.mutateAsync,
    isGeneratingLetter: generateCoverLetterMutation.isPending,
    getInterviewPrepQuery,
    generateInterviewPrep: generateInterviewPrepMutation.mutateAsync,
    isGeneratingPrep: generateInterviewPrepMutation.isPending,
    getSimulationQuery,
    startSimulation: startSimulationMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutateAsync,
    getPostLogQuery,
    savePostLog: savePostLogMutation.mutateAsync,
    notifications: notificationsQuery.data || [],
    isLoadingNotifications: notificationsQuery.isLoading,
    markNotificationAsRead: markNotificationAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    markAllNotificationsAsRead: markAllNotificationsAsReadMutation.mutateAsync,
    triggerDailyChecks: triggerDailyChecksMutation.mutateAsync
  };
}
