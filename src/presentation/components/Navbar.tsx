import type { Profile } from '../../domain/models/types';
import { useEffect } from 'react';
import { ProgressRing } from './ds/ProgressRing';
import { MyCareerLogo } from './ds/MyCareerIcons';
import { 
  LayoutDashboard, 
  User, 
  Briefcase, 
  Target, 
  Sparkles, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  X 
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: Profile | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  // Journey state
  hasResume?: boolean;
  hasProfile?: boolean;
  matchCount?: number;
  applicationCount?: number;
  interviewCount?: number;
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
  hasResume = false,
  hasProfile = false,
  matchCount = 0,
  applicationCount = 0,
  interviewCount = 0
}: NavbarProps) {
  // Calculate journey steps
  const journeySteps: JourneyStep[] = [
    {
      id: 'profile',
      label: 'Perfil & Currículo',
      icon: 'person',
      completed: hasProfile && hasResume,
      active: activeTab === 'profile',
      description: hasProfile && hasResume ? 'Completo' : 'Configure seu perfil'
    },
    {
      id: 'match',
      label: 'Vagas & Match',
      icon: 'search',
      completed: matchCount > 0,
      active: activeTab === 'match',
      description: matchCount > 0 ? `${matchCount} match${matchCount > 1 ? 'es' : ''}` : 'Descubra oportunidades'
    },
    {
      id: 'strategy',
      label: 'Candidaturas',
      icon: 'track_changes',
      completed: applicationCount > 0,
      active: activeTab === 'strategy',
      description: applicationCount > 0 ? `${applicationCount} ativa${applicationCount > 1 ? 's' : ''}` : 'Acompanhe processos'
    },
    {
      id: 'coach',
      label: 'Treinamento',
      icon: 'psychology',
      completed: interviewCount > 0,
      active: activeTab === 'coach',
      description: interviewCount > 0 ? `${interviewCount} simulaç${interviewCount > 1 ? 'ões' : 'ão'}` : 'Prepare-se com IA'
    },
  ];

  const completedCount = journeySteps.filter(s => s.completed).length;
  const journeyProgress = Math.round((completedCount / journeySteps.length) * 100);

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
      case 'profile': return <User className={className} size={16} />;
      case 'match': return <Briefcase className={className} size={16} />;
      case 'strategy': return <Target className={className} size={16} />;
      case 'coach': return <Sparkles className={className} size={16} />;
      default: return null;
    }
  };

  const getUtilityIcon = (id: string, className?: string) => {
    switch (id) {
      case 'dashboard': return <LayoutDashboard className={className} size={18} />;
      case 'settings': return <Settings className={className} size={18} />;
      case 'admin': return <ShieldCheck className={className} size={18} />;
      default: return null;
    }
  };

  const activeIndex = journeySteps.findIndex(s => s.active);
  const highestCompletedIndex = journeySteps.reduce((acc, step, index) => step.completed ? index : acc, -1);
  const targetIndex = Math.max(activeIndex, highestCompletedIndex);
  const activePercentage = targetIndex >= 0 
    ? (targetIndex / (journeySteps.length - 1)) * 100 
    : (completedCount / journeySteps.length) * 100;

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* SideNavBar */}
      <aside className={`fixed left-0 top-0 h-full w-[260px] bg-surface-container-low flex-col justify-between z-50 border-r border-outline-variant/20 overflow-y-auto ${
        isOpen ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="flex-1 flex flex-col">
          {/* Brand */}
          <div className="flex items-center justify-between gap-sm px-5 pt-5 pb-4">
            <MyCareerLogo className="h-9" showText={true} />
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
              title="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main CTA - Copilot */}
          <div className="px-3 mb-2">
            <button
              onClick={() => { setActiveTab('dashboard'); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'ai-gradient text-white shadow-lg shadow-primary-container/20'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" size={20} />
              <span>Meu Copiloto</span>
            </button>
          </div>

          {/* Journey Section */}
          <div className="px-3 mt-2">
            <div className="flex items-center justify-between px-3 mb-3">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Sua Jornada</span>
              <ProgressRing value={journeyProgress} size={28} strokeWidth={3} showValue={false} label={
                <span className="text-[8px] font-bold text-primary">{journeyProgress}%</span>
              } />
            </div>

            <nav className="space-y-1 relative">
              {/* Vertical progress line */}
              <div className="absolute left-[26px] top-4 bottom-4 w-[2px] bg-outline-variant/40 dark:bg-outline-variant/20 rounded-full" />
              <div
                className="absolute left-[26px] top-4 w-[2px] bg-primary rounded-full transition-all duration-700"
                style={{ height: `${Math.max(5, activePercentage)}%` }}
              />

              {journeySteps.map(step => (
                <button
                  key={step.id}
                  onClick={() => { setActiveTab(step.id); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 relative group ${
                    step.active
                      ? 'bg-primary-container/15 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {/* Step indicator */}
                  <div className="relative z-10 shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors border ${
                      step.completed
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        : step.active
                          ? 'bg-primary-container/30 text-primary border-primary'
                          : 'bg-surface border-outline-variant text-on-surface-variant/70'
                    }`}>
                      {getStepIcon(step.id, "w-3.5 h-3.5")}
                    </div>
                    {step.completed && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 text-white rounded-full flex items-center justify-center border border-surface text-[7px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold block truncate ${
                      step.active 
                        ? 'text-primary font-bold' 
                        : 'text-on-surface/90 group-hover:text-on-surface'
                    }`}>
                      {step.label}
                    </span>
                    <span className={`text-[10px] block truncate ${
                      step.completed 
                        ? 'text-emerald-500/90 font-medium' 
                        : 'text-on-surface-variant/80'
                    }`}>
                      {step.description}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Utility Links */}
          <div className="px-3 mt-6">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Geral</span>
            </div>
            {utilityItems.filter(i => i.id !== 'dashboard').map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-container/15 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {getUtilityIcon(item.id, `w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`)}
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-outline-variant/20 p-3 flex-shrink-0">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-high/30 border border-outline-variant/10">
            <div className="flex items-center gap-2.5 min-w-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-8 w-8 rounded-full object-cover border border-outline-variant/30 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                  onClick={() => setActiveTab('settings')}
                />
              ) : (
                <div
                  onClick={() => setActiveTab('settings')}
                  className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs border border-outline-variant/30 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                >
                  {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-on-surface truncate">
                  {profile?.fullName || 'Usuário'}
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] text-on-surface-variant truncate max-w-[80px]">
                    {profile?.headline || 'Candidato'}
                  </span>
                  <span className="px-1 py-0.2 bg-primary/20 text-primary text-[8px] font-extrabold rounded border border-primary/30 tracking-wider">
                    PRO
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center shrink-0"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container shadow-[0_-2px_10px_rgba(0,0,0,0.3)] flex justify-around items-center py-1.5 z-50 border-t border-outline-variant/10">
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
            if (id === 'dashboard') return <LayoutDashboard className={className} size={18} />;
            return getStepIcon(id, className);
          };

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors relative ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {step?.completed && !isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-surface-container" />
              )}
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                {renderMobileIcon(item.id, "w-4.5 h-4.5")}
              </div>
              <span className="text-[9px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
