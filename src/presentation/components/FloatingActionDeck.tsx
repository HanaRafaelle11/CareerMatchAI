import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { SupportFeedbackModal } from './SupportFeedbackModal';

interface FloatingActionDeckProps {
  userId?: string;
  userEmail?: string;
  onOpenCopilot?: () => void;
}

export function FloatingActionDeck({
  userId,
  userEmail,
  onOpenCopilot: _onOpenCopilot
}: FloatingActionDeckProps) {
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <>
      <div 
        className="w-full px-3 my-2 flex flex-col items-start gap-2 font-sans select-none"
      >
        <button
          type="button"
          onClick={() => setIsSupportOpen(true)}
          className="px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800/95 border border-slate-700/80 text-slate-100 font-bold text-xs shadow-2xl flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95 backdrop-blur-md group"
          title="Abrir Suporte & Feedback"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <MessageSquare size={13} className="text-brand-400 shrink-0" />
          <span className="text-[11px] tracking-tight">Ajuda & Suporte</span>
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

