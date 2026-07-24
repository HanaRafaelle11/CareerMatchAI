import { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, Check, X } from 'lucide-react';
import { BetaFeedbackService } from '../../application/services/BetaFeedbackService';
import type { BetaFeedbackRating } from '../../domain/models/types';

interface BetaFeedbackWidgetProps {
  userId?: string;
  feature?: string;
}

export function BetaFeedbackWidget({ userId, feature = 'career_intelligence' }: BetaFeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<BetaFeedbackRating | null>(null);
  const [comment, setComment] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (selectedRating: BetaFeedbackRating, defaultComment?: string) => {
    setIsSending(true);
    try {
      await BetaFeedbackService.sendFeedback(
        userId,
        feature,
        selectedRating,
        comment.trim() || defaultComment
      );
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setIsOpen(false);
        setRating(null);
        setComment('');
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition transform hover:scale-105"
        >
          <MessageSquare size={14} />
          <span>Feedback Beta</span>
        </button>
      ) : (
        <div className="dark-card bg-[#121927] text-white border border-slate-700 rounded-2xl p-4 w-80 max-w-[calc(100vw-2rem)] shrink-0 shadow-2xl space-y-3 animate-scale-up text-xs font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-xs">Feedback do Beta</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          {isSent ? (
            <div className="py-4 text-center text-emerald-400 space-y-1">
              <Check size={20} className="mx-auto" />
              <p className="font-bold text-xs">Obrigado pelo feedback!</p>
              <p className="text-[10px] text-slate-400">Sua opinião ajuda a aprimorar a IA.</p>
            </div>
          ) : (
            <>
              <p className="text-slate-300 text-[11px]">Como está sendo sua experiência com o VoCentro?</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setRating('POSITIVE');
                    handleSubmit('POSITIVE', 'Gostei da recomendação');
                  }}
                  disabled={isSending}
                  className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-blue-500 text-slate-100 text-[10px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ThumbsUp size={13} className="text-emerald-400 shrink-0" />
                  <span>Gostei da recomendação</span>
                </button>

                <button
                  onClick={() => {
                    setRating('NEGATIVE');
                    handleSubmit('NEGATIVE', 'Não achei relevante');
                  }}
                  disabled={isSending}
                  className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-blue-500 text-slate-100 text-[10px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ThumbsDown size={13} className="text-red-400 shrink-0" />
                  <span>Não achei relevante</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Sugestão de melhoria..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 resize-none"
                />
                <button
                  onClick={() => handleSubmit(rating || 'NEUTRAL')}
                  disabled={isSending || !comment.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer transition shadow-md shadow-blue-500/20"
                >
                  <Send size={12} />
                  <span>Enviar Feedback</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
