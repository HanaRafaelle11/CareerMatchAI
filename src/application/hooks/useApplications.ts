import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { tracker } from '../../infrastructure/analytics/tracker';
import { applicationTrackerService } from '../services/ApplicationTrackerService';
import type { Application, ApplicationStage, ApplicationStatus } from '../../domain/models/types';

export function mapStatusToDb(frontendStatus: string): ApplicationStatus {
  switch (frontendStatus) {
    case 'found':
    case '🔎 Encontrada':
    case 'Encontrada':
    case '🔧 Ajustar antes':
      return '🔎 Encontrada' as ApplicationStatus;

    case 'saved':
    case '⭐ Tenho interesse':
    case 'Interessante':
    case '🎯 Alta Prioridade':
      return '⭐ Tenho interesse' as ApplicationStatus;

    case '🕐 Candidatura em andamento':
    case 'in_progress':
      return '🕐 Candidatura em andamento' as ApplicationStatus;

    case 'applied':
    case '📨 Me candidatei':
    case '📝 Vou me candidatar':
    case '📝 Candidatura planejada':
    case 'Aplicada':
      return '📨 Me candidatei' as ApplicationStatus;

    case 'hr':
    case '👥 Entrevista com recrutador':
    case '👥 Entrevista RH':
    case 'Entrevista RH':
      return '👥 Entrevista com recrutador' as ApplicationStatus;

    case 'interview':
    case '🎯 Entrevista com gestor':
    case '🎯 Entrevista Gestor':
    case '🧩 Case técnico':
    case '🤝 Fit cultural':
    case 'Entrevista Gestor':
      return '🎯 Entrevista com gestor' as ApplicationStatus;

    case 'offer':
    case '🏆 Oferta recebida':
    case 'Oferta':
      return '🏆 Oferta recebida' as ApplicationStatus;

    case 'hired':
    case '✅ Aceita':
    case 'Contratado':
      return '✅ Aceita' as ApplicationStatus;

    case 'rejected':
    case '❌ Rejeitada':
    case '🚫 Fora do meu objetivo':
    case '👻 Sem resposta':
    case 'Recusada':
      return '❌ Rejeitada' as ApplicationStatus;

    default:
      return '🔎 Encontrada' as ApplicationStatus;
  }
}

export function mapStatusFromDb(dbStatus: string): string {
  switch (dbStatus) {
    case 'found':
    case '🔎 Encontrada':
    case 'Encontrada':
      return '🔎 Encontrada';

    case 'saved':
    case '⭐ Tenho interesse':
    case 'Interessante':
      return '⭐ Tenho interesse';

    case '🕐 Candidatura em andamento':
    case 'in_progress':
      return '🕐 Candidatura em andamento';

    case 'applied':
    case '📨 Me candidatei':
    case 'Aplicada':
      return '📨 Me candidatei';

    case 'hr':
    case '👥 Entrevista com recrutador':
    case '👥 Entrevista RH':
      return '👥 Entrevista RH';

    case 'interview':
    case '🎯 Entrevista com gestor':
    case '🎯 Entrevista Gestor':
      return '🎯 Entrevista Gestor';

    case 'offer':
    case '🏆 Oferta recebida':
      return '🏆 Oferta recebida';

    case 'hired':
    case '✅ Aceita':
      return '✅ Aceita';

    case 'rejected':
    case '❌ Rejeitada':
    case '🚫 Fora do meu objetivo':
      return '❌ Rejeitada';

    default:
      return '🔎 Encontrada';
  }
}

