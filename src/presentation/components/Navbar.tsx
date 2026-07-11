import type { Profile } from '../../domain/models/types';
import { useEffect } from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: Profile | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function Navbar({ activeTab, setActiveTab, profile, onLogout, isOpen, onClose, isAdmin }: NavbarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: 'dashboard' },
    { id: 'profile', label: 'Currículo', icon: 'description' },
    { id: 'career-profile', label: 'Configurações de Busca', icon: 'search' },
    { id: 'match', label: 'Central de Compatibilidade', icon: 'analytics' },
    { id: 'strategy', label: 'Estratégia de Vagas', icon: 'track_changes' },
    { id: 'coach', label: 'Desenvolvimento & Coach', icon: 'psychology' },
    { id: 'notifications', label: 'Central de Notificações', icon: 'notifications' },
    { id: 'settings', label: 'Configurações', icon: 'settings' }
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Admin', icon: 'shield' });
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

  return (
    <>
      {/* SideNavBar (Desktop) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low hidden md:flex flex-col justify-between p-md z-50 border-r border-outline-variant/20 overflow-y-auto">
        <div>
        <div className="flex items-center gap-sm mb-xl px-sm">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary leading-tight">MyCareer AI</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Premium Copilot</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-md p-md rounded-lg font-bold transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container scale-[0.98]'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'fill-icon' : ''}`}>{item.icon}</span>
                <span className="font-label-md text-label-md">{item.label}</span>
              </button>
            );
          })}
        </nav>
        </div>

        <div className="border-t border-outline-variant/20 pt-md space-y-3 flex-shrink-0">
          {/* User profile card in sidebar */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-high/40 border border-outline-variant/20">
            <div className="flex items-center gap-3">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-9 w-9 rounded-full object-cover border border-outline-variant/35 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setActiveTab('settings')}
                />
              ) : (
                <div 
                  onClick={() => setActiveTab('settings')}
                  className="h-9 w-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm border border-outline-variant/35 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex flex-col overflow-hidden max-w-[120px]">
                <span className="text-xs font-semibold text-on-surface truncate">
                  {profile?.fullName || 'Usuário'}
                </span>
                <span className="text-[10px] text-on-surface-variant truncate">
                  {profile?.headline || 'Candidato'}
                </span>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
              title="Sair"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container shadow-[0_-2px_10px_rgba(0,0,0,0.3)] flex justify-around items-center py-sm z-50 border-t border-outline-variant/10">
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-xs transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'fill-icon' : ''}`}>{item.icon}</span>
              <span className="text-[10px] uppercase font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
