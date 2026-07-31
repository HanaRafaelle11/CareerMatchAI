import { useState } from 'react';
import { BaseModal } from './ds/BaseModal';
import { ThumbsUp, CheckCircle2, MessageSquareHeart } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

interface SatisfactionSurveyModalProps {
  userId: string;
  userName: string;
  visitCount: number;
  onClose: () => void;
}

export function SatisfactionSurveyModal({ userId, userName, visitCount, onClose }: SatisfactionSurveyModalProps) {
  const [easeRating, setEaseRating] = useState<number | null>(null);
  const [experienceRating, setExperienceRating] = useState<string | null>(null);
  const [matchesRating, setMatchesRating] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!easeRating || !experienceRating || !matchesRating) return;

    setIsSubmitting(true);

    try {
      const surveyPayload = {
        user_id: userId,
        user_name: userName,
        visit_number: visitCount,
        ease_rating: easeRating,
        experience_rating: experienceRating,
        matches_rating: matchesRating,
        comment: commentText,
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured && supabase) {
        // Tentar gravar na tabela satisfaction_surveys ou em activity_logs como fallback
        const { error } = await supabase.from('satisfaction_surveys').insert(surveyPayload);
        if (error) {
          await supabase.from('activity_logs').insert({
            user_id: userId,
            event_type: 'satisfaction_survey_submitted',
            metadata: surveyPayload
          });
        }
      }

      // Marcar como concluída para este usuário
      localStorage.setItem(`vocentro_survey_completed_${userId}`, 'true');
      setIsSubmitting(false);
      setIsSubmitted(true);

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Erro ao salvar pesquisa de satisfação:', err);
      localStorage.setItem(`vocentro_survey_completed_${userId}`, 'true');
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleDismiss = () => {
    // Registrar dispensa da sessão atual
    sessionStorage.setItem(`vocentro_survey_dismissed_${userId}`, 'true');
    onClose();
  };

  const emojiScale = [
    { value: 1, label: 'Muito Difícil', icon: '😠' },
    { value: 2, label: 'Difícil', icon: '🙁' },
    { value: 3, label: 'Razoável', icon: '😐' },
    { value: 4, label: 'Fácil', icon: '🙂' },
    { value: 5, label: 'Muito Fácil', icon: '😊' },
  ];

  const cleanDisplayName = (() => {
    if (!userName) return 'Candidato';
    if (userName.includes('@')) {
      const prefix = userName.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return userName;
  })();

  return (
    <BaseModal
      isOpen={true}
      onClose={handleDismiss}
      maxWidthClass="max-w-md"
      icon={<MessageSquareHeart size={22} className="text-brand-400" />}
      title={
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-base text-white">Pesquisa Rápida de Satisfação</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase border border-emerald-500/20">
            {visitCount}ª Visita
          </span>
        </div>
      }
      subtitle={
        <span className="text-xs text-slate-400">
          Olá, <strong className="text-slate-200">{cleanDisplayName}</strong>! Queremos saber como está sendo sua experiência inicial no Vocentro.
        </span>
      }
    >
      {isSubmitted ? (
        <div className="py-8 text-center space-y-3 animate-fade-in">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <h4 className="font-display font-bold text-lg text-white">Muito obrigado pelo seu feedback!</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sua opinião é fundamental para continuarmos aprimorando o Vocentro.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
          {/* Pergunta 1: Facilidade */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 block leading-snug">
              1. Quão fácil foi entender e navegar pela plataforma?
            </label>
            <div className="flex justify-between items-center gap-1.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              {emojiScale.map((item) => {
                const isSelected = easeRating === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setEaseRating(item.value)}
                    className={`flex-1 py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-500/20 border border-brand-500 text-white scale-105 shadow-sm'
                        : 'hover:bg-slate-900 text-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[9px] font-medium leading-tight text-center">{item.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pergunta 2: Experiência Geral */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 block leading-snug">
              2. Como está sendo sua experiência geral até agora?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'excelente', label: '🌟 Excelente' },
                { id: 'boa', label: '👍 Boa' },
                { id: 'razoavel', label: '😐 Razoável' },
                { id: 'precisa_melhorar', label: '👎 Precisa Melhorar' },
              ].map((opt) => {
                const isSelected = experienceRating === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExperienceRating(opt.id)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pergunta 3: Pertinência das Vagas */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 block leading-snug">
              3. As vagas recomendadas fazem sentido para seu perfil?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sim_totalmente', label: '🎯 Totalmente' },
                { id: 'em_parte', label: '⚖️ Em parte' },
                { id: 'pouco', label: '❌ Pouco' },
              ].map((opt) => {
                const isSelected = matchesRating === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMatchesRating(opt.id)}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comentário Opcional */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Algum comentário ou sugestão? (opcional)</label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Conte-nos o que você mais gostou ou o que podemos melhorar..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500 h-16 resize-none font-mono"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-slate-500 hover:text-slate-400 underline cursor-pointer"
            >
              Pular por enquanto
            </button>
            <button
              type="submit"
              disabled={!easeRating || !experienceRating || !matchesRating || isSubmitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all"
            >
              <ThumbsUp size={14} />
              <span>{isSubmitting ? 'Enviando...' : 'Enviar Feedback'}</span>
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
}
