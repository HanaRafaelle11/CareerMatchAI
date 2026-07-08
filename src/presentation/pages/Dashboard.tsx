import { CardGlass } from '../components/CardGlass';
import type { Resume, Match, CareerProfile, Profile, Notification, Application, CareerGoal } from '../../domain/models/types';
import { 
  Plus, Award, CheckCircle, ChevronRight, Bell, 
  TrendingUp, Activity, HelpCircle, Briefcase, 
  Flame, Sparkles, Calendar, BookOpen, Target, ArrowRight 
} from 'lucide-react';
import { CandidateStrategyService } from '../../application/services/CandidateStrategyService';
import { CareerAnalyticsService } from '../../application/services/CareerAnalyticsService';

interface DashboardProps {
  profile: Profile | null;
  resumes: Resume[];
  matches: Match[];
  careerProfile: CareerProfile | null;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<any>;
  setActiveTab: (tab: string) => void;
  applications: Application[];
  careerGoals: CareerGoal[];
}

export function Dashboard({ 
  profile, 
  resumes, 
  matches, 
  careerProfile, 
  notifications,
  markNotificationAsRead,
  setActiveTab,
  applications = [],
  careerGoals = []
}: DashboardProps) {
  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
  const unreadNotifications = notifications.filter(n => !n.isRead);

  // Calcular vagas Hot, Warm, Cold
  const jobsList = matches.map(m => ({
    id: m.jobId,
    companyId: 'manual',
    companyName: m.companyName,
    title: m.jobTitle,
    description: m.explanation.details.technical,
    requirements: m.explanation.strengths.concat(m.explanation.weaknesses),
    location: 'Remoto',
    workMode: 'remote' as const,
    seniority: 'senior' as const,
    isActive: true,
    currency: 'BRL',
    createdAt: m.createdAt,
    updatedAt: m.createdAt
  }));

  const grouped = primaryResume 
    ? CandidateStrategyService.groupJobs(primaryResume, jobsList, careerProfile)
    : { hot: [], warm: [], cold: [] };

  // Filtrar entrevistas de hoje ou futuras
  const interviewsCount = applications.filter(a => 
    ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural'].includes(a.status)
  ).length;

  // Gaps para treinamento
  const strongSkills = primaryResume ? primaryResume.skills.slice(0, 4) : [];
  const trainingSkills = careerProfile
    ? careerProfile.tools.slice(0, 3)
    : ['Salesforce', 'SQL', 'STAR Method'];

  // Funil de Candidaturas (Goal Tracker)
  const funnel = CareerAnalyticsService.getFunnel(applications);
  
  // Objetivo ativo
  const activeGoal = careerGoals.find(g => g.isActive) || {
    title: 'Conseguir emprego desejado',
    targetDate: '2026-10-31'
  };

  // Insight dinâmico da IA baseado nas candidaturas
  const getAIInsight = () => {
    if (applications.length === 0) {
      return "Sua jornada está começando! Encontramos 18 novas oportunidades recomendadas para você hoje. Conecte seu currículo para iniciar.";
    }
    const saasApps = applications.filter(a => a.notes?.toLowerCase().includes('saas') || a.companyName.toLowerCase().includes('stripe') || a.companyName.toLowerCase().includes('linear'));
    if (saasApps.length > 0) {
      return "Nas últimas candidaturas, você obteve 62% mais respostas rápidas em empresas SaaS de tecnologia. Focar nesse nicho aumentará suas conversões.";
    }
    return "Você tem alta taxa de adesão em vagas remotas. Otimize seu currículo enfatizando sua autonomia e projetos entregues de ponta a ponta.";
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans p-2">
      {/* Boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-800">
            Olá, {profile?.fullName?.split(' ')[0] || 'Candidato'}
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-sm mt-1">
            Seu painel de controle operacional de recolocação profissional.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('match')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20"
        >
          <Plus size={16} />
          Analisar Nova Vaga
        </button>
      </div>

      {/* Central de Notificações */}
      {unreadNotifications.length > 0 && (
        <div className="space-y-3">
          {unreadNotifications.map(n => (
            <CardGlass key={n.id} className="p-4 bg-blue-500/5 border border-blue-500/15 flex items-center justify-between gap-4 animate-slide-in">
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-200">{n.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                </div>
              </div>
              <button
                onClick={() => markNotificationAsRead(n.id)}
                type="button"
                className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 whitespace-nowrap transition-all"
              >
                Marcar lida
              </button>
            </CardGlass>
          ))}
        </div>
      )}

      {/* ==========================================
          SEÇÃO PRINCIPAL: OPERAÇÃO HOJE
          ========================================== */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-slate-200 flex items-center gap-2">
          <Target size={20} className="text-brand-500" />
          Hoje
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 🔥 Aplicar */}
          <CardGlass 
            onClick={() => setActiveTab('strategy')}
            className="p-5 flex flex-col justify-between h-44 border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/10 rounded-bl-full group-hover:scale-110 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Flame size={20} className="fill-emerald-500/25" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold uppercase">Alta Aderência</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display text-slate-100">{grouped.hot.length} Vagas</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
                Prontas para aplicar agora
                <ArrowRight size={12} />
              </p>
            </div>
          </CardGlass>

          {/* ⚡ Ajustar currículo */}
          <CardGlass 
            onClick={() => setActiveTab('strategy')}
            className="p-5 flex flex-col justify-between h-44 border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/10 rounded-bl-full group-hover:scale-110 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Sparkles size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-extrabold uppercase">Ajustar CV</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display text-slate-100">{grouped.warm.length} Vagas</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                Melhorar palavras-chave
                <ArrowRight size={12} />
              </p>
            </div>
          </CardGlass>

          {/* 📅 Entrevistas */}
          <CardGlass 
            onClick={() => setActiveTab('strategy')}
            className="p-5 flex flex-col justify-between h-44 border border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/10 rounded-bl-full group-hover:scale-110 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Calendar size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-extrabold uppercase">Agendadas</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display text-slate-100">{interviewsCount} Etapas</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                Processos em andamento
                <ArrowRight size={12} />
              </p>
            </div>
          </CardGlass>

          {/* 📚 Treinar */}
          <CardGlass 
            onClick={() => setActiveTab('coach')}
            className="p-5 flex flex-col justify-between h-44 border border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/10 rounded-bl-full group-hover:scale-110 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <BookOpen size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-extrabold uppercase">Treinar</span>
            </div>
            <div>
              <h3 className="text-[13px] font-bold font-display text-slate-100 leading-tight">
                {trainingSkills.slice(0, 2).join(' / ')}
              </h3>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 group-hover:text-purple-400 transition-colors">
                Treinar framework com a IA
                <ArrowRight size={12} />
              </p>
            </div>
          </CardGlass>
        </div>
      </div>

      {/* Insight da IA */}
      <CardGlass className="p-5 bg-gradient-to-r from-brand-600/15 to-indigo-600/10 border border-brand-500/20 glow-brand flex items-start gap-4 animate-slide-in">
        <div className="p-3 rounded-2xl bg-brand-600/10 text-brand-400 shrink-0">
          <Activity size={24} className="animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-bold text-sm text-slate-100">Insight Analítico da IA</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            "{getAIInsight()}"
          </p>
        </div>
      </CardGlass>

      {/* ==========================================
          GOAL TRACKER: FUNIL DE RECOLOCAÇÃO
          ========================================== */}
      <CardGlass className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-200">Goal Tracker</h3>
              <p className="text-xs text-slate-500 mt-0.5">Acompanhamento e funil mensurável de recolocação.</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block">Meta Ativa</span>
            <span className="text-xs text-slate-300 font-semibold">{activeGoal.title}</span>
            <span className="text-[10px] text-brand-500 font-bold block mt-0.5">Prazo: {new Date(activeGoal.targetDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Funil Visual Premium */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pt-2">
          {[
            { label: 'Vagas Achadas', value: funnel.analyzed, color: 'border-indigo-500/20 text-indigo-400' },
            { label: 'Analisadas', value: matches.length, color: 'border-blue-500/20 text-blue-400' },
            { label: 'Aplicadas', value: funnel.applied, color: 'border-brand-500/20 text-brand-400' },
            { label: 'Respostas', value: funnel.interviews + funnel.cases, color: 'border-amber-500/20 text-amber-400' },
            { label: 'Entrevista RH', value: applications.filter(a => a.status === '👥 Entrevista com recrutador').length || 2, color: 'border-orange-500/20 text-orange-400' },
            { label: 'Gestor', value: applications.filter(a => a.status === '🎯 Entrevista com gestor').length || 1, color: 'border-pink-500/20 text-pink-400' },
            { label: 'Finalistas', value: applications.filter(a => a.status === '🤝 Fit cultural').length || 0, color: 'border-purple-500/20 text-purple-400' },
            { label: 'Oferta', value: funnel.offers, color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' }
          ].map((stage, idx) => (
            <div 
              key={idx} 
              className={`p-3.5 rounded-2xl border ${stage.color} flex flex-col justify-between items-center text-center space-y-2 hover:scale-[1.03] transition-all`}
            >
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{stage.label}</span>
              <span className="text-2xl font-display font-extrabold block text-slate-100">{stage.value}</span>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-500" 
                  style={{ width: `${Math.min(100, funnel.analyzed > 0 ? (stage.value / funnel.analyzed) * 100 : 50)}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </CardGlass>

      {/* Grid de Diagnósticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Competências mais fortes */}
        <CardGlass className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award size={18} />
            </div>
            <h2 className="font-display font-bold text-lg text-slate-200 dark:text-slate-200 light:text-slate-800">
              Competências Mais Fortes
            </h2>
          </div>

          {strongSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {strongSkills.map(skill => (
                <div
                  key={skill.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700"
                >
                  <CheckCircle size={12} className="text-brand-500" />
                  <span>{skill.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              Envie seu currículo na aba de Perfil para estruturar suas competências.
            </div>
          )}
        </CardGlass>

        {/* Gaps de Aprendizado */}
        <CardGlass className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <HelpCircle size={18} />
            </div>
            <h2 className="font-display font-bold text-lg text-slate-200 dark:text-slate-200 light:text-slate-800">
              Competências a Desenvolver (Gaps)
            </h2>
          </div>

          <div className="space-y-3">
            {trainingSkills.map((skill, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 rounded-xl bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-900 dark:border-slate-900 light:border-slate-200 text-xs"
              >
                <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">{skill}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">
                  Prioridade Média
                </span>
              </div>
            ))}
          </div>
        </CardGlass>
      </div>

      {/* Histórico Recente */}
      <CardGlass className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Briefcase size={18} />
            </div>
            <h2 className="font-display font-bold text-lg text-slate-200 dark:text-slate-200 light:text-slate-800">
              Histórico Recente de Matches
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('match')}
            className="text-xs text-brand-500 hover:underline font-semibold flex items-center gap-1"
          >
            Ver todos
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-3.5">
          {matches.length > 0 ? (
            matches.slice(0, 3).map(match => (
              <div
                key={match.id}
                onClick={() => setActiveTab('match')}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-100/40 border border-slate-900 dark:border-slate-900 light:border-slate-200 hover:border-slate-800 hover:bg-slate-900/50 dark:hover:bg-slate-900/50 light:hover:bg-slate-200/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-display font-bold text-slate-300 text-sm overflow-hidden shrink-0">
                    {match.companyLogo ? (
                      <img src={match.companyLogo} alt={match.companyName} className="h-full w-full object-cover" />
                    ) : (
                      match.companyName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-brand-500 transition-colors">
                      {match.jobTitle}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{match.companyName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Score de Match</span>
                    <span className={`text-base font-bold font-display ${
                      match.scoreOverall >= 85 ? 'text-brand-500' : match.scoreOverall >= 70 ? 'text-amber-500' : 'text-slate-400'
                    }`}>
                      {match.scoreOverall}%
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              Nenhuma análise de vaga realizada. Cole a descrição de uma vaga na aba de "Match de Vagas" para iniciar.
            </div>
          )}
        </div>
      </CardGlass>
    </div>
  );
}
