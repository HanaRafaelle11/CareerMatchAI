import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { MatchingEngine } from '../services/matchingEngine';
import type { Resume, Job, Match, PipelineStep } from '../../domain/models/types';

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
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Mapear dados estruturados do Supabase
        return (data || []).map(r => ({
          id: r.id,
          userId: r.user_id,
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
        }));
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
          const filePath = `${userId}/${Date.now()}_${file.name}`;
          
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
            throw new Error(`Falha no upload para o Storage: ${uploadError.message}`);
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

          // 2. Criar registro inicial na tabela public.resumes
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

          // 3. Invocar a Edge Function 'analyze-resume' para processar o currículo
          console.log(`[PIPELINE] 4. Invocando Edge Function 'analyze-resume'...`);
          setPipelineSteps(prev => prev.map(s => 
            s.id === 'extraction' ? { ...s, label: 'Extraindo conteúdo (PDF/DOCX/TXT)...', status: 'running' } :
            s.id === 'ia_parsing' ? { ...s, status: 'running' } : s
          ));

          const apiStartTime = Date.now();
          const { data: parsedResume, error: functionError } = await supabase.functions.invoke('analyze-resume', {
            body: { 
              storagePath: filePath, 
              fileName: file.name,
              userId: userId,
              resumeId: resumeData.id,
              rawText: file.type.includes('text/plain') || file.name.endsWith('.txt') ? rawText : undefined
            }
          });
          const apiDuration = Date.now() - apiStartTime;

          if (functionError) {
            console.error(`[EDGE FUNCTION] Erro ao invocar analyze-resume:`, functionError);
            throw functionError;
          }
          if (parsedResume?.error) {
            console.error(`[EDGE FUNCTION] Erro retornado no processamento da IA:`, parsedResume.error);
            throw new Error(parsedResume.error);
          }
          console.log(`[PIPELINE] 5. Resposta da Edge Function recebida com sucesso. Duração da API: ${apiDuration}ms`);

          const debug = parsedResume._debug || {};
          const charCount = debug.charCount || parsedResume.rawText?.length || 0;
          const pageCount = debug.pageCount || 1;
          const expCount = parsedResume.experiences?.length || 0;
          const hardCount = parsedResume.skills?.filter((s: any) => s.category === 'hard_skill').length || 0;
          const softCount = parsedResume.skills?.filter((s: any) => s.category === 'soft_skill').length || 0;
          const compCount = new Set(parsedResume.experiences?.map((e: any) => e.companyName)).size;
          const ats = parsedResume.atsScore || 85;

          setPipelineSteps([
            { id: 'upload', label: '✔ Upload concluído', status: 'success' },
            { id: 'pdf_found', label: `✔ ${file.name.split('.').pop()?.toUpperCase() || 'PDF'} encontrado`, status: 'success' },
            { id: 'pages', label: `✔ ${pageCount} páginas`, status: 'success' },
            { id: 'chars', label: `✔ ${charCount.toLocaleString('pt-BR')} caracteres extraídos`, status: 'success' },
            { id: 'experiences', label: `✔ ${expCount} experiências identificadas`, status: 'success' },
            { id: 'hard_skills', label: `✔ ${hardCount} hard skills`, status: 'success' },
            { id: 'soft_skills', label: `✔ ${softCount} soft skills`, status: 'success' },
            { id: 'companies', label: `✔ ${compCount} empresas`, status: 'success' },
            { id: 'ia_sent', label: '✔ Enviado para GPT-4o', status: 'success' },
            { id: 'profile_struct', label: '✔ Perfil estruturado', status: 'success' },
            { id: 'ats_score', label: `✔ ATS Score calculado: ${ats}%`, status: 'success' },
            { id: 'db_save', label: 'Gravando no banco de dados...', status: 'running' }
          ]);

          // Extrair o perfil de carreira a partir do currículo processado
          const parsedProfile = MatchingEngine.extractProfile(parsedResume);

          // 4. Atualizar o registro do currículo com os dados estruturados obtidos
          console.log(`[DATABASE] Atualizando registro do currículo com os dados estruturados da IA...`);
          const { error: updateError } = await supabase
            .from('resumes')
            .update({
              structured_data: parsedResume,
              raw_text: parsedResume.structuredSummary
            })
            .eq('id', resumeData.id);

          if (updateError) {
            console.error(`[DATABASE] Erro ao atualizar o currículo com dados da IA:`, updateError);
            throw new Error(`Falha ao salvar dados estruturados no Banco: ${updateError.message}`);
          }
          console.log(`[PIPELINE] 6. Registro do currículo atualizado com dados estruturados da IA.`);

          // 5. Salvar ou atualizar o perfil de carreira associado
          console.log(`[DATABASE] Salvando perfil de carreira associado na tabela public.career_profiles...`);
          const { data: existingProfile } = await supabase
            .from('career_profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          const profilePayload = {
            user_id: userId,
            resume_id: resumeData.id,
            target_roles: parsedProfile.targetRoles,
            seniority: parsedProfile.seniority,
            industries: parsedProfile.industries,
            skills: parsedProfile.skills,
            tools: parsedProfile.tools,
            languages: parsedProfile.languages,
            preferred_locations: parsedProfile.preferredLocations,
            preferred_work_modes: parsedProfile.preferredWorkModes,
            target_companies: parsedProfile.targetCompanies,
            salary_expectation_min: parsedProfile.salaryExpectationMin,
            search_keywords: parsedProfile.searchKeywords,
            is_approved_by_user: parsedProfile.isApprovedByUser
          };

          let profileError;
          if (existingProfile) {
            console.log(`[DATABASE] Atualizando perfil de carreira existente ID: ${existingProfile.id}`);
            const { error } = await supabase
              .from('career_profiles')
              .update(profilePayload)
              .eq('id', existingProfile.id);
            profileError = error;
          } else {
            console.log(`[DATABASE] Criando novo perfil de carreira...`);
            const { error } = await supabase
              .from('career_profiles')
              .insert(profilePayload);
            profileError = error;
          }

          if (profileError) {
            console.error('[DATABASE] Erro ao salvar perfil de carreira no Supabase:', profileError);
            throw new Error(`Falha ao persistir perfil de carreira no Banco: ${profileError.message}`);
          }
          console.log(`[PIPELINE] 7. Perfil de carreira atualizado com sucesso.`);
          
          setPipelineSteps(prev => prev.map(s => 
            s.id === 'db_save' ? { ...s, label: '✔ Banco atualizado', status: 'success' } : s
          ));

          const totalPipelineTime = Date.now() - pipelineStartTime;
          console.log(`[PIPELINE] 8. Pipeline concluído com sucesso. Tempo total do processo: ${totalPipelineTime}ms`);

          return resumeData;
        } else {
          throw new Error('Supabase não está configurado. O parser de currículos requer conexão ativa com Supabase e OpenAI.');
        }
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        setPipelineSteps(prev => {
          let marked = false;
          const isEarlyFailure = prev.length <= 5;
          if (isEarlyFailure) {
            let errorSteps: PipelineStep[] = [];
            
            const hasUploadFailed = errorMsg.includes('upload') || errorMsg.includes('Storage');
            const hasExtractionFailed = errorMsg.includes('Nenhum texto') || errorMsg.includes('extraído') || errorMsg.includes('Auditoria') || errorMsg.includes('PDF');
            const hasOpenAIFailed = errorMsg.includes('OpenAI') || errorMsg.includes('IA') || errorMsg.includes('chave');
            const hasDbFailed = errorMsg.includes('Banco') || errorMsg.includes('database') || errorMsg.includes('referencia') || errorMsg.includes('persistir');
            
            errorSteps.push({
              id: 'err_pdf',
              label: hasUploadFailed || hasExtractionFailed ? '✖ PDF corrompido ou formato inválido' : '✔ PDF carregado com sucesso',
              status: hasUploadFailed || hasExtractionFailed ? 'error' : 'success'
            });

            errorSteps.push({
              id: 'err_text',
              label: hasExtractionFailed ? '✖ Nenhum texto encontrado' : hasUploadFailed ? '✖ Extração bloqueada (upload falhou)' : '✔ Texto extraído com sucesso',
              status: hasExtractionFailed ? 'error' : hasUploadFailed ? 'pending' : 'success'
            });

            errorSteps.push({
              id: 'err_openai',
              label: hasOpenAIFailed ? '✖ OpenAI indisponível ou chave inválida' : (hasUploadFailed || hasExtractionFailed) ? '✖ Processamento cancelado' : '✔ Processado por IA',
              status: hasOpenAIFailed ? 'error' : (hasUploadFailed || hasExtractionFailed) ? 'pending' : 'success'
            });

            errorSteps.push({
              id: 'err_db',
              label: hasDbFailed ? '✖ Resume não salvo no banco' : '✖ Erro no banco de dados',
              status: hasDbFailed ? 'error' : 'pending'
            });

            return errorSteps;
          }

          return prev.map(s => {
            if (!marked && (s.status === 'running' || s.status === 'pending')) {
              marked = true;
              return { ...s, label: `✖ Resume não salvo no banco: ${errorMsg}`, status: 'error' };
            }
            return s;
          });
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
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
export function useMatches(userId: string | undefined) {
  const queryClient = useQueryClient();

  const matchesQuery = useQuery<Match[]>({
    queryKey: ['matches', userId],
    queryFn: async () => {
      if (!userId) return [];
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('matches')
          .select('*, jobs(*)')
          .order('created_at', { ascending: false });

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
    mutationFn: async ({ resume, job }: { resume: Resume, job: Job }) => {
      // 1. Calcula compatibilidade semântica
      const result = await MatchingEngine.calculateMatch(resume, job);

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
