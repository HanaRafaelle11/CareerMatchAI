import { useState, useEffect } from 'react';
import { CardGlass } from '../components/CardGlass';
import type { Resume, Match, CareerProfile, Profile, Notification, Application, CareerGoal } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';
import { 
  Plus, Award, CheckCircle, ChevronRight, Bell, 
  TrendingUp, Activity, HelpCircle, Briefcase, 
  Flame, Sparkles, Calendar, BookOpen, Target, ArrowRight
} from 'lucide-react';
import { CandidateStrategyService } from '../../application/services/CandidateStrategyService';
import { CareerAnalyticsService } from '../../application/services/CareerAnalyticsService';
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
}

export function Dashboard({ 
  profile, 
  resumes, 
  matches, 
  careerProfile,
  careerProfileNew,
  notifications,
  markNotificationAsRead,
  setActiveTab,
  applications = [],
  careerGoals = []
}: DashboardProps) {
  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
  const unreadNotifications = notifications.filter(n => !n.isRead);

  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [errorStats, setErrorStats] = useState({
    totalToday: 0,
    successRate: 100,
    unstableService: 'Nenhum',
    breakdown: { Gemini: 0, Adzuna: 0, Storage: 0, Database: 0 }
  });

  useEffect(() => {
    async function fetchHealth() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        setIsLoadingHealth(true);
        const { data, error } = await supabase
          .from('application_errors')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (!error && data) {
          setSystemErrors(data);
        }

        // Buscar todos do último dia para cálculo de analíticas
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: allErrors } = await supabase
          .from('application_errors')
          .select('*')
          .gt('created_at', oneDayAgo);
        
        if (allErrors) {
          const totalToday = allErrors.length;
          const geminiCount = allErrors.filter(e => 
            e.component?.toLowerCase().includes('gemini') || 
            e.error_code?.toLowerCase().includes('ai') || 
            e.component?.toLowerCase().includes('match-job')
          ).length;

          const adzunaCount = allErrors.filter(e => 
            e.component?.toLowerCase().includes('adzuna') || 
            e.error_code?.toLowerCase().includes('job') || 
            e.component?.toLowerCase().includes('search-jobs')
          ).length;

          const storageCount = allErrors.filter(e => 
            e.component?.toLowerCase().includes('storage') || 
            e.component?.toLowerCase().includes('upload')
          ).length;

          const dbCount = Math.max(0, totalToday - geminiCount - adzunaCount - storageCount);

          let unstableService = 'Nenhum';
          const maxCount = Math.max(geminiCount, adzunaCount, storageCount, dbCount);
          if (maxCount > 0) {
            if (maxCount === geminiCount) unstableService = 'Gemini API';
            else if (maxCount === adzunaCount) unstableService = 'Adzuna API';
            else if (maxCount === storageCount) unstableService = 'Storage S3';
            else unstableService = 'Database';
          }

          const successRate = Math.max(92, Math.min(100, 100 - (totalToday * 0.15)));

          setErrorStats({
            totalToday,
            successRate: Math.round(successRate * 10) / 10,
            unstableService,
            breakdown: {
              Gemini: geminiCount,
              Adzuna: adzunaCount,
              Storage: storageCount,
              Database: dbCount
            }
          });
        }
      } catch (err) {
        console.error("Erro ao obter telemetria:", err);
      } finally {
        setIsLoadingHealth(false);
      }
    }
    fetchHealth();
  }, []);

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

  // Skills: usar career_profiles (novo) como fonte primária
  const strongSkills = careerProfileNew
    ? careerProfileNew.skills.slice(0, 4).map(s => s.name)
    : primaryResume?.skills.slice(0, 4).map(s => s.name) ?? [];

  const trainingSkills = careerProfileNew
    ? (careerProfileNew.ats_keywords?.missing_keywords || []).slice(0, 3)
    : careerProfile?.tools.slice(0, 3) ?? ['Salesforce', 'SQL', 'STAR Method'];

  // Funil de Candidaturas (Goal Tracker)
  const funnel = CareerAnalyticsService.getFunnel(applications);
  
  // Objetivo ativo
  const activeGoal = careerGoals.find(g => g.isActive) || {
    title: 'Conseguir emprego desejado',
    targetDate: '2026-10-31'
  };

  // Insight dinâmico baseado em dados reais
  const getAIInsight = () => {
    const name = careerProfileNew?.personal?.fullName?.split(' ')[0] ||
      profile?.fullName?.split(' ')[0] || 'Candidato';
    if (applications.length === 0 && !careerProfileNew) {
      return `Bem-vindo, ${name}! Envie seu currículo na aba "Meu Currículo" para a IA gerar seu perfil estruturado e encontrar vagas ideais automaticamente.`;
    }
    if (careerProfileNew && applications.length === 0) {
      const role = careerProfileNew.personal?.headline || 'sua área';
      return `Perfil IA gerado com sucesso para ${role}! Acesse o Match Manual para calcular sua compatibilidade com vagas, ou explore o Discovery para encontrar oportunidades automaticamente.`;
    }
    const interviews = applications.filter(a =>
      ['👥 Entrevista com recrutador', '🎯 Entrevista com gestor', '🧩 Case técnico', '🤝 Fit cultural'].includes(a.status)
    ).length;
    if (interviews > 0) {
      return `Parabéns! Você está em ${interviews} processo(s) seletivo(s) ativo(s). Acesse o AI Coach para simular entrevistas e fortalecer sua preparação.`;
    }
    const applied = applications.filter(a => a.status.includes('candidatei')).length;
    if (applied > 5) {
      return `Você já tem ${applied} candidaturas ativas. Foque em empresas com alto score de compatibilidade e personalize sua carta de apresentação para aumentar a taxa de resposta.`;
    }
    return `Continue sua busca com consistência. Candidaturas regulares e personalizadas aumentam significativamente suas chances de entrevista.`;
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
            { label: 'Entrevista RH', value: applications.filter(a => a.status === '👥 Entrevista com recrutador').length, color: 'border-orange-500/20 text-orange-400' },
            { label: 'Gestor', value: applications.filter(a => a.status === '🎯 Entrevista com gestor').length, color: 'border-pink-500/20 text-pink-400' },
            { label: 'Finalistas', value: applications.filter(a => a.status === '🤝 Fit cultural').length, color: 'border-purple-500/20 text-purple-400' },
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
              {strongSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700"
                >
                  <CheckCircle size={12} className="text-brand-500" />
                  <span>{skill}</span>
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

      {/* Admin Panel: Saúde do Sistema */}
      <CardGlass className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 animate-pulse">
              <Activity size={18} />
            </div>
            <h2 className="font-display font-bold text-lg text-slate-200 dark:text-slate-200 light:text-slate-800">
              Painel de Telemetria e Erros (Error Analytics)
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-semibold font-mono">
            Modo Admin Ativo
          </span>
        </div>

        {/* 4 Cards Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Erros Registrados Hoje</span>
            <span className="text-2xl font-extrabold text-slate-100 font-display mt-2">
              {errorStats.totalToday}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Taxa de Sucesso Geral</span>
            <span className={`text-2xl font-extrabold font-display mt-2 ${
              errorStats.successRate >= 99 ? 'text-emerald-400' : errorStats.successRate >= 95 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {errorStats.successRate}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Serviço Mais Instável</span>
            <span className="text-xs font-bold text-slate-200 mt-2 truncate font-mono">
              {errorStats.unstableService}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Erros IA (Gemini)</span>
            <span className="text-2xl font-extrabold text-purple-400 font-display mt-2">
              {errorStats.breakdown.Gemini}
            </span>
          </div>
        </div>

        {/* Categoria Breakdown Grafico de Barras */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 space-y-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Distribuição de Erros por Categoria</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Gemini API', value: errorStats.breakdown.Gemini, color: 'bg-purple-500' },
              { label: 'Adzuna API', value: errorStats.breakdown.Adzuna, color: 'bg-amber-500' },
              { label: 'Storage S3', value: errorStats.breakdown.Storage, color: 'bg-blue-500' },
              { label: 'Database', value: errorStats.breakdown.Database, color: 'bg-red-500' }
            ].map(cat => {
              const max = Math.max(1, errorStats.breakdown.Gemini + errorStats.breakdown.Adzuna + errorStats.breakdown.Storage + errorStats.breakdown.Database);
              const percentage = Math.round((cat.value / max) * 100);
              return (
                <div key={cat.label} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-slate-400">{cat.label}</span>
                    <span className="text-slate-500">{cat.value} ({percentage}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
            Últimas Ocorrências e Logs de Telemetria (Últimas 24h)
          </h4>

          {isLoadingHealth ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              Carregando registros de erro do banco...
            </div>
          ) : systemErrors.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20">
              <table className="w-full border-collapse text-left text-xs text-slate-400">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/60 font-semibold text-slate-300">
                    <th className="p-3">Horário</th>
                    <th className="p-3">Componente</th>
                    <th className="p-3">Erro</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {systemErrors.map((err) => (
                    <tr key={err.id} className="hover:bg-slate-900/10">
                      <td className="p-3 whitespace-nowrap text-slate-500">
                        {new Date(err.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-semibold text-slate-350">{err.component}</td>
                      <td className="p-3 max-w-xs truncate text-red-400" title={err.message}>
                        {err.error_code}: {err.message}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Registrado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 rounded-xl border border-dashed border-slate-900 text-slate-650 text-xs flex flex-col items-center gap-1.5">
              <CheckCircle size={20} className="text-emerald-500/60" />
              <span>Nenhum erro registrado no sistema nas últimas 24h. Funcionamento ideal.</span>
            </div>
          )}
        </div>
      </CardGlass>
    </div>
  );
}
