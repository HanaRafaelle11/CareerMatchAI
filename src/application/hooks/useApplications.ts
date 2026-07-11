import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import { applicationTrackerService } from '../services/ApplicationTrackerService';
import type { Application, ApplicationStage } from '../../domain/models/types';

export function mapStatusToDb(frontendStatus: string): string {
  switch (frontendStatus) {
    case '🔎 Encontrada': return 'Encontrada';
    case '⭐ Tenho interesse':
    case '📝 Vou me candidatar': return 'Interessante';
    case '📨 Me candidatei':
    case '⏳ Aguardando retorno': return 'Aplicada';
    case '👥 Entrevista com recrutador': return 'Entrevista RH';
    case '🎯 Entrevista com gestor':
    case '🧩 Case técnico':
    case '🤝 Fit cultural': return 'Entrevista Gestor';
    case '🏆 Oferta recebida':
    case '✅ Aceita': return 'Oferta';
    case '❌ Rejeitada': return 'Recusada';
    default: return 'Encontrada';
  }
}

export function mapStatusFromDb(dbStatus: string): Application['status'] {
  switch (dbStatus) {
    case 'Encontrada': return '🔎 Encontrada';
    case 'Interessante': return '⭐ Tenho interesse';
    case 'Aplicada': return '📨 Me candidatei';
    case 'Entrevista RH': return '👥 Entrevista com recrutador';
    case 'Entrevista Gestor': return '🎯 Entrevista com gestor';
    case 'Oferta': return '🏆 Oferta recebida';
    case 'Recusada': return '❌ Rejeitada';
    default: return '🔎 Encontrada';
  }
}

export function useApplications(userId: string | undefined, resumeVersionId?: string | null) {
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery<Application[]>({
    queryKey: ['applications', userId, resumeVersionId],
    queryFn: async () => {
      if (!userId) return [];
      if (isSupabaseConfigured && supabase) {
        let query = supabase
          .from('applications')
          .select('*')
          .eq('user_id', userId);

        if (resumeVersionId) {
          query = query.eq('resume_version_id', resumeVersionId);
        } else {
          query = query.is('resume_version_id', null);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(d => ({
          id: d.id,
          userId: d.user_id,
          jobId: d.job_id || undefined,
          matchId: d.match_id || undefined,
          companyName: d.company_name,
          jobTitle: d.job_title,
          status: mapStatusFromDb(d.status),
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
        const { data, error } = await supabase
          .from('applications')
          .insert({
            user_id: userId,
            job_id: appData.jobId || null,
            match_id: appData.matchId || null,
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
          status: mapStatusFromDb(data.status),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
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
          status: app.status === '❌ Rejeitada' ? 'failed' : 'passed',
          notes: app.status === '❌ Rejeitada' ? `Processo encerrado: ${app.rejectionReason}` : 'Mudança de etapa registrada.',
          stageDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        return saved;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
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
  const getStagesQuery = (appId: string) => {
    return useQuery<ApplicationStage[]>({
      queryKey: ['stages', appId],
      queryFn: () => applicationTrackerService.getStages(appId),
      enabled: !!appId
    });
  };

  const addStageMutation = useMutation({
    mutationFn: async ({ appId, stage }: { appId: string, stage: Omit<ApplicationStage, 'id' | 'createdAt'> }) => {
      return applicationTrackerService.addStage(appId, stage);
    },
    onSuccess: (_, variables) => {
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
    getStagesQuery,
    addStage: addStageMutation.mutateAsync,
    deleteStage: deleteStageMutation.mutateAsync
  };
}
