import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface HeroProductMockupProps {
  onSimulateClick?: () => void;
}

export const HeroProductMockup: React.FC<HeroProductMockupProps> = ({ onSimulateClick }) => {
  return (
    <div className="relative w-full max-w-xl mx-auto font-sans select-none">
      {/* Container Principal com Imagem LCP Otimizada WebP */}
      <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-5 space-y-4">
        
        {/* Header do Mockup */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            vocentro.com.br/match-hub
          </div>
          <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center gap-1">
            <Sparkles size={11} /> AI Engine v2.4
          </span>
        </div>

        {/* Imagem WebP de Alta Performance LCP */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
          <img
            src="/professional_happy_illustration.webp"
            alt="Vocentro - Plataforma de Inteligência Artificial para Carreiras e Match de Vagas"
            width={600}
            height={360}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-auto max-h-[300px] object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-[1.01]"
          />
        </div>

        {/* CTA do Mockup */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>Simule entrevistas reais no método STAR com IA</span>
          </div>
          <button
            onClick={onSimulateClick}
            aria-label="Testar simulador de entrevistas com IA"
            className="px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer min-h-[36px] focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <span>Simular</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>
    </div>
  );
};
