import { useEffect } from 'react';
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
  useEffect(() => {
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
  }, []);

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

          // Tentar carregar metadados salvos localmente
          let cachedMeta: { title?: string; companyName?: string; location?: string } | null = null;
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('vocentro_trash_meta_' + exJobIdStr);
              if (raw) cachedMeta = JSON.parse(raw);
            } catch (_) {}
          }

          const title = foundDbJob?.title || foundActiveJob?.title || cachedMeta?.title || 'Oportunidade Profissional';
          const companyName = foundDbJob?.company_name || foundActiveJob?.companyName || cachedMeta?.companyName || 'Empresa Confidencial';
          const location = foundDbJob?.location || foundActiveJob?.location || cachedMeta?.location || 'Brasil';

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
              companyName: foundDbJob.company_name || 'Empresa Confidencial',
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

  // 1. Mutation para Mover para a Lixeira (Soft Delete no Banco via job_feedback) com Optimistic UI Update
  const moveToTrashMutation = useMutation({
    mutationFn: async (job: Job | { id: string; title?: string; companyName?: string; location?: string }) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      const targetJobId = String(job.id);
      const title = (job as any).title || 'Oportunidade Profissional';
      const companyName = (job as any).companyName || (job as any).company_name || 'Empresa Confidencial';
      const location = (job as any).location || 'Brasil';

      // Salvar metadados legíveis em cache
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('vocentro_trash_meta_' + targetJobId, JSON.stringify({ title, companyName, location }));
        } catch (_) {}
      }

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('job_feedback')
          .insert({
            user_id: userId,
            job_id: targetJobId,
            action: 'REJECTED',
            reason: JSON.stringify({ title, companyName, location })
          });

        if (error && !error.message.includes('duplicate')) {
          console.error('[MOVE TO TRASH ERROR]', error);
        }
      }
      return targetJobId;
    },
    onMutate: async (job) => {
      const targetId = String(job.id);
      await queryClient.cancelQueries({ queryKey: ['job-trash', userId] });
      await queryClient.cancelQueries({ queryKey: ['jobs', userId] });
      await queryClient.cancelQueries({ queryKey: ['matches', userId] });

      const previousJobs = queryClient.getQueryData<Job[]>(['jobs', userId]);
      const previousMatches = queryClient.getQueryData<any[]>(['matches', userId]);
      const previousTrash = queryClient.getQueryData<TrashedJob[]>(['job-trash', userId]);

      // Atualização otimista imediata na interface (0ms delay)
      if (previousJobs) {
        queryClient.setQueryData<Job[]>(['jobs', userId], old => 
          (old || []).filter(j => String(j.id) !== targetId && String((j as any).jobId) !== targetId)
        );
      }

      if (previousMatches) {
        queryClient.setQueryData<any[]>(['matches', userId], old => 
          (old || []).filter(m => String(m.jobId) !== targetId && String(m.job_id) !== targetId)
        );
      }

      if (previousTrash) {
        queryClient.setQueryData<TrashedJob[]>(['job-trash', userId], old => [
          {
            id: targetId,
            jobId: targetId,
            title: (job as any).title || 'Vaga Excluída',
            companyName: (job as any).companyName || 'Empresa',
            location: (job as any).location || 'Brasil',
            deletedAt: new Date().toISOString(),
            originalJob: job as Job
          },
          ...(old || [])
        ]);
      }

      return { previousJobs, previousMatches, previousTrash };
    },
    onError: (_err, _job, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs', userId], context.previousJobs);
      }
      if (context?.previousMatches) {
        queryClient.setQueryData(['matches', userId], context.previousMatches);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(['job-trash', userId], context.previousTrash);
      }
    },
    onSettled: () => {
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

  // 3. Mutation para Excluir Definitivamente (Restrito à associação do usuário, NUNCA apaga a vaga do catálogo nem candidaturas ativas)
  const deletePermanentlyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      const targetId = String(jobId);
      if (isSupabaseConfigured && supabase) {
        // A. Se houver candidatura no Pipeline/Kanban, remover a associação no Pipeline para permitir a exclusão completa confirmada
        await supabase
          .from('applications')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', targetId);

        // B. Apagar registros que representam a associação deste usuário com a vaga (job_feedback, job_matches, matches)
        await supabase
          .from('job_feedback')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', targetId);

        await supabase
          .from('job_matches')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', targetId);

        await supabase
          .from('matches')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', targetId);
      }
      return targetId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-trash', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
    }
  });

  // 4. Esvaziar Lixeira (Excluir Definitivamente associações de todas as vagas na lixeira)
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
          await supabase.from('job_matches').delete().eq('user_id', userId).in('job_id', ids);
          await supabase.from('matches').delete().eq('user_id', userId).in('job_id', ids);
        }
      }

      if (typeof window !== 'undefined') {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vocentro_trash_meta_')) {
              localStorage.removeItem(key);
            }
          }
        } catch (_) {}
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['job-trash', userId], []);
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
