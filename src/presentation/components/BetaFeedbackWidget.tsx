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
          className="px-3.5 py-2 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/50 text-white font-semibold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition transform hover:scale-105 backdrop-blur-sm"
          title="Abrir Suporte e Feedback"
        >
          <MessageSquare size={14} className="text-brand-400 shrink-0" />
          <span>Suporte VoCentro</span>
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


