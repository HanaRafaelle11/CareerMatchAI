import type { Resume, Match, CareerProfile, Profile, Notification, Application, CareerGoal, Job } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { useState, useEffect, useMemo } from 'react';
import { 
  Award, Search, Briefcase, Trophy,
  ChevronRight, Zap, CheckCircle2, Circle, AlertTriangle, RefreshCw, WifiOff,
  ListTodo
} from 'lucide-react';
import { StatCard } from '../components/ds';
import { CareerScoreDashboardCard } from '../components/CareerScoreDashboardCard';
import { NextStepCard } from '../components/NextStepCard';
import { NextStepService } from '../../domain/services/NextStepService';
import { useCareerGoal } from '../../application/hooks/useCareerGoal';
import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';
import { isAppliedStatus, isSavedStatus, isHiredStatus } from '../../domain/models/applicationStatusConstants';
import { calculateProfileCompleteness } from '../../domain/services/ProfileCompletenessService';
import { tracker } from '../../infrastructure/analytics/tracker';

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
  careerGoals = [],
  setSelectedJobId,
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

  const { goal: liveGoal } = useCareerGoal(profile?.id);

  // ── 1. TODOS OS HOOKS E CÁLCULOS NO TOPO (REGRAS DO REACT) ──
  const nextStepResult = useMemo(() => {
    return NextStepService.getUserNextStep({
      profile,
      careerGoal: liveGoal || (careerGoals && careerGoals.length > 0 ? careerGoals[0] : null),
      careerProfileNew,
      resumes,
      matches,
      applications
    });
  }, [profile, liveGoal, careerGoals, careerProfileNew, resumes, matches, applications]);

  const { primaryAction, secondaryActions } = nextStepResult;
  const userName = profile?.fullName?.split(' ')[0] || 'Candidato';

  // ── ESTADO 1: OFFLINE ──
  if (!isOnline) {
    return (
      <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center space-y-4 max-w-xl mx-auto my-12 animate-fade-in font-sans">
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
      <div className="space-y-6 w-full max-w-7xl mx-auto p-4 animate-pulse font-sans">
        <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
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
      <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-center space-y-4 max-w-xl mx-auto my-12 animate-fade-in font-sans">
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
    ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural', 'hr', 'interview'].includes(a.status)
  );
  const interviewsCount = interviews.length;

  // Métricas de pipeline
  const hiredCount = applications.filter(a => isHiredStatus(a.status)).length;
  const appliedCount = applications.filter(a => isAppliedStatus(a.status)).length;
  const savedCount = applications.filter(a => isSavedStatus(a.status)).length;

  const targetRole = (careerProfileNew?.personal as any)?.preferences?.targetRoles?.[0] || profile?.headline || 'Desenvolvimento Profissional';
  const hasResume = resumes.length > 0;

  // Profile completeness real
  const linkedinVal = careerProfileNew?.personal?.linkedin;
  const hasLinkedin = !!linkedinVal && 
    typeof linkedinVal === 'string' && 
    linkedinVal.trim().length > 0 && 
    !['n/a', 'na', 'none', 'não informado', 'não consta', 'n-a', 'null', 'undefined', 'n.a.'].includes(linkedinVal.toLowerCase().trim()) && 
    linkedinVal.toLowerCase().includes('linkedin.com');
  const hasSkills = (careerProfileNew?.skills?.length || 0) > 0;
  const hasExperiences = (careerProfileNew?.experience?.length || 0) > 0;

  const completenessResult = calculateProfileCompleteness({
    hasResume,
    hasLinkedin,
    hasSkills,
    hasExperiences,
    profile,
    careerProfile: careerProfileNew
  });
  const completeness = completenessResult.score;

  // Average match
  const hasMatches = matches.length > 0;
  const baselineScore = hasResume ? Math.min(88, Math.max(72, completeness + 20)) : 0;
  const avgMatch = hasMatches 
    ? Math.round(matches.reduce((acc, m) => acc + m.scoreOverall, 0) / matches.length) 
    : baselineScore;

  const handleExecuteNextStep = (tab: string, payload?: any) => {
    if (tab === 'match') {
      if (payload?.jobId && setSelectedJobId) {
        setSelectedJobId(payload.jobId);
      } else {
        localStorage.setItem('vocentro_trigger_discovery', 'true');
      }
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Heatmap Data (30 dias)
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

  // Próximas entrevistas ou ações agendadas
  const upcomingActions = applications.filter(a => {
    if (['rejected', 'deleted'].includes(a.status as string)) return false;
    return !!a.nextActionDate || ['hr', 'interview', '👥 Entrevista com recrutador', '🎯 Entrevista com gestor'].includes(a.status);
  });

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto mb-16 animate-fade-in font-sans">
      
      {/* ── CABEÇALHO COM SAUDAÇÃO HUMANA & OBJETIVO ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">Olá, {userName} 👋</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8C2CC] mt-1">
            {hasResume 
              ? 'Seu copiloto de carreira mapeou suas prioridades. Acompanhe a ação recomendada e seu diagnóstico abaixo.'
              : 'Bem-vindo ao VoCentro! Envie seu currículo para calcular seu Career Score e acessar recomendações personalizadas.'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">Objetivo profissional:</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {targetRole}
            </span>
          </div>
        </div>

        {/* Botão de Ação Rápida */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => {
              localStorage.setItem('vocentro_trigger_discovery', 'true');
              setActiveTab('match');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Search size={14} strokeWidth={1.5} />
            <span>+ Explorar Vagas</span>
          </button>
        </div>
      </header>

      {/* ── 1º BLOCO: SEU PRÓXIMO PASSO (HERO DOMINANTE DE AÇÃO CONTEXTUAL) ── */}
      <section aria-label="1. Seu Próximo Passo">
        <NextStepCard 
          action={primaryAction}
          isLoading={isLoading}
          onExecuteAction={handleExecuteNextStep}
        />
      </section>

      {/* ── 2º BLOCO: SEU PROGRESSO (RESUMO NUMÉRICO DO FUNIL) ── */}
      <section aria-label="2. Seu Progresso" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Seu Progresso de Carreira
          </h2>
          <button
            onClick={() => setActiveTab('strategy')}
            className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
          >
            Ver pipeline completo →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Search size={16} strokeWidth={1.5} />} 
            label="Vagas com Match" 
            value={matches.length} 
            trend={{ value: `${avgMatch}% match médio`, positive: true }} 
            action={{ label: "Ver vagas", onClick: () => setActiveTab('match') }}
            isLoading={isLoading}
          />
          <StatCard 
            icon={<Briefcase size={16} strokeWidth={1.5} />} 
            label="Candidaturas Ativas" 
            value={appliedCount} 
            trend={appliedCount > 0 ? { value: `${appliedCount} em progresso`, positive: true } : null}
            accent="secondary"
            action={{ label: "Ver Candidaturas", onClick: () => setActiveTab('strategy') }}
            isLoading={isLoading}
          />
          <StatCard 
            icon={<Award size={16} strokeWidth={1.5} />} 
            label="Entrevistas" 
            value={interviewsCount} 
            trend={interviewsCount > 0 ? { value: `${interviewsCount} ativas`, positive: true } : null} 
            accent="success"
            action={{ label: "Treinar STAR", onClick: () => setActiveTab('coach') }}
            isLoading={isLoading}
          />
          {hiredCount > 0 ? (
            <StatCard 
              icon={<Trophy size={16} strokeWidth={1.5} className="text-amber-400" />} 
              label="Contratado 🏆" 
              value={hiredCount} 
              trend={{ value: `${hiredCount} conquista(s)`, positive: true }} 
              accent="success"
              action={{ label: "Ver Histórico", onClick: () => setActiveTab('strategy') }}
              isLoading={isLoading}
            />
          ) : (
            <StatCard 
              icon={<Zap size={16} strokeWidth={1.5} />} 
              label="Preenchimento do Perfil" 
              value={`${completeness}%`} 
              trend={completeness === 100 ? { value: 'Completo', positive: true } : null} 
              accent="warning"
              action={{ label: "Ajustar perfil", onClick: () => setActiveTab('profile') }}
              isLoading={isLoading}
            />
          )}
        </div>
      </section>


      {/* ── 3º BLOCO: PIPELINE VISUAL (MINI FUNIL DE CANDIDATURAS) ── */}
      <section aria-label="3. Pipeline de Candidaturas" className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 shadow-xs font-sans space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-brand-500/10 text-brand-500 dark:text-brand-400">
              <Briefcase size={16} />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
              Pipeline de Candidaturas
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('strategy')}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Acessar pipeline</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Estágios do Funil */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { label: 'Salvas', count: savedCount, color: 'border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400' },
            { label: 'Candidaturas Enviadas', count: appliedCount, color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400' },
            { label: 'Em Entrevista', count: interviewsCount, color: 'border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400' },
            { label: 'Oferta / Contratado', count: hiredCount, color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' },
          ].map((stage, idx) => (
            <div
              key={idx}
              onClick={() => setActiveTab('strategy')}
              className={`p-3 rounded-xl border ${stage.color} flex flex-col justify-between cursor-pointer hover:opacity-90 transition-opacity`}
            >
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">{stage.label}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{stage.count}</span>
                <span className="text-[10px] font-semibold opacity-75">Ver →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4º BLOCO: AGENDA / PRÓXIMA ENTREVISTA ── */}
      <section aria-label="4. Agenda e Próximas Entrevistas" className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 shadow-xs font-sans space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Award size={16} />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Agenda de Entrevistas & Próximas Ações
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#B8C2CC]">
                Acompanhamento das suas datas e etapas decisivas.
              </p>
            </div>
          </div>
        </div>

        {upcomingActions.length > 0 ? (
          <div className="space-y-2 pt-1">
            {upcomingActions.slice(0, 3).map(app => (
              <div
                key={app.id}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/8 bg-slate-50/50 dark:bg-[#1C2128]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {app.jobTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      · {app.companyName}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-0.5 font-medium">
                    {app.nextAction ? `Próxima ação: ${app.nextAction}` : `Etapa atual: ${app.status}`}
                    {app.nextActionDate && ` (Data: ${new Date(app.nextActionDate).toLocaleDateString('pt-BR')})`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('coach')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    Simular Entrevista
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('strategy')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-white/10 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Ver no Pipeline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhuma entrevista agendada para os próximos dias.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('coach')}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
            >
              Realizar treino preventivo no Simulador STAR →
            </button>
          </div>
        )}
      </section>

      {/* ── SEÇÃO SECUNDÁRIA: DIAGNÓSTICO DE COMPETITIVIDADE (CAREER SCORE) ── */}
      <CareerScoreDashboardCard
        resume={resumes[0]}
        careerProfileNew={careerProfileNew}
        isLoading={isLoading}
        onGoToProfile={() => {
          setActiveTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoToSkills={() => {
          setActiveTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoToExperiences={() => {
          setActiveTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoToPreferences={() => {
          setActiveTab('career-profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onExploreJobs={() => {
          localStorage.setItem('vocentro_trigger_discovery', 'true');
          setActiveTab('match');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* ── SEÇÃO SECUNDÁRIA: ATIVIDADES COMPLEMENTARES E CONSTÂNCIA ── */}
      {secondaryActions && secondaryActions.length > 0 && (
        <details className="group bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-5 sm:p-6 shadow-xs font-sans">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                <ListTodo size={15} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Atividades complementares e constância</h3>
                <p className="text-xs text-slate-500 dark:text-[#B8C2CC]">Ações opcionais e histórico dos últimos 30 dias (clique para expandir)</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-open:rotate-90 transition-transform" />
          </summary>

          <div className="space-y-4 pt-4 mt-2 border-t border-slate-100 dark:border-white/6">
            <div className="space-y-2">
              {secondaryActions.map(sec => (
                <div
                  key={sec.id}
                  onClick={() => {
                    tracker.track('secondary_action_clicked', 'Dashboard', { action_id: sec.id, target_tab: sec.ctaTab });
                    handleExecuteNextStep(sec.ctaTab, sec.actionPayload);
                  }}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-white/8 bg-slate-50/50 dark:bg-[#1C2128]/50 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-[#1C2128] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    {sec.completed ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-brand-500 transition-colors" />
                    )}
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-[#F8FAFC]">
                      {sec.label}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-brand-500 transition-all" />
                </div>
              ))}
            </div>

            {/* Heatmap de Atividades */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/6">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Constância de atividades nos últimos 30 dias:</h4>
              <div className="flex flex-col gap-2 overflow-x-auto">
                <div className="flex gap-[4px] min-w-[340px]">
                  {Array.from({ length: heatmapWeeks }).map((_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-[4px]">
                      {Array.from({ length: heatmapDaysPerWeek }).map((_, dayIdx) => {
                        const dataIdx = weekIdx * heatmapDaysPerWeek + dayIdx;
                        const activity = activityData[dataIdx];
                        const colorClass = 
                          activity === 3 ? 'bg-brand-500' : 
                          activity === 2 ? 'bg-brand-500/60' : 
                          activity === 1 ? 'bg-brand-500/20' : 
                          'bg-slate-100 dark:bg-white/5';
                        return (
                          <div 
                            key={dayIdx} 
                            className={`w-3 h-3 rounded-xs transition-all hover:scale-110 cursor-pointer ${colorClass}`}
                            title={`${activity > 0 ? `${activity} atividade(s)` : 'Sem atividade registrada'}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </details>
      )}

    </div>
  );
}
