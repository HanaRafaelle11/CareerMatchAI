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
      filters.workModes,
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

      // ── Pós-processamento inteligente e Ordenação das vagas ──
      if (careerProfileNew) {
        const preferences = (careerProfileNew.personal as any)?.preferences || {};
        const targetSeniority = preferences.seniority?.toLowerCase();
        const minSalary = Number(preferences.salaryExpectationMin || 0);
        const preferredWorkModes = preferences.preferredWorkModes || [];
        const preferredLocations = preferences.preferredLocations || [];
        const targetRoles = preferences.targetRoles || [];
        const industries = preferences.industries || [];

        // 1. Filtrar resultados incompatíveis
        let filteredResults = searchResult.results.filter(job => {
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
          const jobMax = job.salaryMax || job.salaryMin;
          if (minSalary > 0 && jobMax) {
            if (jobMax < minSalary * 0.8) {
              return false;
            }
          }

          // C. Filtragem por Modalidade de Trabalho (se houver preferência estrita e remoteOnly marcado)
          if (preferredWorkModes.length > 0) {
            if (preferredWorkModes.includes('remote') && !preferredWorkModes.includes('onsite') && job.workMode === 'onsite') {
              if (filters.remoteOnly) return false;
            }
          }

          if (filters.workModes && filters.workModes.length > 0) {
            const jobMode = job.workMode || 'onsite';
            if (!filters.workModes.includes(jobMode)) {
              return false;
            }
          }

          return true;
        });

        // 2. Ordenação/Priorização Inteligente dos Resultados baseada no Score
        const scoredResults = filteredResults.map(job => {
          let score = 0;
          const jobTitleLower = job.title.toLowerCase();
          const jobDescLower = job.description.toLowerCase();
          const jobLocLower = job.location.toLowerCase();

          // A. Cargo (targetRoles)
          targetRoles.forEach((role: string) => {
            if (jobTitleLower.includes(role.toLowerCase())) {
              score += 15;
            }
          });

          // B. Localização
          preferredLocations.forEach((loc: string) => {
            if (jobLocLower.includes(loc.toLowerCase())) {
              score += 10;
            }
          });

          // C. Modalidade
          if (preferredWorkModes.includes(job.workMode)) {
            score += 8;
          }

          // D. Pretensão Salarial
          const jobMin = job.salaryMin || 0;
          const jobMax = job.salaryMax || jobMin;
          if (minSalary > 0 && jobMin > 0) {
            if (jobMin >= minSalary) {
              score += 10;
            } else if (jobMax >= minSalary) {
              score += 5;
            }
          }

          // E. Senioridade
          if (targetSeniority) {
            if (jobTitleLower.includes(targetSeniority)) {
              score += 8;
            }
          }

          // F. Área de atuação (Industries)
          industries.forEach((ind: string) => {
            if (jobTitleLower.includes(ind.toLowerCase()) || jobDescLower.includes(ind.toLowerCase())) {
              score += 5;
            }
          });

          return { job, score };
        });

        // Ordenar do maior score para o menor
        scoredResults.sort((a, b) => b.score - a.score);
        searchResult.results = scoredResults.map(item => item.job);
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
