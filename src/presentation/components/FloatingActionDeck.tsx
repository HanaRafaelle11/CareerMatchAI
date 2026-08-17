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
  userEmail
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
          className="px-3.5 py-2 rounded-xl bg-slate-900/95 dark:bg-slate-900/95 bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 hover:bg-slate-200 border border-slate-700/80 dark:border-slate-700/80 border-slate-300 text-slate-100 dark:text-slate-100 text-slate-800 font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Abrir Suporte & Feedback"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <MessageSquare size={13} className="text-brand-500 shrink-0" />
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
