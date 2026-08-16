import { useState, useRef, useEffect } from 'react';
import type { Resume } from '../../../domain/models/types';
import { FileText, HelpCircle, RefreshCw, Check, Settings, Sparkles } from 'lucide-react';

interface CompactHeaderProps {
  userName: string;
  activeResume: Resume | null;
  onSwitchResume?: () => void;
  onReanalyze?: () => void;
  className?: string;
  resumes?: Resume[];
  onSelectResume?: (resumeVersionId: string) => void;
}

export function CompactHeader({
  activeResume,
  onSwitchResume,
  onReanalyze,
  className = '',
  resumes = [],
  onSelectResume
}: CompactHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lastUpdate = activeResume?.updatedAt
    ? new Date(activeResume.updatedAt)
    : null;

  const timeSinceUpdate = lastUpdate
    ? formatRelativeTime(lastUpdate)
    : null;

  return (
    <div className={`w-full px-1 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${className}`}>
      {/* Left side: Resume info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Resume icon */}
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <FileText size={16} />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[9px] uppercase font-semibold text-on-surface-variant tracking-wider flex items-center gap-1 select-none">
            Currículo em Análise
            <span title="Todas as sugestões de vagas, Match e simulações do copiloto são calculadas com base neste currículo selecionado.">
              <HelpCircle size={10} className="cursor-help opacity-60 hover:opacity-100" />
            </span>
          </span>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {activeResume ? (
              <>
                <span className="text-xs font-semibold text-on-surface truncate max-w-[200px] hover:underline cursor-help" title="Todas as sugestões de vagas, Match e simulações do copiloto são calculadas com base neste currículo selecionado.">
                  {activeResume.fileName || 'Currículo ativo'}
                </span>
                {timeSinceUpdate && (
                  <span className="text-[10px] text-on-surface-variant hidden sm:inline">
                    ({timeSinceUpdate})
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-on-surface-variant">
                Nenhum currículo ativo — envie seu CV para começar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      {activeResume && (
        <div className="flex items-center gap-2 shrink-0 relative" ref={dropdownRef}>
          {onSwitchResume && (
            <>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700 dark:border-slate-700 light:border-slate-300 shadow-xs"
              >
                <RefreshCw size={12} />
                Trocar CV
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-72 rounded-2xl bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl z-50 p-2 flex flex-col gap-1">
                  <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 light:text-slate-500 tracking-wider border-b border-slate-800/80 select-none">
                    Selecione o currículo ativo
                  </div>
                  <div className="max-h-56 overflow-y-auto flex flex-col gap-1 py-1">
                    {resumes.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400 italic select-none">
                        Nenhum outro CV encontrado
                      </div>
                    ) : (
                      resumes.map(r => {
                        const isCurrent = r.resumeVersionId === activeResume?.resumeVersionId;
                        return (
                          <button
                            key={r.resumeVersionId || r.id}
                            onClick={() => {
                              const target = r.resumeVersionId || r.id;
                              if (onSelectResume && target) onSelectResume(target);
                              setShowDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30'
                                : 'text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate pr-2">{r.fileName}</span>
                            {isCurrent && (
                              <Check size={14} className="shrink-0 text-brand-400" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onSwitchResume();
                    }}
                    className="w-full text-center py-2 px-3 text-[11px] font-bold text-brand-400 hover:bg-brand-500/10 rounded-xl border-t border-slate-800/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Settings size={13} />
                    Gerenciar / Enviar Currículos
                  </button>
                </div>
              )}

            </>
          )}
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer border border-primary/20"
            >
              <Sparkles size={12} />
              Reanalisar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  if (hours < 24) return `há ${hours}h`;
  if (days < 7) return `há ${days}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
