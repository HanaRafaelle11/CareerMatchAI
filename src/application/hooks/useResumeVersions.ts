import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../infrastructure/api/supabaseClient';
import { sanitizeFileName } from '../utils/fileUtils';
import type { ResumeVersion, PipelineStep } from '../../domain/models/types';

export function useResumeVersions(userId: string | undefined) {
  const queryClient = useQueryClient();

  const versionsQuery = useQuery<ResumeVersion[]>({
    queryKey: ['resume-versions', userId],
    queryFn: async () => {
      if (!userId) return [];
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(r => ({
          id: r.id,
          userId: r.user_id,
          fileUrl: r.file_url,
          fileName: r.file_name,
          professionalGoal: r.professional_goal,
          status: r.status,
          createdAt: r.created_at
        }));
      }
      return [];
    },
    enabled: !!userId,
    refetchInterval: (query) => {
      const data = query.state.data as ResumeVersion[] | undefined;
      const hasProcessing = data?.some(v => v.status === 'uploaded' || v.status === 'processing');
      return hasProcessing ? 2500 : false;
    }
  });

  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);

  const uploadVersionMutation = useMutation({
    mutationFn: async ({ file, resumeName, professionalGoal }: { file: File, resumeName: string, professionalGoal?: string }) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase não está configurado.');
      }

      setPipelineSteps([
        { id: 'upload', label: 'Enviando arquivo ao Storage...', status: 'running' },
        { id: 'extract', label: 'Extraindo conteúdo do PDF...', status: 'pending' },
        { id: 'gemini', label: 'IA analisando histórico e competências...', status: 'pending' },
        { id: 'save', label: 'Criando perfil consolidado...', status: 'pending' }
      ]);

      // 1. Upload do arquivo para o storage
      const sanitizedName = sanitizeFileName(file.name);
      const storagePath = `${userId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error('Erro ao enviar o currículo. Por favor, tente novamente.');
      }

      setPipelineSteps(prev => prev.map(s => 
        s.id === 'upload' ? { ...s, label: '✔ Upload concluído', status: 'success' } :
        s.id === 'extract' ? { ...s, status: 'running' } : s
      ));

      // 2. Obter a URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(storagePath);

      const fileUrl = urlData.publicUrl;

      // 3. Inserir registro na tabela resume_versions com status 'uploaded'
      const { data: resumeVersion, error: insertError } = await supabase
        .from('resume_versions')
        .insert({
          user_id: userId,
          file_url: fileUrl,
          file_name: resumeName,
          professional_goal: professionalGoal || null,
          status: 'uploaded'
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erro ao registrar versão de currículo: ${insertError.message}`);
      }

      if (!resumeVersion?.id) {
        throw new Error('A versão do currículo não foi criada. Pipeline interrompido.');
      }

      // 4. Invocação assíncrona da Edge Function para processar texto com Gemini
      try {
        supabase.functions.invoke('analyze-resume', {
          body: {
            storagePath: storagePath,
            fileName: file.name,
            userId: userId,
            resumeVersionId: resumeVersion.id
          }
        }).catch(err => {
          console.error("Erro assíncrono na Edge Function:", err);
        });
      } catch (invokeErr) {
        console.error("Falha ao iniciar Edge Function:", invokeErr);
      }

      // 5. Polling Loop com frequência adaptativa e limite de 5 minutos
      const pollingStartTime = Date.now();
      let isComplete = false;
      
      while (!isComplete) {
        const elapsedSeconds = (Date.now() - pollingStartTime) / 1000;
        
        // Timeout de 5 minutos (300 segundos)
        if (elapsedSeconds >= 300) {
          throw new Error("Seu currículo está demorando mais que o esperado. Continuaremos processando em segundo plano. Você pode retornar depois.");
        }

        // Definir delay de polling adaptativo
        let delayMs = 2000;
        if (elapsedSeconds > 120) {
          delayMs = 10000;
        } else if (elapsedSeconds > 30) {
          delayMs = 5000;
        }

        await new Promise(resolve => setTimeout(resolve, delayMs));

        const { data: verInfo, error: statusError } = await supabase
          .from('resume_versions')
          .select('status')
          .eq('id', resumeVersion.id)
          .single();

        if (statusError) continue;

        const { data: logs } = await supabase
          .from('resume_processing_logs')
          .select('*')
          .eq('resume_version_id', resumeVersion.id)
          .order('created_at', { ascending: true });

        if (logs) {
          const logUploaded = logs.find(l => l.step === 'uploaded');
          const logExtracting = logs.find(l => l.step === 'extracting_text');
          const logIdentifying = logs.find(l => l.step === 'identifying_skills');
          const logCreating = logs.find(l => l.step === 'creating_profile');
          const logFailed = logs.find(l => l.step === 'failed' || l.status === 'failed' || l.status === 'error');

          const steps: PipelineStep[] = [
            { 
              id: 'uploaded', 
              label: logUploaded?.status === 'completed' || logUploaded?.status === 'success' ? '✔ Upload recebido' : logUploaded?.status === 'running' ? 'Recebendo upload...' : 'Aguardando upload...', 
              status: logUploaded?.status === 'completed' || logUploaded?.status === 'success' ? 'success' : logUploaded?.status === 'running' ? 'running' : 'pending' 
            },
            { 
              id: 'extracting_text', 
              label: logExtracting?.status === 'completed' || logExtracting?.status === 'success' ? '✔ Extraindo informações do currículo' : logExtracting?.status === 'running' ? 'Extraindo informações do currículo...' : 'Aguardando extração...', 
              status: logExtracting?.status === 'completed' || logExtracting?.status === 'success' ? 'success' : logExtracting?.status === 'running' ? 'running' : 'pending' 
            },
            { 
              id: 'identifying_skills', 
              label: logIdentifying?.status === 'completed' || logIdentifying?.status === 'success' ? '✔ IA identificando competências' : logIdentifying?.status === 'running' ? 'IA identificando competências...' : 'Aguardando IA...', 
              status: logIdentifying?.status === 'completed' || logIdentifying?.status === 'success' ? 'success' : logIdentifying?.status === 'running' ? 'running' : 'pending' 
            },
            { 
              id: 'creating_profile', 
              label: logCreating?.status === 'completed' || logCreating?.status === 'success' ? '✔ Criando perfil profissional' : logCreating?.status === 'running' ? 'Criando perfil profissional...' : 'Aguardando finalização...', 
              status: logCreating?.status === 'completed' || logCreating?.status === 'success' ? 'success' : logCreating?.status === 'running' ? 'running' : 'pending' 
            }
          ];

          setPipelineSteps(steps);

          if (verInfo.status === 'failed' || logFailed || logs.some(l => l.status === 'failed' || l.status === 'error')) {
            const failedLog = logs.find(l => l.status === 'failed' || l.status === 'error');
            throw new Error(failedLog?.error_message || 'Falha no processamento da IA.');
          }
        }

        if (verInfo.status === 'completed') {
          isComplete = true;
        } else if (verInfo.status === 'failed' || verInfo.status === 'cancelled') {
          isComplete = true;
          const { data: errorLog } = await supabase
            .from('resume_processing_errors')
            .select('error_message')
            .eq('resume_version_id', resumeVersion.id)
            .maybeSingle();

          throw new Error(errorLog?.error_message || 'Falha ao estruturar currículo no Gemini.');
        }
      }

      return resumeVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-versions', userId] });
      queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      queryClient.invalidateQueries({ queryKey: ['career-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-ai', userId] });
    }
  });

  return {
    versions: versionsQuery.data || [],
    isLoadingVersions: versionsQuery.isLoading,
    uploadVersion: uploadVersionMutation.mutateAsync,
    isUploadingVersion: uploadVersionMutation.isPending,
    uploadError: uploadVersionMutation.error ? (uploadVersionMutation.error as Error).message : null,
    pipelineSteps
  };
}
