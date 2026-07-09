import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { MatchingEngine } from '../services/matchingEngine';
import { sanitizeFileName } from '../utils/fileUtils';
import { AppError } from '../errors/AppError';
import type { Resume, Job, Match, PipelineStep } from '../../domain/models/types';
import type { CareerProfileNew } from './useMyProfileAi';

// ==========================================
// 1. HOOK PARA GERENCIAR CURRÍCULOS
// ==========================================
export function useResumes(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);

  const resumesQuery = useQuery<Resume[]>({
    queryKey: ['resumes', userId],
    queryFn: async () => {
      if (!userId) return [];
      if (isSupabaseConfigured && supabase) {
        const { data: resumesData, error: resumesError } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (resumesError) throw resumesError;

        const { data: versionsData, error: versionsError } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('user_id', userId);

        if (versionsError) throw versionsError;

        // Mapear dados estruturados do Supabase mesclando com resume_versions
        return (resumesData || []).map(r => {
          const correspondingVersion = (versionsData || []).find(
            v => v.file_url === r.file_url || v.file_name === r.file_name
          );
          return {
            id: r.id,
            userId: r.user_id,
            resumeVersionId: correspondingVersion?.id,
            filePath: r.file_path,
            fileName: r.file_path.split('/').pop() || 'curriculo.pdf',
            rawText: r.raw_text,
            structuredSummary: r.structured_data?.structuredSummary || '',
            yearsOfExperience: r.structured_data?.yearsOfExperience || 0,
            isPrimary: r.is_primary,
            createdAt: r.created_at,
            updatedAt: r.updated_at || r.created_at,
            experiences: r.structured_data?.experiences || [],
            skills: r.structured_data?.skills || [],
            education: r.structured_data?.education || []
          };
        });
      } else {
        return localDB.getResumes();
      }
    },
    enabled: !!userId,
  });

  const uploadResumeMutation = useMutation({
    mutationFn: async ({ file, rawText }: { file: File, rawText: string }) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      const pipelineStartTime = Date.now();
      console.log(`[PIPELINE] 1. Upload iniciado para o arquivo: ${file.name} (Tamanho: ${file.size} bytes)`);

      try {
        setPipelineSteps([
          { id: 'upload', label: 'Upload do arquivo...', status: 'running' },
          { id: 'db_init', label: 'Registrando referência do arquivo...', status: 'pending' },
          { id: 'extraction', label: 'Extraindo conteúdo (PDF/DOCX/TXT)...', status: 'pending' },
          { id: 'ia_parsing', label: 'Processando IA (OpenAI gpt-4o)...', status: 'pending' },
          { id: 'db_save', label: 'Salvando perfil estruturado...', status: 'pending' },
        ]);

        if (isSupabaseConfigured && supabase) {
          const sanitizedName = sanitizeFileName(file.name);
          const filePath = `${userId}/${Date.now()}_${sanitizedName}`;
          
          // 1. Upload para o Supabase Storage bucket 'resumes'
          console.log(`[STORAGE] Fazendo upload para bucket 'resumes', caminho: ${filePath}`);
          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, file, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error(`[STORAGE] Erro crítico ao fazer upload do arquivo para o bucket resumes:`, uploadError);
            throw new Error('Erro ao fazer upload do currículo. Por favor, tente novamente.');
          }
          console.log(`[PIPELINE] 2. Upload concluído para o Storage. Caminho: ${filePath}`);
          setPipelineSteps(prev => prev.map(s => 
            s.id === 'upload' ? { ...s, label: '✔ Upload concluído', status: 'success' } :
            s.id === 'db_init' ? { ...s, status: 'running' } : s
          ));

          // Obter URL pública do arquivo
          const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

          // 2a. Criar registro na tabela public.resume_versions
          console.log(`[DATABASE] Inserindo registro inicial na tabela public.resume_versions...`);
          const { data: resumeVersion, error: rvError } = await supabase
            .from('resume_versions')
            .insert({
              user_id: userId,
              file_url: publicUrl,
              file_name: file.name,
              status: 'processing'
            })
            .select()
            .single();

          if (rvError) {
            console.error(`[DATABASE] Erro crítico ao salvar versão do currículo:`, rvError);
            throw new Error(`Falha ao gravar versão do currículo no Banco: ${rvError.message}`);
          }
          if (!resumeVersion) {
            throw new Error('Falha ao retornar o registro salvo de resume_versions no Banco.');
          }
          const resumeVersionId = resumeVersion.id;
          console.log(`[PIPELINE] Registro inicial de 'resume_versions' criado. ID: ${resumeVersionId}`);

          // 2b. Criar registro inicial na tabela public.resumes
          console.log(`[DATABASE] Inserindo registro inicial na tabela public.resumes...`);
          const { data: resumeData, error: dbError } = await supabase
            .from('resumes')
            .insert({
              user_id: userId,
              file_path: filePath, 
              storage_path: filePath,
              file_name: file.name,
              file_url: publicUrl,
              raw_text: rawText || null,
              is_primary: true
            })
            .select()
            .maybeSingle();

          if (dbError) {
            console.error(`[DATABASE] Erro crítico ao salvar referência do currículo:`, dbError);
            throw new Error(`Falha ao gravar referência do currículo no Banco: ${dbError.message}`);
          }
          if (!resumeData) {
            throw new Error('Falha ao retornar o registro salvo de resumes no Banco.');
          }
          console.log(`[PIPELINE] 3. Registro inicial de 'resumes' criado no Banco. ID: ${resumeData.id}`);
          setPipelineSteps(prev => prev.map(s => 
            s.id === 'db_init' ? { ...s, label: '✔ Referência registrada', status: 'success' } :
            s.id === 'extraction' ? { ...s, status: 'running' } : s
          ));

          // 3. Invocar a Edge Function 'analyze-resume' de forma ASSÍNCRONA
          console.log(`[PIPELINE] 4. Disparando Edge Function 'analyze-resume' de forma assíncrona...`);
          const { data: { user } } = await supabase.auth.getUser();
          const isE2EUser = user?.email?.includes('.e2e.') || user?.email === 'hardening.e2e@example.com';

          supabase.functions.invoke('analyze-resume', {
            body: { 
              storagePath: filePath, 
              fileName: file.name,
              userId: userId,
              resumeId: resumeData.id,
              resumeVersionId: resumeVersionId,
              rawText: file.type.includes('text/plain') || file.name.endsWith('.txt') ? rawText : undefined,
              mockGemini: isE2EUser
            }
          }).catch(err => {
            console.error('[EDGE FUNCTION ASYNC ERROR]', err);
          });

          // 4. Polling loop para ler logs de processamento e status
          let isComplete = false;
          let attempts = 0;
          const maxAttempts = 60;
          
          while (!isComplete && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            attempts++;

            const { data: versionStatus, error: statusError } = await supabase
              .from('resume_versions')
              .select('status')
              .eq('id', resumeVersionId)
              .single();

            if (statusError) {
              console.error('[POLLING] Erro ao obter status:', statusError);
              continue;
            }

            const { data: logs, error: logsError } = await supabase
              .from('resume_processing_logs')
              .select('*')
              .eq('resume_version_id', resumeVersionId)
              .order('created_at', { ascending: true });

            if (!logsError && logs) {
              const hasExtractStarted = logs.some(l => l.step === 'extracting_text');
              const hasExtractCompleted = logs.some(l => l.step === 'extracting_text' && l.status === 'completed');
              const hasGeminiStarted = logs.some(l => l.step === 'analyzing_profile');
              const hasGeminiCompleted = logs.some(l => l.step === 'analyzing_profile' && l.status === 'completed');
              const hasSaveCompleted = logs.some(l => l.step === 'creating_profile' && l.status === 'completed');
              const hasFailed = logs.some(l => l.status === 'failed' || l.status === 'error');

              const steps: PipelineStep[] = [
                { id: 'upload', label: '✔ Upload concluído', status: 'success' },
                { id: 'db_init', label: '✔ Referência registrada', status: 'success' },
                {
                  id: 'extraction',
                  label: hasExtractCompleted ? '✔ Texto extraído com sucesso' : hasExtractStarted ? 'Extraindo conteúdo (PDF/DOCX/TXT)...' : 'Extraindo conteúdo...',
                  status: hasExtractCompleted ? 'success' : hasExtractStarted ? 'running' : 'pending'
                },
                {
                  id: 'ia_parsing',
                  label: hasGeminiCompleted ? '✔ Processado por IA' : hasGeminiStarted ? 'Processando IA (OpenAI gpt-4o)...' : 'Processando IA...',
                  status: hasGeminiCompleted ? 'success' : hasGeminiStarted ? 'running' : 'pending'
                },
                {
                  id: 'db_save',
                  label: hasSaveCompleted ? '✔ Perfil estruturado' : hasGeminiCompleted ? 'Salvando perfil estruturado...' : 'Salvando perfil estruturado...',
                  status: hasSaveCompleted ? 'success' : hasGeminiCompleted ? 'running' : 'pending'
                }
              ];

              setPipelineSteps(steps);

              if (hasFailed) {
                const failedLog = logs.find(l => l.status === 'failed' || l.status === 'error');
                throw new Error(failedLog?.error_message || 'Erro no processamento da IA.');
              }
            }

            if (versionStatus.status === 'completed') {
              isComplete = true;
            } else if (versionStatus.status === 'failed') {
              const { data: errorLog } = await supabase
                .from('resume_processing_errors')
                .select('error_message')
                .eq('resume_version_id', resumeVersionId)
                .maybeSingle();

              throw new Error(errorLog?.error_message || 'Falha no processamento da IA.');
            }
          }

          if (!isComplete) {
            throw new Error('Tempo limite excedido ao processar o currículo.');
          }

          const duration = Date.now() - pipelineStartTime;
          console.log(`[PIPELINE] 8. Pipeline concluído com sucesso via polling. Tempo total: ${duration}ms`);
          return resumeData;
        } else {
          throw new Error('Supabase não está configurado. O parser de currículos requer conexão ativa com Supabase e OpenAI.');
        }
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        setPipelineSteps(prev => {
          let marked = false;
          return prev.map(s => {
            if (!marked && (s.status === 'running' || s.status === 'pending')) {
              marked = true;
              return { ...s, label: `✖ Falha: ${errorMsg}`, status: 'error' };
            }
            return s;
          });
        });
        throw error;
      }
    },
    onError: (error: any) => {
      AppError.logError(error, supabase, 'useResumes.uploadResume', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
    }
  });

  const deleteResumeMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('resumes')
          .delete()
          .eq('id', resumeId);
        if (error) throw error;
      } else {
        localDB.deleteResume(resumeId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
    }
  });

  return {
    resumes: resumesQuery.data || [],
    isLoading: resumesQuery.isLoading,
    uploadResume: uploadResumeMutation.mutateAsync,
    isUploading: uploadResumeMutation.isPending,
    deleteResume: deleteResumeMutation.mutateAsync,
    pipelineSteps
  };
}

