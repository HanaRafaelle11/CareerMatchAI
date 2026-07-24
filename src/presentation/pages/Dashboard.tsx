import type { Resume, Match, CareerProfile, Profile, Notification, Application, CareerGoal, Job } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { 
  Sparkles, Award, ArrowRight, Search, Briefcase, 
  ChevronRight, Zap, CheckCircle2, Circle
} from 'lucide-react';
import { StatCard } from '../components/ds';
import { CareerScoreDashboardCard } from '../components/CareerScoreDashboardCard';
import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { AiCreditsWidget } from '../components/AiCreditsWidget';

interface DashboardProps {
  profile: Profile | null;
  resumes: Resume[];
  matches: Match[];
  careerProfile: CareerProfile | null;
  careerProfileNew: CareerProfileNew | null;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<any>;
  setActiveTab: (tab: string) => void;
  applications: Application[];
  careerGoals: CareerGoal[];
  jobs?: Job[];
  setSelectedJobId?: (id: string | null) => void;
}

export function Dashboard({ 
  profile, 
  resumes, 
  matches, 
  careerProfileNew,
  setActiveTab,
  applications = [],
}: DashboardProps) {
  // Activity Heatmap query
  const { data: userActivities = [] } = useQuery({
    queryKey: ['user-activities-heatmap', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const localKey = 'vocentro_activity_logs';
      const localRaw = localStorage.getItem(localKey);
      let localLogs = [];
      if (localRaw) {
        try {
          localLogs = JSON.parse(localRaw);
        } catch (_) {}
      }

      if (!isSupabaseConfigured || !supabase) {
        return localLogs;
      }

      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('event_type, created_at')
          .eq('user_id', profile.id)
          .gte('created_at', new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString());
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('[Dashboard] Error querying activity logs:', err);
        return localLogs;
      }
    },
    enabled: !!profile?.id
  });

  const interviews = applications.filter(a => 
    ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural'].includes(a.status)
  );
  const interviewsCount = interviews.length;

  const targetRole = (careerProfileNew?.personal as any)?.preferences?.targetRoles?.[0] || profile?.headline || 'Desenvolvimento Profissional';

  // Real profile completeness
  const hasResume = resumes.length > 0;
  const linkedinVal = careerProfileNew?.personal?.linkedin;
  const hasLinkedin = !!linkedinVal && 
    typeof linkedinVal === 'string' && 
    linkedinVal.trim().length > 0 && 
    !['n/a', 'na', 'none', 'não informado', 'não consta', 'n-a', 'null', 'undefined', 'n.a.'].includes(linkedinVal.toLowerCase().trim()) && 
    linkedinVal.toLowerCase().includes('linkedin.com');
  const hasSkills = (careerProfileNew?.skills?.length || 0) > 0;
  const hasExperiences = (careerProfileNew?.experience?.length || 0) > 0;
  
  let completeness = 10;
  if (hasResume) completeness += 30;
  if (hasLinkedin) completeness += 20;
  if (hasSkills) completeness += 20;
  if (hasExperiences) completeness += 20;

  // Average match
  const avgMatch = matches.length > 0 
    ? Math.round(matches.reduce((acc, m) => acc + m.scoreOverall, 0) / matches.length) 
    : 92;

  // Contextual recommendation & dynamic CTA button label
  const getAIInsight = () => {
    if (!hasResume) {
      return {
        title: "Envie seu currículo em PDF",
        text: "Seu copiloto precisa do seu currículo em PDF para extrair palavras-chave e traçar seu plano de recolocação.",
        actionLabel: "Atualizar currículo",
        tab: "profile"
      };
    }
    if (matches.length === 0) {
      return {
        title: "Encontramos vagas alinhadas com seu perfil",
        text: "Sua IA já mapeou suas competências! Agora podemos calcular a aderência semântica com oportunidades abertas no mercado.",
        actionLabel: "Encontrar vagas",
        tab: "match"
      };
    }
    if (interviewsCount > 0) {
      return {
        title: "Treine para sua próxima entrevista",
        text: `Você possui ${interviewsCount} processo(s) em fase de entrevista. Simule perguntas comportamentais com a IA.`,
        actionLabel: "Simular entrevista",
        tab: "coach"
      };
    }
    return {
      title: "Adicionar competências recomendadas",
      text: "Seu currículo já está competitivo. Hoje vale focar em aumentar a quantidade de candidaturas qualificadas adicionando palavras-chave de ATS.",
      actionLabel: "Revisar competências",
      tab: "profile"
    };
  };

  const insight = getAIInsight();
  const userName = profile?.fullName?.split(' ')[0] || 'Hana';

  // Daily task checklist (Phase 5.5 - Seu Plano de Hoje)
  const dailyTasks = [
    { id: 1, label: 'Atualizar competências de CRM no currículo', completed: hasSkills, actionTab: 'profile' },
    { id: 2, label: 'Candidatar-se a 2 vagas de alta compatibilidade', completed: applications.length >= 2, actionTab: 'match' },
    { id: 3, label: 'Simular 1 entrevista com método STAR', completed: interviewsCount > 0, actionTab: 'coach' },
  ];
  const completedDailyCount = dailyTasks.filter(t => t.completed).length;

  // Heatmap Data
  const heatmapWeeks = 5;
  const heatmapDaysPerWeek = 7;
  const totalDays = heatmapWeeks * heatmapDaysPerWeek;
  const activityData: number[] = Array.from({ length: totalDays }, () => 0);

  userActivities.forEach((act: any) => {
    try {
      const dateStr = act.created_at || act.timestamp;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      
      const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < totalDays) {
        const idx = (totalDays - 1) - diffDays;
        let weight = 1;
        const type = (act.event_type || '').toLowerCase();
        
        if (['profile_updated', 'preferences_updated'].includes(type)) weight = 1;
        else if (['resume_uploaded', 'resume_created', 'optimization_requested'].includes(type)) weight = 2;
        else if (['application_created', 'simulation_started', 'match_found'].includes(type)) weight = 3;
        
        if (weight > activityData[idx]) activityData[idx] = weight;
      }
    } catch (_) {}
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto mb-16 animate-fade-in font-sans">
      
      {/* ── 1. SAUDAÇÃO HUMANA & BRIEFING DO COPILOTO ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">Olá, {userName} 👋</h1>
          <p className="text-sm text-slate-600 dark:text-[#B8C2CC] mt-1">
            Seu currículo já está competitivo. Hoje vale focar em aumentar a quantidade de candidaturas qualificadas.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">Objetivo atual:</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {targetRole}
            </span>
          </div>
        </div>

        {/* Discreet Action Button (+ Explorar vagas) */}
        <button
          onClick={() => setActiveTab('match')}
          className="btn-secondary text-xs shrink-0 self-start sm:self-auto"
        >
          <Search size={14} strokeWidth={1.5} />
          <span>+ Explorar vagas</span>
        </button>
      </header>

      {/* ── 1.5 PRIMEIRO MOMENTO IA: CAREER SCORE DASHBOARD CARD ── */}
      <CareerScoreDashboardCard
        resume={resumes[0]}
        careerProfileNew={careerProfileNew}
        onExploreJobs={() => setActiveTab('match')}
      />

      {/* ── 2. ESSENTIAL BRIEFING METRICS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8">
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] block">{avgMatch}%</span>
          <span className="text-xs text-slate-500 dark:text-[#B8C2CC]">Compatibilidade média</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8">
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] block">{applications.length}</span>
          <span className="text-xs text-slate-500 dark:text-[#B8C2CC]">Candidaturas ativas</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8">
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] block">{interviewsCount}</span>
          <span className="text-xs text-slate-500 dark:text-[#B8C2CC]">Entrevistas marcadas</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8">
          <span className="text-2xl font-bold text-[#22C7A8] block">+{matches.length || 3}</span>
          <span className="text-xs text-slate-500 dark:text-[#B8C2CC]">Novas vagas compatíveis</span>
        </div>
      </div>

      {/* ── 3. HERO CARD: MATCH SCORE (ESTILO DUOLINGO STREAK) & EDITORIAL AI RECOMMENDATION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HERO CARD MATCH SCORE */}
        <section className="lg:col-span-5 bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Aderência ao Mercado</span>
              <span className="text-xs font-semibold text-[#22C7A8]">Excelente Alinhamento</span>
            </div>

            <div className="my-3">
              <span className="text-5xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight">{avgMatch}%</span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden my-3">
              <div className="bg-[#22C7A8] h-full rounded-full transition-all duration-500" style={{ width: `${avgMatch}%` }} />
            </div>

            <p className="text-xs text-slate-600 dark:text-[#B8C2CC] leading-relaxed mt-2">
              Você está acima de <strong>87% dos candidatos</strong> para vagas de {targetRole}.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('match')}
            className="mt-6 pt-4 border-t border-slate-100 dark:border-white/6 text-xs text-[#4F8EF7] font-medium hover:underline flex items-center justify-between w-full cursor-pointer"
          >
            <span>Ver detalhes do match</span>
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </section>

        {/* CARD EDITORIAL DA IA (SEM BADGES AZUIS REDUNDANTES) */}
        <section className="lg:col-span-7 bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-[#F8FAFC]">
              <Sparkles size={16} className="text-[#4F8EF7]" strokeWidth={1.5} />
              <span className="text-xs font-semibold uppercase tracking-wider">💡 Recomendação da IA</span>
            </div>

            <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] leading-snug">{insight.title}</h2>
            <p className="text-xs text-slate-600 dark:text-[#B8C2CC] leading-relaxed">{insight.text}</p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/6 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Próximo passo recomendado</span>
            <button 
              onClick={() => setActiveTab(insight.tab)}
              className="btn-primary text-xs shrink-0"
            >
              <span>{insight.actionLabel}</span>
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </section>
      </div>

      {/* ── 4. FASE 5.5 — SEU PLANO DE HOJE (DAILY 15-MIN COPILOT TASKLIST) ── */}
      <section className="bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">Seu Plano de Hoje</h3>
            <p className="text-xs text-slate-500 dark:text-[#B8C2CC]">Você precisa de apenas 15 minutos hoje para avançar sua busca.</p>
          </div>
          <span className="text-xs font-semibold text-[#22C7A8] bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
            {completedDailyCount}/3 concluído
          </span>
        </div>

        <div className="space-y-2">
          {dailyTasks.map(task => (
            <div
              key={task.id}
              onClick={() => setActiveTab(task.actionTab)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                task.completed
                  ? 'bg-slate-50/50 dark:bg-white/2 border-slate-200/60 dark:border-white/5 opacity-75'
                  : 'bg-white dark:bg-[#1C2128]/50 border-slate-200 dark:border-white/8 hover:border-[#4F8EF7]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {task.completed ? (
                  <CheckCircle2 size={16} className="text-[#22C7A8] shrink-0" />
                ) : (
                  <Circle size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                )}
                <span className={`text-xs ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-[#F8FAFC]'}`}>
                  {task.label}
                </span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. ESTATÍSTICAS RESUMIDAS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Search size={16} strokeWidth={1.5} />} 
          label="Vagas Analisadas" 
          value={matches.length} 
          trend={{ value: `+${matches.length}`, positive: true }} 
          action={{ label: "Ver vagas", onClick: () => setActiveTab('match') }}
        />
        <StatCard 
          icon={<Briefcase size={16} strokeWidth={1.5} />} 
          label="Processos Ativos" 
          value={applications.length} 
          trend={null}
          accent="secondary"
          action={{ label: "Ver Kanban", onClick: () => setActiveTab('strategy') }}
        />
        <StatCard 
          icon={<Award size={16} strokeWidth={1.5} />} 
          label="Entrevistas Agendadas" 
          value={interviewsCount} 
          trend={interviewsCount > 0 ? { value: `${interviewsCount} ativas`, positive: true } : null}
          accent="success"
          action={{ label: "Treinar STAR", onClick: () => setActiveTab('coach') }}
        />
        <StatCard 
          icon={<Zap size={16} strokeWidth={1.5} />} 
          label="Preenchimento Perfil" 
          value={`${completeness}%`} 
          trend={completeness === 100 ? { value: 'Completo', positive: true } : null} 
          accent="warning"
          action={{ label: "Ajustar perfil", onClick: () => setActiveTab('profile') }}
        />
      </div>

      {/* ── 6. HISTÓRICO DE EVOLUÇÃO & CRÉDITOS DE IA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Atividade Recente */}
        <section className="lg:col-span-7 bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">Constância de Estudos & Candidaturas</h3>
              <p className="text-xs text-slate-500 dark:text-[#B8C2CC]">Atividade registrada nos últimos 30 dias</p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">30 dias</span>
          </div>

          <div className="flex flex-col gap-2 pt-1 overflow-x-auto">
            <div className="flex gap-[4px] min-w-[480px]">
              {Array.from({ length: heatmapWeeks }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[4px]">
                  {Array.from({ length: heatmapDaysPerWeek }).map((_, dayIdx) => {
                    const dataIdx = weekIdx * heatmapDaysPerWeek + dayIdx;
                    const activity = activityData[dataIdx];
                    const colorClass = 
                      activity === 3 ? 'bg-[#4F8EF7]' : 
                      activity === 2 ? 'bg-[#4F8EF7]/60' : 
                      activity === 1 ? 'bg-[#4F8EF7]/20' : 
                      'bg-slate-100 dark:bg-white/5';
                    return (
                      <div 
                        key={dayIdx} 
                        className={`w-3 h-3 rounded-xs transition-all hover:scale-110 cursor-pointer ${colorClass}`}
                        title={`${activity > 0 ? `${activity} atividades` : 'Sem atividade'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 mt-3">
              <span>Menos ativo</span>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-xs bg-slate-100 dark:bg-white/5" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#4F8EF7]/20" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#4F8EF7]/60" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#4F8EF7]" />
              </div>
              <span>Mais ativo</span>
            </div>
          </div>
        </section>

        {/* AI Credits Widget */}
        <section className="lg:col-span-5 flex flex-col">
          <AiCreditsWidget className="flex-1" userId={profile?.id} />
        </section>
      </div>

    </div>
  );
}
