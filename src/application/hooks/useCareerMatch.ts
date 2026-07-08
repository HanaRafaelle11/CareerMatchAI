import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { MatchingEngine } from '../services/matchingEngine';
import type { Resume, Job, Match } from '../../domain/models/types';

// ==========================================
// 1. HOOK PARA GERENCIAR CURRÍCULOS
// ==========================================
export function useResumes(userId: string | undefined) {
  const queryClient = useQueryClient();

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

      console.log(`[UPLOAD] Iniciando fluxo de upload para o usuário: ${userId}`);
      console.log(`[UPLOAD] Arquivo: ${file.name}, Tamanho: ${file.size} bytes, Tipo: ${file.type}`);

      if (isSupabaseConfigured && supabase) {
        const filePath = `${userId}/${Date.now()}_${file.name}`;
        
        // 1. Upload para o Supabase Storage bucket 'resumes'
        console.log(`[STORAGE] Fazendo upload para bucket 'resumes', caminho: ${filePath}`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`[STORAGE] Erro ao fazer upload do arquivo:`, uploadError);
          throw uploadError;
        }
        console.log(`[STORAGE] Upload concluído com sucesso:`, uploadData);

        // 2. Criar registro inicial na tabela public.resumes
        console.log(`[DATABASE] Inserindo registro inicial na tabela public.resumes`);
        const { data: resumeData, error: dbError } = await supabase
          .from('resumes')
          .insert({
            user_id: userId,
            file_path: filePath, // retrocompatibilidade
            storage_path: filePath,
            file_name: file.name,
            raw_text: rawText || null,
            is_primary: true
          })
          .select()
          .maybeSingle();

        if (dbError) {
          console.error(`[DATABASE] Erro ao salvar referência do currículo:`, dbError);
          throw dbError;
        }
        if (!resumeData) {
          throw new Error('Falha ao retornar o registro salvo de resumes.');
        }
        console.log(`[DATABASE] Registro inicial salvo, ID: ${resumeData.id}`);

        // 3. Invocar a Edge Function 'analyze-resume' para processar o currículo
        console.log(`[EDGE FUNCTION] Invocando analyze-resume com storagePath: ${filePath}`);
        const { data: parsedResume, error: functionError } = await supabase.functions.invoke('analyze-resume', {
          body: { 
            storagePath: filePath, 
            fileName: file.name,
            userId: userId,
            rawText: file.type.includes('text/plain') || file.name.endsWith('.txt') ? rawText : undefined
          }
        });

        if (functionError) {
          console.error(`[EDGE FUNCTION] Erro ao invocar analyze-resume:`, functionError);
          throw functionError;
        }
        console.log(`[EDGE FUNCTION] Análise concluída com sucesso. Resposta estruturada recebida:`, parsedResume);

        // Extrair o perfil de carreira a partir do currículo processado
        const parsedProfile = MatchingEngine.extractProfile(parsedResume);

        // 4. Atualizar o registro do currículo com os dados estruturados obtidos
        console.log(`[DATABASE] Atualizando registro do currículo com os dados estruturados da IA`);
        const { error: updateError } = await supabase
          .from('resumes')
          .update({
            structured_data: parsedResume,
            raw_text: parsedResume.structuredSummary
          })
          .eq('id', resumeData.id);

        if (updateError) {
          console.error(`[DATABASE] Erro ao atualizar o currículo com dados da IA:`, updateError);
          throw updateError;
        }

        // 5. Salvar ou atualizar o perfil de carreira associado
        console.log(`[DATABASE] Salvando perfil de carreira associado na tabela public.career_profiles`);
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
          const { error } = await supabase
            .from('career_profiles')
            .update(profilePayload)
            .eq('id', existingProfile.id);
          profileError = error;
        } else {
          const { error } = await supabase
            .from('career_profiles')
            .insert(profilePayload);
          profileError = error;
        }

        if (profileError) {
          console.error('[DATABASE] Erro ao salvar perfil de carreira no Supabase:', profileError);
        } else {
          console.log(`[DATABASE] Perfil de carreira salvo com sucesso.`);
        }

        return resumeData;
      } else {
        // Fallback local - Apenas se Supabase NÃO estiver configurado!
        console.log(`[LOCAL] Rodando em modo Local Fallback (LocalStorage)`);
        const { resume: parsedResume, careerProfile: parsedProfile } = await MatchingEngine.parseResumeText(rawText, file.name);

        const newResume: Resume = {
          id: `res-${Date.now()}`,
          userId,
          fileName: file.name,
          rawText,
          structuredSummary: parsedResume.structuredSummary,
          yearsOfExperience: parsedResume.yearsOfExperience,
          isPrimary: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          experiences: parsedResume.experiences,
          skills: parsedResume.skills,
          education: parsedResume.education
        };
        const savedResume = localDB.saveResume(newResume);

        localDB.saveCareerProfile({
          id: `cp-${Date.now()}`,
          userId,
          resumeId: savedResume.id,
          targetRoles: parsedProfile.targetRoles,
          seniority: parsedProfile.seniority,
          industries: parsedProfile.industries,
          skills: parsedProfile.skills,
          tools: parsedProfile.tools,
          languages: parsedProfile.languages,
          preferredLocations: parsedProfile.preferredLocations,
          preferredWorkModes: parsedProfile.preferredWorkModes as any,
          targetCompanies: parsedProfile.targetCompanies,
          salaryExpectationMin: parsedProfile.salaryExpectationMin,
          searchKeywords: parsedProfile.searchKeywords,
          isApprovedByUser: parsedProfile.isApprovedByUser,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        return savedResume;
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
    deleteResume: deleteResumeMutation.mutateAsync
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
