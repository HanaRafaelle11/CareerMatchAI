import { 
  Trophy, 
  Calendar, 
  AlertCircle, 
  MessageSquare, 
  Clock, 
  FileUp, 
  UserCheck, 
  Sparkles, 
  Compass, 
  ArrowRight,
  Target
} from 'lucide-react';
import type { NextStepAction } from '../../domain/services/NextStepService';
import { tracker } from '../../infrastructure/analytics/tracker';

interface NextStepCardProps {
  action: NextStepAction;
  isLoading?: boolean;
  onExecuteAction: (tab: string, payload?: any) => void;
}

export function NextStepCard({ action, isLoading = false, onExecuteAction }: NextStepCardProps) {
  if (isLoading) {
    return (
      <section 
        aria-label="Carregando seu próximo passo" 
        className="w-full rounded-2xl p-6 bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 shadow-xs animate-pulse space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 dark:bg-slate-700/60 rounded-md w-40" />
          <div className="h-6 bg-slate-200 dark:bg-slate-700/60 rounded-full w-28" />
        </div>
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 dark:bg-slate-700/60 rounded-lg w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded-md w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded-md w-2/3" />
        </div>
        <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-white/6">
          <div className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded w-48" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700/60 rounded-xl w-36" />
        </div>
      </section>
    );
  }

  const renderIcon = () => {
    const props = { size: 22, className: 'shrink-0', strokeWidth: 1.75 };
    switch (action.icon) {
      case 'trophy':
        return <Trophy {...props} className="text-amber-500" />;
      case 'calendar':
        return <Calendar {...props} className="text-brand-500" />;
      case 'alert-circle':
        return <AlertCircle {...props} className="text-rose-500" />;
      case 'message-square':
        return <MessageSquare {...props} className="text-sky-500" />;
      case 'clock':
        return <Clock {...props} className="text-amber-500" />;
      case 'file-up':
        return <FileUp {...props} className="text-indigo-500" />;
      case 'user-check':
        return <UserCheck {...props} className="text-emerald-500" />;
      case 'sparkles':
        return <Sparkles {...props} className="text-brand-400" />;
      case 'compass':
      default:
        return <Compass {...props} className="text-brand-500" />;
    }
  };

  const badgeStyles = {
    success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    danger: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    info: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
    brand: 'bg-indigo-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-indigo-200 dark:border-brand-500/20',
  };

  const handleCtaClick = () => {
    tracker.track('next_step_clicked', 'Dashboard', {
      action_type: action.type,
      target_tab: action.ctaTab,
      urgency_score: action.urgencyScore
    });
    onExecuteAction(action.ctaTab, action.ctaPayload);
  };

  return (
    <section 
      aria-label="Seu próximo passo sugerido"
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#242B36] border border-slate-200/90 dark:border-white/8 shadow-sm transition-all hover:shadow-md animate-fade-in font-sans"
    >
      {/* Glow sutil de destaque no topo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 opacity-90" />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Cabeçalho do Card: Tag "🎯 Seu Próximo Passo" + Badge de Contexto */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500 dark:text-brand-400">
              <Target size={16} strokeWidth={2} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Seu Próximo Passo
            </span>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${badgeStyles[action.badgeVariant] || badgeStyles.brand}`}>
            {action.badgeText}
          </span>
        </div>

        {/* Bloco Central: Ícone, Título, Subtítulo e Descrição Humanizada */}
        <div className="flex items-start gap-4 pt-1">
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/8 shrink-0 mt-0.5">
            {renderIcon()}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug">
              {action.title}
            </h2>
            {action.subtitle && (
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {action.subtitle}
              </p>
            )}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8C2CC] leading-relaxed">
              {action.description}
            </p>
          </div>
        </div>

        {/* Rodapé: Motivo / Justificativa + Único CTA Dominante */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            {action.reason ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                {action.reason}
              </span>
            ) : (
              <span>Orientação contextual baseada no momento da sua busca.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 via-indigo-600 to-brand-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-[#242B36]"
          >
            <span>{action.ctaLabel}</span>
            <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
