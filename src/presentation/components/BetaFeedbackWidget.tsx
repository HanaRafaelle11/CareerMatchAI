import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { SupportFeedbackModal } from './SupportFeedbackModal';

interface BetaFeedbackWidgetProps {
  userId?: string;
  userEmail?: string;
  feature?: string;
}

export function BetaFeedbackWidget({ userId, userEmail }: BetaFeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 font-sans">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2.5 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold text-xs shadow-xl shadow-brand-500/20 flex items-center gap-2 cursor-pointer transition transform hover:scale-105"
        >
          <MessageSquare size={16} />
          <span>Fale conosco / Suporte</span>
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
