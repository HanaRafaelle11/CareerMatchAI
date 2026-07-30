import { Trophy, PartyPopper, CheckCircle2, Calendar, Clock, Sparkles, X } from 'lucide-react';
import type { Application } from '../../domain/models/types';

interface HiredCongratulationModalProps {
  isOpen: boolean;
  app: Application | null;
  onClose: () => void;
}

export function HiredCongratulationModal({ isOpen, app, onClose }: HiredCongratulationModalProps) {
  if (!isOpen || !app) return null;

  // Calcular SLA de Contratação (duração desde a candidatura/criação)
  const startDate = new Date(app.appliedAt || app.createdAt);
  const endDate = new Date();
  const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
  const slaDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(startDate);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#111C33] via-[#0D1526] to-[#080D18] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-scale-up overflow-hidden">
        
        {/* Efeito Glow Dourado de Fundo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Ícone de Troféu Animado */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-emerald-500/30 border border-amber-400/40 flex items-center justify-center shadow-xl shadow-amber-500/10">
          <Trophy size={42} className="text-amber-400 animate-bounce" />
          <PartyPopper size={20} className="absolute -top-2 -right-2 text-amber-300 animate-pulse" />
        </div>

        {/* Mensagem Principal */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-extrabold text-xs">
            <Sparkles size={14} />
            <span>CONQUISTA CONFIRMADA!</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Parabéns pela Contratação! 🏆
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Você conquistou a vaga de <strong className="text-amber-300 font-bold">{app.jobTitle}</strong> na <strong className="text-white font-bold">{app.companyName}</strong>!
          </p>
        </div>

        {/* Card do SLA de Contratação */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-left space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock size={14} className="text-emerald-400" />
              SLA de Contratação
            </span>
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {slaDays === 1 ? 'Contratação Recorde < 24h' : `${slaDays} Dias`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Início do Processo:</span>
              <span className="text-slate-200 font-semibold flex items-center gap-1 mt-0.5">
                <Calendar size={12} className="text-slate-400" />
                {formattedDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Tempo Total de Jornada:</span>
              <span className="text-slate-200 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                {slaDays} dias até a oferta
              </span>
            </div>
          </div>
        </div>

        {/* Botão de Ação */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <PartyPopper size={18} />
            <span>Comemorar Conquista & Salvar!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
