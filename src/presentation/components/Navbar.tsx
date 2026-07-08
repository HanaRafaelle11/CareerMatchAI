import { LayoutDashboard, User, LogOut, Compass, FileText, Briefcase, Award, X, Upload } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import type { Profile } from '../../domain/models/types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: Profile | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Navbar({ activeTab, setActiveTab, profile, onLogout, isOpen, onClose }: NavbarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume-upload', label: 'Enviar Currículo', icon: Upload },
    { id: 'profile', label: 'Meu Currículo', icon: FileText },
    { id: 'career-profile', label: 'Meu Perfil', icon: User },
    { id: 'strategy', label: 'Minha Estratégia', icon: Briefcase },
    { id: 'match', label: 'Match Manual', icon: Compass },
    { id: 'coach', label: 'AI Coach', icon: Award }
  ];

  return (
    <>
      {/* Backdrop para fechar o menu no mobile ao clicar fora */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-64 border-r border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50/90 backdrop-blur-md flex flex-col justify-between p-6 z-40 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-display font-bold text-white text-base shadow-lg shadow-brand-500/20">
                CM
              </div>
              <span className="font-display font-bold text-lg bg-gradient-to-r from-white to-slate-400 dark:from-white dark:to-slate-400 light:from-slate-900 light:to-slate-600 bg-clip-text text-transparent">
                CareerMatch AI
              </span>
            </div>
            {/* Botão de Fechar no Mobile */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-900/50 dark:hover:bg-slate-900/50 light:hover:bg-slate-200/50 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                      : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:bg-slate-900/40 dark:hover:bg-slate-900/40 light:hover:bg-slate-200/50 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      <div className="flex flex-col gap-4">
        {/* Theme and Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 dark:border-slate-800 light:border-slate-200 pt-4">
          <span className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-400">Modo de Cores</span>
          <ThemeToggle />
        </div>

        {/* User profile card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/20 dark:bg-slate-900/20 light:bg-slate-100/50 border border-slate-900 dark:border-slate-900 light:border-slate-200">
          <div className="flex items-center gap-3">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-9 w-9 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-display font-semibold text-sm border border-indigo-500/30">
                {profile?.fullName?.charAt(0).toUpperCase() || 'C'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 truncate max-w-[120px]">
                {profile?.fullName || 'Carregando...'}
              </span>
              <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                {profile?.headline || 'Candidato'}
              </span>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  </>
  );
}
