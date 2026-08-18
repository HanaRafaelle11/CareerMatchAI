import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export function Toast({ toast, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-950/95 light:bg-emerald-50 border-emerald-500/50 light:border-emerald-300 text-emerald-100 light:text-emerald-900',
    error: 'bg-red-950/95 light:bg-red-50 border-red-500/50 light:border-red-300 text-red-100 light:text-red-900',
    warning: 'bg-amber-950/95 light:bg-amber-50 border-amber-500/50 light:border-amber-300 text-amber-100 light:text-amber-900',
    info: 'bg-blue-950/95 light:bg-blue-50 border-blue-500/50 light:border-blue-300 text-blue-100 light:text-blue-900',
    neutral: 'bg-slate-900/95 light:bg-slate-100 border-slate-700/50 light:border-slate-300 text-slate-100 light:text-slate-900'
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    neutral: Info
  }[toast.type];

  const iconColors = {
    success: 'text-emerald-400 light:text-emerald-600',
    error: 'text-red-400 light:text-red-600',
    warning: 'text-amber-400 light:text-amber-600',
    info: 'text-blue-400 light:text-blue-600',
    neutral: 'text-slate-400 light:text-slate-600'
  }[toast.type];

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[9999] animate-slide-up max-w-sm md:max-w-md">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-medium ${bgStyles}`}>
        <Icon size={18} className={`shrink-0 ${iconColors}`} />
        <span className="flex-1 leading-snug">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              onClose();
              toast.action?.onClick();
            }}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] transition-colors cursor-pointer border border-white/20 shrink-0"
          >
            {toast.action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white shrink-0 cursor-pointer"
          title="Fechar notificação"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