export function useApplications(userId: string | undefined, resumeVersionId?: string | null) {
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery<Application[]>({
    queryKey: ['applications', userId],
    queryFn: async () => {
      if (!userId) return [];
      if (isSupabaseConfigured && supabase) {
        let query = supabase
          .from('applications')
          .select('*')
          .eq('user_id', userId);

        // Do NOT filter by resume_version_id — saved/applied jobs must always be visible
        // regardless of which resume version is currently selected

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(d => ({
          id: d.id,
          userId: d.user_id,
          jobId: d.job_id || undefined,
          matchId: d.match_id || undefined,
          companyName: d.company_name,
          jobTitle: d.job_title,
          status: mapStatusFromDb(d.status) as ApplicationStatus,
          rejectionReason: d.rejection_reason || undefined,
          sourcePlatform: d.source_platform || undefined,
          resumeVersionId: d.resume_version_id || undefined,
          notes: d.notes || undefined,
          appliedAt: d.applied_at || undefined,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        }));
      } else {
        const all = localDB.getApplications();
        if (resumeVersionId) {
          return all.filter(a => a.resumeVersionId === resumeVersionId);
        }
        return all;
      }
    },
    enabled: !!userId,
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (appData: Omit<Application, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase) {
        const isUuid = (val?: string | null) => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const safeJobId = isUuid(appData.jobId) ? appData.jobId : null;
        const safeMatchId = isUuid(appData.matchId) ? appData.matchId : null;

        const { data, error } = await supabase
          .from('applications')
          .insert({
            user_id: userId,
            job_id: safeJobId,
            match_id: safeMatchId,
            company_name: appData.companyName,
            job_title: appData.jobTitle,
            status: mapStatusToDb(appData.status),
            rejection_reason: appData.rejectionReason || null,
            source_platform: appData.sourcePlatform || null,
            resume_version_id: appData.resumeVersionId || resumeVersionId || null,
            notes: appData.notes || null,
            applied_at: appData.appliedAt || null
          })
          .select()
          .single();

        if (error) throw error;
        return {
          id: data.id,
          userId: data.user_id,
          jobId: data.job_id || undefined,
          matchId: data.match_id || undefined,
          companyName: data.company_name,
          jobTitle: data.job_title,
          status: mapStatusFromDb(data.status) as ApplicationStatus,
          rejectionReason: data.rejection_reason || undefined,
          sourcePlatform: data.source_platform || undefined,
          resumeVersionId: data.resume_version_id || undefined,
          notes: data.notes || undefined,
          appliedAt: data.applied_at || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      } else {
        const newApp: Application = {
          id: `app-${Date.now()}`,
          userId,
          resumeVersionId: appData.resumeVersionId || resumeVersionId || undefined,
          ...appData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        // Auto-cria estágio inicial localmente
        const saved = localDB.saveApplication(newApp);
        localDB.saveApplicationStage({
          id: `stage-${Date.now()}`,
          applicationId: saved.id,
          stageName: newApp.status,
          status: 'passed',
          notes: 'Status registrado inicial do processo.',
          stageDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        return saved;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      if (data.status === 'applied') {
        tracker.track('job_applied', 'applications');
      } else {
        tracker.track('job_saved', 'applications');
      }
    }
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async (app: Application) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('applications')
          .update({
            status: mapStatusToDb(app.status),
            rejection_reason: app.rejectionReason || null,
            source_platform: app.sourcePlatform || null,
            notes: app.notes || null,
            applied_at: app.appliedAt || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', app.id);

        if (error) throw error;
        return app;
      } else {
        const saved = localDB.saveApplication(app);
        // Regista mudança na timeline automaticamente se for local
        localDB.saveApplicationStage({
          id: `stage-${Date.now()}`,
          applicationId: saved.id,
          stageName: app.status,
          status: app.status === 'rejected' ? 'failed' : 'passed',
          notes: app.status === 'rejected' ? `Processo encerrado: ${app.rejectionReason}` : 'Mudança de etapa registrada.',
          stageDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        return saved;
      }
    },
    onMutate: async (updatedApp: Application) => {
      await queryClient.cancelQueries({ queryKey: ['applications', userId] });
      const previousApps = queryClient.getQueryData<Application[]>(['applications', userId]);

      queryClient.setQueryData<Application[]>(['applications', userId], old => {
        if (!old) return [updatedApp];
        return old.map(a => a.id === updatedApp.id ? { ...a, ...updatedApp } : a);
      });

      return { previousApps };
    },
    onError: (_err, _updatedApp, context) => {
      if (context?.previousApps) {
        queryClient.setQueryData(['applications', userId], context.previousApps);
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
      if (data?.status === 'applied') {
        tracker.track('job_applied', 'applications');
      }
    }
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: async (appId: string) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('applications')
          .delete()
          .eq('id', appId);

        if (error) throw error;
      } else {
        localDB.deleteApplication(appId);
      }
      return appId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
    }
  });

  // Queries e Mutações de Estágios (timeline)
  const useStagesQuery = (appId: string) => {
    return useQuery<ApplicationStage[]>({
      queryKey: ['stages', appId],
      queryFn: () => applicationTrackerService.getStages(appId),
      enabled: !!appId && appId.trim().length > 0
    });
  };

  const addStageMutation = useMutation({
    mutationFn: async ({ appId, stage }: { appId: string, stage: Omit<ApplicationStage, 'id' | 'createdAt'> }) => {
      return applicationTrackerService.addStage(appId, stage);
    },
    onMutate: async ({ appId, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['stages', appId] });
      const previousStages = queryClient.getQueryData<ApplicationStage[]>(['stages', appId]);

      const tempStage: ApplicationStage = {
        id: `temp-${Date.now()}`,
        applicationId: appId,
        stageName: stage.stageName,
        status: stage.status,
        notes: stage.notes,
        stageDate: stage.stageDate || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      queryClient.setQueryData<ApplicationStage[]>(['stages', appId], old => [...(old || []), tempStage]);

      return { previousStages };
    },
    onError: (_err, variables, context) => {
      if (context?.previousStages) {
        queryClient.setQueryData(['stages', variables.appId], context.previousStages);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stages', variables.appId] });
    }
  });

  const deleteStageMutation = useMutation({
    mutationFn: async ({ appId: _appId, stageId }: { appId: string, stageId: string }) => {
      return applicationTrackerService.deleteStage(stageId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stages', variables.appId] });
    }
  });

  return {
    applications: applicationsQuery.data || [],
    isLoading: applicationsQuery.isLoading,
    createApplication: createApplicationMutation.mutateAsync,
    isCreating: createApplicationMutation.isPending,
    updateApplication: updateApplicationMutation.mutateAsync,
    isUpdating: updateApplicationMutation.isPending,
    deleteApplication: deleteApplicationMutation.mutateAsync,
    
    // Stages helpers expostos
    useStagesQuery,
    addStage: addStageMutation.mutateAsync,
    deleteStage: deleteStageMutation.mutateAsync
  };
}
