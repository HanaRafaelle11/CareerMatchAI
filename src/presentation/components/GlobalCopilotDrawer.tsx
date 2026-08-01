import { useState } from 'react';
import { Sparkles, X, ArrowRight, Bot } from 'lucide-react';
import { useCopilotEngine } from '../../application/hooks/useCopilotEngine';
import { useAuth } from '../../application/hooks/useAuth';
import { useEntitlements, PaywallModal, CheckoutModal } from '../../modules/billing';
import type { Application, Job } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';

interface GlobalCopilotDrawerProps {
  applications?: Application[];
  jobs?: Job[];
  matches?: any[];
  careerProfileNew?: CareerProfileNew | null;
  setActiveTab?: (tab: string) => void;
  onStartSimulation?: (target: string | Job, reset?: boolean) => void;
}

export function GlobalCopilotDrawer({
  applications = [],
  jobs = [],
  matches = [],
  careerProfileNew,
  setActiveTab,
  onStartSimulation
}: GlobalCopilotDrawerProps) {
  const { user } = useAuth();
  const { isPro, canUseCopilot, paywallState, triggerPaywall, closePaywall } = useEntitlements(user?.id);
  const [showCheckout, setShowCheckout] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([
    {
      role: 'assistant',
      text: 'Olá! Sou o seu Copiloto de Carreira. Posso recomendar ações para suas vagas, ajustar seu currículo ou praticar entrevistas STAR.'
    }
  ]);

  const { recommendations, greetingHeadline } = useCopilotEngine({
    applications,
    jobs,
    matches,
    careerProfileNew
  });

  const handleToggleOpen = () => {
    if (!isPro && !canUseCopilot) {
      triggerPaywall('copilot');
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');

    // Resposta conversacional inteligente com detecção de intenção
    setTimeout(() => {
      let reply = "Entendido! Recomendo focar na preparação para suas entrevistas ativas e manter seu perfil atualizado. Para orientações mais detalhadas, use a Central de IA & Coach.";
      const lower = userText.toLowerCase();

      // Detecção de intenção: Simulação de Entrevista → redirecionar para Coach
      const isSimulationIntent = ['simular entrevista', 'simulação de entrevista', 'praticar entrevista', 'treinar entrevista',
        'simulador', 'entrevista star', 'método star', 'treinamento star', 'mock interview', 'prática de entrevista',
        'simule uma entrevista', 'quero simular', 'simula entrevista', 'simular perguntas'].some(k => lower.includes(k));

      if (isSimulationIntent) {
        reply = "🎯 Para simulação completa de entrevistas com método STAR, use a aba Coach — lá você pratica com perguntas reais geradas pela IA, recebe feedback detalhado e cronometra suas respostas. Vou te levar até lá!";
        setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
        // Redirecionar automaticamente para a aba Coach após 2s
        setTimeout(() => {
          if (setActiveTab) {
            setActiveTab('coach');
            setIsOpen(false);
          }
        }, 2000);
        return;
      }

      if (lower.includes('pretensão') || lower.includes('salário') || lower.includes('salario') || lower.includes('remuneração')) {
        reply = "💰 Para negociação salarial, consulte o Monitor de Demanda Real na aba Coach — lá você vê as habilidades mais demandadas e pode calibrar sua pretensão. Quer ir direto para o Coach?";
      } else if (lower.includes('vaga') || lower.includes('candidatar') || lower.includes('aplicar') || lower.includes('oportunidade')) {
        reply = "🔍 Vou destacar as vagas de maior prioridade para o seu perfil! Acesse a aba Vagas & Match para ver o ranking de compatibilidade da IA.";
      } else if (lower.includes('currículo') || lower.includes('curriculo') || lower.includes('cv') || lower.includes('resume')) {
        reply = "📄 Seu currículo já está cadastrado. Você pode selecionar qualquer vaga ativa para gerar uma versão sob medida na aba Vagas & Match.";
      } else if (lower.includes('perfil') || lower.includes('competência') || lower.includes('skill')) {
        reply = "⚡ Recomendo revisar suas competências na aba Perfil para garantir que seu Career Score reflita todas as suas habilidades reais.";
      } else if (lower.includes('pipeline') || lower.includes('kanban') || lower.includes('estratégia') || lower.includes('estrategia')) {
        reply = "📋 Seu Pipeline está na aba Estratégia. Atualize o status de cada candidatura para que o Copiloto recalcule suas probabilidades de conversão.";
      }

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    }, 600);
  };

  const handleExecuteAction = (targetTab?: string, targetAppId?: string) => {
    if (targetAppId && onStartSimulation) {
      onStartSimulation(targetAppId, true);
    } else if (targetTab && setActiveTab) {
      setActiveTab(targetTab);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Opção A: Botão Flutuante Único no Canto Inferior Direito */}
      <button
        onClick={handleToggleOpen}
        aria-label="Abrir Copiloto IA"
        className="fixed bottom-[4.25rem] right-3 md:bottom-6 md:right-6 z-[9990] flex items-center gap-1.5 md:gap-2.5 px-3 py-2 md:px-4 md:py-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 text-white font-bold text-[11px] md:text-xs shadow-xl hover:scale-105 active:scale-95 transition-all border border-brand-400/30 group cursor-pointer"
      >
        <Sparkles size={14} className="animate-spin-slow text-amber-300 md:w-4 md:h-4" />
        <span>Copiloto IA</span>
        {recommendations.length > 0 && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        )}
      </button>

      {/* Drawer / Slide-Over Flutuante */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111827] border-l border-slate-800 shadow-2xl z-[9995] flex flex-col animate-slide-in">
          {/* Header do Drawer */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                  Copiloto de Carreira IA
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </h3>
                <span className="text-[10px] text-slate-400">Assistente Proativo Ativo</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Recomendações Proativas */}
          <div className="p-4 bg-slate-900/50 border-b border-slate-800/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              💡 {greetingHeadline}
            </span>
            <div className="space-y-1.5">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleExecuteAction(rec.targetTab, rec.targetAppId)}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-brand-500/40 cursor-pointer transition-all flex items-center justify-between gap-2 group"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-brand-300 block truncate">
                      {rec.title}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-1">
                      {rec.description}
                    </p>
                  </div>
                  <div className="p-1 rounded-lg bg-brand-500/10 text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors shrink-0">
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Interativo */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Form do Input */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Pergunte ou peça uma ação ao Copiloto..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Enviar
              </button>
            </form>

            <button
              onClick={() => {
                if (setActiveTab) setActiveTab('coach');
                setIsOpen(false);
              }}
              className="w-full py-2 text-center text-[10px] font-bold text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl bg-slate-950 transition-colors"
            >
              Abrir Central Completa de IA & Simulações
            </button>
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={paywallState.isOpen}
        onClose={closePaywall}
        feature={paywallState.feature}
        title={paywallState.title}
        description={paywallState.description}
        onUpgrade={() => setShowCheckout(true)}
      />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        userId={user?.id}
        userEmail={user?.email}
        userName={user?.email?.split('@')[0]}
      />
    </>
  );
}
