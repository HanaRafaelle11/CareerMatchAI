import { useState } from 'react';
import { CardGlass } from './CardGlass';
import { Sparkles, Target, Layers, UploadCloud, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useEscapeToClose } from '../../application/hooks/useEscapeToClose';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartUpload?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function OnboardingModal({ isOpen, onClose, onStartUpload, onNavigateTab }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEscapeToClose(isOpen, onClose);

  if (!isOpen) return null;

  const handleStart = () => {
    onClose();
    if (onStartUpload) onStartUpload();
    if (onNavigateTab) onNavigateTab('profile');
  };

  const steps = [
    {
      title: 'Bem-vindo ao VoCentro! 🚀',
      subtitle: 'Sua plataforma inteligente de carreira e recolocação profissional.',
      icon: Sparkles,
      iconColor: 'text-[#4F8EF7]',
      content: (
        <div className="space-y-3 text-slate-300 text-xs leading-relaxed">
          <p>
            O VoCentro cruza as competências do seu currículo com exigências reais de vagas do mercado, calculando sua <strong>compatibilidade real (0 a 100%)</strong> em segundos.
          </p>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 size={14} /> Afinidade com Vagas do Mercado
            </div>
            <div className="flex items-center gap-2 text-brand-400 font-bold">
              <CheckCircle2 size={14} /> Treino de Entrevistas com IA (Método STAR)
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <CheckCircle2 size={14} /> Painel de Acompanhamento de Candidaturas
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Seu Plano de Hoje em 15 Minutos ⏱',
      subtitle: 'Produtividade focada para acelerar sua contratação.',
      icon: Target,
      iconColor: 'text-emerald-400',
      content: (
        <div className="space-y-3 text-slate-300 text-xs leading-relaxed">
          <p>
            Na sua página inicial, o Copiloto sugere <strong>3 ações diárias de 15 minutos</strong> para manter seu progresso constante no mercado.
          </p>
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Exemplo do Plano do Dia:</span>
            <ul className="space-y-1.5 text-[11px] text-slate-200">
              <li>1. Upload ou atualização do currículo-mestre</li>
              <li>2. Cálculo de compatibilidade para vagas recomendadas</li>
              <li>3. Treinamento de 1 resposta de entrevista com IA</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Painel de Candidaturas 📊',
      subtitle: 'Controle visual de todos os seus processos seletivos ativos.',
      icon: Layers,
      iconColor: 'text-amber-400',
      content: (
        <div className="space-y-3 text-slate-300 text-xs leading-relaxed">
          <p>
            Na aba <strong>Minhas Candidaturas</strong>, você acompanha seus processos entre as etapas: de <i>"Salvas"</i> e <i>"Enviadas"</i> a <i>"Entrevista"</i> e <i>"Oferta"</i>.
          </p>
          <p className="text-slate-400 text-[11px]">
            O assistente estima suas chances de avanço e indica o momento ideal para fazer follow-up com os recrutadores.
          </p>
        </div>
      )
    },
    {
      title: 'Vamos começar? 📄',
      subtitle: 'Envie seu currículo em PDF para liberar todos os recursos.',
      icon: UploadCloud,
      iconColor: 'text-purple-400',
      content: (
        <div className="space-y-4 text-slate-300 text-xs leading-relaxed text-center py-2">
          <p>
            Para dar o primeiro passo, envie seu currículo em PDF. Nossa IA vai extrair suas experiências e encontrar suas primeiras vagas compatíveis automaticamente!
          </p>
          <button
            onClick={handleStart}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UploadCloud size={16} />
            <span>Fazer Upload do Currículo em PDF Agora</span>
          </button>
        </div>
      )
    }
  ];

  const current = steps[currentStep];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 font-sans animate-fade-in">
      <CardGlass className="w-full max-w-md space-y-5 border border-slate-800 p-6 bg-[#121929] shadow-2xl relative rounded-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Stepper Dots */}
        <div className="flex justify-center gap-1.5 pt-1">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-6 bg-brand-500' : 'w-1.5 bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${current.iconColor}`}>
            <Icon size={22} />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white">{current.title}</h3>
            <p className="text-xs text-slate-400">{current.subtitle}</p>
          </div>
        </div>

        <div className="py-2">
          {current.content}
        </div>

        {/* Navigation Footer */}
        {currentStep < steps.length - 1 && (
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
            >
              Anterior
            </button>

            <button
              onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 1))}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Próximo</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </CardGlass>
    </div>
  );
}
