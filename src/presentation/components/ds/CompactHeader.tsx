import { useState, useRef, useEffect } from 'react';
import type { Resume } from '../../../domain/models/types';
import { Badge } from './Badge';
import { FileText, HelpCircle, RefreshCw, Check, Settings, Sparkles } from 'lucide-react';

interface CompactHeaderProps {
  userName: string;
  activeResume: Resume | null;
  aiScore?: number;
  onSwitchResume?: () => void;
  onReanalyze?: () => void;
  className?: string;
  resumes?: Resume[];
  onSelectResume?: (resumeVersionId: string) => void;
}

export function CompactHeader({
  activeResume,
  aiScore,
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
            <span title="Todas as sugestões de vagas, compatibilidades e simulações do copiloto são calculadas com base neste currículo selecionado.">
              <HelpCircle size={10} className="cursor-help opacity-60 hover:opacity-100" />
            </span>
          </span>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {activeResume ? (
              <>
                <span className="text-xs font-semibold text-on-surface truncate max-w-[200px] hover:underline cursor-help" title="Todas as sugestões de vagas, compatibilidades e simulações do copiloto são calculadas com base neste currículo selecionado.">
                  {activeResume.fileName || 'Currículo ativo'}
                </span>
                {aiScore !== undefined && aiScore > 0 && (
                  <Badge variant="premium" size="sm">
                    IA {aiScore}%
                  </Badge>
                )}
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/20"
              >
                <RefreshCw size={12} />
                Trocar CV
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-surface-container-high border border-outline-variant/30 shadow-xl z-30 p-1 flex flex-col gap-0.5">
                  <div className="px-2.5 py-1.5 text-[9px] uppercase font-bold text-on-surface-variant tracking-wider border-b border-outline-variant/20 select-none">
                    Selecione o currículo ativo
                  </div>
                  <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 py-1">
                    {resumes.length === 0 ? (
                      <div className="px-2.5 py-2 text-xs text-on-surface-variant/80 italic select-none">
                        Nenhum outro CV encontrado
                      </div>
                    ) : (
                      resumes.map(r => {
                        const isCurrent = r.resumeVersionId === activeResume?.resumeVersionId;
                        return (
                          <button
                            key={r.resumeVersionId}
                            onClick={() => {
                              if (onSelectResume && r.resumeVersionId) onSelectResume(r.resumeVersionId);
                              setShowDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-on-surface hover:bg-surface-container-highest'
                            }`}
                          >
                            <span className="truncate pr-2">{r.fileName}</span>
                            {isCurrent && (
                              <Check size={12} className="shrink-0 text-primary" />
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
                    className="w-full text-center py-2 px-2.5 text-[10px] font-bold text-primary hover:bg-primary/5 rounded-lg border-t border-outline-variant/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Settings size={12} />
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