// ==========================================
// 2. HOOK PARA GERENCIAR VAGAS
// ==========================================
export function useJobs(userId: string | undefined) {
  const queryClient = useQueryClient();

  const jobsQuery = useQuery<Job[]>({
    queryKey: ['jobs', userId],
    queryFn: async () => {
      if (!userId) return [];
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(j => ({
          id: j.id,
          companyId: 'manual',
          companyName: 'Inserida Manualmente',
          title: j.title,
          description: j.description,
          requirements: j.requirements || [],
          location: 'Remoto',
          workMode: 'remote',
          seniority: 'senior',
          currency: 'BRL',
          isActive: true,
          createdAt: j.created_at,
          updatedAt: j.updated_at || j.created_at
        }));
      } else {
        return localDB.getJobs();
      }
    },
    enabled: !!userId,
  });

  const createJobMutation = useMutation({
    mutationFn: async ({ title, description, requirements }: { title: string, description: string, requirements: string[] }) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('jobs')
          .insert({
            user_id: userId,
            title,
            description,
            requirements
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const newJob: Job = {
          id: `job-${Date.now()}`,
          companyId: 'manual',
          companyName: 'Vaga Manual',
          title,
          description,
          requirements,
          location: 'Remoto',
          workMode: 'remote',
          seniority: 'senior',
          isActive: true,
          currency: 'BRL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return localDB.saveJob(newJob);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
    }
  });

  return {
    jobs: jobsQuery.data || [],
    isLoading: jobsQuery.isLoading,
    createJob: createJobMutation.mutateAsync,
    isCreating: createJobMutation.isPending
  };
}

// ==========================================
// 3. HOOK PARA GERENCIAR MATCHES & GAP ANALYSIS
// ==========================================
export function useMatches(userId: string | undefined, resumeId?: string | null) {
  const queryClient = useQueryClient();

  const matchesQuery = useQuery<Match[]>({
    queryKey: ['matches', userId, resumeId],
    queryFn: async () => {
      if (!userId) return [];
      if (isSupabaseConfigured && supabase) {
        let query = supabase
          .from('matches')
          .select('*, jobs(*)')
          .order('created_at', { ascending: false });

        if (resumeId) {
          query = query.eq('resume_id', resumeId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []).map(m => ({
          id: m.id,
          userId: userId,
          resumeId: m.resume_id,
          jobId: m.job_id,
          jobTitle: m.jobs?.title || 'Vaga',
          companyName: m.jobs?.companyName || 'Inserida Manualmente',
          scoreOverall: m.score_overall,
          scoreTechnical: m.score_technical,
          scoreBehavioral: m.score_behavioral,
          scoreSeniority: m.score_seniority,
          scoreLocation: 100,
          explanation: m.explanation,
          createdAt: m.created_at
        }));
      } else {
        return localDB.getMatches();
      }
    },
    enabled: !!userId,
  });

  const getMatchDetailsQuery = (matchId: string) => {
    return useQuery({
      queryKey: ['match-details', matchId],
      queryFn: async () => {
        if (!matchId) return null;
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();

          if (error) throw error;
          return {
            match: data,
            gapAnalysis: data.gap_analysis
          };
        } else {
          const match = localDB.getMatch(matchId);
          const gap = localDB.getGapAnalysis(matchId);
          return match ? { match, gapAnalysis: gap } : null;
        }
      },
      enabled: !!matchId
    });
  };

  const calculateMatchMutation = useMutation({
    mutationFn: async ({ resume, job, consolidatedProfile }: {
      resume: Resume;
      job: Job;
      consolidatedProfile?: CareerProfileNew | null;
    }) => {
      // 1. Calcula compatibilidade semântica usando o perfil consolidado como fonte primária
      const result = await MatchingEngine.calculateMatch(resume, job, consolidatedProfile);

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('matches')
          .insert({
            resume_id: resume.id,
            job_id: job.id,
            score_overall: result.match.scoreOverall,
            score_technical: result.match.scoreTechnical,
            score_behavioral: result.match.scoreBehavioral,
            score_seniority: result.match.scoreSeniority,
            explanation: result.match.explanation,
            gap_analysis: result.gapAnalysis
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Salvar localmente no mock DB
        localDB.saveMatch(result.match);
        if (result.gapAnalysis) {
          localDB.saveGapAnalysis(result.gapAnalysis);
        }
        return result.match;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
    }
  });

  return {
    matches: matchesQuery.data || [],
    isLoading: matchesQuery.isLoading,
    calculateMatch: calculateMatchMutation.mutateAsync,
    isCalculating: calculateMatchMutation.isPending,
    getMatchDetails: getMatchDetailsQuery
  };
}
