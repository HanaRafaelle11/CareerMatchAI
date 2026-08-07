import { useState } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
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

  return (
    <>
      <div 
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6 right-4 md:right-6 z-[60] flex flex-col items-end gap-2.5 font-sans pointer-events-none select-none"
      >
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

        {/* BOTÃO 2 (FUNDO): Suporte VoCentro */}
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
