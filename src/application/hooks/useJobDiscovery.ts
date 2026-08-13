import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JobSearchService } from '../services/JobSearchService';
import { simplifySearchTitle } from '../services/JobOccupationDictionary';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { localDB } from '../../infrastructure/storage/localDatabase';
import type { Job } from '../../domain/models/types';
import type { JobSearchFilters } from '../../domain/adapters/BaseJobConnector';
import type { CareerProfileNew } from './useMyProfileAi';
import { AppError } from '../errors/AppError';
import { calculateJobRelevanceScore } from '../../domain/services/JobRelevanceService';

export function useJobDiscovery(
  userId: string | undefined, 
  filters: JobSearchFilters,
  careerProfileNew?: CareerProfileNew | null
) {
  const queryClient = useQueryClient();

  // Limiar mínimo de vagas — cascata avança se ficar abaixo deste valor
  const MIN_RESULTS_THRESHOLD = 8;

  const discoveryQuery = useQuery<{ results: Omit<Job, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]; count: number }>({
    queryKey: [
      'job-discovery', 
      userId, 
      filters.keyword, 
      filters.location, 
      filters.remoteOnly, 
      filters.workModes,
      filters.seniority,
      filters.page,
      filters.searchTimestamp,
      careerProfileNew?.id,
      (careerProfileNew as any)?.updated_at || (careerProfileNew as any)?.updatedAt,
      careerProfileNew?.personal?.headline,
      careerProfileNew?.experience?.[0]?.role,
      ((careerProfileNew?.personal as any)?.preferences?.targetRoles || []).join(',')
    ],
    queryFn: async () => {
      if (!userId) return { results: [], count: 0 };

      let finalKeywords: string[] = [];
      let finalLocation = filters.location;
      let finalRemoteOnly = filters.remoteOnly;

      // ── Normalização de Localização robusta (aceita nome completo do estado ou sigla) ──
      const normalizeLocationWithUF = (locStr: string): string => {
        if (!locStr) return 'Brasil';
        const clean = locStr.trim();
        if (clean.toLowerCase() === 'brasil' || clean.toLowerCase() === 'remoto') return clean;

        // Mapa de nomes completos de estado → sigla (para tratar formato Adzuna: "Florianópolis, Santa Catarina")
        const stateNameToUF: Record<string, string> = {
          'acre': 'AC', 'alagoas': 'AL', 'amapá': 'AP', 'amapa': 'AP',
          'amazonas': 'AM', 'bahia': 'BA', 'ceará': 'CE', 'ceara': 'CE',
          'distrito federal': 'DF', 'espírito santo': 'ES', 'espirito santo': 'ES',
          'goiás': 'GO', 'goias': 'GO', 'maranhão': 'MA', 'maranhao': 'MA',
          'mato grosso do sul': 'MS', 'mato grosso': 'MT',
          'minas gerais': 'MG', 'pará': 'PA', 'para': 'PA',
          'paraíba': 'PB', 'paraiba': 'PB', 'paraná': 'PR', 'parana': 'PR',
          'pernambuco': 'PE', 'piauí': 'PI', 'piaui': 'PI',
          'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
          'rio grande do sul': 'RS', 'rondônia': 'RO', 'rondonia': 'RO',
          'roraima': 'RR', 'santa catarina': 'SC', 'são paulo': 'SP', 'sao paulo': 'SP',
          'sergipe': 'SE', 'tocantins': 'TO'
        };

        // Extrair cidade e estado (formatos: "Cidade, Estado", "Cidade Estado", "Cidade UF")
        const commaIdx = clean.indexOf(',');
        let city = commaIdx > 0 ? clean.slice(0, commaIdx).trim() : clean;
        let stateHint = commaIdx > 0 ? clean.slice(commaIdx + 1).trim() : '';

        // Verificar se já possui sigla UF de 2 letras ao final
        const ufSuffixMatch = clean.match(/\s+([A-Z]{2})$/i);
        if (ufSuffixMatch) {
          const uf = ufSuffixMatch[1].toUpperCase();
          city = clean.slice(0, clean.lastIndexOf(ufSuffixMatch[0])).trim();
          return `${city} ${uf}`;
        }

        // Converter nome completo de estado para sigla
        if (stateHint) {
          const uf = stateNameToUF[stateHint.toLowerCase()];
          if (uf) return `${city} ${uf}`;
          // Pode já ser uma sigla de 2 letras
          if (/^[A-Z]{2}$/i.test(stateHint)) return `${city} ${stateHint.toUpperCase()}`;
        }

        // Mapeamento de capitais conhecidas
        const cityToUF: Record<string, string> = {
          'são paulo': 'SP', 'sao paulo': 'SP',
          'rio de janeiro': 'RJ', 'belo horizonte': 'MG',
          'curitiba': 'PR', 'porto alegre': 'RS',
          'brasília': 'DF', 'brasilia': 'DF',
          'salvador': 'BA', 'fortaleza': 'CE', 'recife': 'PE',
          'campinas': 'SP', 'guarulhos': 'SP', 'osasco': 'SP',
          'barueri': 'SP', 'santo andré': 'SP', 'santo andre': 'SP',
          'são bernardo do campo': 'SP', 'diadema': 'SP',
          'niterói': 'RJ', 'niteroi': 'RJ',
          'florianópolis': 'SC', 'florianopolis': 'SC',
          'goiânia': 'GO', 'goiania': 'GO',
          'manaus': 'AM', 'belém': 'PA', 'belem': 'PA',
          'macaé': 'RJ', 'macae': 'RJ', 'vitória': 'ES', 'vitoria': 'ES',
          'joinville': 'SC', 'blumenau': 'SC', 'londrina': 'PR', 'maringá': 'PR'
        };

        const cityLower = city.toLowerCase();
        const mappedUF = cityToUF[cityLower];
        if (mappedUF) return `${city} ${mappedUF}`;

        // Último recurso: adicionar SP como fallback se nada mapeou
        return city ? `${city} SP` : 'Brasil';
      };

      // Função auxiliar para normalizar apenas o nome da cidade (sem UF) para comparação
      const extractCityName = (locStr: string): string => {
        if (!locStr) return '';
        return locStr
          .replace(/,.*$/, '')           // remove tudo após vírgula
          .replace(/\s+[A-Z]{2}$/i, '')  // remove sigla UF ao final
          .trim()
          .toLowerCase();
      };

      // ── Busca Inteligente com Cascata de 5 Camadas ──
      let originalKeyword = '';

      if (filters.keyword && filters.keyword.trim()) {
        originalKeyword = filters.keyword.trim();
      } else if (careerProfileNew) {
        const preferences = (careerProfileNew.personal as any)?.preferences || {};
        originalKeyword = preferences.targetRoles?.[0] || careerProfileNew.personal?.headline || careerProfileNew.experience?.[0]?.role || '';
      } else {
        originalKeyword = 'Vagas';
      }

      // Gerar cascata de candidatos ordenados do mais específico ao mais amplo
      finalKeywords = simplifySearchTitle(originalKeyword);
      if (finalKeywords.length === 0) finalKeywords = [originalKeyword || 'Vagas'];

      // Otimizar localização:
      // Se o usuário digitou uma busca manual por palavra-chave (filters.keyword) e deixou a localidade vazia,
      // devemos buscar em todo o 'Brasil' (sem sobrescrever com a cidade do perfil).
      const hasManualKeyword = Boolean(filters.keyword && filters.keyword.trim().length > 0);
      
      if (finalLocation) {
        finalLocation = normalizeLocationWithUF(finalLocation);
      } else if (!hasManualKeyword && careerProfileNew) {
        const preferences = (careerProfileNew.personal as any)?.preferences || {};
        const rawLoc = preferences.preferredLocations?.[0] || careerProfileNew.personal?.location || 'Brasil';
        finalLocation = normalizeLocationWithUF(rawLoc);
      } else {
        finalLocation = 'Brasil';
      }

      if (careerProfileNew && finalRemoteOnly === undefined) {
        const preferences = (careerProfileNew.personal as any)?.preferences || {};
        finalRemoteOnly = preferences.preferredWorkModes?.includes('remote') ?? false;
      }

      // ── Cascata de 5 Camadas com limiar mínimo ──
      let searchResult = { results: [] as any[], count: 0, providerUsed: '' };
      let rawFallbackLevel = 0;
      let fallbackTermUsed = finalKeywords[0] || originalKeyword;

      const runSearch = async (keyword: string, location: string) => {
        return JobSearchService.searchJobs({
          keyword,
          keywords: [keyword],
          location,
          remoteOnly: finalRemoteOnly,
          workModes: filters.workModes,
          seniority: filters.seniority,
          page: filters.page || 1
        });
      };

      // Camada 1: termo literal do currículo/campo de busca
      const layer1Term = finalKeywords[0];
      searchResult = await runSearch(layer1Term, finalLocation) as any;
      fallbackTermUsed = layer1Term;

      // Camadas 2-4: avançar quando resultado abaixo do limiar
      if ((searchResult.results?.length || 0) < MIN_RESULTS_THRESHOLD) {
        for (let i = 1; i < finalKeywords.length; i++) {
          rawFallbackLevel = i;
          const nextResult = await runSearch(finalKeywords[i], finalLocation) as any;
          if ((nextResult.results?.length || 0) >= MIN_RESULTS_THRESHOLD) {
            searchResult = nextResult;
            fallbackTermUsed = finalKeywords[i];
            break;
          }
          // Usar o que tiver mais vagas
          if ((nextResult.results?.length || 0) > (searchResult.results?.length || 0)) {
            searchResult = nextResult;
            fallbackTermUsed = finalKeywords[i];
          }
        }
      }

      // Camada 5: ampliação geográfica (busca em todo o Brasil / remoto)
      if ((searchResult.results?.length || 0) < MIN_RESULTS_THRESHOLD) {
        for (const candidateTerm of finalKeywords) {
          const brazilResult = await runSearch(candidateTerm, 'Brasil') as any;
          if ((brazilResult.results?.length || 0) > (searchResult.results?.length || 0)) {
            searchResult = brazilResult;
            fallbackTermUsed = candidateTerm;
            rawFallbackLevel = 5;
            if ((searchResult.results?.length || 0) >= MIN_RESULTS_THRESHOLD) break;
          }
        }
      }

      // Se mesmo após toda a cascata não houver vagas encontradas (0 resultados), zerar o fallbackLevel para evitar banner falso
      const fallbackLevel = (searchResult.results?.length || 0) > 0 ? Math.min(5, Math.max(0, rawFallbackLevel)) : 0;

      console.log(`[useJobDiscovery] Resultado final: ${searchResult.results?.length} vagas | termo: "${fallbackTermUsed}" | fallbackLevel: ${fallbackLevel}`);

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
          // A. Filtragem por Senioridade explícita dos filtros
          if (filters.seniority && filters.seniority !== 'all') {
            const jobSeniority = (job.seniority || '').toLowerCase();
            const filterSeniority = filters.seniority.toLowerCase();
            const jobTitleLower = job.title.toLowerCase();

            if (filterSeniority === 'junior') {
              if (jobSeniority === 'senior' || jobSeniority === 'lead' || jobSeniority === 'director' ||
                  jobTitleLower.includes('senior') || jobTitleLower.includes('sênior') || jobTitleLower.includes('lead') || jobTitleLower.includes('diretor')) {
                return false;
              }
            } else if (filterSeniority === 'senior') {
              if (jobSeniority === 'junior' || jobTitleLower.includes('junior') || jobTitleLower.includes('júnior') || jobTitleLower.includes('estágio')) {
                return false;
              }
            } else if (jobSeniority && jobSeniority !== filterSeniority && !jobTitleLower.includes(filterSeniority)) {
              return false;
            }
          } else if (targetSeniority && filters.seniority !== 'all') {
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

          // A. Cargo (targetRoles)
          targetRoles.forEach((role: string) => {
            if (jobTitleLower.includes(role.toLowerCase())) {
              score += 15;
            }
          });

          // B. Localização (compara cidade sem UF para tolerar descasamento de formato Adzuna)
          preferredLocations.forEach((loc: string) => {
            const preferredCity = extractCityName(loc);
            const jobCity = extractCityName(job.location);
            if (jobCity && preferredCity && (jobCity.includes(preferredCity) || preferredCity.includes(jobCity))) {
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

          return { job, rawScore: score };
        });

        // Ordenar do maior Relevance Score (Composite 70/20/10) para o menor
        scoredResults.sort((a, b) => {
          const fitA = Math.min(95, Math.max(50, 60 + a.rawScore));
          const fitB = Math.min(95, Math.max(50, 60 + b.rawScore));
          const dateA = (a.job as any).posted_at || (a.job as any).postedAt;
          const dateB = (b.job as any).posted_at || (b.job as any).postedAt;
          const relA = calculateJobRelevanceScore(fitA, (a.job as any).scores?.overall || 85, dateA).relevanceScore;
          const relB = calculateJobRelevanceScore(fitB, (b.job as any).scores?.overall || 85, dateB).relevanceScore;
          return relB - relA;
        });

        searchResult.results = scoredResults.map(item => item.job);
      }

      console.log('[STAGE 4: USE_JOB_DISCOVERY OUTPUT]', JSON.stringify({
        totalCount: searchResult.results.length,
        sampleFirst5: searchResult.results.slice(0, 5).map(j => ({
          title: j.title,
          company: j.companyName,
          provider: j.sourcePlatform,
          sourcePlatform: j.sourcePlatform,
          sources: j.sources,
          sourceUrl: j.sourceUrl,
          redirect_url: (j as any).redirect_url,
          applyUrl: (j as any).applyUrl,
          url: (j as any).url
        }))
      }, null, 2));

      return { ...searchResult, fallbackLevel, fallbackTermUsed };
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
            source_platform: discoveredJob.sourcePlatform || 'JobAggregator',
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
          companyId: discoveredJob.companyId || (data.company_name ? data.company_name.toLowerCase().replace(/\s+/g, '_') : 'aggregator'),
          companyName: data.company_name || 'Empresa Confidencial',
          title: data.title,
          description: data.description,
          requirements: data.requirements || [],
          location: data.location || 'Brasil',
          workMode: data.work_mode || 'remote',
          seniority: discoveredJob.seniority || 'pleno',
          salaryMin: data.salary_numeric || undefined,
          salaryMax: undefined,
          currency: 'BRL',
          sourceUrl: data.source_url || discoveredJob.sourceUrl || '',
          sourcePlatform: data.source_platform || discoveredJob.sourcePlatform || 'JobAggregator',
          sources: discoveredJob.sources,
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
          sources: discoveredJob.sources,
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
    totalCount: discoveryQuery.data?.count || discoveryQuery.data?.results.length || 0,
    totalApiCount: discoveryQuery.data?.count || 0,
    fallbackLevel: (discoveryQuery.data as any)?.fallbackLevel || 0,
    fallbackTermUsed: (discoveryQuery.data as any)?.fallbackTermUsed || '',
    isLoading: discoveryQuery.isLoading,
    isError: discoveryQuery.isError,
    error: discoveryQuery.error,
    importJob: importJobMutation.mutateAsync,
    isImporting: importJobMutation.isPending
  };
}
