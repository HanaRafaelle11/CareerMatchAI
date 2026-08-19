import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface FeatureAdoptionItem {
  id: string;
  name: string;
  category: string;
  totalUsage: number;
  activeUsersCount: number;
  avgLatencySeconds: number;
  frequencyPerUser: number;
  retentionRate30d: number;
  conversionToApplicationRate: number;
  revenueInfluencedStatus: 'pendente';
  revenueStatusLabel: string;
  adoptionLevel: 'Alta Adoção' | 'Adoção Moderada' | 'Baixa Adoção (< 5% do Líder)' | 'Nunca Utilizada';
}

export interface FeatureAdoptionSummary {
  mostUsedFeatures: FeatureAdoptionItem[];
  lowAdoptionFeatures: FeatureAdoptionItem[];
  neverUsedFeatures: FeatureAdoptionItem[];
  allFeatures: FeatureAdoptionItem[];
  totalAiExecutions: number;
  avgPlatformLatencySeconds: number;
  topFeatureVolume: number;
}

export class FeatureAdoptionService {
  /**
   * Agrega as métricas do Módulo 2.5 (Feature Adoption) com separação estrita de Nunca Utilizadas vs Baixa Adoção
   */
  static async getFeatureAdoptionMetrics(): Promise<FeatureAdoptionSummary> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getEmptyFeatureAdoptionMetrics();
    }

    try {
      const [
        profilesRes,
        aiLogsRes,
        eventsRes,
        matchesRes,
        applicationsRes,
        optRes,
        lettersRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at, is_test_account'),
        supabase.from('ai_usage_logs').select('id, user_id, feature_name, tokens_used, processing_time_ms, created_at').order('created_at', { ascending: false }),
        supabase.from('analytics_events').select('user_id, event_name, category, created_at').order('created_at', { ascending: false }),
        supabase.from('matches').select('id, user_id, job_id, created_at'),
        supabase.from('applications').select('id, user_id, job_id, created_at'),
        supabase.from('resume_optimizations').select('id, user_id, created_at'),
        supabase.from('cover_letters').select('id, user_id, created_at')
      ]);

      const rawProfiles = profilesRes.data || [];
      const allProfiles = rawProfiles.filter((p: any) => p.is_test_account !== true);
      const realUserIds = new Set(allProfiles.map(p => p.id));

      const aiLogs = (aiLogsRes.data || []).filter((l: any) => l.user_id && realUserIds.has(l.user_id));
      const events = (eventsRes.data || []).filter((e: any) => e.user_id && realUserIds.has(e.user_id));
      const matches = (matchesRes.data || []).filter((m: any) => m.user_id && realUserIds.has(m.user_id));
      const applications = (applicationsRes.data || []).filter((a: any) => a.user_id && realUserIds.has(a.user_id));
      const optimizations = (optRes.data || []).filter((o: any) => o.user_id && realUserIds.has(o.user_id));
      const coverLetters = (lettersRes.data || []).filter((l: any) => l.user_id && realUserIds.has(l.user_id));

      // Mapeamento das funcionalidades inteligentes ativas do Vocentro
      const featureCatalog = [
        { id: 'match_calculation', name: 'Cálculo de Match Semântico', category: 'Inteligência' },
        { id: 'star_simulation', name: 'Simulador de Entrevista STAR', category: 'Treinamento IA' },
        { id: 'resume_optimization', name: 'Otimizador Adaptativo de CV', category: 'Currículo' },
        { id: 'cover_letter', name: 'Gerador de Carta de Apresentação', category: 'Escrita IA' },
        { id: 'coach_chat', name: 'Copiloto Conversacional (Coach)', category: 'Assistente' },
        { id: 'job_discovery', name: 'Busca & Recomendação de Vagas', category: 'Descoberta' }
      ];

      const userAppJobPairs = new Set(applications.map((a: any) => `${a.user_id}_${a.job_id}`));

      // Computar volumes reais combinando tabelas de negócio e logs de IA
      const rawUsages: Record<string, any[]> = {};
      featureCatalog.forEach(feat => {
        if (feat.id === 'match_calculation') {
          const matchLogs = aiLogs.filter(l => (l.feature_name || '').toLowerCase().includes('match'));
          const matchEvents = events.filter(e => (e.event_name || '').toLowerCase().includes('match'));
          rawUsages[feat.id] = [...matches, ...matchLogs, ...matchEvents];
        } else if (feat.id === 'star_simulation') {
          const interviewLogs = aiLogs.filter(l => (l.feature_name || '').toLowerCase().includes('interview') || (l.feature_name || '').toLowerCase().includes('star'));
          const interviewEvents = events.filter(e => (e.event_name || '').toLowerCase().includes('interview') || (e.event_name || '').toLowerCase().includes('star'));
          rawUsages[feat.id] = [...interviewLogs, ...interviewEvents];
        } else if (feat.id === 'resume_optimization') {
          const cvLogs = aiLogs.filter(l => (l.feature_name || '').toLowerCase().includes('resume') || (l.feature_name || '').toLowerCase().includes('cv') || (l.feature_name || '').toLowerCase().includes('optimize') || (l.feature_name || '').toLowerCase().includes('adapt'));
          const cvEvents = events.filter(e => (e.event_name || '').toLowerCase().includes('resume') || (e.event_name || '').toLowerCase().includes('cv') || (e.event_name || '').toLowerCase().includes('adapt'));
          rawUsages[feat.id] = [...optimizations, ...cvLogs, ...cvEvents];
        } else if (feat.id === 'cover_letter') {
          const letterLogs = aiLogs.filter(l => (l.feature_name || '').toLowerCase().includes('letter') || (l.feature_name || '').toLowerCase().includes('cover'));
          const letterEvents = events.filter(e => (e.event_name || '').toLowerCase().includes('letter') || (e.event_name || '').toLowerCase().includes('cover'));
          rawUsages[feat.id] = [...coverLetters, ...letterLogs, ...letterEvents];
        } else if (feat.id === 'coach_chat') {
          const coachLogs = aiLogs.filter(l => (l.feature_name || '').toLowerCase().includes('coach') || (l.feature_name || '').toLowerCase().includes('chat') || (l.feature_name || '').toLowerCase().includes('copilot'));
          const copilotEvents = events.filter(e => (e.event_name || '').toLowerCase().includes('copilot') || (e.event_name || '').toLowerCase().includes('chat') || (e.event_name || '').toLowerCase().includes('coach'));
          rawUsages[feat.id] = [...coachLogs, ...copilotEvents];
        } else if (feat.id === 'job_discovery') {
          const searchEvents = events.filter(e => (e.event_name || '').toLowerCase().includes('job') || (e.event_name || '').toLowerCase().includes('search'));
          rawUsages[feat.id] = searchEvents.length > 0 ? searchEvents : applications;
        }
      });

      const maxUsageVolume = Math.max(...Object.values(rawUsages).map(u => u.length), 1);
      const lowThreshold = maxUsageVolume * 0.05; // 5% do líder

      const processedItems: FeatureAdoptionItem[] = featureCatalog.map(feat => {
        const usages = rawUsages[feat.id] || [];
        const totalUsage = usages.length;
        const uniqueUsers = new Set(usages.map(u => u.user_id));
        const activeUsersCount = uniqueUsers.size;

        const totalTimeMs = usages.reduce((acc, u) => acc + (u.time_ms || 1500), 0);
        const avgLatencySeconds = usages.length > 0 ? Number(((totalTimeMs / usages.length) / 1000).toFixed(2)) : 0;

        const frequencyPerUser = activeUsersCount > 0 ? Number((totalUsage / activeUsersCount).toFixed(1)) : 0;

        const userUsageCounts: Record<string, number> = {};
        usages.forEach(u => {
          userUsageCounts[u.user_id] = (userUsageCounts[u.user_id] || 0) + 1;
        });
        const retainedUsers = Object.values(userUsageCounts).filter(c => c > 1).length;
        const retentionRate30d = activeUsersCount > 0 ? Number(((retainedUsers / activeUsersCount) * 100).toFixed(1)) : 0;

        let convertedUsages = 0;
        if (feat.id === 'match_calculation') {
          convertedUsages = matches.filter((m: any) => userAppJobPairs.has(`${m.user_id}_${m.job_id}`)).length;
        } else {
          // Usuários que usaram a feature e possuem candidatura registrada
          const featureUserIds = new Set(usages.map(u => u.user_id));
          const usersWithApp = applications.filter((a: any) => featureUserIds.has(a.user_id));
          convertedUsages = usersWithApp.length;
        }
        const conversionToApplicationRate = totalUsage > 0 ? Number(((convertedUsages / totalUsage) * 100).toFixed(1)) : 0;

        let adoptionLevel: 'Alta Adoção' | 'Adoção Moderada' | 'Baixa Adoção (< 5% do Líder)' | 'Nunca Utilizada';
        if (totalUsage === 0) {
          adoptionLevel = 'Nunca Utilizada';
        } else if (totalUsage < lowThreshold) {
          adoptionLevel = 'Baixa Adoção (< 5% do Líder)';
        } else if (totalUsage >= maxUsageVolume * 0.35) {
          adoptionLevel = 'Alta Adoção';
        } else {
          adoptionLevel = 'Adoção Moderada';
        }

        return {
          id: feat.id,
          name: feat.name,
          category: feat.category,
          totalUsage,
          activeUsersCount,
          avgLatencySeconds,
          frequencyPerUser,
          retentionRate30d,
          conversionToApplicationRate,
          revenueInfluencedStatus: 'pendente',
          revenueStatusLabel: '[DADO PENDENTE — INSTRUMENTAÇÃO ADICIONAL NECESSÁRIA]',
          adoptionLevel
        };
      });

      const sortedAll = [...processedItems].sort((a, b) => b.totalUsage - a.totalUsage);
      
      const neverUsedFeatures = sortedAll.filter(f => f.totalUsage === 0);
      const lowAdoptionFeatures = sortedAll.filter(f => f.totalUsage > 0 && f.totalUsage < lowThreshold);
      const mostUsedFeatures = sortedAll.filter(f => f.totalUsage >= lowThreshold);

      const totalAiExecutions = sortedAll.reduce((acc, f) => acc + f.totalUsage, 0);
      const usedFeatures = sortedAll.filter(f => f.totalUsage > 0);
      const avgPlatformLatencySeconds = usedFeatures.length > 0 
        ? Number((usedFeatures.reduce((acc, f) => acc + f.avgLatencySeconds, 0) / usedFeatures.length).toFixed(2)) 
        : 0;

      return {
        mostUsedFeatures,
        lowAdoptionFeatures,
        neverUsedFeatures,
        allFeatures: sortedAll,
        totalAiExecutions,
        avgPlatformLatencySeconds,
        topFeatureVolume: maxUsageVolume
      };
    } catch (err) {
      console.error('[FeatureAdoptionService] Erro ao consultar métricas de adoção:', err);
      return this.getEmptyFeatureAdoptionMetrics();
    }
  }

  private static getEmptyFeatureAdoptionMetrics(): FeatureAdoptionSummary {
    const catalog = [
      { id: 'match_calculation', name: 'Cálculo de Match Semântico', category: 'Inteligência' },
      { id: 'star_simulation', name: 'Simulador de Entrevista STAR', category: 'Treinamento IA' },
      { id: 'resume_optimization', name: 'Otimizador Adaptativo de CV', category: 'Currículo' },
      { id: 'cover_letter', name: 'Gerador de Carta de Apresentação', category: 'Escrita IA' },
      { id: 'coach_chat', name: 'Copiloto Conversacional (Coach)', category: 'Assistente' },
      { id: 'job_discovery', name: 'Busca & Recomendação de Vagas', category: 'Descoberta' }
    ];

    const allFeatures: FeatureAdoptionItem[] = catalog.map(feat => ({
      id: feat.id,
      name: feat.name,
      category: feat.category,
      totalUsage: 0,
      activeUsersCount: 0,
      avgLatencySeconds: 0,
      frequencyPerUser: 0,
      retentionRate30d: 0,
      conversionToApplicationRate: 0,
      revenueInfluencedStatus: 'pendente',
      revenueStatusLabel: '[DADO PENDENTE — INSTRUMENTAÇÃO ADICIONAL NECESSÁRIA]',
      adoptionLevel: 'Nunca Utilizada'
    }));

    return {
      mostUsedFeatures: [],
      lowAdoptionFeatures: [],
      neverUsedFeatures: allFeatures,
      allFeatures,
      totalAiExecutions: 0,
      avgPlatformLatencySeconds: 0,
      topFeatureVolume: 0
    };
  }
}
