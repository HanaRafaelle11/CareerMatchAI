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

  // Limpa residual antigo do localStorage durante essa transição
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

  const getLocalTrashedIds = (): string[] => {
    if (typeof window === 'undefined' || !userId) return [];
    try {
      return JSON.parse(localStorage.getItem(`vocentro_local_trashed_ids_${userId}`) || '[]');
    } catch { return []; }
  };

  const dbTrashedJobs = trashQuery.data || [];
  const dbTrashedIds = new Set(dbTrashedJobs.map(t => String(t.jobId)));
  const localTrashedIds = getLocalTrashedIds();

  const allTrashedJobs = [...dbTrashedJobs];
  for (const id of localTrashedIds) {
    if (!dbTrashedIds.has(id)) {
      let cachedMeta: { title?: string; companyName?: string; location?: string } | null = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('vocentro_trash_meta_' + id);
          if (raw) cachedMeta = JSON.parse(raw);
        } catch (_) {}
      }
      const foundActiveJob = activeJobs.find(j => String(j.id) === id);
      allTrashedJobs.push({
        id,
        jobId: id,
        title: foundActiveJob?.title || cachedMeta?.title || 'Vaga Excluída',
        companyName: foundActiveJob?.companyName || cachedMeta?.companyName || 'Empresa',
        location: foundActiveJob?.location || cachedMeta?.location || 'Brasil',
        deletedAt: new Date().toISOString(),
        originalJob: foundActiveJob
      });
    }
  }

  const trashedJobs = allTrashedJobs;
  const trashedJobIds = new Set(trashedJobs.map(t => String(t.jobId)));

  // 1. Mutation para Mover para a Lixeira (Soft Delete no Banco via job_feedback)
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
          const currentLocal = getLocalTrashedIds();
          localStorage.setItem(`vocentro_local_trashed_ids_${userId}`, JSON.stringify(Array.from(new Set([...currentLocal, targetJobId]))));
        } catch (_) {}
      }

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('job_feedback')
          .insert({
            user_id: userId,
            job_id: targetJobId,
            action: 'REJECTED',
            reason: 'BAD_MATCH'
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

      // Atualização otimista imediata na interface
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

  const isUuid = (id?: string | null): boolean => {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  // 2. Mutation para Restaurar 1 Vaga Individual
  const restoreFromTrashMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      const targetId = String(jobId);

      if (isSupabaseConfigured && supabase && isUuid(userId)) {
        try {
          const { error } = await supabase
            .from('job_feedback')
            .delete()
            .eq('user_id', userId)
            .eq('job_id', targetId)
            .eq('action', 'REJECTED');

          if (error && error.code !== '22P02') {
            console.error('[RESTORE TRASH ERROR]', error);
          }
        } catch (dbErr) {
          console.warn('[RESTORE TRASH] Supabase delete warning:', dbErr);
        }
      }

      // Remover do cache local
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('vocentro_trash_meta_' + targetId);
          const currentLocal = getLocalTrashedIds().filter(id => id !== targetId);
          localStorage.setItem(`vocentro_local_trashed_ids_${userId}`, JSON.stringify(currentLocal));
        } catch (_) {}
      }

      return targetId;
    },
    onSuccess: (targetId) => {
      queryClient.setQueryData<TrashedJob[]>(['job-trash', userId], old => 
        (old || []).filter(item => String(item.id) !== targetId && String(item.jobId) !== targetId)
      );
      queryClient.invalidateQueries({ queryKey: ['job-trash', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
    }
  });

  // 3. Mutation para Restaurar TODAS as Vagas da Lixeira (Bulk Restore)
  const restoreAllFromTrashMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase && isUuid(userId)) {
        try {
          const { error } = await supabase
            .from('job_feedback')
            .delete()
            .eq('user_id', userId)
            .eq('action', 'REJECTED');

          if (error && error.code !== '22P02') {
            console.error('[RESTORE ALL TRASH ERROR]', error);
          }
        } catch (dbErr) {
          console.warn('[RESTORE ALL TRASH] Supabase bulk delete warning:', dbErr);
        }
      }

      // Limpar todos os metadados locais de lixeira
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(`vocentro_local_trashed_ids_${userId}`);
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
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
    }
  });

  // 4. Mutation para Excluir Definitivamente 1 Vaga
  const deletePermanentlyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      const targetId = String(jobId);

      if (isSupabaseConfigured && supabase && isUuid(userId)) {
        try {
          await supabase
            .from('applications')
            .delete()
            .eq('user_id', userId)
            .eq('job_id', targetId);

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
        } catch (dbErr) {
          console.warn('[DELETE PERMANENTLY] Warning:', dbErr);
        }
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('vocentro_trash_meta_' + targetId);
          const currentLocal = getLocalTrashedIds().filter(id => id !== targetId);
          localStorage.setItem(`vocentro_local_trashed_ids_${userId}`, JSON.stringify(currentLocal));
        } catch (_) {}
      }

      return targetId;
    },
    onSuccess: (targetId) => {
      queryClient.setQueryData<TrashedJob[]>(['job-trash', userId], old => 
        (old || []).filter(item => String(item.id) !== targetId && String(item.jobId) !== targetId)
      );
      queryClient.invalidateQueries({ queryKey: ['job-trash', userId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
      queryClient.invalidateQueries({ queryKey: ['matches', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-discovery'] });
    }
  });

  // 5. Mutation para Esvaziar Lixeira (Excluir Definitivamente TODAS as vagas da lixeira)
  const clearTrashMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase && isUuid(userId)) {
        try {
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
        } catch (dbErr) {
          console.warn('[CLEAR TRASH] Warning:', dbErr);
        }
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(`vocentro_local_trashed_ids_${userId}`);
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
    isMovingToTrash: moveToTrashMutation.isPending,
    isRestoring: restoreFromTrashMutation.isPending,
    isRestoringAll: restoreAllFromTrashMutation.isPending,
    isDeletingPermanently: deletePermanentlyMutation.isPending,
    isClearingTrash: clearTrashMutation.isPending,
    moveToTrash: moveToTrashMutation.mutateAsync,
    restoreFromTrash: restoreFromTrashMutation.mutateAsync,
    restoreAllFromTrash: restoreAllFromTrashMutation.mutateAsync,
    removeFromTrash: deletePermanentlyMutation.mutateAsync,
    clearTrash: clearTrashMutation.mutateAsync
  };
}
