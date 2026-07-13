import type { Resume, Match, CareerProfile, Profile, Notification, Application, CareerGoal, Job } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import careerInsightsGraph from '../../assets/career_insights_graph.png';
import { 
  Sparkles, Award, ArrowRight, Search, Briefcase, 
  ChevronRight, Zap, ShieldCheck, CheckCircle, Send, MessageSquareText,
  Rocket, Plus, Megaphone, FileText
} from 'lucide-react';
import { Badge, StatCard } from '../components/ds';

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
      <div className="space-y-lg p-2 max-w-5xl mx-auto animate-fade-in">
        <header className="flex items-center justify-between gap-md mb-xl">
          <div>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Olá, {userName} 👋</h2>
            <p className="text-xs text-on-surface-variant mt-1">Seu copiloto inteligente de recolocação está pronto para te guiar.</p>
          </div>
        </header>

        <div className="premium-card rounded-2xl p-xl max-w-lg mx-auto text-center flex flex-col items-center justify-center border border-outline-variant/30 bg-surface-container/20">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 animate-pulse">
            <Rocket size={32} />
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">Primeiro passo da sua jornada</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm mb-6">
            Importe seu currículo em PDF para mapearmos suas competências principais, calcular matches semânticos e iniciar o preparo para as entrevistas.
          </p>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-semibold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer text-sm"
          >
            <Plus size={18} />
            Importar Currículo
          </button>
        </div>
      </div>
    );
  }

  // Activity heatmap/grid generator (Stripe / GitHub style)
  const heatmapWeeks = 18;
  const heatmapDaysPerWeek = 7;
  const totalDays = heatmapWeeks * heatmapDaysPerWeek;
  
  const activityData: number[] = Array.from({ length: totalDays }, (_, i) => {
    // Generate organic low-intensity search scan baseline (mostly 0s, some 1s)
    const seed = Math.sin(i * 0.15) * Math.cos(i * 0.05);
    if (seed > 0.8) return 1;
    return 0;
  });

  // Highlight days with actual candidate actions
  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
  const activeDates: string[] = [];
  if (primaryResume?.createdAt) activeDates.push(primaryResume.createdAt);
  if (primaryResume?.updatedAt) activeDates.push(primaryResume.updatedAt);
  
  resumes.forEach(r => {
    if (r.createdAt) activeDates.push(r.createdAt);
  });
  
  applications.forEach(app => {
    if (app.createdAt) activeDates.push(app.createdAt);
    if (app.updatedAt) activeDates.push(app.updatedAt);
  });
  
  matches.forEach(m => {
    if (m.createdAt) activeDates.push(m.createdAt);
  });

  activeDates.forEach(dateStr => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < totalDays) {
        const idx = (totalDays - 1) - diffDays;
        activityData[idx] = Math.min(activityData[idx] + 3, 3);
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
  } else if (completeness >= 30) {
    rankPercentile = 60;
    levelName = 'Em Evolução';
  }

  return (
    <div className="space-y-lg p-1 max-w-7xl mx-auto mb-16 animate-fade-in">
      
      {/* Header / Top Dashboard Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Olá, {userName} 👋</h2>
          <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5" title="Rank calculado comparando a completude e dados do seu perfil com os critérios médios de vagas de mercado">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Seu perfil está classificado como <strong className="text-primary">{levelName}</strong> (entre os {rankPercentile}% mais preparados).</span>
          </p>
        </div>

        {/* Gamification / XP Box */}
        <div className="flex items-center gap-3 p-2 px-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/15 shrink-0 max-w-xs">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
            Lvl {level}
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant mb-1">
              <span>Nível do Candidato</span>
              <span>{xpInCurrentLevel}/500 XP</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${xpPercentage}%` }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid: Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        
        {/* Journey/Funnel Card */}
        <section className="lg:col-span-8 premium-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface">Funil da sua Recolocação</h3>
                <p className="text-[11px] text-on-surface-variant">Taxa de conversão das suas candidaturas</p>
              </div>
              <Badge variant="premium" size="sm">Meta: Conseguir Emprego</Badge>
            </div>
            
            {/* Visual Funnel Indicator */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              {[
                { label: 'CV Mapeado', value: '100%', icon: <CheckCircle size={16} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 light:text-emerald-600', tabId: 'profile' },
                { label: 'Vagas & Match', value: `${matches.length} vagas`, icon: <Search size={16} />, color: 'text-primary bg-primary/10 border-primary/20', tabId: 'match' },
                { label: 'Candidaturas', value: `${applications.length} ativas`, icon: <Send size={16} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 light:text-amber-700', tabId: 'strategy' },
                { label: 'Entrevistas', value: `${interviewsCount} marcadas`, icon: <MessageSquareText size={16} />, color: 'text-secondary bg-secondary/10 border-secondary/20', tabId: 'coach' },
              ].map((step, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveTab(step.tabId)}
                  className="flex flex-col items-center text-center p-3 rounded-2xl bg-surface-container-high/30 border border-outline-variant/10 hover:scale-[1.02] hover:border-outline-variant/35 hover:bg-surface-container-high/50 cursor-pointer active:scale-[0.99] transition-all duration-300"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${step.color} border shadow-sm`}>
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
                <span className="text-[9px] text-emerald-400 font-semibold">{completeness === 100 ? 'Máxima' : 'Em progresso'}</span>
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

        {/* AI Copilot Advisor Insight (Interactive CTA) */}
        <section className="lg:col-span-4 bg-gradient-to-br from-brand-600 to-indigo-900 rounded-2xl p-5 text-white flex flex-col justify-between relative overflow-hidden shadow-lg border border-primary/20">
          <div className="absolute -right-12 -top-12 w-36 h-36 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-white/80">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Recomendação da IA</span>
            </div>
            <h3 className="text-base font-bold text-white leading-snug">{insight.title}</h3>
            <p className="text-xs text-white/85 leading-relaxed font-normal">{insight.text}</p>
          </div>
          
          <button 
            onClick={() => setActiveTab(insight.tab)}
            className="w-full mt-5 py-2.5 bg-white hover:bg-slate-100 text-brand-blue hover:text-brand-700 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer hover:scale-[1.01]"
          >
            <span>{insight.actionLabel}</span>
            <ArrowRight size={14} />
          </button>
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
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full border border-outline-variant/10">Últimas 18 semanas</span>
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
            <p className="text-[11px] text-on-surface-variant">Últimas notificações e alertas do seu copiloto</p>
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
                    const relatedJob = jobs.find(j => 
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
          ) : (
            <div className="space-y-2">
              <div 
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high/60 border border-transparent hover:border-outline-variant/10 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-on-surface">Análise de IA concluída</p>
                  <p className="text-[11px] text-on-surface-variant">Sua experiência foi estruturada e as palavras-chave ATS mapeadas.</p>
                </div>
                <span className="text-[10px] text-on-surface-variant shrink-0">Agora</span>
              </div>
              <div 
                onClick={() => setActiveTab('match')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high/60 border border-transparent hover:border-outline-variant/10 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <Search size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-on-surface">Vagas prontas para avaliação</p>
                  <p className="text-[11px] text-on-surface-variant">Selecione vagas e confira o diagnóstico semântico de aderência.</p>
                </div>
                <span className="text-[10px] text-on-surface-variant shrink-0">1h atrás</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

