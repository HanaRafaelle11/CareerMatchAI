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
      <div className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-[60] font-sans">
        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/50 text-white font-semibold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition transform hover:scale-105 backdrop-blur-sm"
        >
          <MessageSquare size={14} />
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


