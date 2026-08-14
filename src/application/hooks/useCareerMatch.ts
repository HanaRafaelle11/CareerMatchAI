import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { tracker } from '../../infrastructure/analytics/tracker';
import { MatchingEngine } from '../services/matchingEngine';
import { UnifiedMatchService } from '../../domain/services/UnifiedMatchService';
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
        if (!resumesData || resumesData.length === 0) {
          const localRes = localDB.getResumes();
          if (localRes && localRes.length > 0) return localRes;
        }

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

      // Validar tamanho do arquivo (máx 10MB)
      const MAX_SIZE_BYTES = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE_BYTES) {
        throw new Error('O arquivo excede o limite máximo de 10MB. Por favor, envie um arquivo menor.');
      }

      // Validar extensão / MIME type
      const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg', '.webp'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp'
      ];
      
      if (!allowedExtensions.includes(fileExt) && file.type && !allowedMimes.includes(file.type)) {
        throw new Error('Formato de arquivo não suportado. Por favor, envie um documento em formato PDF, DOCX, TXT ou Imagem (PNG, JPG, WEBP).');
      }

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
        tracker.track('resume_uploaded', 'resumes');
        tracker.track('resume_parsed', 'resumes');

        if (isSupabaseConfigured && supabase) {
          try {
            const versionId = newResume.resumeVersionId;
            let userFullName = "Profissional Vocentro";
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
            tracker.track('resume_uploaded', 'resumes');
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
                raw_text: (rawText && rawText !== '__binary_upload__') ? rawText : null,
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
            tracker.track('resume_parsed', 'resumes');
            
            // Gravar tempo de processamento real no banco de dados
            await supabase
              .from('resume_versions')
              .update({ processing_time_ms: duration })
              .eq('id', resumeVersionId);

            return {
              ...resumeData,
              resumeVersionId
            };
          } catch (supaError) {
            console.error('[PIPELINE] Falha no fluxo Supabase:', supaError);
            throw supaError;
          }
        } else {
          return await runMockPipeline();
        }
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        const userFriendlyMsg = (errorMsg.includes('non-2xx') || errorMsg.includes('Edge Function') || errorMsg.includes('parse') || errorMsg.includes('PDF'))
          ? 'Não conseguimos processar este arquivo. Verifique:\n✓ PDF válido com camada de texto\n✓ Arquivo menor que 10MB\n✓ Arquivo sem senha de proteção'
          : errorMsg;

        setPipelineSteps(prev => {
          let marked = false;
          return prev.map(s => {
            if (!marked && (s.status === 'running' || s.status === 'pending')) {
              marked = true;
              return { ...s, label: `✖ ${userFriendlyMsg}`, status: 'error' };
            }
            return s;
          });
        });
        throw new Error(userFriendlyMsg);
      }
    },
    onError: (error: any) => {
      setPipelineSteps([]);
      AppError.logError(error, supabase, 'useResumes.uploadResume', userId);
    },
    onSuccess: () => {
      setPipelineSteps([]);
      // Remover completamente a cache de busca para que o novo currículo calcule sugestões limpas
      queryClient.removeQueries({ queryKey: ['job-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });

      // Limpar termos residuais de busca do currículo anterior
      sessionStorage.removeItem('job_search_keyword');
      sessionStorage.removeItem('job_search_location');
      sessionStorage.removeItem('job_search_remote');
      sessionStorage.removeItem('job_search_page');
      sessionStorage.removeItem('job_search_input_keyword');
      sessionStorage.removeItem('job_search_input_location');
      sessionStorage.removeItem('job_search_input_remote');
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

        // 3. Deletar currículo principal imediatamente do banco
        const { error } = await supabase
          .from('resumes')
          .delete()
          .eq('id', resumeId);
        if (error) throw error;

        // 4. Executar limpezas vinculadas em paralelo em segundo plano (background cleanup)
        const cleanupPromises: Promise<any>[] = [
          UnifiedMatchService.clearStaleMatchesForUser(userId!, resumeId).catch(e => console.warn('[DELETE] Matches:', e)),
          Promise.resolve(supabase.from('resume_optimizations').delete().eq('resume_id', resumeId)),
        ];

        if (resumeVersionId) {
          cleanupPromises.push(Promise.resolve(supabase.from('resume_processing_logs').delete().eq('resume_version_id', resumeVersionId)));
          cleanupPromises.push(Promise.resolve(supabase.from('resume_versions').delete().eq('id', resumeVersionId)));
        }

        if (resume?.file_path) {
          cleanupPromises.push(Promise.resolve(supabase.storage.from('resumes').remove([resume.file_path])));
        }


        await Promise.allSettled(cleanupPromises);

        // 5. Limpeza final se não restar nenhum currículo
        try {
          const { data: remainingResumes } = await supabase
            .from('resumes')
            .select('id')
            .eq('user_id', userId);

          if (!remainingResumes || remainingResumes.length === 0) {
            await Promise.allSettled([
              supabase.from('resume_versions').delete().eq('user_id', userId),
              supabase.from('career_profiles').delete().eq('user_id', userId),
              supabase.from('career_insights').delete().eq('user_id', userId),
              supabase.from('resume_processing_logs').delete().eq('user_id', userId),
              supabase.from('resume_processing_errors').delete().eq('user_id', userId)
            ]);
          }
        } catch (e) {
          console.warn('[DELETE] Falha na limpeza final:', e);
        }
      } else {
        localDB.deleteResume(resumeId);
      }
    },
    onMutate: async (resumeId: string) => {
      // Optimistic UI: Remove o currículo da interface em 0ms
      await queryClient.cancelQueries({ queryKey: ['resumes', userId] });
      const previousResumes = queryClient.getQueryData(['resumes', userId]);

      if (previousResumes) {
        queryClient.setQueryData(['resumes', userId], (old: any) => 
          Array.isArray(old) ? old.filter(r => r.id !== resumeId) : []
        );
      }
      return { previousResumes };
    },
    onError: (_err, _resumeId, context) => {
      if (context?.previousResumes) {
        queryClient.setQueryData(['resumes', userId], context.previousResumes);
      }
    },
    onSuccess: () => {
      setPipelineSteps([]);
      // Remover completamente a cache de busca para evitar vazamento do perfil antigo
      queryClient.removeQueries({ queryKey: ['job-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['resume-optimization'] });
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      queryClient.invalidateQueries({ queryKey: ['cover-letter'] });

      // Limpar termos salvos da busca no sessionStorage
      sessionStorage.removeItem('job_search_keyword');
      sessionStorage.removeItem('job_search_location');
      sessionStorage.removeItem('job_search_input_location');
      sessionStorage.removeItem('job_search_input_remote');
    }
  });


  const selectActiveResumeMutation = useMutation({
    mutationFn: async (targetId: string) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase) {
        // 1. Resetar is_primary = false em todos os currículos do usuário
        await supabase
          .from('resumes')
          .update({ is_primary: false })
          .eq('user_id', userId);

        // 2. Definir o currículo selecionado como is_primary = true (por id ou por resume_version)
        const { error: setError } = await supabase
          .from('resumes')
          .update({ is_primary: true })
          .eq('id', targetId)
          .eq('user_id', userId);

        if (setError) {
          // Se targetId for um resumeVersionId, buscar a resume_version correspondente
          const { data: rv } = await supabase
            .from('resume_versions')
            .select('file_name, file_url')
            .eq('id', targetId)
            .maybeSingle();

          if (rv) {
            await supabase
              .from('resumes')
              .update({ is_primary: true })
              .eq('user_id', userId)
              .or(`file_name.eq.${rv.file_name},file_url.eq.${rv.file_url}`);
          }
        }
      } else {
        // Modo Local DB / Mock
        const allResumes = JSON.parse(localStorage.getItem('vocentro_resumes') || '[]');
        const updated = allResumes.map((r: any) => {
          if (r.userId === userId || !r.userId) {
            const isMatch = r.id === targetId || r.resumeVersionId === targetId;
            return { ...r, isPrimary: isMatch };
          }
          return r;
        });
        localStorage.setItem('vocentro_resumes', JSON.stringify(updated));
      }
      return targetId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
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
        if (!data || data.length === 0) {
          const localJobs = localDB.getJobs();
          if (localJobs && localJobs.length > 0) return localJobs;
        }
        const rawJobs = (data || []).map(j => ({
          id: j.id,
          companyId: 'manual',
          companyName: j.company_name || 'Inserida Manualmente',
          title: j.title,
          description: j.description,
          requirements: j.requirements || [],
          location: j.location || 'Remoto',
          workMode: (j.work_mode || 'remote') as any,
          seniority: (j.seniority || 'senior') as any,
          currency: 'BRL',
          isActive: true,
          createdAt: j.created_at,
          updatedAt: j.updated_at || j.created_at,
          sourceUrl: j.source_url || undefined,
          sourcePlatform: j.source_platform || 'manual',
          salary: j.salary || undefined,
          salaryNumeric: j.salary_numeric || undefined,
          benefits: j.benefits || []
        }));

        const uniqueJobs: Job[] = [];
        const seenKeys = new Set<string>();
        for (const job of rawJobs) {
          const minuteKey = `${job.title.trim().toLowerCase()}::${job.companyName.trim().toLowerCase()}::${new Date(job.createdAt).toISOString().slice(0, 16)}`;
          if (!seenKeys.has(job.id) && !seenKeys.has(minuteKey)) {
            seenKeys.add(job.id);
            seenKeys.add(minuteKey);
            uniqueJobs.push(job);
          }
        }
        return uniqueJobs;
      } else {
        return localDB.getJobs();
      }
    },
    enabled: !!userId,
  });

  const createJobMutation = useMutation({
    mutationFn: async (args: { 
      title: string;
      description: string;
      requirements: string[];
      sourceUrl?: string;
      companyName?: string;
      location?: string;
      workMode?: string;
      seniority?: string;
      salary?: string;
      salaryNumeric?: number;
      benefits?: string[];
      sourcePlatform?: string;
    }) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('jobs')
          .insert({
            user_id: userId,
            title: args.title,
            description: args.description,
            requirements: args.requirements,
            source_url: args.sourceUrl,
            company_name: args.companyName || 'Inserida Manualmente',
            location: args.location || 'Remoto',
            work_mode: args.workMode || 'remote',
            seniority: args.seniority || 'senior',
            salary: args.salary || undefined,
            salary_numeric: args.salaryNumeric || undefined,
            benefits: args.benefits || [],
            source_platform: args.sourcePlatform || 'manual'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const newJob: Job = {
          id: `job-${Date.now()}`,
          companyId: 'manual',
          companyName: args.companyName || 'Vaga Manual',
          title: args.title,
          description: args.description,
          requirements: args.requirements,
          location: args.location || 'Remoto',
          workMode: (args.workMode || 'remote') as any,
          seniority: (args.seniority || 'senior') as any,
          isActive: true,
          currency: 'BRL',
          sourceUrl: args.sourceUrl,
          sourcePlatform: args.sourcePlatform || 'manual',
          salary: args.salary,
          salaryNumeric: args.salaryNumeric,
          benefits: args.benefits || [],
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
      const targetId = String(jobId);

      if (isSupabaseConfigured && supabase) {
        // Verificar se tem candidatura registrada para proteger histórico e estatísticas
        const { data: existingApps } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', userId)
          .eq('job_id', targetId);

        if (existingApps && existingApps.length > 0) {
          throw new Error('Esta vaga possui uma candidatura registrada no seu Pipeline. Remova a candidatura no Pipeline antes de excluí-la.');
        }

        // Deletar APENAS associações do usuário (job_feedback, job_matches, matches)
        // NUNCA deletar a linha do catálogo compartilhado na tabela jobs nem registros em applications
        await supabase
          .from('job_feedback')
          .delete()
          .eq('job_id', targetId)
          .eq('user_id', userId);

        await supabase
          .from('job_matches')
          .delete()
          .eq('job_id', targetId)
          .eq('user_id', userId);

        await supabase
          .from('matches')
          .delete()
          .eq('job_id', targetId)
          .eq('user_id', userId);
      }

      // Limpar cache local do mock localDB
      localDB.deleteJob(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-career-match-data'] });
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
        let targetResumeIds: string[] = [];

        if (resumeId) {
          targetResumeIds = [resumeId];
        } else {
          // Buscar todos os IDs de currículo do usuário para consultar a tabela matches
          const { data: userResumes } = await supabase
            .from('resumes')
            .select('id, is_primary')
            .eq('user_id', userId);

          if (userResumes && userResumes.length > 0) {
            const primary = userResumes.find(r => r.is_primary);
            if (primary) {
              targetResumeIds = [primary.id];
            } else {
              targetResumeIds = userResumes.map(r => r.id);
            }
          }
        }

        if (targetResumeIds.length === 0) return [];

        const { data, error } = await supabase
          .from('matches')
          .select('*, jobs(*)')
          .in('resume_id', targetResumeIds)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[MATCHES QUERY ERROR]', error);
          return [];
        }
        return (data || []).map(m => ({
          id: m.id,
          userId: userId,
          resumeId: m.resume_id,
          jobId: m.job_id,
          jobTitle: m.jobs?.title || 'Vaga',
          companyName: m.jobs?.companyName || m.jobs?.company_name || 'Inserida Manualmente',
          scoreOverall: m.score_overall,
          scoreTechnical: m.score_technical,
          scoreBehavioral: m.score_behavioral,
          scoreSeniority: m.score_seniority,
          scoreLocation: 100,
          explanation: m.explanation,
          gap_analysis: m.gap_analysis,
          createdAt: m.created_at,
          processingTimeMs: m.processing_time_ms
        }));
      } else {
        return localDB.getMatches();
      }
    },
    enabled: !!userId,
  });

  const useMatchDetailsQuery = (matchId: string) => {
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-details'] });
      queryClient.invalidateQueries({ queryKey: ['resume-optimization'] });
      tracker.track('match_generated', 'matching', { score: data?.score_overall || data?.scoreOverall });
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      queryClient.invalidateQueries({ queryKey: ['cover-letter'] });
    }
  });

  return {
    matches: matchesQuery.data || [],
    isLoading: matchesQuery.isLoading,
    calculateMatch: calculateMatchMutation.mutateAsync,
    isCalculating: calculateMatchMutation.isPending,
    getMatchDetails: useMatchDetailsQuery
  };
}
