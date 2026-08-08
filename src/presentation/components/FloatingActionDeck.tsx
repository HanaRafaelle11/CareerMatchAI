import { useState } from 'react';
import { Sparkles, MessageSquare, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { SupportFeedbackModal } from './SupportFeedbackModal';

interface FloatingActionDeckProps {
  userId?: string;
  userEmail?: string;
  onOpenCopilot: () => void;
}

export function FloatingActionDeck({
  userId,
  userEmail,
  onOpenCopilot
}: FloatingActionDeckProps) {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div 
        className="fixed bottom-6 right-4 md:right-6 z-[50] flex flex-col items-end gap-2 font-sans select-none"
      >
        {isExpanded ? (
          <div className="flex flex-col items-end gap-2 animate-fade-in">
            {/* BOTÃO 1: Copiloto IA */}
            <button
              type="button"
              onClick={onOpenCopilot}
              className="px-3.5 py-2 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95 border border-brand-400/30 group"
              title="Abrir Copiloto IA"
            >
              <Sparkles size={14} className="text-amber-300 animate-pulse shrink-0" />
              <span className="tracking-tight">Copiloto IA</span>
            </button>

            {/* BOTÃO 2: Suporte VoCentro */}
            <button
              type="button"
              onClick={() => setIsSupportOpen(true)}
              className="px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800/95 border border-slate-700/80 text-slate-100 font-bold text-xs shadow-2xl flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95 backdrop-blur-md group"
              title="Abrir Suporte & Feedback"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <MessageSquare size={13} className="text-brand-400 shrink-0" />
              <span className="tracking-tight">Suporte</span>
            </button>

            {/* BOTÃO DE RECOLHER */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-2.5 py-1.5 rounded-full bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-semibold flex items-center gap-1 shadow-lg cursor-pointer hover:bg-slate-900 transition-colors"
              title="Recolher assistente"
            >
              <ChevronLeft size={12} />
              <span>Recolher</span>
            </button>
          </div>
        ) : (
          /* PÍLULA COMPACTA RECOLHIDA */
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="px-3 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800/95 border border-slate-700/80 text-slate-200 font-bold text-xs shadow-2xl flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95 backdrop-blur-md group"
            title="Expandir Copiloto e Suporte"
          >
            <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-400">
              <Bot size={13} />
            </div>
            <span className="text-[11px] tracking-tight">Ajuda & IA</span>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
          </button>
        )}
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

