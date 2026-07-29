import { useState } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, Target, Bot, Check, ArrowRight, X } from 'lucide-react';
import { CardGlass } from './CardGlass';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function OnboardingModal({ isOpen, onClose, onNavigateTab }: OnboardingModalProps) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      title: "1. Cadastre seu Currículo em PDF",
      subtitle: "Fonte Única de Verdade da IA",
      description: "Envie seu currículo atualizado. Nossa inteligência artificial extrairá suas competências, experiências e senioridade para alimentar todo o ecossistema do VoCentro.",
      icon: UploadCloud,
      color: "from-blue-600 to-indigo-600",
      actionText: "Avançar para Descoberta",
      actionTab: "profile"
    },
    {
      title: "2. Descoberta & Match de Vagas",
      subtitle: "Cálculo Inteligente do Match da vaga",
      description: "O VoCentro varre agregadores de vagas e calcula instantaneamente o Match da vaga (%), destacando pontos fortes e requisitos exigidos.",
      icon: Target,
      color: "from-[#22C7A8] to-emerald-600",
      actionText: "Avançar para Copiloto IA",
      actionTab: "match"
    },
    {
      title: "3. Coach IA & Estratégia de Carreira",
      subtitle: "Copiloto para cada Etapa do Processo",
      description: "Otimize seções específicas do seu currículo para ATS, gere cartas de apresentação personalizadas e simule perguntas comportamentais (Roteiro STAR).",
      icon: Bot,
      color: "from-purple-600 to-pink-600",
      actionText: "Começar a usar o VoCentro 🚀",
      actionTab: "dashboard"
    }
  ];

  const currentStep = steps[step - 1];
  const IconComponent = currentStep.icon;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      localStorage.setItem('vocentro_onboarding_completed', 'true');
      onClose();
      if (onNavigateTab) onNavigateTab(currentStep.actionTab);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4 min-h-screen w-screen overflow-y-auto font-sans">
      <CardGlass className="w-full max-w-lg min-w-[320px] rounded-3xl p-6 sm:p-8 space-y-6 relative border border-slate-700/80 bg-[#121927] text-white shadow-2xl animate-scale-up my-auto">
        <button
          onClick={() => {
            localStorage.setItem('vocentro_onboarding_completed', 'true');
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Pular Apresentação"
        >
          <X size={18} />
        </button>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 pt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-brand-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4 text-center py-2">
          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr ${currentStep.color} p-4 flex items-center justify-center shadow-lg shadow-brand-500/20 animate-pulse-subtle`}>
            <IconComponent size={32} className="text-white" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-brand-400 uppercase tracking-widest block">
              {currentStep.subtitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-tight">
              {currentStep.title}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {currentStep.description}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 font-semibold">
            Passo {step} de 3
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Voltar
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer transition transform hover:scale-[1.02]"
            >
              <span>{currentStep.actionText}</span>
              {step === 3 ? <Check size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </CardGlass>
    </div>,
    document.body
  );
}
