import type { Profile } from '../../domain/models/types';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { calculateProfileCompleteness } from '../../domain/services/ProfileCompletenessService';
import { ProgressRing } from './ds/ProgressRing';
import { VocentroLogo } from './ds/MyCareerIcons';
import { ThemeToggle } from './ThemeToggle';
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
  ChevronRight
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
  onOpenCopilot?: () => void;
  userId?: string;
  userEmail?: string;
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
  userEmail
}: NavbarProps) {
  const completenessResult = calculateProfileCompleteness({
    hasResume,
    profile
  });
  const profileCompleteness = completenessResult.score;

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
      label: 'Jornada & Pipeline',
      icon: 'track_changes',
      completed: applicationCount > 0,
      active: activeTab === 'strategy' || activeTab === 'jornada',
      description: applicationCount > 0 ? `${applicationCount} ativa${applicationCount > 1 ? 's' : ''}` : 'Acompanhe processos'
    },
    {
      id: 'coach',
      label: 'Copiloto IA',
      icon: 'psychology',
      completed: interviewCount > 0 || isPro,
      active: activeTab === 'coach',
      description: interviewCount > 0 ? `${interviewCount} simulaç${interviewCount > 1 ? 'ões' : 'ão'}` : 'Assistente & Treino'
    },
  ];

  const journeyProgress = profileCompleteness;

  const utilityItems = [
    { id: 'dashboard', label: 'Meu Copiloto', icon: 'dashboard' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];

  if (isAdmin) {
    utilityItems.push({ id: 'admin', label: 'Admin', icon: 'shield' });
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const getUtilityIcon = (id: string, className?: string) => {
    switch (id) {
      case 'dashboard': return <LayoutDashboard className={className} size={16} strokeWidth={1.5} />;
      case 'jornada': return <Target className={className} size={16} strokeWidth={1.5} />;
      case 'settings': return <Settings className={className} size={16} strokeWidth={1.5} />;
      case 'admin': return <ShieldCheck className={className} size={16} strokeWidth={1.5} />;
      default: return null;
    }
  };

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* SideNavBar — Linear Pure Minimalist Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-[#FAFBFC] dark:bg-[#202632] flex-col justify-between z-50 border-r border-slate-200/80 dark:border-white/8 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? 'w-[68px]' : 'w-[240px]'
      } ${
        isOpen ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="flex-1 flex flex-col">
          {/* Brand & Toggle Header — Sticky no topo da Sidebar */}
          <div className={`sticky top-0 z-10 flex items-center ${isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-4 py-3'} bg-[#FAFBFC] dark:bg-[#202632] border-b border-slate-200/80 dark:border-white/8 shrink-0`}>
            <div className="flex items-center gap-2">
              <VocentroLogo className="h-7 w-7 text-brand-500" showText={false} variant="symbol" />
              {!isCollapsed && <span className="font-extrabold text-sm text-foreground tracking-tight">VoCentro</span>}
            </div>
            
            <button
              onClick={onClose}
              aria-label="Fechar menu"
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/8 text-slate-400 hover:text-slate-600 transition-colors"
              title="Fechar menu"
            >
              <X size={18} />
            </button>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden md:flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/8 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                title={isCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            )}
          </div>

          {/* Main Navigation */}
          <div className="px-2 mt-3 mb-2">
            <button
              onClick={() => { setActiveTab('dashboard'); onClose(); }}
              title="Meu Copiloto"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2 px-0' : 'gap-2.5 px-3 py-1.5'} rounded-md font-medium text-xs transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-[#4F8EF7]'
                  : 'text-slate-600 dark:text-[#B8C2CC] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-[#4F8EF7]' : 'text-slate-400 dark:text-slate-500'}`} size={15} strokeWidth={1.5} />
              {!isCollapsed && <span>Meu Copiloto</span>}
            </button>
          </div>

          {/* Journey Section */}
          <div className="px-2 mt-2">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jornada</span>
                {/* Tooltip de explicação da Jornada */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowJourneyTooltip(v => !v)}
                    className="flex items-center gap-1 group cursor-pointer"
                    title="Ver detalhes da Jornada"
                  >
                    <ProgressRing value={journeyProgress} size={18} strokeWidth={2} showValue={false} label={
                      <span className="text-[8px] font-bold text-[#4F8EF7]">{journeyProgress}%</span>
                    } />
                  </button>
                  {showJourneyTooltip && createPortal(
                    <>
                      {/* Backdrop para fechar ao clicar fora */}
                      <div className="fixed inset-0 z-[9998]" onClick={() => setShowJourneyTooltip(false)} />
                      <div className="fixed left-4 border-slate-700/90 rounded-2xl shadow-2xl p-4 text-xs text-slate-200 animate-scale-up z-[9999] w-72 md:w-80 bg-[#121927] top-16 md:left-[248px]">
                        <div className="font-extrabold text-white text-xs mb-3 flex items-center justify-between pb-2 border-b border-slate-800">
                          <span>Perfil Profissional — <strong className="text-[#4F8EF7]">{profileCompleteness}% concluído</strong></span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold uppercase">Meta 100%</span>
                        </div>
                        
                        <div className="space-y-1.5">
                          {journeySteps.map(step => (
                            <div
                              key={step.id}
                              onClick={() => {
                                setActiveTab(step.id);
                                setShowJourneyTooltip(false);
                                onClose();
                              }}
                              className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors group"
                              title={`Ir para ${step.label}`}
                            >
                              <span className={`shrink-0 mt-0.5 text-xs ${step.completed ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {step.completed ? '✅' : '○'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`font-bold block text-xs ${step.completed ? 'text-emerald-400' : 'text-slate-200 group-hover:text-brand-400'}`}>
                                    {step.label}
                                  </span>
                                  <span className="text-[9px] font-bold text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">Ir →</span>
                                </div>
                                <span className="text-[10px] text-slate-400 leading-snug block">{step.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] font-semibold text-slate-400 leading-relaxed text-center">
                          💡 Complete as etapas pendentes acima para aumentar sua Jornada.
                        </p>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              </div>
            )}

            <nav className="space-y-0.5">
              {journeySteps.map(step => (
                <button
                  key={step.id}
                  onClick={() => { setActiveTab(step.id); onClose(); }}
                  title={step.label}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2 px-0' : 'gap-2.5 px-3 py-1.5'} rounded-md text-left transition-colors ${
                    step.active
                      ? 'text-[#4F8EF7] font-medium'
                      : 'text-slate-600 dark:text-[#B8C2CC] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`shrink-0 ${step.active ? 'text-[#4F8EF7]' : step.completed ? 'text-[#22C7A8]' : 'text-slate-400 dark:text-slate-400'}`}>
                    {getStepIcon(step.id, "w-4 h-4")}
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <span className={`text-xs block truncate ${
                        step.active 
                          ? 'text-[#4F8EF7] font-medium' 
                          : 'text-slate-700 dark:text-[#F8FAFC]'
                      }`}>
                        {step.label}
                      </span>
                      {step.completed && (
                        <span className="text-[10px] font-bold text-[#22C7A8]">✓</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Utility Links */}
          <div className="px-2 mt-4 space-y-1 pb-20 md:pb-2">
            {!isCollapsed && (
              <div className="px-3 mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Geral</span>
              </div>
            )}
            {utilityItems.filter(i => i.id !== 'dashboard').map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); onClose(); }}
                  title={item.label}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2 px-0' : 'gap-2.5 px-3 py-2'} rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-[#4F8EF7] font-medium'
                      : 'text-slate-600 dark:text-[#B8C2CC] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {getUtilityIcon(item.id, `w-4 h-4 shrink-0 ${isActive ? 'text-[#4F8EF7]' : 'text-slate-400 dark:text-slate-400'}`)}
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}

            {/* Botao de Sair */}
            <button
              onClick={() => { onClose(); onLogout(); }}
              title="Sair da conta"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2 px-0' : 'gap-2.5 px-3 py-2'} rounded-md text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer`}
            >
              <LogOut className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" size={16} strokeWidth={1.5} />
              {!isCollapsed && <span>Sair da conta</span>}
            </button>
          </div>
        </div>

        {/* CTA Banner Seja Pro / Badge Pro Ativo (oculto quando collapsed) */}
        {!isCollapsed && (
          isPro ? (
            <div className="mx-3 p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-brand-500/10 border border-emerald-500/20 rounded-xl space-y-1 my-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-[11px]">
                <ShieldCheck size={13} />
                <span>PLANO PRO ATIVO</span>
              </div>
              <p className="text-[10px] text-slate-400">Todos os recursos desbloqueados.</p>
            </div>
          ) : (
            <div className="mx-3 p-3 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-emerald-500/10 border border-amber-500/20 rounded-xl space-y-1.5 my-2">
              <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-[11px]">
                <Sparkles size={13} />
                <span>VOCENTRO PRO</span>
              </div>
              <p className="text-[10px] text-slate-300">Destrave simulações ilimitadas e exportação em PDF.</p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open_checkout_modal'))}
                className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Seja Pro</span>
                <Sparkles size={10} />
              </button>
            </div>
          )
        )}

        {/* Ajuda & IA dentro do menu lateral (fixo e recolhível) */}
        {!isCollapsed && onOpenCopilot && (
          <FloatingActionDeck
            userId={userId}
            userEmail={userEmail}
            onOpenCopilot={onOpenCopilot}
          />
        )}

        {/* User Profile Footer */}
        <div className={`border-t border-slate-200/80 dark:border-white/8 ${isCollapsed ? 'p-2' : 'p-3'} flex-shrink-0 mb-16 md:mb-0`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-1.5 rounded-md`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile?.fullName || 'Foto de perfil do usuário'}
                  className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-white/10 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                  onClick={() => setActiveTab('settings')}
                  title={profile?.fullName || 'Configurações'}
                />
              ) : (
                <div
                  onClick={() => setActiveTab('settings')}
                  title={profile?.fullName || 'Configurações'}
                  className="h-6 w-6 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                >
                  {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-slate-800 dark:text-[#F8FAFC] truncate">
                    {profile?.fullName || 'Usuário'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {profile?.headline || 'Candidato PRO'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center gap-1.5 shrink-0">
                <ThemeToggle className="p-1" />
                <button
                  onClick={onLogout}
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center shrink-0"
                  title="Sair"
                >
                  <LogOut size={14} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#FAFBFC] dark:bg-[#202632] flex justify-around items-center py-1.5 z-50 border-t border-slate-200 dark:border-white/8 safe-area-inset-bottom">
        {[
          { id: 'dashboard', label: 'Copiloto' },
          { id: 'profile', label: 'Perfil' },
          { id: 'match', label: 'Vagas' },
          { id: 'strategy', label: 'Jornada' },
          { id: 'coach', label: 'Treinar' },
        ].map(item => {
          const isActive = activeTab === item.id;
          const step = journeySteps.find(s => s.id === item.id);
          
          const renderMobileIcon = (id: string, className?: string) => {
            if (id === 'dashboard') return <LayoutDashboard className={className} size={18} strokeWidth={1.5} />;
            return getStepIcon(id, className);
          };

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 flex-1 min-w-0 px-1 py-1 rounded-lg transition-colors relative ${
                isActive ? 'text-[#4F8EF7]' : 'text-slate-400 dark:text-[#B8C2CC]'
              }`}
            >
              {step?.completed && !isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#22C7A8] rounded-full" />
              )}
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                {renderMobileIcon(item.id, "w-4.5 h-4.5")}
              </div>
              <span className="text-[9px] font-medium truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
