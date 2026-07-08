import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobDiscoveryService } from '../services/jobDiscoveryService';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { Job } from '../../domain/models/types';
import type { JobSearchFilters } from '../../domain/adapters/BaseJobConnector';

export function useJobDiscovery(userId: string | undefined, filters: JobSearchFilters) {
  const queryClient = useQueryClient();

  const discoveryQuery = useQuery<Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]>({
    queryKey: ['job-discovery', userId, filters.keyword, filters.location, filters.remoteOnly],
    queryFn: async () => {
      if (!userId) return [];
      return jobDiscoveryService.discoverJobs(filters);
    },
    enabled: !!userId && !!filters.keyword,
  });

  const importJobMutation = useMutation({
    mutationFn: async (discoveredJob: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('jobs')
          .insert({
            user_id: userId,
            title: discoveredJob.title,
            description: discoveredJob.description,
            requirements: discoveredJob.requirements
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const newJob: Job = {
          id: `job-imported-${Date.now()}`,
          companyId: discoveredJob.companyId,
          companyName: discoveredJob.companyName,
          companyLogo: discoveredJob.companyLogo,
          title: discoveredJob.title,
          description: discoveredJob.description,
          requirements: discoveredJob.requirements,
          location: discoveredJob.location,
          workMode: discoveredJob.workMode,
          seniority: discoveredJob.seniority,
          salaryMin: discoveredJob.salaryMin,
          salaryMax: discoveredJob.salaryMax,
          currency: discoveredJob.currency,
          sourceUrl: discoveredJob.sourceUrl,
          sourcePlatform: discoveredJob.sourcePlatform,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return localDB.saveJob(newJob);
      }
    },
    onSuccess: () => {
      // Invalida a query de vagas do usuário para carregar na lista principal
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
    }
  });

  return {
    discoveredJobs: discoveryQuery.data || [],
    isLoading: discoveryQuery.isLoading,
    isError: discoveryQuery.isError,
    importJob: importJobMutation.mutateAsync,
    isImporting: importJobMutation.isPending
  };
}
