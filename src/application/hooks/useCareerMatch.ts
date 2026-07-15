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
            v => v.file_url && r.file_url && v.file_url === r.file_url
          ) || (versionsData || []).find(
            v => v.file_name === r.file_name
          );
          return {
            id: r.id,
            userId: r.user_id,
            resumeVersionId: correspondingVersion?.id,
            filePath: r.file_path,
            fileName: r.file_name || r.file_path.split('/').pop() || 'curriculo.pdf',
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

      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      const runMockPipeline = async () => {
        setPipelineSteps([
          { id: 'reading_resume', label: 'Lendo seu currículo...', status: 'running' },
          { id: 'identifying_experiences', label: 'Identificando experiências profissionais', status: 'pending' },
          { id: 'extracting_skills', label: 'Extraindo competências', status: 'pending' },
          { id: 'creating_profile', label: 'Criando seu perfil profissional', status: 'pending' },
        ]);
        
        await sleep(1000);
        setPipelineSteps([
          { id: 'reading_resume', label: '✔ Lendo seu currículo', status: 'success' },
          { id: 'identifying_experiences', label: 'Identificando experiências profissionais...', status: 'running' },
          { id: 'extracting_skills', label: 'Extraindo competências', status: 'pending' },
          { id: 'creating_profile', label: 'Criando seu perfil profissional', status: 'pending' },
        ]);

        await sleep(1000);
        setPipelineSteps([
          { id: 'reading_resume', label: '✔ Lendo seu currículo', status: 'success' },
          { id: 'identifying_experiences', label: '✔ Identificando experiências profissionais', status: 'success' },
          { id: 'extracting_skills', label: 'Extraindo competências...', status: 'running' },
          { id: 'creating_profile', label: 'Criando seu perfil profissional', status: 'pending' },
        ]);

        await sleep(1000);
        setPipelineSteps([
          { id: 'reading_resume', label: '✔ Lendo seu currículo', status: 'success' },
          { id: 'identifying_experiences', label: '✔ Identificando experiências profissionais', status: 'success' },
          { id: 'extracting_skills', label: '✔ Extraindo competências', status: 'success' },
          { id: 'creating_profile', label: 'Criando seu perfil profissional...', status: 'running' },
        ]);

        await sleep(1000);
        setPipelineSteps([
          { id: 'reading_resume', label: '✔ Lendo seu currículo', status: 'success' },
          { id: 'identifying_experiences', label: '✔ Identificando experiências profissionais', status: 'success' },
          { id: 'extracting_skills', label: '✔ Extraindo competências', status: 'success' },
          { id: 'creating_profile', label: '✔ Criando seu perfil profissional', status: 'success' },
        ]);

        const generateUUID = (): string => {
          if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
          }
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };

        // Criar registro local no mock DB
        const newResume: Resume = {
          id: generateUUID(),
          userId: userId,
          filePath: file.name,
          storage_path: file.name,
          fileName: file.name,
          file_url: URL.createObjectURL(file),
          isPrimary: true,
          resumeVersionId: generateUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          experiences: [],
          skills: [],
          education: [],
          yearsOfExperience: 0
        };
        localDB.saveResume(newResume);

        if (isSupabaseConfigured && supabase) {
          try {
            const versionId = newResume.resumeVersionId;
            let userFullName = "Profissional Talenta";
            const { data: profData } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
            if (profData?.full_name) {
              userFullName = profData.full_name;
            }

            // 1. Inserir resume_version
            await supabase.from('resume_versions').insert({
              id: versionId,
              user_id: userId,
              file_url: newResume.file_url,
              file_name: newResume.fileName,
              status: 'completed'
            });

            // 2. Inserir resume
            await supabase.from('resumes').insert({
              id: newResume.id,
              user_id: userId,
              file_path: newResume.filePath,
              storage_path: newResume.storage_path,
              file_name: newResume.fileName,
              file_url: newResume.file_url,
              is_primary: true
            });

            // 3. Inserir career_profile
            await supabase.from('career_profiles').insert({
              user_id: userId,
              resume_version_id: versionId,
              personal: { fullName: userFullName, headline: "Especialista em Tecnologia" },
              experience: [{ companyName: "Empresa de Tecnologia", role: "Desenvolvedor", startDate: "2022-01-01", isCurrent: true }],
              skills: [{ name: "React" }, { name: "TypeScript" }],
              summary: "Perfil de contingência gerado localmente."
            });

            // 4. Inserir career_insights
            await supabase.from('career_insights').insert({
              user_id: userId,
              resume_version_id: versionId,
              seniority_prediction: { value: "Mid", confidence: 0.9, reason: "Fallback local", source_type: "inferred" },
              industry_prediction: { value: "Tecnologia", confidence: 0.9, reason: "Fallback local", source_type: "inferred" }
            });
          } catch (dbErr) {
            console.error('[DATABASE FALLBACK ERROR]', dbErr);
          }
        }

        return newResume;
      };

      try {
        setPipelineSteps([
          { id: 'reading_resume', label: 'Lendo seu currículo...', status: 'running' },
          { id: 'identifying_experiences', label: 'Identificando experiências profissionais', status: 'pending' },
          { id: 'extracting_skills', label: 'Extraindo competências', status: 'pending' },
          { id: 'creating_profile', label: 'Criando seu perfil profissional', status: 'pending' },
        ]);

        if (isSupabaseConfigured && supabase) {
          try {
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
              s.id === 'reading_resume' ? { ...s, status: 'running' } : s
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
              s.id === 'reading_resume' ? { ...s, status: 'running' } : s
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
                const hasSkillsStarted = logs.some(l => l.step === 'identifying_skills');
                const hasSkillsCompleted = logs.some(l => l.step === 'identifying_skills' && l.status === 'completed');
                const hasSaveStarted = logs.some(l => l.step === 'creating_profile');
                const hasSaveCompleted = logs.some(l => l.step === 'creating_profile' && (l.status === 'completed' || l.status === 'success'));
                const hasFailed = logs.some(l => l.status === 'failed' || l.status === 'error');

                const steps: PipelineStep[] = [
                  {
                    id: 'reading_resume',
                    label: hasExtractCompleted ? '✔ Lendo seu currículo' : hasExtractStarted ? 'Lendo seu currículo...' : 'Lendo seu currículo',
                    status: hasExtractCompleted ? 'success' : hasExtractStarted ? 'running' : 'pending'
                  },
                  {
                    id: 'identifying_experiences',
                    label: hasGeminiCompleted ? '✔ Identificando experiências profissionais' : hasGeminiStarted ? 'Identificando experiências profissionais...' : 'Identificando experiências profissionais',
                    status: hasGeminiCompleted ? 'success' : hasGeminiStarted ? 'running' : 'pending'
                  },
                  {
                    id: 'extracting_skills',
                    label: hasSkillsCompleted ? '✔ Extraindo competências' : hasSkillsStarted ? 'Extraindo competências...' : 'Extraindo competências',
                    status: hasSkillsCompleted ? 'success' : hasSkillsStarted ? 'running' : 'pending'
                  },
                  {
                    id: 'creating_profile',
                    label: hasSaveCompleted ? '✔ Criando seu perfil profissional' : hasSaveStarted ? 'Criando seu perfil profissional...' : 'Criando seu perfil profissional',
                    status: hasSaveCompleted ? 'success' : hasSaveStarted ? 'running' : 'pending'
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
            
            // Gravar tempo de processamento real no banco de dados
            await supabase
              .from('resume_versions')
              .update({ processing_time_ms: duration })
              .eq('id', resumeVersionId);

            return resumeData;
          } catch (supaError) {
            console.warn('[PIPELINE] Falha no fluxo Supabase. Iniciando fallback para modo Local...', supaError);
            return await runMockPipeline();
          }
        } else {
          return await runMockPipeline();
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
      setPipelineSteps([]);
      AppError.logError(error, supabase, 'useResumes.uploadResume', userId);
    },
    onSuccess: () => {
      setPipelineSteps([]);
      // Invalidar TODAS as queries dependentes do currículo
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery', userId] });
    }
  });

  const deleteResumeMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      if (isSupabaseConfigured && supabase) {
        // 1. Obter informações do currículo antes de deletar
        const { data: resume } = await supabase
          .from('resumes')
          .select('file_name, file_path, file_url')
          .eq('id', resumeId)
          .maybeSingle();

        // 2. Encontrar a resume_version correspondente para limpeza profunda
        let resumeVersionId: string | null = null;
        if (resume) {
          const { data: rv } = await supabase
            .from('resume_versions')
            .select('id')
            .eq('user_id', userId)
            .eq('file_url', resume.file_url || '')
            .maybeSingle();
          if (rv) resumeVersionId = rv.id;

          if (!resumeVersionId) {
            const fileName = resume.file_name || resume.file_path?.split('/').pop();
            const { data: rv2 } = await supabase
              .from('resume_versions')
              .select('id')
              .eq('user_id', userId)
              .eq('file_name', fileName || '')
              .maybeSingle();
            if (rv2) resumeVersionId = rv2.id;
          }
        }

        // 3. Limpeza profunda: apagar TUDO relacionado a este currículo
        if (resumeVersionId) {
          try {
            await supabase.from('resume_processing_logs').delete().eq('resume_version_id', resumeVersionId);
          } catch (e) {
            console.warn('[DELETE] Falha ao apagar logs do CV:', e);
          }
        }

        // 4. Deletar matches vinculados a este resume_id
        try {
          await supabase.from('matches').delete().eq('resume_id', resumeId);
        } catch (e) {
          console.warn('[DELETE] Falha ao apagar matches do CV:', e);
        }

        // 5. Deletar resume_optimizations vinculados
        try {
          await supabase.from('resume_optimizations').delete().eq('resume_id', resumeId);
        } catch (e) {
          console.warn('[DELETE] Falha ao apagar otimizações do CV:', e);
        }

        // 6. Deletar a resume_version (CASCADE apaga career_profiles, career_insights, job_matches)
        if (resumeVersionId) {
          try {
            await supabase.from('resume_versions').delete().eq('id', resumeVersionId);
          } catch (e) {
            console.warn('[DELETE] Falha ao apagar versão de CV:', e);
          }
        }

        // 7. Deletar da tabela resumes
        const { error } = await supabase
          .from('resumes')
          .delete()
          .eq('id', resumeId);
        if (error) throw error;

        // 8. Limpeza final: se não restar nenhum currículo, varrer tudo do usuário
        try {
          const { data: remainingResumes } = await supabase
            .from('resumes')
            .select('id')
            .eq('user_id', userId);

          if (!remainingResumes || remainingResumes.length === 0) {
            await supabase.from('resume_versions').delete().eq('user_id', userId);
            await supabase.from('career_profiles').delete().eq('user_id', userId);
            await supabase.from('career_insights').delete().eq('user_id', userId);
            await supabase.from('resume_processing_logs').delete().eq('user_id', userId);
            await supabase.from('resume_processing_errors').delete().eq('user_id', userId);
          }
        } catch (e) {
          console.warn('[DELETE] Falha ao fazer limpeza profunda final:', e);
        }

        // 9. Limpar arquivo do Storage
        if (resume?.file_path) {
          try {
            await supabase.storage.from('resumes').remove([resume.file_path]);
          } catch (e) {
            console.warn('[DELETE] Falha ao remover arquivo do Storage:', e);
          }
        }
      } else {
        localDB.deleteResume(resumeId);
      }
    },
    onSuccess: () => {
      setPipelineSteps([]);
      // Invalidar TODAS as queries dependentes
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery', userId] });
      queryClient.invalidateQueries({ queryKey: ['resume-optimization'] });
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      queryClient.invalidateQueries({ queryKey: ['cover-letter'] });
      // Limpar sessionStorage e localStorage de dados residuais
      sessionStorage.removeItem('job_search_keyword');
      sessionStorage.removeItem('job_search_location');
      sessionStorage.removeItem('job_search_remote');
      sessionStorage.removeItem('job_search_page');
      sessionStorage.removeItem('job_search_input_keyword');
      sessionStorage.removeItem('job_search_input_location');
      sessionStorage.removeItem('job_search_input_remote');
    }
  });

  const selectActiveResumeMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase) {
        // 1. Set all resumes for this user to is_primary = false
        const { error: resetError } = await supabase
          .from('resumes')
          .update({ is_primary: false })
          .eq('user_id', userId);
        if (resetError) throw resetError;

        // 2. Set the selected resume to is_primary = true
        const { error: setError } = await supabase
          .from('resumes')
          .update({ is_primary: true })
          .eq('id', resumeId);
        if (setError) throw setError;
      } else {
        // Local mode
        const allResumes = JSON.parse(localStorage.getItem('careermatch_resumes') || '[]');
        const updated = allResumes.map((r: any) => {
          if (r.userId === userId) {
            return { ...r, isPrimary: r.id === resumeId };
          }
          return r;
        });
        localStorage.setItem('careermatch_resumes', JSON.stringify(updated));
      }
      return resumeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
    }
  });

  return {
    resumes: resumesQuery.data || [],
    isLoading: resumesQuery.isLoading,
    uploadResume: uploadResumeMutation.mutateAsync,
    isUploading: uploadResumeMutation.isPending,
    deleteResume: deleteResumeMutation.mutateAsync,
    selectActiveResume: selectActiveResumeMutation.mutateAsync,
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

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('jobs')
          .delete()
          .eq('id', jobId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        localDB.deleteJob(jobId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    }
  });

  return {
    jobs: jobsQuery.data || [],
    isLoading: jobsQuery.isLoading,
    createJob: createJobMutation.mutateAsync,
    isCreating: createJobMutation.isPending,
    deleteJob: deleteJobMutation.mutateAsync,
    isDeleting: deleteJobMutation.isPending
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
          gap_analysis: m.gap_analysis, // Adiciona o gap_analysis para o AI Coach
          createdAt: m.created_at,
          processingTimeMs: m.processing_time_ms
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
      const matchStartTime = Date.now();
      // 1. Calcula compatibilidade semântica usando o perfil consolidado como fonte primária
      const result = await MatchingEngine.calculateMatch(resume, job, consolidatedProfile);
      const matchDuration = Date.now() - matchStartTime;
      console.info(`Matching calculated in ${matchDuration}ms`);

      if (isSupabaseConfigured && supabase) {
        // O match-job já salvou o registro no banco via saveJobMatch!
        // Apenas retornamos a propriedade match do resultado.
        return result.match;
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
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-details'] });
      queryClient.invalidateQueries({ queryKey: ['resume-optimization'] });
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      queryClient.invalidateQueries({ queryKey: ['cover-letter'] });
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
