import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
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
    success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
    error: 'bg-red-950/90 border-red-500/50 text-red-200',
    warning: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
    info: 'bg-blue-950/90 border-blue-500/50 text-blue-200'
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }[toast.type];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up max-w-md">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium ${bgStyles}`}>
        <Icon size={18} className="shrink-0" />
        <span className="flex-1 leading-snug">{toast.message}</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
