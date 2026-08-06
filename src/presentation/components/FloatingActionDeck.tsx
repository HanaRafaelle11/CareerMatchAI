import { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, Bell, CheckCheck, X, AlertTriangle, Building2, Briefcase } from 'lucide-react';
import { SupportFeedbackModal } from './SupportFeedbackModal';
import type { Notification } from '../../domain/models/types';

interface FloatingActionDeckProps {
  userId?: string;
  userEmail?: string;
  notifications: Notification[];
  markAllNotificationsAsRead: () => Promise<any>;
  onOpenCopilot: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export function FloatingActionDeck({
  userId,
  userEmail,
  notifications,
  markAllNotificationsAsRead,
  onOpenCopilot,
  onNavigateToTab
}: FloatingActionDeckProps) {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fechar popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.warn('[FloatingActionDeck] Erro ao marcar notificações como lidas:', err);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'desired_company':
        return <Building2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />;
      case 'inactivity':
        return <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />;
      case 'job_alert':
      default:
        return <Briefcase size={15} className="text-brand-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <>
      <div 
        ref={popoverRef}
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6 right-4 md:right-6 z-[60] flex flex-col items-end gap-2.5 font-sans pointer-events-none select-none"
      >
        {/* POP-OVER DE NOTIFICAÇÕES (Ancorado acima dos botões) */}
        {isNotificationsOpen && (
          <div className="pointer-events-auto w-80 max-w-[calc(100vw-32px)] bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 rounded-2xl shadow-2xl backdrop-blur-xl p-4 animate-scale-up text-slate-100 dark:text-slate-100 light:text-slate-800 mb-1 z-50">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-brand-400" />
                <h4 className="font-extrabold text-xs tracking-tight">Notificações</h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold border border-brand-500/30">
                    {unreadCount} nova(s)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors cursor-pointer"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck size={13} />
                    <span>Marcar lidas</span>
                  </button>
                )}
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Lista de Notificações com Scroll */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Nenhuma notificação no momento.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (onNavigateToTab) {
                        onNavigateToTab('match');
                        setIsNotificationsOpen(false);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs transition-all flex gap-2.5 cursor-pointer ${
                      !n.isRead 
                        ? 'bg-slate-800/90 border-brand-500/30 text-slate-100 shadow-sm' 
                        : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    {getNotificationIcon(n.type)}
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] truncate text-slate-200">{n.title}</span>
                        <span className="text-[9px] text-slate-400 shrink-0">
                          {new Date(n.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* BOTÃO 1 (TOPO): Copiloto IA */}
        <button
          type="button"
          onClick={onOpenCopilot}
          className="pointer-events-auto px-4 py-2.5 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95 border border-brand-400/30 group"
          title="Abrir Copiloto IA"
        >
          <Sparkles size={15} className="text-amber-300 animate-pulse shrink-0" />
          <span className="tracking-tight">Copiloto IA</span>
        </button>

        {/* BOTÃO 2 (MEIO): Suporte VoCentro */}
        <button
          type="button"
          onClick={() => setIsSupportOpen(true)}
          className="pointer-events-auto px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800/95 border border-slate-700/80 hover:border-brand-500/50 text-slate-100 font-bold text-xs shadow-2xl flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95 backdrop-blur-md group"
          title="Abrir Suporte & Feedback"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <MessageSquare size={14} className="text-brand-400 group-hover:text-brand-300 transition-colors shrink-0" />
          <span className="tracking-tight">Suporte</span>
        </button>

        {/* BOTÃO 3 (FUNDO): Notificações (Sino Circular Compacto) */}
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(prev => !prev)}
          className={`pointer-events-auto relative w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md border ${
            isNotificationsOpen
              ? 'bg-brand-500 border-brand-400 text-white'
              : 'bg-slate-900/95 hover:bg-slate-800/95 border-slate-700/80 text-slate-200 hover:text-white hover:border-brand-500/50'
          }`}
          title="Notificações"
        >
          <Bell size={18} className={unreadCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-300'} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-extrabold border-2 border-slate-950 shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <SupportFeedbackModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        userId={userId}
        userEmail={userEmail}
      />
    </>
  );
}
