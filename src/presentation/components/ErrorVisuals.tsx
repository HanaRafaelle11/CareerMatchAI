import React from 'react';
import { AlertTriangle, AlertCircle, RefreshCw, HelpCircle, Loader2, Sparkles } from 'lucide-react';
import { CardGlass } from './CardGlass';
import { AppError } from '../../application/errors/AppError';

interface ErrorStateProps {
  error: any;
  onRetry?: () => void;
  onAction?: () => void;
}

export function ErrorState({ error, onRetry, onAction }: ErrorStateProps) {
  const appError = AppError.from(error);
  const isError = appError.severity === 'error';

  return (
    <CardGlass className={`border-l-4 ${isError ? 'border-l-red-500' : 'border-l-amber-500'} p-6 space-y-4`}>
      <div className="flex items-start gap-3.5">
        {isError ? (
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
        ) : (
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        )}
        <div className="space-y-1">
          <h4 className="font-display font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800">
            {appError.title}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {appError.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {appError.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-500 hover:bg-brand-600 transition text-xs text-white font-semibold font-display shadow"
          >
            <RefreshCw size={12} className="animate-spin-hover" />
            Tentar Novamente
          </button>
        )}
        {appError.action && onAction && (
          <button
            onClick={onAction}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition text-xs text-slate-300 font-semibold font-display"
          >
            {appError.action}
          </button>
        )}
      </div>
    </CardGlass>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, actionText, onAction, icon }: EmptyStateProps) {
  return (
    <CardGlass className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="p-3.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-500">
        {icon || <HelpCircle size={24} />}
      </div>
      <div className="max-w-md space-y-1.5">
        <h4 className="font-display font-bold text-sm text-slate-300 dark:text-slate-300 light:text-slate-800">
          {title}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          {message}
        </p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-xs text-brand-400 font-bold transition font-display"
        >
          {actionText}
        </button>
      )}
    </CardGlass>
  );
}

interface ProcessingStateProps {
  title: string;
  subtitle?: string;
}

export function ProcessingState({ title, subtitle }: ProcessingStateProps) {
  return (
    <CardGlass className="flex flex-col items-center justify-center p-12 text-center space-y-4 relative overflow-hidden">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-brand-500/10 blur-xl animate-pulse" />
        <div className="p-4 rounded-full bg-slate-950 border border-slate-800 text-brand-500 relative z-10 animate-bounce">
          <Sparkles size={24} />
        </div>
        <Loader2 className="absolute text-brand-500/40 animate-spin" size={56} strokeWidth={1} />
      </div>
      <div className="space-y-1 z-10">
        <h4 className="font-display font-bold text-sm text-slate-300 dark:text-slate-300 light:text-slate-800 animate-pulse">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
    </CardGlass>
  );
}
