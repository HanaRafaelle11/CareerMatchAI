import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import type { Job } from '../../domain/models/types';

export interface TrashedJob {
  id: string;
  jobId: string;
  title: string;
  companyName: string;
  location?: string;
  deletedAt: string;
  originalJob?: Job;
}

export function useJobTrash(userId?: string, activeJobs: Job[] = []) {
  const queryClient = useQueryClient();

  // Limpa residual antigo do localStorage durante essa transição (Migração Ponto 6)
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vocentro_job_trash_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignorar erros de storage
    }
  }

  // Query ao banco de dados Supabase (tabela job_feedback com action = 'REJECTED')
  const trashQuery = useQuery<TrashedJob[]>({
    queryKey: ['job-trash', userId],
    queryFn: async () => {
      if (!userId) return [];

      if (isSupabaseConfigured && supabase) {
        // 1. Buscar registros de exclusão no Supabase
        const { data: exclusions, error: exErr } = await supabase
          .from('job_feedback')
          .select('id, job_id, created_at')
          .eq('user_id', userId)
          .eq('action', 'REJECTED');

        if (exErr) {
          console.error('[TRASH QUERY ERROR]', exErr);
          return [];
        }

        if (!exclusions || exclusions.length === 0) return [];

        const excludedJobIds = exclusions.map(e => String(e.job_id));

        // 2. Buscar detalhes das vagas no banco (tabela jobs)
        const { data: dbJobs } = await supabase
          .from('jobs')
          .select('*')
          .in('id', excludedJobIds);

        // 3. Montar a lista de vagas excluídas
        return exclusions.map(ex => {
          const exJobIdStr = String(ex.job_id);
          const foundDbJob = (dbJobs || []).find(j => String(j.id) === exJobIdStr);
          const foundActiveJob = activeJobs.find(j => String(j.id) === exJobIdStr);

          const title = foundDbJob?.title || foundActiveJob?.title || `Vaga (${exJobIdStr.slice(0, 8)})`;
          const companyName = foundDbJob?.company_name || foundActiveJob?.companyName || 'Empresa';
          const location = foundDbJob?.location || foundActiveJob?.location || 'Brasil';

          return {
            id: exJobIdStr,
            jobId: exJobIdStr,
            title,
            companyName,
            location,
            deletedAt: ex.created_at || new Date().toISOString(),
            originalJob: foundActiveJob || (foundDbJob ? {
              id: foundDbJob.id,
              companyId: 'manual',
              companyName: foundDbJob.company_name || 'Empresa',
              title: foundDbJob.title,
              description: foundDbJob.description || '',
              requirements: foundDbJob.requirements || [],
              location: foundDbJob.location || 'Remoto',
              workMode: foundDbJob.work_mode || 'remote',
              seniority: foundDbJob.seniority || 'senior',
              currency: 'BRL',
              isActive: true,
              createdAt: foundDbJob.created_at,
              updatedAt: foundDbJob.updated_at || foundDbJob.created_at
            } : undefined)
          };
        });
      }
      return [];
    },
    enabled: !!userId,
  });

  const trashedJobs = trashQuery.data || [];
  const trashedJobIds = new Set(trashedJobs.map(t => String(t.jobId)));

  // 1. Mutation para Mover para a Lixeira (Soft Delete no Banco)
  const moveToTrashMutation = useMutation({
    mutationFn: async (job: Job | { id: string; title?: string; companyName?: string; location?: string }) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      const targetJobId = String(job.id);

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('job_feedback')
          .insert({
            user_id: userId,
            job_id: targetJobId,
            action: 'REJECTED',
            reason: null
          });

        if (error && !error.message.includes('duplicate')) {
          console.error('[MOVE TO TRASH ERROR]', error);
          // Se já existir, tentar prosseguir sem quebrar
        }
      }
      return targetJobId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-trash', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
    }
  });

  // 2. Mutation para Restaurar Vaga (Remover exclusão do Banco)
  const restoreFromTrashMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('job_feedback')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', String(jobId))
          .eq('action', 'REJECTED');

        if (error) {
          console.error('[RESTORE TRASH ERROR]', error);
          throw error;
        }
      }
      return jobId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-trash', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
    }
  });

  // 3. Mutation para Excluir Definitivamente do Banco (DELETE real)
  const deletePermanentlyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      const targetId = String(jobId);

      if (isSupabaseConfigured && supabase) {
        // Remover da tabela job_feedback
        await supabase
          .from('job_feedback')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', targetId);

        // Remover da tabela applications
        await supabase
          .from('applications')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', targetId);

        // Remover da tabela job_matches
        await supabase
          .from('job_matches')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', targetId);

        // Remover da tabela matches
        await supabase
          .from('matches')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', targetId);

        // Remover da tabela jobs (DELETE real da linha no banco)
        const { error: jobDelErr } = await supabase
          .from('jobs')
          .delete()
          .eq('user_id', userId)
          .eq('id', targetId);

        if (jobDelErr) {
          console.warn('[PERMANENT DELETE JOBS WARNING]', jobDelErr);
        }
      }
      return targetId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-trash', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
    }
  });

  // 4. Esvaziar Lixeira (Excluir Definitivamente todas as vagas na lixeira)
  const clearTrashMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase) {
        const { data: excludedList } = await supabase
          .from('job_feedback')
          .select('job_id')
          .eq('user_id', userId)
          .eq('action', 'REJECTED');

        if (excludedList && excludedList.length > 0) {
          const ids = excludedList.map(e => String(e.job_id));

          await supabase.from('job_feedback').delete().eq('user_id', userId).in('job_id', ids);
          await supabase.from('applications').delete().eq('user_id', userId).in('job_id', ids);
          await supabase.from('job_matches').delete().eq('user_id', userId).in('job_id', ids);
          await supabase.from('matches').delete().eq('user_id', userId).in('job_id', ids);
          await supabase.from('jobs').delete().eq('user_id', userId).in('id', ids);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-trash', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
    }
  });

  return {
    trashedJobs,
    trashedJobIds,
    isLoading: trashQuery.isLoading,
    moveToTrash: moveToTrashMutation.mutateAsync,
    restoreFromTrash: restoreFromTrashMutation.mutateAsync,
    removeFromTrash: deletePermanentlyMutation.mutateAsync,
    clearTrash: clearTrashMutation.mutateAsync
  };
}
