import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessageOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (messageOrOptions: string | ToastMessageOptions, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6500,
  neutral: 4000
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((messageOrOptions: string | ToastMessageOptions, type: ToastType = 'success', duration?: number) => {
    let message = '';
    let effectiveType: ToastType = type;
    let effectiveDuration = duration;
    let action: ToastAction | undefined;

    if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
      message = messageOrOptions.message || '';
      effectiveType = messageOrOptions.type || 'success';
      effectiveDuration = messageOrOptions.duration || DEFAULT_DURATIONS[effectiveType];
      action = messageOrOptions.action;
    } else {
      message = String(messageOrOptions || '');
      effectiveDuration = duration || DEFAULT_DURATIONS[effectiveType];
    }

    if (!message) return;

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newItem: ToastItem = {
      id,
      message,
      type: effectiveType,
      duration: effectiveDuration,
      action
    };

    setToasts(prev => {
      // Evitar duplicar toasts idênticos que já estejam visíveis
      const isDuplicate = prev.some(t => t.message === message && t.type === effectiveType);
      if (isDuplicate) {
        return prev;
      }
      // Limitar a no máximo 2 toasts simultâneos para não poluir a tela
      const trimmed = prev.length >= 2 ? prev.slice(1) : prev;
      return [...trimmed, newItem];
    });

    setTimeout(() => {
      hideToast(id);
    }, effectiveDuration);
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast Global Container — Posicionado estritamente no Canto Superior Direito com margem segura */}
      <div className="fixed top-20 md:top-24 right-4 md:right-6 z-[99999] pointer-events-none flex flex-col gap-2.5 max-w-sm md:max-w-md w-full">
        {toasts.map(t => {
          const bgStyles = {
            success: 'bg-emerald-950/95 light:bg-emerald-50 border-emerald-500/50 light:border-emerald-300 text-emerald-100 light:text-emerald-900 shadow-emerald-500/10',
            error: 'bg-red-950/95 light:bg-red-50 border-red-500/50 light:border-red-300 text-red-100 light:text-red-900 shadow-red-500/10',
            warning: 'bg-amber-950/95 light:bg-amber-50 border-amber-500/50 light:border-amber-300 text-amber-100 light:text-amber-900 shadow-amber-500/10',
            info: 'bg-blue-950/95 light:bg-blue-50 border-blue-500/50 light:border-blue-300 text-blue-100 light:text-blue-900 shadow-blue-500/10',
            neutral: 'bg-slate-900/95 light:bg-slate-100 border-slate-700/50 light:border-slate-300 text-slate-100 light:text-slate-900 shadow-slate-500/10'
          }[t.type];

          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
            neutral: Info
          }[t.type];

          const iconColors = {
            success: 'text-emerald-400 light:text-emerald-600',
            error: 'text-red-400 light:text-red-600',
            warning: 'text-amber-400 light:text-amber-600',
            info: 'text-blue-400 light:text-blue-600',
            neutral: 'text-slate-400 light:text-slate-600'
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-xl text-xs font-medium transition-all animate-slide-in ${bgStyles}`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Icon size={18} className={`shrink-0 ${iconColors}`} />
                <span className="leading-snug break-words">{t.message}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      hideToast(t.id);
                      t.action?.onClick();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] transition-colors cursor-pointer border border-white/20"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => hideToast(t.id)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white shrink-0 cursor-pointer"
                  title="Fechar notificação"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg: string | ToastMessageOptions) => console.log('[Toast Fallback]', msg),
      hideToast: () => {}
    };
  }
  return context;
}
