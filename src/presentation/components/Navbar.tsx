import type { Profile } from '../../domain/models/types';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { calculateProfileCompleteness } from '../../domain/services/ProfileCompletenessService';
import { ProgressRing } from './ds/ProgressRing';
import { VocentroLogo } from './ds/MyCareerIcons';
import { ThemeToggle } from './ThemeToggle';
import { tracker } from '../../infrastructure/analytics/tracker';
import { 
  LayoutDashboard, 
  User, 
  Briefcase, 
  Target, 
  Sparkles, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  X,
  ChevronLeft,
  ChevronRight,
  Bot,
  Sliders
} from 'lucide-react';

import { FloatingActionDeck } from './FloatingActionDeck';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: Profile | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  isPro?: boolean;
  hasResume?: boolean;
  hasProfile?: boolean;
  matchCount?: number;
  applicationCount?: number;
  interviewCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenCopilot?: (source?: 'sidebar' | 'mobile_nav') => void;
  userId?: string;
  userEmail?: string;
  careerProfile?: any;
  activeResume?: any;
}

interface JourneyStep {
  id: string;
  label: string;
  icon: string;
  completed: boolean;
  active: boolean;
  description: string;
}

export function Navbar({
  activeTab,
  setActiveTab,
  profile,
  onLogout,
  isOpen,
  onClose,
  isAdmin,
  isPro = false,
  hasResume = false,
  hasProfile = false,
  matchCount = 0,
  applicationCount = 0,
  interviewCount = 0,
  isCollapsed = false,
  onToggleCollapse,
  onOpenCopilot,
  userId,
  userEmail,
  careerProfile,
  activeResume
}: NavbarProps) {
  const linkedinVal = careerProfile?.personal?.linkedin;
  const hasLinkedin = !!linkedinVal && 
    typeof linkedinVal === 'string' && 
    linkedinVal.trim().length > 0 && 
    !['n/a', 'na', 'none', 'não informado', 'não consta', 'n-a', 'null', 'undefined', 'n.a.'].includes(linkedinVal.toLowerCase().trim()) && 
    linkedinVal.toLowerCase().includes('linkedin.com');
  const hasSkills = ((careerProfile as any)?.skills?.length || 0) > 0;
  const hasExperiences = ((careerProfile as any)?.experience?.length || 0) > 0;

  const completenessResult = calculateProfileCompleteness({
    hasResume,
    hasLinkedin,
    hasSkills,
    hasExperiences,
    profile,
    careerProfile,
    resume: activeResume
  });
  const profileCompleteness = completenessResult.score;

  // ── SEÇÃO JORNADA DE CARREIRA (NOMENCLATURAS PADRONIZADAS) ──
  const journeySteps: JourneyStep[] = [
    {
      id: 'profile',
      label: 'Perfil & Currículo',
      icon: 'person',
      completed: (hasProfile || hasResume) && hasResume,
      active: activeTab === 'profile',
      description: (hasProfile || hasResume) && hasResume ? `Perfil ${profileCompleteness}% Completo` : 'Configure seu perfil'
    },
    {
      id: 'match',
      label: 'Vagas & Match',
      icon: 'search',
      completed: hasResume || matchCount > 0,
      active: activeTab === 'match' || activeTab === 'discover',
      description: hasResume || matchCount > 0 ? 'Vagas Sincronizadas' : 'Descubra oportunidades'
    },
    {
      id: 'strategy',
      label: 'Minhas Candidaturas',
      icon: 'track_changes',
      completed: applicationCount > 0,
      active: activeTab === 'strategy' || activeTab === 'jornada',
      description: applicationCount > 0 ? `${applicationCount} ativa${applicationCount > 1 ? 's' : ''}` : 'Acompanhe processos'
    },
    {
      id: 'coach',
      label: 'Simulador de Entrevistas',
      icon: 'psychology',
      completed: interviewCount > 0 || isPro,
      active: activeTab === 'coach',
      description: interviewCount > 0 ? `${interviewCount} simulaç${interviewCount > 1 ? 'ões' : 'ão'}` : 'Treino STAR com IA'
    },
  ];

  const completedJourneySteps = journeySteps.filter(s => s.completed).length;
  const totalJourneySteps = journeySteps.length;
  const journeyProgress = totalJourneySteps > 0 ? Math.round((completedJourneySteps / totalJourneySteps) * 100) : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavigate = (tabId: string, source: 'sidebar' | 'mobile_bottom_nav' | 'journey_tooltip') => {
    tracker.track(source === 'sidebar' ? 'sidebar_item_clicked' : 'mobile_nav_item_clicked', 'Navigation', {
      item: tabId,
      source: source === 'sidebar' ? 'sidebar' : 'mobile_bottom_nav'
    });
    setActiveTab(tabId);
    onClose();
  };

  const handleToggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    tracker.track('sidebar_collapsed_toggled', 'Navigation', {
      is_collapsed: nextCollapsed
    });
    onToggleCollapse?.();
  };

  const handleOpenCopilotFromNav = (source: 'sidebar' | 'mobile_nav') => {
    onOpenCopilot?.(source);
    onClose();
  };

  const getStepIcon = (id: string, className?: string) => {
    switch (id) {
      case 'profile': return <User className={className} size={15} strokeWidth={1.5} />;
      case 'match': return <Briefcase className={className} size={15} strokeWidth={1.5} />;
      case 'strategy': return <Target className={className} size={15} strokeWidth={1.5} />;
      case 'coach': return <Sparkles className={className} size={15} strokeWidth={1.5} />;
      default: return null;
    }
  };

  const [showJourneyTooltip, setShowJourneyTooltip] = useState(false);

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* SideNavBar — Desktop & Mobile Drawer */}
      <aside 
        aria-label="Navegação Principal"
        className={`fixed left-0 top-0 h-full bg-[#FAFBFC] dark:bg-[#202632] flex flex-col justify-between z-50 border-r border-slate-200/80 dark:border-white/8 overflow-y-auto transition-all duration-300 font-sans ${
          isCollapsed ? 'w-[68px]' : 'w-[240px]'
        } ${
          isOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="flex-1 flex flex-col">
          {/* Brand & Toggle Header */}
          <div className={`sticky top-0 z-10 flex items-center ${isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-4 py-3'} bg-[#FAFBFC] dark:bg-[#202632] border-b border-slate-200/80 dark:border-white/8 shrink-0`}>
            <div className="flex items-center gap-2">
              <VocentroLogo className="h-7 w-7 text-brand-500 shrink-0" showText={false} variant="symbol" />
              {!isCollapsed && <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">VoCentro</span>}
            </div>
            
            <button
              onClick={onClose}
              aria-label="Fechar menu lateral"
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/8 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
            >
              <X size={18} />
            </button>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={handleToggleCollapse}
                aria-expanded={!isCollapsed}
                aria-label={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                className="hidden md:flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/8 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title={isCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            )}
          </div>

          {/* ── SEÇÃO PRINCIPAL: VISÃO GERAL + COPILOTO IA ── */}
          <div className="px-2 mt-3 mb-2 space-y-1">
            {/* 1. Visão Geral (Dashboard) */}
            <button
              onClick={() => handleNavigate('dashboard', 'sidebar')}
              aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              title="Visão Geral (Painel do Candidato)"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2'} rounded-xl font-bold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 shadow-xs border border-brand-200 dark:border-brand-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-brand-700 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} size={15} strokeWidth={1.5} />
              {!isCollapsed && <span>Visão Geral</span>}
            </button>

            {/* 2. Copiloto IA (Acesso em 1 clique sem trocar aba) */}
            {onOpenCopilot && (
              <button
                type="button"
                onClick={() => handleOpenCopilotFromNav('sidebar')}
                aria-label="Abrir Copiloto IA"
                title="Copiloto de Carreira IA (Orientação em tempo real)"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2'} rounded-xl font-bold text-xs transition-all bg-indigo-50/70 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/90 dark:hover:bg-indigo-500/20 border border-indigo-200/80 dark:border-indigo-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer shadow-xs`}
              >
                <div className="relative shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" size={15} strokeWidth={1.5} />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span>Copiloto IA</span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-600/15 text-indigo-700 dark:text-indigo-300">
                      Chat
                    </span>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* ── SEÇÃO JORNADA DE CARREIRA ── */}
          <div className="px-2 mt-3">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Jornada de Carreira
                </span>
                {/* Tooltip de explicação da Jornada */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowJourneyTooltip(v => !v)}
                    className="flex items-center gap-1 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    title="Ver detalhes da Jornada"
                  >
                    <ProgressRing value={journeyProgress} size={18} strokeWidth={2} showValue={false} label={
                      <span className="text-[8px] font-bold text-brand-600 dark:text-brand-400">{journeyProgress}%</span>
                    } />
                  </button>
                  {showJourneyTooltip && createPortal(
                    <>
                      <div className="fixed inset-0 z-[9998]" onClick={() => setShowJourneyTooltip(false)} />
                      <div className="fixed left-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-xs text-slate-800 dark:text-slate-200 animate-scale-up z-[9999] w-72 md:w-80 bg-white dark:bg-[#121927] top-16 md:left-[248px]">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs mb-3 flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="block">Jornada — <strong className="text-brand-600 dark:text-brand-400">{journeyProgress}% concluída</strong></span>
                            <span className="text-[10px] text-slate-400 font-normal">{completedJourneySteps} de {totalJourneySteps} ações concluídas</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/20 font-bold uppercase">Meta 100%</span>
                        </div>
                        
                        <div className="space-y-1.5">
                          {journeySteps.map(step => (
                            <div
                              key={step.id}
                              onClick={() => {
                                handleNavigate(step.id, 'journey_tooltip');
                                setShowJourneyTooltip(false);
                              }}
                              className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                              title={`Ir para ${step.label}`}
                            >
                              <span className={`shrink-0 mt-0.5 text-xs ${step.completed ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {step.completed ? '✅' : '○'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`font-bold block text-xs ${step.completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-brand-600'}`}>
                                    {step.label}
                                  </span>
                                  <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">Ir →</span>
                                </div>
                                <span className="text-[10px] text-slate-400 leading-snug block">{step.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-400 leading-relaxed text-center">
                          💡 Este percentual mede as 4 etapas essenciais da sua recolocação.
                        </p>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              </div>
            )}

            <nav aria-label="Etapas da Jornada" className="space-y-0.5">
              {journeySteps.map(step => (
                <button
                  key={step.id}
                  onClick={() => handleNavigate(step.id, 'sidebar')}
                  aria-current={step.active ? 'page' : undefined}
                  title={step.label}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2'} rounded-xl text-left font-medium text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer ${
                    step.active
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-500/20 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <div className={`shrink-0 ${step.active ? 'text-brand-700 dark:text-brand-400' : step.completed ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-400'}`}>
                    {getStepIcon(step.id, "w-4 h-4")}
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <span className={`text-xs block truncate ${
                        step.active 
                          ? 'text-brand-700 dark:text-brand-400 font-bold' 
                          : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {step.label}
                      </span>
                      {step.completed && (
                        <span className="text-[10px] font-bold text-emerald-500">✓</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* ── SEÇÃO CONTA E UTILITÁRIOS ── */}
          <div className="px-2 mt-4 space-y-1 pb-16 md:pb-2">
            {!isCollapsed && (
              <div className="px-3 mb-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Conta
                </span>
              </div>
            )}

            {/* Preferências de Carreira */}
            <button
              onClick={() => handleNavigate('career-profile', 'sidebar')}
              aria-current={activeTab === 'career-profile' ? 'page' : undefined}
              title="Preferências de Carreira & Trabalho"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2'} rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer ${
                activeTab === 'career-profile'
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-500/20 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'career-profile' ? 'text-brand-700 dark:text-brand-400' : 'text-slate-400 dark:text-slate-400'}`} size={16} strokeWidth={1.5} />
              {!isCollapsed && <span>Preferências</span>}
            </button>

            {/* Configurações */}
            <button
              onClick={() => handleNavigate('settings', 'sidebar')}
              aria-current={activeTab === 'settings' ? 'page' : undefined}
              title="Configurações da Conta"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2'} rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-500/20 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-brand-700 dark:text-brand-400' : 'text-slate-400 dark:text-slate-400'}`} size={16} strokeWidth={1.5} />
              {!isCollapsed && <span>Configurações</span>}
            </button>

            {/* Admin (se admin) */}
            {isAdmin && (
              <button
                onClick={() => handleNavigate('admin', 'sidebar')}
                aria-current={activeTab === 'admin' ? 'page' : undefined}
                title="Painel Administrativo"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2'} rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-500/20 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === 'admin' ? 'text-brand-700 dark:text-brand-400' : 'text-slate-400 dark:text-slate-400'}`} size={16} strokeWidth={1.5} />
                {!isCollapsed && <span>Admin</span>}
              </button>
            )}

            {/* Tour da Plataforma (Ação Utilitária Separada) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new Event('vocentro_open_onboarding'));
              }}
              title="Reabrir Tour de Apresentação da Plataforma"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2 px-0' : 'gap-2.5 px-3 py-1.5'} rounded-xl text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" size={15} strokeWidth={1.5} />
              {!isCollapsed && <span className="text-[11px]">Tour da Plataforma</span>}
            </button>
          </div>
        </div>

        {/* Banner Seja Pro / Badge Pro Ativo */}
        {!isCollapsed && (
          isPro ? (
            <div className="mx-3 p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-brand-500/10 border border-emerald-500/20 rounded-xl space-y-1 my-2">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
                <ShieldCheck size={13} />
                <span>PLANO PRO ATIVO</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Todos os recursos desbloqueados.</p>
            </div>
          ) : (
            <div className="mx-3 p-3 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-emerald-500/10 border border-amber-500/20 rounded-xl space-y-1.5 my-2">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-extrabold text-[11px]">
                <Sparkles size={13} />
                <span>VOCENTRO PRO</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-300">Destrave simulações ilimitadas e exportação em PDF.</p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open_checkout_modal'))}
                className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <span>Seja Pro</span>
                <Sparkles size={10} />
              </button>
            </div>
          )
        )}

        {/* Ajuda & Suporte */}
        {!isCollapsed && (
          <FloatingActionDeck
            userId={userId}
            userEmail={userEmail}
            onOpenCopilot={onOpenCopilot}
          />
        )}

        {/* Rodapé com Perfil do Usuário, Tema e Logout Único */}
        <div className={`border-t border-slate-200/80 dark:border-white/8 ${isCollapsed ? 'p-2' : 'p-3'} shrink-0 mb-16 md:mb-0 bg-[#FAFBFC] dark:bg-[#202632]`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-1.5 rounded-md`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile?.fullName || 'Foto de perfil do usuário'}
                  className="h-7 w-7 rounded-full object-cover border border-slate-200 dark:border-white/10 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                  onClick={() => handleNavigate('settings', 'sidebar')}
                  title={profile?.fullName || 'Configurações'}
                />
              ) : (
                <div
                  onClick={() => handleNavigate('settings', 'sidebar')}
                  title={profile?.fullName || 'Configurações'}
                  className="h-7 w-7 rounded-full bg-brand-500/10 dark:bg-white/5 text-brand-700 dark:text-slate-300 flex items-center justify-center font-extrabold text-xs cursor-pointer hover:opacity-80 transition-opacity shrink-0 border border-brand-500/20"
                >
                  {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC] truncate">
                    {profile?.fullName || 'Candidato'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {profile?.headline || 'Candidato Vocentro'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <ThemeToggle className="p-1" />
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  title="Sair da conta"
                  aria-label="Sair da conta"
                >
                  <LogOut size={15} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAVIGATION (5 ABAS COM TOUCH TARGET >= 44PX) ── */}
      <nav 
        aria-label="Navegação Inferior Mobile"
        className="md:hidden fixed bottom-0 left-0 w-full bg-[#FAFBFC] dark:bg-[#202632] flex justify-around items-center py-1 z-50 border-t border-slate-200/90 dark:border-white/8 safe-area-inset-bottom font-sans shadow-lg"
      >
        {[
          { id: 'dashboard', label: 'Visão Geral', icon: 'dashboard' },
          { id: 'match', label: 'Vagas', icon: 'match' },
          { id: 'copilot', label: 'Copiloto IA', icon: 'copilot', isSpecial: true },
          { id: 'strategy', label: 'Candidaturas', icon: 'strategy' },
          { id: 'coach', label: 'Entrevistas', icon: 'coach' },
        ].map(item => {
          const isActive = item.id === 'copilot' ? false : activeTab === item.id;
          const step = journeySteps.find(s => s.id === item.id);
          
          const renderMobileIcon = (id: string, className?: string) => {
            if (id === 'dashboard') return <LayoutDashboard className={className} size={18} strokeWidth={1.5} />;
            if (id === 'copilot') return <Bot className={className} size={18} strokeWidth={1.5} />;
            return getStepIcon(id, className);
          };

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'copilot') {
                  handleOpenCopilotFromNav('mobile_nav');
                } else {
                  handleNavigate(item.id, 'mobile_bottom_nav');
                }
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-1 py-1 rounded-xl transition-all relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                item.isSpecial
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : isActive 
                    ? 'text-brand-700 dark:text-brand-400 font-bold' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {step?.completed && !isActive && (
                <span className="absolute 1.5 top-1.5 right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              )}
              {item.isSpecial && (
                <span className="absolute top-1 right-3 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                {renderMobileIcon(item.id, "w-4.5 h-4.5")}
              </div>
              <span className="text-[9px] font-medium truncate w-full text-center tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
