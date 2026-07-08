import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../infrastructure/api/supabaseClient';
import type { ResumeVersion } from '../../domain/models/types';

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
  });

  const uploadVersionMutation = useMutation({
    mutationFn: async ({ file, resumeName, professionalGoal }: { file: File, resumeName: string, professionalGoal?: string }) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase não está configurado.');
      }

      // 1. Upload do arquivo para o storage
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `${userId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erro ao enviar arquivo para o storage: ${uploadError.message}`);
      }

      // 2. Obter a URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(storagePath);

      const fileUrl = urlData.publicUrl;

      // 3. Inserir registro na tabela resume_versions com status 'uploaded'
      const { data: insertData, error: insertError } = await supabase
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

      // 4. Invocação assíncrona da Edge Function para processar texto com Gemini
      try {
        supabase.functions.invoke('analyze-resume', {
          body: {
            storagePath: storagePath,
            fileName: file.name,
            userId: userId,
            resumeVersionId: insertData.id
          }
        }).catch(err => {
          console.error("Erro assíncrono na Edge Function:", err);
        });
      } catch (invokeErr) {
        console.error("Falha ao iniciar Edge Function:", invokeErr);
      }

      return insertData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-versions', userId] });
    }
  });

  return {
    versions: versionsQuery.data || [],
    isLoadingVersions: versionsQuery.isLoading,
    uploadVersion: uploadVersionMutation.mutateAsync,
    isUploadingVersion: uploadVersionMutation.isPending,
    uploadError: uploadVersionMutation.error ? (uploadVersionMutation.error as Error).message : null
  };
}
