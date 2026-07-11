import React from 'react';
import { 
  AlertTriangle, AlertCircle, RefreshCw, HelpCircle, Loader2, Sparkles, 
  ShieldAlert, FileText, Cpu, Briefcase, CheckCircle, Circle, MailCheck
} from 'lucide-react';
import { CardGlass } from './CardGlass';
import { AppError, ERROR_CATALOG } from '../../application/errors/AppError';

interface ErrorStateProps {
  error: any;
  onRetry?: () => void;
  onAction?: () => void;
}

export function ErrorState({ error, onRetry, onAction }: ErrorStateProps) {
  const appError = AppError.from(error);
  const isError = appError.severity === 'error';

  // Ícone contextual com base no código do erro
  const getContextIcon = () => {
    const code = appError.code;
    if (code.includes('AUTH') || code.includes('RLS') || code.includes('SECURITY')) {
      return <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={24} />;
    }
    if (code.includes('RESUME') || code.includes('PARSE') || code.includes('PDF')) {
      return <FileText className="text-blue-400 shrink-0 mt-0.5" size={24} />;
    }
    if (code.includes('AI') || code.includes('GEMINI')) {
      return <Cpu className="text-purple-400 shrink-0 mt-0.5" size={24} />;
    }
    if (code.includes('JOB') || code.includes('SEARCH') || code.includes('ADZUNA')) {
      return <Briefcase className="text-amber-400 shrink-0 mt-0.5" size={24} />;
    }
    return isError ? (
      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={24} />
    ) : (
      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={24} />
    );
  };

  return (
    <CardGlass className={`border-l-4 ${isError ? 'border-l-red-500/80' : 'border-l-amber-500/80'} p-6 space-y-4`}>
      <div className="flex items-start gap-4">
        {getContextIcon()}
        <div className="space-y-1.5 flex-1">
          <h4 className="font-display font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800">
            {appError.title}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {appError.message}
          </p>
          
          {ERROR_CATALOG[appError.code] && (() => {
            const item = ERROR_CATALOG[appError.code];
            return (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-900/60 space-y-1.5 text-[11px] font-sans leading-relaxed text-slate-400 animate-fade-in">
                <div>
                  <strong className="text-brand-400 block text-[9px] uppercase font-extrabold tracking-wider mb-1">Diagnóstico Detalhado</strong>
                </div>
                <div>
                  <strong className="text-slate-300">Causa provável:</strong> {item.cause}
                </div>
                <div>
                  <strong className="text-slate-300">Impacto no sistema:</strong> {item.impact}
                </div>
                <div>
                  <strong className="text-slate-300">Recomendação:</strong> {item.recommendation}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-900/60">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {appError.retryable && onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 transition text-xs text-white font-semibold font-display shadow-md shadow-brand-500/10 cursor-pointer"
            >
              <RefreshCw size={12} className="animate-spin-hover" />
              Tentar Novamente
            </button>
          )}
          {appError.action && onAction && (!appError.retryable || appError.action.toLowerCase() !== 'tentar novamente') && (
            <button
              onClick={onAction}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-xs text-slate-350 font-semibold font-display cursor-pointer"
            >
              {appError.action}
            </button>
          )}
          <a
            href="mailto:suporte@careermatch.ai?subject=Relato%20de%20Erro%20CareerMatch"
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 transition font-medium"
          >
            <MailCheck size={11} />
            Reportar problema
          </a>
        </div>
        
        {/* Código do erro em modo menor (apenas para depuração) */}
        <span className="text-[9px] text-slate-600 font-mono self-end sm:self-center">
          Código: {appError.code}
        </span>
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
  suggestions?: string[];
}

export function EmptyState({ title, message, actionText, onAction, icon, suggestions }: EmptyStateProps) {
  return (
    <CardGlass className="flex flex-col items-center justify-center p-6 sm:p-12 text-center space-y-5">
      <div className="p-3 sm:p-4 rounded-full bg-slate-900/60 border border-slate-850 text-slate-500">
        {icon || <HelpCircle size={28} />}
      </div>
      
      <div className="max-w-md space-y-2">
        <h4 className="font-display font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800">
          {title}
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          {message}
        </p>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="w-full max-w-[280px] sm:max-w-xs text-left p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 space-y-1.5 mx-auto">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Sugestões:</span>
          <ul className="space-y-1 text-slate-400 text-[11px] leading-normal list-outside pl-4 list-disc">
            {suggestions.map((sug, i) => (
              <li key={i} className="break-words">{sug}</li>
            ))}
          </ul>
        </div>
      )}

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-xs text-brand-400 font-bold transition font-display cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </CardGlass>
  );
}

interface PipelineStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
}

