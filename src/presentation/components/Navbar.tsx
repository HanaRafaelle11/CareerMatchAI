import type { Profile } from '../../domain/models/types';
import { useEffect } from 'react';
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
      completed: interviewCount > 0,
      active: activeTab === 'coach',
      description: interviewCount > 0 ? `${interviewCount} simulaç${interviewCount > 1 ? 'ões' : 'ão'}` : 'Assistente & Treino'
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
      case 'profile': return <User className={className} size={15} strokeWidth={1.5} />;
      case 'match': return <Briefcase className={className} size={15} strokeWidth={1.5} />;
      case 'strategy': return <Target className={className} size={15} strokeWidth={1.5} />;
      case 'coach': return <Sparkles className={className} size={15} strokeWidth={1.5} />;
      default: return null;
    }
  };

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

      {/* SideNavBar — Linear Pure Minimalist Sidebar (No background/pill/border for active item) */}
      <aside className={`fixed left-0 top-0 h-full w-[240px] bg-[#FAFBFC] dark:bg-[#202632] flex-col justify-between z-50 border-r border-slate-200/80 dark:border-white/8 overflow-y-auto ${
        isOpen ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="flex-1 flex flex-col">
          {/* Brand */}
          <div className="flex items-center justify-between gap-sm px-5 pt-5 pb-4">
            <VocentroLogo className="h-7" showText={true} />
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-white/8 text-slate-400 hover:text-slate-600 transition-colors"
              title="Fechar menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* Main Navigation — Linear Style (Text & Icon blue only, zero background) */}
          <div className="px-3.5 mb-2">
            <button
              onClick={() => { setActiveTab('dashboard'); onClose(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-[#4F8EF7]'
                  : 'text-slate-600 dark:text-[#B8C2CC] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-[#4F8EF7]' : 'text-slate-400 dark:text-slate-500'}`} size={15} strokeWidth={1.5} />
              <span>Meu Copiloto</span>
            </button>
          </div>

          {/* Journey Section */}
          <div className="px-3.5 mt-2">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jornada</span>
              <ProgressRing value={journeyProgress} size={18} strokeWidth={2} showValue={false} label={
                <span className="text-[8px] font-bold text-[#4F8EF7]">{journeyProgress}%</span>
              } />
            </div>

            <nav className="space-y-0.5">
              {journeySteps.map(step => (
                <button
                  key={step.id}
                  onClick={() => { setActiveTab(step.id); onClose(); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left transition-colors ${
                    step.active
                      ? 'text-[#4F8EF7] font-medium'
                      : 'text-slate-600 dark:text-[#B8C2CC] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`shrink-0 ${step.active ? 'text-[#4F8EF7]' : step.completed ? 'text-[#22C7A8]' : 'text-slate-400 dark:text-slate-500'}`}>
                    {getStepIcon(step.id, "w-4 h-4")}
                  </div>

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
                </button>
              ))}
            </nav>
          </div>

          {/* Utility Links */}
          <div className="px-3.5 mt-4 space-y-1 pb-20 md:pb-2">
            <div className="px-3 mb-1.5">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Geral</span>
            </div>
            {utilityItems.filter(i => i.id !== 'dashboard').map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); onClose(); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-[#4F8EF7] font-medium'
                      : 'text-slate-600 dark:text-[#B8C2CC] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {getUtilityIcon(item.id, `w-4 h-4 shrink-0 ${isActive ? 'text-[#4F8EF7]' : 'text-slate-400 dark:text-slate-500'}`)}
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Botao de Sair visivel no menu para facil acesso mobile */}
            <button
              onClick={() => { onClose(); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" size={16} strokeWidth={1.5} />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>

        {/* CTA Banner Seja Pro */}
        <div className="mx-3 p-3 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-emerald-500/10 border border-amber-500/20 rounded-xl space-y-1.5 my-2">
          <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-[11px]">
            <Sparkles size={13} />
            <span>VOCENTRO PRO</span>
          </div>
          <p className="text-[10px] text-slate-300">Destrave simulações ilimitadas e exportação em PDF.</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open_checkout_modal'))}
            className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow cursor-pointer transition-all flex items-center justify-center gap-1"
          >
            <span>Seja Pro</span>
            <Sparkles size={12} />
          </button>
        </div>

        {/* User Profile Footer (Com margem inferior no mobile para evitar sobreposicao com a Bottom Bar) */}
        <div className="border-t border-slate-200/80 dark:border-white/8 p-3 flex-shrink-0 mb-16 md:mb-0">
          <div className="flex items-center justify-between p-1.5 rounded-md">
            <div className="flex items-center gap-2.5 min-w-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-white/10 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                  onClick={() => setActiveTab('settings')}
                />
              ) : (
                <div
                  onClick={() => setActiveTab('settings')}
                  className="h-6 w-6 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                >
                  {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-800 dark:text-[#F8FAFC] truncate">
                  {profile?.fullName || 'Usuário'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {profile?.headline || 'Candidato PRO'}
                </span>
              </div>
            </div>

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
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#FAFBFC] dark:bg-[#202632] flex justify-around items-center py-1.5 z-50 border-t border-slate-200 dark:border-white/8">
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
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors relative ${
                isActive ? 'text-[#4F8EF7]' : 'text-slate-400 dark:text-[#B8C2CC]'
              }`}
            >
              {step?.completed && !isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#22C7A8] rounded-full" />
              )}
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                {renderMobileIcon(item.id, "w-4.5 h-4.5")}
              </div>
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
