import { useState, useRef } from 'react';
import { Sparkles, X, ArrowRight, Bot } from 'lucide-react';
import { useCopilotEngine } from '../../application/hooks/useCopilotEngine';
import { useAuth } from '../../application/hooks/useAuth';
import { useEntitlements, PaywallModal, CheckoutModal } from '../../modules/billing';
import { useEscapeToClose } from '../../application/hooks/useEscapeToClose';
import { useFocusTrap } from '../../application/hooks/useFocusTrap';
import { supabase } from '../../infrastructure/api/supabaseClient';
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
  const drawerRef = useRef<HTMLDivElement>(null);

  // Listener da tecla ESC para fechar o drawer
  useEscapeToClose(isOpen, () => setIsOpen(false));

  // Focus trap para prender navegação por Tab dentro do drawer enquanto aberto
  useFocusTrap(drawerRef, isOpen);

  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');

    const lower = userText.toLowerCase();

    // Detecção de intenção: Simulação de Entrevista → redirecionar para Coach
    const isSimulationIntent = ['simular entrevista', 'simulação de entrevista', 'praticar entrevista', 'treinar entrevista',
      'simulador', 'entrevista star', 'método star', 'treinamento star', 'mock interview', 'prática de entrevista',
      'simule uma entrevista', 'quero simular', 'simula entrevista', 'simular perguntas'].some(k => lower.includes(k));

    if (isSimulationIntent) {
      setTimeout(() => {
        const reply = "🎯 Para simulação completa de entrevistas com método STAR, use a aba Coach — lá você pratica com perguntas reais geradas pela IA, recebe feedback detalhado e cronometra suas respostas. Vou te levar até lá!";
        setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
        // Redirecionar automaticamente para a aba Coach após 2s
        setTimeout(() => {
          if (setActiveTab) {
            setActiveTab('coach');
            setIsOpen(false);
          }
        }, 2000);
      }, 300);
      return;
    }

    setIsTyping(true);

    // Chamada assíncrona para a Edge Function de Copiloto IA
    (async () => {
      try {
        if (!supabase) {
          throw new Error("Supabase não configurado no cliente.");
        }
        const { data, error } = await supabase.functions.invoke('chat-copilot', {
          body: {
            message: userText,
            history: messages,
            context: {
              careerProfile: careerProfileNew,
              applications,
              jobs
            }
          }
        });

        if (error) throw error;

        if (data && data.success && data.reply) {
          setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
        } else {
          throw new Error(data?.error || "Resposta de IA indisponível no momento.");
        }
      } catch (err: any) {
        console.error("[GLOBAL COPILOT IA ERROR]:", err);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: `⚠️ Desculpe, não consegui obter uma resposta do Copiloto IA. Detalhes: ${err.message || 'Falha na conexão com o servidor.'}` 
        }]);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  const handleExecuteAction = (targetTab?: string, targetAppId?: string) => {
    if (targetAppId && onStartSimulation) {
      onStartSimulation(targetAppId, true);
    } else if (targetTab && setActiveTab) {
      setActiveTab(targetTab);
    }
    setIsOpen(false);
  };

/** Utility to render markdown bold (**text**), italic (*text*), and line breaks (\n) in JSX */
function renderCopilotMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  
  // Split by line breaks first
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Parse **bold** and *italic*
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const parsedLine = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={partIdx} className="font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={partIdx} className="italic text-slate-300 dark:text-slate-300 light:text-slate-700">{part.slice(1, -1)}</em>;
      }
      return <span key={partIdx}>{part}</span>;
    });

    return (
      <span key={lineIdx} className="block min-h-[1em]">
        {parsedLine}
      </span>
    );
  });
}

  return (
    <>
      {/* Opção A: Botão Flutuante Único no Canto Inferior Direito (Item 17: z-index ajustado para z-40 e opacidade sutil) */}
      {!isOpen && (
        <button
          onClick={handleToggleOpen}
          aria-label="Abrir Copiloto IA"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-1.5 md:gap-2.5 px-3.5 py-2.5 md:px-4 md:py-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 text-white font-bold text-[11px] md:text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all border border-brand-400/30 group cursor-pointer opacity-95 hover:opacity-100"
        >
          <Sparkles size={14} className="animate-spin-slow text-amber-300 md:w-4 md:h-4" />
          <span>Copiloto IA</span>
          {recommendations.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
      )}

      {/* Drawer / Slide-Over Flutuante */}
      {isOpen && (
        <div 
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="copilot-drawer-title"
          className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 light:bg-white border-l border-slate-800 light:border-slate-200 shadow-2xl z-[9995] flex flex-col animate-slide-in"
        >

          {/* Header do Drawer */}
          <div className="p-4 border-b border-slate-800 light:border-slate-200 flex justify-between items-center bg-slate-900/80 light:bg-white/90 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <Bot size={18} />
              </div>
              <div>
                <h3 id="copilot-drawer-title" className="font-bold text-xs text-slate-100 light:text-slate-900 flex items-center gap-1.5">
                  Copiloto de Carreira IA
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </h3>
                <span className="text-[10px] text-slate-400 light:text-slate-500">Assistente Proativo Ativo</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fechar copiloto"
              className="p-1.5 rounded-lg text-slate-400 light:text-slate-500 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <X size={18} />
            </button>
          </div>


          {/* Recomendações Proativas */}
          <div className="p-4 bg-slate-800/50 light:bg-slate-50 border-b border-slate-800/80 light:border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 light:text-slate-500 tracking-wider block">
              💡 {greetingHeadline}
            </span>
            <div className="space-y-1.5">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleExecuteAction(rec.targetTab, rec.targetAppId)}
                  className="p-2.5 rounded-xl bg-slate-900/80 light:bg-white border border-slate-800/80 light:border-slate-200 hover:border-brand-500/40 cursor-pointer transition-all flex items-center justify-between gap-2 group"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-slate-200 light:text-slate-800 group-hover:text-brand-400 light:group-hover:text-brand-600 block truncate">
                      {rec.title}
                    </span>
                    <p className="text-[10px] text-slate-400 light:text-slate-500 leading-snug line-clamp-1">
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
                      : 'bg-slate-800 light:bg-slate-100 border border-slate-700 light:border-slate-200 text-slate-200 light:text-slate-800 rounded-bl-none'
                  }`}
                >
                  {renderCopilotMarkdown(m.text)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} className="animate-pulse" />
                </div>
                <div className="p-3 rounded-2xl text-xs bg-slate-800 light:bg-slate-100 border border-slate-700 light:border-slate-200 text-slate-400 light:text-slate-500 rounded-bl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Form do Input */}
          <div className="p-3 border-t border-slate-800 light:border-slate-200 bg-slate-900/90 light:bg-slate-50 space-y-2">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Pergunte ou peça uma ação ao Copiloto..."
                className="flex-1 bg-slate-800 light:bg-white border border-slate-700 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-200 light:text-slate-900 outline-none focus:border-brand-500 placeholder:text-slate-500 light:placeholder:text-slate-400"
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
              className="w-full py-2 text-center text-[10px] font-bold text-slate-400 light:text-slate-500 hover:text-slate-200 light:hover:text-slate-700 border border-slate-800 light:border-slate-200 hover:border-slate-700 light:hover:border-slate-300 rounded-xl bg-slate-800/50 light:bg-white transition-colors"
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
