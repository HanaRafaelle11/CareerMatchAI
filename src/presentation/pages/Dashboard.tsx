import type { Resume, Match, CareerProfile, Profile, Notification, Application, CareerGoal, Job } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import careerInsightsGraph from '../../assets/career_insights_graph.png';
import { 
  Sparkles, Award, ArrowRight, Search, Briefcase, 
  ChevronRight, Zap, ShieldCheck, CheckCircle, Send, MessageSquareText,
  Plus, Megaphone, FileText
} from 'lucide-react';
import { Badge, StatCard } from '../components/ds';
import { VocentroLogo } from '../components/ds/MyCareerIcons';
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
  notifications,
  markNotificationAsRead,
  setActiveTab,
  applications = [],
  jobs = [],
  setSelectedJobId
}: DashboardProps) {
  const unreadNotifications = notifications.filter(n => !n.isRead);

  // ── BUSCAR EVENTOS REAIS DE ATIVIDADE DO USUÁRIO (HEATMAP) ──
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
        console.error('[Dashboard] Error querying activity logs, falling back to local.', err);
        return localLogs;
      }
    },
    enabled: !!profile?.id
  });

  // Filter interviews
  const interviews = applications.filter(a => 
    ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural'].includes(a.status)
  );
  const interviewsCount = interviews.length;

  const trainingSkills = careerProfileNew
    ? (careerProfileNew.ats_keywords?.missing_keywords || []).slice(0, 3)
    : ['Salesforce', 'SQL', 'STAR Method'];

  // Calculate real profile completeness
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

  // Calculate average match
  const avgMatch = matches.length > 0 
    ? Math.round(matches.reduce((acc, m) => acc + m.scoreOverall, 0) / matches.length) 
    : 85;

  // Gamification (Mock level/XP)
  const currentXP = 320 + (applications.length * 50) + (matches.length * 10) + (completeness * 2);
  const level = Math.floor(currentXP / 500) + 1;
  const xpInCurrentLevel = currentXP % 500;
  const xpNeededForNextLevel = 500;
  const xpPercentage = Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);

  // AI recommendations
  const getAIInsight = () => {
    const name = profile?.fullName?.split(' ')[0] || 'Candidato';
    if (!hasResume) {
      return {
        title: "Envie seu currículo",
        text: `Olá, ${name}! Envie seu currículo para que a IA possa mapear suas competências e traçar sua estratégia de recolocação profissional.`,
        actionLabel: "Fazer upload",
        tab: "profile"
      };
    }
    if (matches.length === 0) {
      return {
        title: "Explore vagas recomendadas",
        text: "Sua IA já mapeou seu perfil! Agora, vamos rodar a análise de compatibilidade semântica com vagas de mercado.",
        actionLabel: "Calcular compatibilidade",
        tab: "match"
      };
    }
    if (interviewsCount > 0) {
      return {
        title: "Simule sua entrevista de emprego",
        text: `Você tem ${interviewsCount} entrevista(s) agendada(s). Treine suas respostas baseadas no método STAR com nosso Recrutador IA.`,
        actionLabel: "Iniciar treinamento",
        tab: "coach"
      };
    }
    return {
      title: "Mapeamento de Habilidades",
      text: `Identificamos que adicionar "${trainingSkills[0] || 'STAR Method'}" ao seu perfil pode aumentar sua compatibilidade com vagas em até 18%.`,
      actionLabel: "Refinar Habilidades",
      tab: "profile"
    };
  };

  const insight = getAIInsight();
  const userName = profile?.fullName?.split(' ')[0] || 'Hana';

  // If no resume is uploaded, show the new premium Empty State
  if (resumes.length === 0) {
    return (
      <div className="space-y-lg p-2 max-w-5xl mx-auto animate-fade-in font-sans">
        <header className="flex items-center justify-between gap-md mb-xl">
          <div>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Olá, {userName}! Sua carreira, você no centro.</h2>
            <p className="text-xs text-on-surface-variant mt-1">A plataforma inteligente de evolução profissional está pronta para guiar sua jornada.</p>
          </div>
        </header>

        <div className="premium-card rounded-[20px] p-xl max-w-lg mx-auto text-center flex flex-col items-center justify-center border border-outline-variant/30 bg-surface-container/20">
          <VocentroLogo variant="symbol" className="h-16 w-16 mb-5" />
          <h3 className="text-lg font-bold text-on-surface mb-2 font-display">Primeiro passo da sua jornada</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm mb-6">
            Importe seu currículo em PDF para mapearmos suas competências principais, analisar vagas compatíveis e simular entrevistas.
          </p>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-[14px] shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            <Plus size={16} />
            Importar Currículo
          </button>
        </div>
      </div>
    );
  }

  // Activity heatmap/grid generator (Stripe / GitHub style)
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
        
        if (['profile_updated', 'preferences_updated'].includes(type)) {
          weight = 1;
        } else if (['resume_uploaded', 'resume_created', 'optimization_requested', 'strategy_created'].includes(type)) {
          weight = 2;
        } else if (['application_created', 'simulation_started', 'match_found', 'job_added'].includes(type)) {
          weight = 3;
        }
        
        if (weight > activityData[idx]) {
          activityData[idx] = weight;
        }
      }
    } catch (_) {}
  });

  // Calculate dynamic candidate performance tier based on actual profile completeness
  let rankPercentile = 80;
  let levelName = 'Pendente';
  if (completeness >= 90) {
    rankPercentile = 5;
    levelName = 'Elite Candidate';
  } else if (completeness >= 70) {
    rankPercentile = 18;
    levelName = 'Top Performer';
  } else if (completeness >= 50) {
    rankPercentile = 35;
    levelName = 'Altamente Competitivo';
  } else {
    rankPercentile = 85;
    levelName = 'Iniciante';
  }

  return (
    <div className="space-y-lg p-1 max-w-7xl mx-auto mb-16 animate-fade-in font-sans">
      
      {/* Header / Top Dashboard Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight font-display">Olá, {userName}! Sua carreira, você no centro.</h2>
          <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5" title="Rank estimado com base na taxa de preenchimento do seu currículo e perfil (completo = Elite Candidate)">
            <ShieldCheck size={14} className="text-brand-accent" />
            <span>Seu perfil está classificado como <strong className="text-brand-accent font-semibold">{levelName}</strong> (entre os {rankPercentile}% mais preparados - calculado com base no preenchimento do perfil).</span>
          </p>
        </div>

        {/* Gamification / XP Box */}
        <div className="flex items-center gap-3 p-2 px-3 rounded-[14px] bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-outline-variant/15 shrink-0 max-w-xs">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
            Lvl {level}
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant mb-1">
              <span>Nível do Candidato</span>
              <span>{xpInCurrentLevel}/500 XP</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 dark:bg-slate-950 light:bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-accent rounded-full transition-all duration-500" style={{ width: `${xpPercentage}%` }} />
            </div>
          </div>
        </div>
      </header>
 
      {/* Main Grid: Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        
        {/* Journey/Funnel Card */}
        <section className="lg:col-span-6 premium-card rounded-[20px] p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface font-display">Funil da sua Recolocação</h3>
                <p className="text-[11px] text-on-surface-variant">Taxa de conversão das suas candidaturas</p>
              </div>
              <Badge variant="premium" size="sm">Meta: Conseguir Emprego</Badge>
            </div>
            
            {/* Visual Funnel Indicator */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              {[
                { label: 'CV Mapeado', value: '100%', icon: <CheckCircle size={16} />, color: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20', tabId: 'profile' },
                { label: 'Vagas & Match', value: `${matches.length} vagas`, icon: <Search size={16} />, color: 'text-primary bg-primary/10 border-primary/20', tabId: 'match' },
                { label: 'Candidaturas', value: `${applications.length} ativas`, icon: <Send size={16} />, color: 'text-primary bg-primary/10 border-primary/20', tabId: 'pipeline' },
                { label: 'Entrevistas', value: `${interviewsCount} marcadas`, icon: <MessageSquareText size={16} />, color: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20', tabId: 'coach' },
              ].map((step, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveTab(step.tabId)}
                  className="flex flex-col items-center text-center p-3 rounded-[16px] bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-50 border border-outline-variant/10 hover:scale-[1.01] hover:border-outline-variant/35 hover:bg-slate-900/60 cursor-pointer active:scale-[0.99] transition-all duration-300"
                >
                  <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center mb-2 ${step.color} border shadow-sm`}>
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-medium text-on-surface-variant block leading-tight truncate w-full">{step.label}</span>
                  <span className="text-xs font-bold text-on-surface mt-0.5 block">{step.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-outline-variant/10 pt-4 mt-4 grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-0.5">Completude</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-on-surface">{completeness}%</span>
                <span className="text-[9px] text-brand-accent font-semibold">{completeness === 100 ? 'Máxima' : 'Em progresso'}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-0.5">Entrevistas</span>
              <span className="text-sm font-bold text-on-surface">
                {interviewsCount > 0 ? `${interviewsCount} pendentes` : 'Nenhuma marcada'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-0.5">Match Médio</span>
              <span className="text-sm font-bold text-on-surface">{avgMatch}%</span>
            </div>
          </div>
        </section>

        {/* AI Advisor Insight (Interactive CTA) */}
        <section className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-[20px] p-5 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute -right-12 -top-12 w-36 h-36 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-brand-accent">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Recomendação IA</span>
            </div>
            <h3 className="text-base font-bold text-on-surface leading-snug font-display">{insight.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-normal">{insight.text}</p>
          </div>
          
          <button 
            onClick={() => setActiveTab(insight.tab)}
            className="w-full mt-5 py-3 bg-brand-accent hover:opacity-90 text-slate-955 font-bold rounded-[14px] shadow-sm transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer hover:scale-[1.01]"
          >
            <span>{insight.actionLabel}</span>
            <ArrowRight size={14} />
          </button>
        </section>

        {/* AI Credits & Limits Widget */}
        <section className="lg:col-span-3 flex flex-col">
          <AiCreditsWidget className="flex-1" userId={profile?.id} />
        </section>
      </div>

      {/* Quick Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard 
          icon={<Search size={16} />} 
          label="Matches Encontrados" 
          value={matches.length} 
          trend={{ value: `+${matches.length}`, positive: true }} 
          action={{ label: "Explorar", onClick: () => setActiveTab('match') }}
        />
        <StatCard 
          icon={<Briefcase size={16} />} 
          label="Candidaturas Ativas" 
          value={applications.length} 
          trend={null}
          accent="secondary"
          action={{ label: "Ver pipeline", onClick: () => setActiveTab('pipeline') }}
        />
        <StatCard 
          icon={<Award size={16} />} 
          label="Entrevistas Agendadas" 
          value={interviewsCount} 
          trend={interviewsCount > 0 ? { value: `${interviewsCount} ativas`, positive: true } : null}
          accent="success"
          action={{ label: "Treinar", onClick: () => setActiveTab('coach') }}
        />
        <StatCard 
          icon={<Zap size={16} />} 
          label="Compatibilidade Média" 
          value={matches.length > 0 ? `${avgMatch}%` : '--'} 
          trend={matches.length > 0 ? { value: 'Alta', positive: true } : null} 
          accent="warning"
          action={{ label: "Ver vagas", onClick: () => setActiveTab('match') }}
        />
      </div>

      {/* Bottom Section: Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        
        {/* Activity Heatmap Grid */}
        <section className="lg:col-span-7 premium-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Histórico de Atividade</h3>
              <p className="text-[11px] text-on-surface-variant">Sua consistência na busca de emprego</p>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full border border-outline-variant/10">Últimos 30 dias</span>
          </div>

          <div className="flex flex-col gap-2 pt-1.5 overflow-x-auto">
            {/* Grid display */}
            <div className="flex gap-[3px] min-w-[500px]">
              {Array.from({ length: heatmapWeeks }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {Array.from({ length: heatmapDaysPerWeek }).map((_, dayIdx) => {
                    const dataIdx = weekIdx * heatmapDaysPerWeek + dayIdx;
                    const activity = activityData[dataIdx];
                    const colorClass = 
                      activity === 3 ? 'bg-primary' : 
                      activity === 2 ? 'bg-primary/60' : 
                      activity === 1 ? 'bg-primary/20' : 
                      'bg-surface-container-highest/40';
                    return (
                      <div 
                        key={dayIdx} 
                        className={`w-[11px] h-[11px] rounded-sm transition-all duration-300 hover:scale-125 cursor-pointer ${colorClass}`}
                        title={`${activity > 0 ? `${activity} interações` : 'Nenhuma atividade'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-2 px-1">
              <span>Menos ativos</span>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-surface-container-highest/40" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/20" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              </div>
              <span>Mais ativos</span>
            </div>
          </div>
        </section>

        {/* Dynamic Career Insights */}
        <section className="lg:col-span-5 flex flex-col gap-md">
          <div className="premium-card rounded-2xl p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-on-surface">Métricas Comparativas</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Baseado nas buscas e otimizações de currículos feitas recentemente:
              </p>
              <div className="rounded-xl overflow-hidden relative group h-28 border border-outline-variant/15">
                <img alt="Career insights graph" className="w-full h-full object-cover opacity-60 absolute inset-0 transition-transform duration-700 group-hover:scale-105" src={careerInsightsGraph}/>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent flex items-end p-3">
                  <p className="text-on-surface font-semibold text-xs relative z-10 leading-tight">
                    {resumes.length > 1 || resumes.some(r => !r.isPrimary)
                      ? "Sua atratividade no mercado aumentou 42% após a última otimização de CV."
                      : "Otimize seu currículo e aumente suas chances em até 42%!"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-outline-variant/10 pt-3 mt-3 flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant font-medium">Revisado por IA</span>
              <button 
                onClick={() => setActiveTab('notifications')}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver alertas</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Activity Widgets */}
      <section className="premium-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Eventos Recentes</h3>
            <p className="text-[11px] text-on-surface-variant">Últimas notificações e alertas do Vocentro</p>
          </div>
          <button className="text-xs text-primary font-bold hover:underline cursor-pointer" onClick={() => setActiveTab('notifications')}>Ver todas</button>
        </div>

        <div className="space-y-2">
          {unreadNotifications.length > 0 ? (
            unreadNotifications.slice(0, 3).map(n => (
              <div 
                key={n.id} 
                onClick={() => {
                  markNotificationAsRead(n.id);
                  if (n.type === 'job_alert' || n.title.toLowerCase().includes('vaga') || n.message.toLowerCase().includes('vaga')) {
                    const relatedJob = jobs?.find(j => 
                      n.message.toLowerCase().includes(j.companyName.toLowerCase()) || 
                      n.title.toLowerCase().includes(j.companyName.toLowerCase())
                    );
                    if (relatedJob) {
                      setSelectedJobId?.(relatedJob.id);
                    }
                    setActiveTab('match');
                  } else {
                    setActiveTab('notifications');
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high/60 border border-transparent hover:border-outline-variant/10 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Megaphone size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-on-surface truncate">{n.title}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{n.message}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationAsRead(n.id);
                  }}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Marcar lida
                </button>
              </div>
            ))
          ) : (() => {
            const formatRelativeTime = (dateStr: string) => {
              try {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return '';
                const diffMs = Date.now() - d.getTime();
                const diffMin = Math.floor(diffMs / 60000);
                if (diffMin < 1) return 'Agora';
                if (diffMin < 60) return `${diffMin}m atrás`;
                const diffHours = Math.floor(diffMin / 60);
                if (diffHours < 24) return `${diffHours}h atrás`;
                const diffDays = Math.floor(diffHours / 24);
                if (diffDays === 1) return 'Ontem';
                return `${diffDays}d atrás`;
              } catch {
                return '';
              }
            };
 
            const realEvents: Array<{
              id: string;
              title: string;
              message: string;
              timestamp: string;
              icon: React.ReactNode;
              colorClass: string;
              onClick: () => void;
            }> = [];
 
            resumes.forEach((r) => {
              if (r.createdAt) {
                realEvents.push({
                  id: `resume-${r.id}`,
                  title: "Análise de IA concluída",
                  message: `O currículo "${r.fileName || 'Curriculo.pdf'}" foi estruturado e as palavras-chave ATS foram mapeadas.`,
                  timestamp: r.createdAt,
                  icon: <FileText size={16} />,
                  colorClass: "bg-primary/10 text-primary",
                  onClick: () => setActiveTab('profile')
                });
              }
            });
 
            matches.forEach((m) => {
              if (m.createdAt) {
                realEvents.push({
                  id: `match-${m.id}`,
                  title: "Vaga analisada por IA",
                  message: `Aderência de ${m.scoreOverall}% calculada para ${m.jobTitle} na ${m.companyName}.`,
                  timestamp: m.createdAt,
                  icon: <Search size={16} />,
                  colorClass: "bg-amber-500/10 text-amber-500",
                  onClick: () => setActiveTab('match')
                });
              }
            });
 
            const sortedRealEvents = realEvents
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 3);
 
            if (sortedRealEvents.length > 0) {
              return sortedRealEvents.map(evt => (
                <div 
                  key={evt.id} 
                  onClick={evt.onClick}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high/60 border border-transparent hover:border-outline-variant/10 transition-all cursor-pointer animate-fade-in"
                >
                  <div className={`w-8 h-8 rounded-lg ${evt.colorClass} flex items-center justify-center shrink-0`}>
                    {evt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface truncate">{evt.title}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{evt.message}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant shrink-0 font-medium">
                    {formatRelativeTime(evt.timestamp)}
                  </span>
                </div>
              ));
            }
 
            return (
              <div className="text-center py-6 text-on-surface-variant text-xs border border-dashed border-outline-variant/20 rounded-xl">
                Nenhuma atividade ou notificação recente registrada. Comece enviando seu currículo!
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}