interface ProcessingStateProps {
  title: string;
  subtitle?: string;
  steps?: PipelineStep[];
  expectedTime?: string;
}

export function ProcessingState({ title, subtitle, steps, expectedTime }: ProcessingStateProps) {
  // Calcular porcentagem estimada baseada nos passos concluídos
  const calculateProgress = () => {
    if (!steps || steps.length === 0) return 0;
    const completedCount = steps.filter(s => s.status === 'success').length;
    const runningCount = steps.filter(s => s.status === 'running').length;
    
    // Cada etapa completada contribui igualmente. A etapa atual soma metade do seu peso.
    const stepWeight = 100 / steps.length;
    const baseProgress = completedCount * stepWeight;
    const runningBonus = runningCount * (stepWeight / 2);
    
    return Math.min(100, Math.round(baseProgress + runningBonus));
  };

  const progressPercent = calculateProgress();

  return (
    <CardGlass className="w-full max-w-md mx-auto flex flex-col items-center justify-center p-5 sm:p-8 text-center space-y-5 sm:space-y-6 relative overflow-hidden">
      {/* Indicador superior */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-brand-500/10 blur-xl animate-pulse" />
        <div className="p-3.5 sm:p-4 rounded-full bg-slate-950 border border-slate-800 text-brand-500 relative z-10 animate-bounce">
          <Sparkles size={22} />
        </div>
        <Loader2 className="absolute text-brand-500/40 animate-spin" size={48} strokeWidth={1} />
      </div>

      <div className="space-y-1.5 z-10 max-w-sm">
        <h4 className="font-display font-bold text-sm text-slate-200 dark:text-slate-200 light:text-slate-800 animate-pulse leading-snug">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs text-slate-500 leading-relaxed font-sans px-1">
            {subtitle}
          </p>
        )}
      </div>

      {expectedTime && (
        <div className="text-[10px] text-brand-400 font-bold font-display z-10 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 select-none">
          ⏱ {expectedTime}
        </div>
      )}

      {/* Renderizar progresso com etapas se disponível */}
      {steps && steps.length > 0 ? (
        <div className="w-full max-w-[280px] sm:max-w-xs space-y-4 pt-1 z-10 text-left">
          {/* Barra de progresso visual */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span className="uppercase font-display tracking-wider">Progresso da análise</span>
              <span className="text-brand-500">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out shadow-sm shadow-brand-500/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Listagem das etapas individuais */}
          <div className="space-y-2 rounded-xl bg-slate-950/60 border border-slate-900 p-3 sm:p-3.5">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-xxs font-medium font-sans">
                <span className={`leading-tight flex-1 break-words ${
                  s.status === 'success' ? 'text-slate-450 line-through' :
                  s.status === 'running' ? 'text-brand-400 font-bold' :
                  'text-slate-650'
                }`}>
                  {idx + 1}. {s.label}
                </span>

                <div className="shrink-0">
                  {s.status === 'success' && <CheckCircle size={12} className="text-emerald-500" />}
                  {s.status === 'running' && <Loader2 size={12} className="text-brand-500 animate-spin" />}
                  {s.status === 'pending' && <Circle size={10} className="text-slate-800" />}
                  {s.status === 'error' && <AlertCircle size={12} className="text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Barra de progresso genérica
        <div className="w-full max-w-[280px] sm:max-w-xs space-y-1.5 pt-1">
          <div className="h-1.5 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full animate-progress-loading" />
          </div>
        </div>
      )}
    </CardGlass>
  );
}
