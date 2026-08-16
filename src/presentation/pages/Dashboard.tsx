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

  // ── 1. TODOS OS HOOKS E CÁLCULOS NO TOPO (REGRAS DO REACT) ──
  const nextStepResult = useMemo(() => {
    return NextStepService.getUserNextStep({
      profile,
      careerProfileNew,
      resumes,
      matches,
      applications
    });
  }, [profile, careerProfileNew, resumes, matches, applications]);

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

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto mb-16 animate-fade-in font-sans">
      
      {/* ── 1. SAUDAÇÃO HUMANA & OBJETIVO ── */}
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

        {/* Action Button (+ Explorar vagas) */}
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

      {/* ── 2. SEU PRÓXIMO PASSO (HERO DOMINANTE DE AÇÃO CONTEXTUAL) ── */}
      <NextStepCard 
        action={primaryAction}
        isLoading={isLoading}
        onExecuteAction={handleExecuteNextStep}
      />

      {/* ── 3. CAREER SCORE (DIAGNÓSTICO DE COMPETITIVIDADE) ── */}
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

      {/* ── 4. MÉTRICAS CONSOLIDADAS DA JORNADA ── */}
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
          action={{ label: "Ver Pipeline", onClick: () => setActiveTab('strategy') }}
          isLoading={isLoading}
        />
        <StatCard 
          icon={<Search size={16} strokeWidth={1.5} />} 
          label="Vagas Salvas" 
          value={savedCount} 
          trend={savedCount > 0 ? { value: `${savedCount} em prospecção`, positive: false } : null}
          action={{ label: "Ver Salvas", onClick: () => setActiveTab('strategy') }}
          isLoading={isLoading}
        />
        {hiredCount > 0 ? (
          <StatCard 
            icon={<Trophy size={16} strokeWidth={1.5} className="text-amber-400" />} 
            label="Contratado 🏆" 
            value={hiredCount} 
            trend={{ value: `${hiredCount} conquista(s)`, positive: true }} 
            accent="success"
            action={{ label: "Ver Pipeline", onClick: () => setActiveTab('strategy') }}
            isLoading={isLoading}
          />
        ) : interviewsCount > 0 ? (
          <StatCard 
            icon={<Award size={16} strokeWidth={1.5} />} 
            label="Entrevistas" 
            value={interviewsCount} 
            trend={{ value: `${interviewsCount} ativas`, positive: true }} 
            accent="success"
            action={{ label: "Treinar STAR", onClick: () => setActiveTab('coach') }}
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

      {/* ── 5. TAMBÉM PODE FAZER HOJE (AÇÕES SECUNDÁRIAS NÃO CONFLITANTES) ── */}
      {secondaryActions && secondaryActions.length > 0 && (
        <section className="bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-5 sm:p-6 shadow-xs font-sans">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                <ListTodo size={15} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">Também pode fazer hoje</h3>
                <p className="text-xs text-slate-500 dark:text-[#B8C2CC]">Ações complementares para impulsionar sua busca sem sobrecarga.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-3">
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
        </section>
      )}

      {/* ── 6. HISTÓRICO DE CONSTÂNCIA DE ATIVIDADES (HEATMAP) ── */}
      <section className="bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 rounded-2xl p-5 sm:p-6 shadow-xs font-sans">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">Constância de Candidaturas & Atividades</h3>
            <p className="text-xs text-slate-500 dark:text-[#B8C2CC]">Registro de atividade dos últimos 30 dias</p>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200/50 dark:border-white/5">
            Últimos 30 dias
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1 overflow-x-auto">
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

          <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 mt-3">
            <span>Menos ativo</span>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-xs bg-slate-100 dark:bg-white/5" />
              <div className="w-2.5 h-2.5 rounded-xs bg-brand-500/20" />
              <div className="w-2.5 h-2.5 rounded-xs bg-brand-500/60" />
              <div className="w-2.5 h-2.5 rounded-xs bg-brand-500" />
            </div>
            <span>Mais ativo</span>
          </div>
        </div>
      </section>

    </div>
  );
}
