import type { Resume, Match, CareerProfile, Profile, Notification, Application, CareerGoal, Job } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { useState, useEffect } from 'react';
import { 
  Sparkles, Award, ArrowRight, Search, Briefcase, 
  ChevronRight, Zap, CheckCircle2, Circle, AlertTriangle, RefreshCw, WifiOff
} from 'lucide-react';
import { StatCard } from '../components/ds';
import { CareerScoreDashboardCard } from '../components/CareerScoreDashboardCard';
import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

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
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function Dashboard({ 
  profile, 
  resumes, 
  matches, 
  careerProfileNew,
  setActiveTab,
  applications = [],
  isLoading = false,
  error = null,
  onRetry
}: DashboardProps) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // ── ESTADO 1: OFFLINE ──
  if (!isOnline) {
    return (
      <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center space-y-4 max-w-xl mx-auto my-12 animate-fade-in">
        <WifiOff size={40} className="mx-auto text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-amber-200">Sem conexão com a internet</h2>
        <p className="text-sm text-slate-600 dark:text-amber-300/80">
          Verifique sua rede para que o Copiloto IA possa atualizar seu Career Score e recomendações de vagas.
        </p>
      </div>
    );
  }

  // ── ESTADO 2: LOADING ──
  if (isLoading) {
    return (
      <div className="space-y-6 w-full max-w-7xl mx-auto p-4 animate-pulse">
        <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── ESTADO 3: ERROR / RETRY ──
  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-center space-y-4 max-w-xl mx-auto my-12 animate-fade-in">
        <AlertTriangle size={40} className="mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-rose-200">Não foi possível carregar seu dashboard</h2>
        <p className="text-sm text-slate-600 dark:text-rose-300/80">{error.message || 'Ocorreu uma falha na comunicação com os serviços do VoCentro.'}</p>
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="btn-primary text-xs mx-auto flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Tentar novamente</span>
          </button>
        )}
      </div>
    );
  }

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

  // Average match da vaga (ou baseline do Career Score)
  const hasMatches = matches.length > 0;
  const baselineScore = hasResume ? Math.min(88, Math.max(72, completeness + 20)) : 0;
  const avgMatch = hasMatches 
    ? Math.round(matches.reduce((acc, m) => acc + m.scoreOverall, 0) / matches.length) 
    : baselineScore;

  // ── 100% DYNAMIC COPILOT IA INSIGHT & CTA DOMINANTE DA HOME ──
  const getAIInsight = () => {
    if (!hasResume) {
      return {
        title: "Envie seu currículo em PDF",
        text: "Seu copiloto precisa do seu currículo em PDF para calcular seu Career Score e traçar seu plano de recolocação.",
        actionLabel: "Fazer Upload do Currículo-Mestre",
        tab: "profile"
      };
    }
    if (matches.length === 0) {
      return {
        title: "Encontramos vagas alinhadas com seu perfil",
        text: "Sua IA já mapeou suas competências! Agora podemos calcular o Match com oportunidades abertas no mercado.",
        actionLabel: "Descobrir Vagas Aderentes",
        tab: "match"
      };
    }
    if (interviewsCount > 0) {
      return {
        title: "Treine para sua próxima entrevista",
        text: `Você possui ${interviewsCount} processo(s) em fase de entrevista. Simule perguntas comportamentais com a IA.`,
        actionLabel: "Iniciar Treino STAR para Entrevistas",
        tab: "coach"
      };
    }
    if (applications.length > 0) {
      return {
        title: "Acompanhe seu progresso de candidaturas",
        text: `Você possui ${applications.length} candidatura(s) ativas. Atualize o status no seu Pipeline para receber orientações.`,
        actionLabel: "Acompanhar seu Pipeline de Candidaturas",
        tab: "strategy"
      };
    }
    return {
      title: "Adicionar competências recomendadas",
      text: "Seu currículo já está competitivo. Hoje vale focar em aumentar a quantidade de candidaturas qualificadas no seu Pipeline.",
      actionLabel: "Revisar Competências no Perfil",
      tab: "profile"
    };
  };

  const insight = getAIInsight();
  const userName = profile?.fullName?.split(' ')[0] || 'Candidato';

  // Daily task checklist (Seu Plano de Hoje)
  const dailyTasks = [
    { id: 1, label: 'Atualizar competências estratégicas no currículo', completed: hasSkills, actionTab: 'profile' },
    { id: 2, label: 'Candidatar-se a 2 vagas de alto Match', completed: applications.length >= 2, actionTab: 'match' },
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
    <div className="space-y-6 w-full max-w-7xl mx-auto mb-16 animate-fade-in font-sans">
      
      {/* ── 1. SAUDAÇÃO HUMANA & BRIEFING DO COPILOTO ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">Olá, {userName} 👋</h1>
          <p className="text-sm text-slate-600 dark:text-[#B8C2CC] mt-1">
            {hasResume 
              ? 'Seu currículo está cadastrado. Acompanhe abaixo seu diagnóstico de Career Score e recomendações.'
              : 'Bem-vindo ao VoCentro! Envie seu currículo para calcular seu Career Score e acessar recomendações personalizadas.'}
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
          onClick={() => {
            localStorage.setItem('vocentro_trigger_discovery', 'true');
            setActiveTab('match');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="btn-secondary text-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Search size={14} strokeWidth={1.5} />
          <span>+ Explorar Vagas</span>
        </button>
      </header>

      {/* ── 2. HERO CARD: CAREER SCORE DASHBOARD CARD ── */}
      <CareerScoreDashboardCard
        resume={resumes[0]}
        careerProfileNew={careerProfileNew}
        onExploreJobs={() => {
          localStorage.setItem('vocentro_trigger_discovery', 'true');
          setActiveTab('match');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* ── 3. METRICAS ESSENCIAIS DA JORNADA (UNIFICADAS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8">
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] block">{avgMatch}%</span>
          <span className="text-xs text-slate-500 dark:text-[#B8C2CC]">Match médio com vagas</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8">
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] block">{applications.length}</span>
          <span className="text-xs text-slate-500 dark:text-[#B8C2CC]">No Pipeline</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8">
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] block">{interviewsCount}</span>
          <span className="text-xs text-slate-500 dark:text-[#B8C2CC]">Entrevistas ativas</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#242B36] border border-slate-200/80 dark:border-white/8">
          <span className="text-2xl font-bold text-[#22C7A8] block">+{matches.length}</span>
          <span className="text-xs text-slate-500 dark:text-[#B8C2CC]">Novas vagas com Match</span>
        </div>
      </div>

      {/* ── 4. ORIENTAÇÃO DO COPILOTO IA (CTA DOMINANTE 100% DINÂMICO) ── */}
      <section className="bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-700 dark:text-[#F8FAFC]">
            <Sparkles size={16} className="text-[#4F8EF7]" strokeWidth={1.5} />
            <span className="text-xs font-semibold uppercase tracking-wider">💡 Orientação do Copiloto IA</span>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] leading-snug">{insight.title}</h2>
          <p className="text-xs text-slate-600 dark:text-[#B8C2CC] leading-relaxed">{insight.text}</p>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/6 flex items-center justify-between gap-4">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Ação imediata sugerida para seu progresso</span>
          <button 
            onClick={() => {
              if (insight.tab === 'match') {
                localStorage.setItem('vocentro_trigger_discovery', 'true');
              }
              setActiveTab(insight.tab);
            }}
            className="btn-primary text-xs shrink-0 cursor-pointer font-semibold"
          >
            <span>{insight.actionLabel}</span>
            <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      {/* ── 5. SEU PLANO DE HOJE (CHECKLIST 15-MIN) ── */}
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

      {/* ── 6. ESTATÍSTICAS RESUMIDAS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Search size={16} strokeWidth={1.5} />} 
          label="Vagas com Match" 
          value={matches.length} 
          trend={{ value: `+${matches.length}`, positive: true }} 
          action={{ label: "Ver vagas", onClick: () => setActiveTab('match') }}
        />
        <StatCard 
          icon={<Briefcase size={16} strokeWidth={1.5} />} 
          label="No Pipeline" 
          value={applications.length} 
          trend={null}
          accent="secondary"
          action={{ label: "Ver Pipeline", onClick: () => setActiveTab('strategy') }}
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
          label="Preenchimento do Perfil" 
          value={`${completeness}%`} 
          trend={completeness === 100 ? { value: 'Completo', positive: true } : null} 
          accent="warning"
          action={{ label: "Ajustar perfil", onClick: () => setActiveTab('profile') }}
        />
      </div>

      {/* ── 7. HISTÓRICO DE CONSTÂNCIA DE ATIVIDADES (HEATMAP) ── */}
      <section className="bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">Constância de Candidaturas & Estudos</h3>
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

    </div>
  );
}

