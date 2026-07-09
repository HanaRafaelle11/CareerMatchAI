import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobDiscoveryService } from '../services/jobDiscoveryService';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { Job } from '../../domain/models/types';
import type { JobSearchFilters } from '../../domain/adapters/BaseJobConnector';
import type { CareerProfileNew } from './useMyProfileAi';

export function useJobDiscovery(
  userId: string | undefined, 
  filters: JobSearchFilters,
  careerProfileNew?: CareerProfileNew | null
) {
  const queryClient = useQueryClient();

  const discoveryQuery = useQuery<Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]>({
    queryKey: [
      'job-discovery', 
      userId, 
      filters.keyword, 
      filters.location, 
      filters.remoteOnly, 
      filters.page,
      careerProfileNew?.id
    ],
    queryFn: async () => {
      if (!userId) return [];

      let finalKeywords: string[] = [];
      let finalLocation = filters.location;
      let finalRemoteOnly = filters.remoteOnly;

      // ── Busca Inteligente Baseada no Perfil Consolidado ──
      if (careerProfileNew) {
        const preferences = (careerProfileNew.personal as any)?.preferences || {};

        // 1. Gerar múltiplas palavras-chave/sinônimos dos cargos-alvo
        if (preferences.targetRoles && preferences.targetRoles.length > 0) {
          finalKeywords = [...preferences.targetRoles];
        } else {
          const headline = careerProfileNew.personal?.headline;
          const lastRole = careerProfileNew.experience?.[0]?.role;
          finalKeywords = [headline, lastRole].filter((v): v is string => !!v);
        }

        // Se o usuário digitou uma busca manual, insere como prioridade na lista
        if (filters.keyword) {
          finalKeywords = [filters.keyword, ...finalKeywords.filter(k => k !== filters.keyword)];
        }

        // 2. Otimizar localização (cidade ou país)
        if (!finalLocation) {
          finalLocation = preferences.preferredLocations?.[0] || careerProfileNew.personal?.location || 'Brasil';
        }

        // 3. Mapear modalidade remota
        if (finalRemoteOnly === undefined) {
          finalRemoteOnly = preferences.preferredWorkModes?.includes('remote') ?? true;
        }
      } else {
        // Fallback básico se sem currículo/perfil estruturado
        finalKeywords = [filters.keyword || 'React'];
      }

      // Limitar a no máximo 3 termos paralelos para evitar limites de tráfego
      const keywordsToSearch = finalKeywords.filter(Boolean).slice(0, 3);
      if (keywordsToSearch.length === 0) {
        keywordsToSearch.push('React');
      }

      return jobDiscoveryService.discoverJobs({
        keywords: keywordsToSearch,
        location: finalLocation,
        remoteOnly: finalRemoteOnly,
        page: filters.page || 1
      });
    },
    enabled: !!userId, // Habilitado sempre que o usuário estiver logado
    retry: false // Evita retrying infinito em caso de chaves de API ausentes
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
            requirements: discoveredJob.requirements,
            company_name: discoveredJob.companyName,
            location: discoveredJob.location,
            work_mode: discoveredJob.workMode,
            seniority: discoveredJob.seniority,
            salary_min: discoveredJob.salaryMin,
            salary_max: discoveredJob.salaryMax,
            currency: discoveredJob.currency,
            source_url: discoveredJob.sourceUrl,
            source_platform: discoveredJob.sourcePlatform,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        return {
          id: data.id,
          companyId: data.company_id || 'adzuna',
          companyName: data.company_name,
          title: data.title,
          description: data.description,
          requirements: data.requirements || [],
          location: data.location || 'Brasil',
          workMode: data.work_mode || 'remote',
          seniority: data.seniority || 'pleno',
          salaryMin: data.salary_min || undefined,
          salaryMax: data.salary_max || undefined,
          currency: data.currency || 'BRL',
          sourceUrl: data.source_url || '',
          sourcePlatform: data.source_platform || '',
          isActive: data.is_active
        };
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
      queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
    }
  });

  return {
    discoveredJobs: discoveryQuery.data || [],
    isLoading: discoveryQuery.isLoading,
    isError: discoveryQuery.isError,
    error: discoveryQuery.error,
    importJob: importJobMutation.mutateAsync,
    isImporting: importJobMutation.isPending
  };
}
