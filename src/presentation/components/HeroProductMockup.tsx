import React from 'react';
import { Sparkles, CheckCircle2, Bot, Target, ArrowRight } from 'lucide-react';

interface HeroProductMockupProps {
  onSimulateClick?: () => void;
}

export const HeroProductMockup: React.FC<HeroProductMockupProps> = ({ onSimulateClick }) => {
  return (
    <div className="relative w-full max-w-xl mx-auto font-sans select-none">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 via-indigo-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-70 pointer-events-none" />

      {/* Main SaaS Interface Glassmorphism Container */}
      <div className="relative rounded-2xl bg-card border border-border shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4">
        
        {/* Mock Titlebar */}
        <div className="flex items-center justify-between pb-3 border-b border-border text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="ml-2 font-bold text-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              vocentro.com.br/dashboard
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-bold flex items-center gap-1 text-[10px]">
            <Sparkles size={11} /> Match IA v2.4
          </span>
        </div>

        {/* Top Job Card Header */}
        <div className="p-3.5 rounded-xl bg-card/80 border border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 font-bold shrink-0">
              <Target size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground font-display">Desenvolvedor(a) Frontend Sênior</h3>
              <p className="text-[11px] text-muted-foreground font-sans">TechCorp • São Paulo, SP • Remoto</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold font-mono">
            Vaga Aberta
          </span>
        </div>

        {/* Grid de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Match Score Card */}
          <div className="p-4 rounded-xl bg-card/60 border border-brand-500/30 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Match da vaga</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                Alta Afinidade
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-display text-emerald-500 tracking-tight">
                94%
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">Afinidade com a vaga</span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-brand-500 to-emerald-500 h-full w-[94%]" />
            </div>
          </div>

          {/* Otimização ATS Card */}
          <div className="p-4 rounded-xl bg-card/60 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Status do Currículo</span>
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-foreground">Currículo Otimizado</p>
            <p className="text-[10px] text-muted-foreground leading-normal">
              12 pontos de destaque mapeados para a vaga.
            </p>
          </div>
        </div>

        {/* Coach IA Interactive Bar */}
        <div className="p-3.5 rounded-xl bg-card/80 border border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <span>Simulador de Entrevistas pronto para treino.</span>
          </div>
          <button
            onClick={onSimulateClick}
            aria-label="Simular - Treinar entrevista no Vocentro"
            className="px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer min-h-[36px] focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <span>Simular</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>
    </div>
  );
};
