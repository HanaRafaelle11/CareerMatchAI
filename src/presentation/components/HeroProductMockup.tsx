import { 
  Sparkles, 
  CheckCircle2, 
  Bot, 
  FileCheck, 
  Zap, 
  ShieldCheck, 
  Building2,
  Award,
  ChevronRight,
  MessageSquareCode
} from 'lucide-react';

interface HeroProductMockupProps {
  onSimulateClick?: () => void;
}

export function HeroProductMockup({ onSimulateClick }: HeroProductMockupProps) {
  return (
    <div className="relative w-full max-w-xl mx-auto font-sans select-none">
      {/* Background Ambient Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/30 via-indigo-500/20 to-emerald-500/30 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 animate-pulse pointer-events-none" />

      {/* Main SaaS Interface Card */}
      <div className="relative rounded-2xl bg-slate-900/90 dark:bg-slate-900/95 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300">
        
        {/* Mock Window Titlebar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-100 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-[10px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              vocentro.app/match-hub
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[10px] font-semibold text-brand-400 font-mono">
            <Sparkles size={10} className="text-brand-400 animate-pulse" />
            AI Match Engine v2.4
          </div>
        </div>

        {/* Mock Window Content */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Top Job Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-50 border border-slate-800/60 dark:border-slate-800/60 light:border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-brand-500/20 font-bold text-sm font-display">
                <Building2 size={20} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 font-display">
                    Desenvolvedor(a) Frontend Sênior
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 font-mono">
                    Remoto
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
                  TechCorp Global • São Paulo, SP • R$ 14.000 - R$ 18.000
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono self-end sm:self-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Publicada hoje
            </div>
          </div>

          {/* Match Score & ATS Compatibility Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            
            {/* Score 92% Card */}
            <div className="sm:col-span-5 p-4 rounded-xl bg-gradient-to-br from-slate-950/80 to-slate-900/80 dark:from-slate-950/80 dark:to-slate-900/80 light:from-slate-100 light:to-white border border-brand-500/30 dark:border-brand-500/30 light:border-brand-300 flex flex-col justify-between relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold flex items-center gap-1">
                  <Award size={12} className="text-brand-400" />
                  Score de Aderência
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Alta Afinidade
                </span>
              </div>

              <div className="my-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-display tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-brand-400 bg-clip-text text-transparent">
                  92%
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">Match Semântico</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">Compatibilidade ATS</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-brand-500 rounded-full w-[92%] transition-all duration-1000 shadow-sm" />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 leading-tight">
                  Seu perfil atende 11 dos 12 requisitos-chave.
                </p>
              </div>
            </div>

            {/* ATS Tailoring & Keywords Card */}
            <div className="sm:col-span-7 p-4 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-50 border border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileCheck size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                    Currículo Otimizado para ATS
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 size={10} /> Pronto
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['React.js', 'TypeScript', 'Tailwind CSS', 'Vite / Next.js', 'State Management', 'CI/CD'].map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 dark:bg-slate-900 light:bg-white text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-brand-400" />
                    {skill}
                  </span>
                ))}
              </div>

              <div className="pt-1 border-t border-slate-800/50 dark:border-slate-800/50 light:border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Formatação STAR aplicada</span>
                <span className="font-mono text-brand-400">100% Legível por Robôs</span>
              </div>
            </div>
          </div>

          {/* Action Row: Simulate Interview Button */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-950/40 via-indigo-950/40 to-slate-950/40 border border-brand-500/25 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/30">
                <Bot size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 flex items-center gap-1.5">
                  Treino com Coach IA Vocentro
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-brand-500/20 text-brand-300 font-mono">IA Simulador</span>
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">
                  Pratique as perguntas técnicas desta vaga em tempo real.
                </p>
              </div>
            </div>

            <button
              onClick={onSimulateClick}
              className="px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 cursor-pointer shrink-0 font-sans group"
            >
              <Zap size={14} className="fill-white text-white group-hover:scale-110 transition-transform" />
              Simular Entrevista
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>

        {/* Footer info bar in mock */}
        <div className="px-5 py-2.5 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-100 bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Dados protegidos via Criptografia de Ponta a Ponta</span>
          </div>
          <span className="font-mono text-slate-400">Vocentro © 2026</span>
        </div>
      </div>

      {/* Floating Badge 1 (Top Right) */}
      <div className="absolute -top-3 -right-3 sm:-right-5 bg-slate-950/95 dark:bg-slate-950/95 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl p-2.5 shadow-xl backdrop-blur-md hidden sm:flex items-center gap-2 z-20 animate-bounce duration-1000">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 font-bold text-xs">
          92%
        </div>
        <div>
          <span className="text-[9px] text-slate-400 dark:text-slate-400 light:text-slate-500 block font-mono">Score de Vaga</span>
          <span className="text-xs font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">Compatibilidade Alta</span>
        </div>
      </div>

      {/* Floating Badge 2 (Bottom Left) */}
      <div className="absolute -bottom-3 -left-3 sm:-left-5 bg-slate-950/95 dark:bg-slate-950/95 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl p-2.5 shadow-xl backdrop-blur-md hidden sm:flex items-center gap-2.5 z-20">
        <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20 font-bold text-xs">
          <MessageSquareCode size={15} />
        </div>
        <div>
          <span className="text-[9px] text-slate-400 dark:text-slate-400 light:text-slate-500 block font-mono">Coach de Entrevistas</span>
          <span className="text-xs font-bold text-brand-400">100% Personalizado</span>
        </div>
      </div>

    </div>
  );
}
