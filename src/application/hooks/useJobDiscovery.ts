import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobDiscoveryService } from '../services/jobDiscoveryService';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { Job } from '../../domain/models/types';
import type { JobSearchFilters } from '../../domain/adapters/BaseJobConnector';
import type { CareerProfileNew } from './useMyProfileAi';
import { AppError } from '../errors/AppError';

export function useJobDiscovery(
  userId: string | undefined, 
  filters: JobSearchFilters,
  careerProfileNew?: CareerProfileNew | null
) {
  const queryClient = useQueryClient();

  const discoveryQuery = useQuery<{ results: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]; count: number }>({
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
      if (!userId) return { results: [], count: 0 };

      let finalKeywords: string[] = [];
      let finalLocation = filters.location;
      let finalRemoteOnly = filters.remoteOnly;

      // ── Busca Inteligente Baseada no Perfil Consolidado ──
      if (careerProfileNew) {
        const preferences = (careerProfileNew.personal as any)?.preferences || {};

        // 1. Gerar múltiplas palavras-chave/sinônimos dos cargos-alvo
        const targetRoles = preferences.targetRoles || [];
        const searchKeywordsPref = preferences.searchKeywords || [];
        finalKeywords = [...searchKeywordsPref, ...targetRoles];

        if (finalKeywords.length === 0) {
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

      const searchResult = await jobDiscoveryService.discoverJobs({
        keywords: keywordsToSearch,
        location: finalLocation,
        remoteOnly: finalRemoteOnly,
        page: filters.page || 1
      });

      // ── Filtragem Avançada no Frontend baseada nas Preferências do Usuário ──
      if (careerProfileNew) {
        const preferences = (careerProfileNew.personal as any)?.preferences || {};
        const targetSeniority = preferences.seniority?.toLowerCase();
        const minSalary = Number(preferences.salaryExpectationMin || 0);

        searchResult.results = searchResult.results.filter(job => {
          // A. Filtragem por Senioridade
          if (targetSeniority) {
            const jobTitleLower = job.title.toLowerCase();
            
            // Usuário Júnior -> descarta vagas explicitamente Sênior/Lead/Diretor
            if (targetSeniority.includes('júnior') || targetSeniority.includes('junior')) {
              if (jobTitleLower.includes('senior') || jobTitleLower.includes('sênior') || jobTitleLower.includes('lead') || jobTitleLower.includes('diretor') || jobTitleLower.includes('director')) {
                return false;
              }
            }
            // Usuário Sênior/Lead -> descarta vagas Júnior/Estágio
            if (targetSeniority.includes('sênior') || targetSeniority.includes('senior') || targetSeniority.includes('lead')) {
              if (jobTitleLower.includes('junior') || jobTitleLower.includes('júnior') || jobTitleLower.includes('estágio') || jobTitleLower.includes('estagiário')) {
                return false;
              }
            }
          }

          // B. Filtragem por Pretensão Salarial (tolerância de 20% para flexibilidade)
          if (minSalary > 0 && job.salaryMax) {
            if (job.salaryMax < minSalary * 0.8) {
              return false;
            }
          }

          return true;
        });
      }

      return searchResult;
    },
    enabled: !!userId, // Habilitado sempre que o usuário estiver logado
    retry: false, // Evita retrying infinito em caso de chaves de API ausentes
    staleTime: 5 * 60 * 1000, // 5 minutos — evita refetch desnecessário da Adzuna
    meta: {
      onError: (err: any) => {
        AppError.logError(err, supabase, 'useJobDiscovery.discoverJobs', userId);
      }
    }
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
            source_url: discoveredJob.sourceUrl,
            salary: discoveredJob.salaryMin && discoveredJob.salaryMax 
              ? `R$ ${discoveredJob.salaryMin} - R$ ${discoveredJob.salaryMax}`
              : discoveredJob.salaryMin 
                ? `R$ ${discoveredJob.salaryMin}` 
                : null,
            salary_numeric: discoveredJob.salaryMin || null
          })
          .select()
          .single();

        if (error) throw error;
        return {
          id: data.id,
          companyId: 'adzuna',
          companyName: data.company_name || 'Empresa Confidencial',
          title: data.title,
          description: data.description,
          requirements: data.requirements || [],
          location: data.location || 'Brasil',
          workMode: data.work_mode || 'remote',
          seniority: 'pleno',
          salaryMin: data.salary_numeric || undefined,
          salaryMax: undefined,
          currency: 'BRL',
          sourceUrl: data.source_url || '',
          sourcePlatform: 'Adzuna',
          isActive: true
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
    discoveredJobs: discoveryQuery.data?.results || [],
    totalCount: discoveryQuery.data?.count || 0,
    isLoading: discoveryQuery.isLoading,
    isError: discoveryQuery.isError,
    error: discoveryQuery.error,
    importJob: importJobMutation.mutateAsync,
    isImporting: importJobMutation.isPending
  };
}
