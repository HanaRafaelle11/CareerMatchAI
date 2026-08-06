import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { SupportFeedbackModal } from './SupportFeedbackModal';

interface BetaFeedbackWidgetProps {
  userId?: string;
  userEmail?: string;
  feature?: string;
}

export function FeedbackWidget({ userId, userEmail }: BetaFeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);


  return (
    <>
      <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6 right-4 md:right-48 z-[60] font-sans">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800/95 border border-slate-700/80 hover:border-brand-500/50 text-slate-100 font-bold text-xs shadow-2xl flex items-center gap-2.5 cursor-pointer transition-all transform hover:scale-105 backdrop-blur-md group"
          title="Abrir Suporte e Feedback"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <MessageSquare size={14} className="text-brand-400 group-hover:text-brand-300 transition-colors shrink-0" />
          <span className="tracking-tight">Suporte VoCentro</span>
        </button>
      </div>

      <SupportFeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userId={userId}
        userEmail={userEmail}
      />
    </>
  );
}

export const BetaFeedbackWidget = FeedbackWidget;


