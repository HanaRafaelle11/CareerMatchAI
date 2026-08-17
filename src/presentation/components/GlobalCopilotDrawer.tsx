import { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, Bot, Sparkles, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import { useCopilotEngine } from '../../application/hooks/useCopilotEngine';
import { useAuth } from '../../application/hooks/useAuth';
import { useEntitlements, PaywallModal, CheckoutModal } from '../../modules/billing';
import { useEscapeToClose } from '../../application/hooks/useEscapeToClose';
import { useFocusTrap } from '../../application/hooks/useFocusTrap';
import { supabase } from '../../infrastructure/api/supabaseClient';
import { tracker } from '../../infrastructure/analytics/tracker';
import type { Application, Job, Match, Profile, Resume } from '../../domain/models/types';
import type { CareerProfileNew } from '../../application/hooks/useMyProfileAi';

export interface GlobalCopilotDrawerProps {
  applications?: Application[];
  jobs?: Job[];
  matches?: Match[];
  careerProfileNew?: CareerProfileNew | null;
  profile?: Profile | null;
  resumes?: Resume[];
  selectedJob?: Job | null;
  setActiveTab?: (tab: string) => void;
  onStartSimulation?: (target: string | Job, reset?: boolean) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onClose?: () => void;
  hideFloatingButton?: boolean;
}

export function GlobalCopilotDrawer({
  applications = [],
  jobs = [],
  matches = [],
  careerProfileNew,
  profile,
  resumes = [],
  selectedJob,
  setActiveTab,
  onStartSimulation,
  isOpen: propIsOpen,
  onToggleOpen: _onToggleOpen,
  onClose,
  hideFloatingButton: _hideFloatingButton = false
}: GlobalCopilotDrawerProps) {
  const { user } = useAuth();
  const { isPro, paywallState, closePaywall, triggerPaywall } = useEntitlements(user?.id);
  const [showCheckout, setShowCheckout] = useState(false);

  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : localIsOpen;
  
  const handleClose = () => {
    tracker.track('copilot_drawer_closed', 'Copilot', {
      message_count: messages.length
    });
    if (onClose) onClose();
    else setLocalIsOpen(false);
  };

  const drawerRef = useRef<HTMLDivElement>(null);

  // Listener da tecla ESC para fechar o drawer
  useEscapeToClose(isOpen, handleClose);

  // Focus trap para prender navegação por Tab dentro do drawer enquanto aberto
  useFocusTrap(drawerRef, isOpen);

  const { recommendations, greetingHeadline, candidateName, careerScoreBreakdown } = useCopilotEngine({
    applications,
    jobs,
    matches,
    careerProfileNew,
    profile,
    resumes,
    selectedJob
  });

  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<Array<{ 
    role: 'assistant' | 'user'; 
    text: string;
    action?: {
      label: string;
      targetTab: string;
      appId?: string;
    };
  }>>([
    {
      role: 'assistant',
      text: greetingHeadline
    }
  ]);

  // Atualiza a primeira mensagem com o nome quando ele carregar
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', text: greetingHeadline }]);
    }
  }, [greetingHeadline]);

  // Telemetria ao abrir o drawer
  useEffect(() => {
    if (isOpen) {
      tracker.track('copilot_drawer_opened', 'Copilot', {
        has_resume: resumes.length > 0,
        has_profile: !!careerProfileNew,
        application_count: applications.length,
        is_pro: isPro
      });
    }
  }, [isOpen]);

  const handleSendMessage = (e: React.FormEvent, retryText?: string) => {
    if (e && e.preventDefault) e.preventDefault();

    const textToSend = retryText || chatInput.trim();
    if (!textToSend || isTyping) return;

    // Se o usuário não for Pro, orienta sobre o plano Pro sem travar a interface
    if (!isPro) {
      tracker.track('copilot_paywall_prompted', 'Copilot', { is_pro: false });
      triggerPaywall('ia_training');
      return;
    }

    const userText = textToSend;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setLastFailedMessage(null);

    tracker.track('copilot_message_sent', 'Copilot', {
      length: userText.length,
      is_pro: isPro
    });

    const lower = userText.toLowerCase();

    // Detecção de intenção: Simulação de Entrevista → gera CTA explícito sem timeout forçado
    const isSimulationIntent = [
      'simular entrevista', 'simulação de entrevista', 'praticar entrevista', 'treinar entrevista',
      'simulador', 'entrevista star', 'método star', 'treinamento star', 'mock interview', 'prática de entrevista',
      'simule uma entrevista', 'quero simular', 'simula entrevista', 'simular perguntas'
    ].some(k => lower.includes(k));

    if (isSimulationIntent) {
      setTimeout(() => {
        tracker.track('copilot_intent_redirected', 'Copilot', {
          intent: 'interview_simulation',
          target_tab: 'coach'
        });

        const reply = "🎯 Para simular entrevistas com método STAR, cronômetro e feedback detalhado gerado por IA, você pode acessar nossa Central de Treinamento agora:";
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: reply,
          action: {
            label: 'Abrir Simulador de Entrevistas',
            targetTab: 'coach'
          }
        }]);
      }, 300);
      return;
    }

    setIsTyping(true);

    // Chamada assíncrona para a Edge Function de Copiloto IA
    (async () => {
      try {
        if (!supabase) {
          throw new Error("Cliente Supabase não inicializado.");
        }

        const { data, error } = await supabase.functions.invoke('chat-copilot', {
          body: {
            message: userText,
            history: messages.map(m => ({ role: m.role, text: m.text })),
            context: {
              careerProfile: careerProfileNew,
              careerScore: careerScoreBreakdown,
              candidateName,
              selectedJob: selectedJob ? {
                id: selectedJob.id,
                title: selectedJob.title,
                companyName: selectedJob.companyName,
                requirements: selectedJob.requirements
              } : null,
              applications: applications.map(a => ({
                id: a.id,
                jobTitle: a.jobTitle,
                companyName: a.companyName,
                status: a.status,
                nextAction: a.nextAction,
                nextActionDate: a.nextActionDate
              })),
              jobs: jobs.slice(0, 10).map(j => ({
                id: j.id,
                title: j.title,
                companyName: j.companyName,
                location: j.location
              }))
            }
          }
        });

        if (error) {
          // Trata rate limit ou erro de permissão
          if (error.message?.includes('429') || (error as any)?.status === 429) {
            tracker.track('copilot_error_displayed', 'Copilot', { error_type: 'rate_limit' });
            setMessages(prev => [...prev, {
              role: 'assistant',
              text: 'Você atingiu o limite de mensagens do seu plano por enquanto. Tente novamente mais tarde para continuar orientando sua carreira.'
            }]);
            return;
          }
          throw error;
        }

        if (data && data.success && data.reply) {
          tracker.track('copilot_response_received', 'Copilot', { success: true });
          setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
        } else if (data && data.error) {
          if (data.error.includes('Limite de requisições')) {
            tracker.track('copilot_error_displayed', 'Copilot', { error_type: 'rate_limit' });
            setMessages(prev => [...prev, {
              role: 'assistant',
              text: 'Você atingiu o limite de mensagens do seu plano por enquanto. Tente novamente mais tarde.'
            }]);
          } else {
            throw new Error(data.error);
          }
        } else {
          throw new Error('Resposta indisponível');
        }
      } catch (err: any) {
        console.error('[COPILOT ERROR]:', err);
        tracker.track('copilot_error_displayed', 'Copilot', { error_type: 'network_or_api' });
        setLastFailedMessage(userText);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: 'Não foi possível consultar o Copiloto agora. Verifique sua conexão e tente novamente.'
        }]);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  const handleExecuteAction = (targetTab?: string, targetAppId?: string, recId?: string) => {
    if (recId) {
      tracker.track('copilot_recommendation_clicked', 'Copilot', {
        rec_id: recId,
        target_tab: targetTab || 'unknown'
      });
    }

    if (targetAppId && onStartSimulation) {
      onStartSimulation(targetAppId, true);
    } else if (targetTab && setActiveTab) {
      setActiveTab(targetTab);
    }
    handleClose();
  };

  /** Renderizador leve de markdown seguro (bold, italic, quebras) */
  function renderCopilotMarkdown(text: string): React.ReactNode {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      const parsedLine = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={partIdx} className="font-extrabold text-slate-100 dark:text-slate-100 text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={partIdx} className="italic text-slate-300 dark:text-slate-300 text-slate-700">{part.slice(1, -1)}</em>;
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
      {/* Drawer / Slide-Over Flutuante */}
      {isOpen && (
        <div 
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="copilot-drawer-title"
          className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 dark:bg-slate-900 bg-white border-l border-slate-800 dark:border-slate-800 border-slate-200 shadow-2xl z-[9995] flex flex-col animate-slide-in font-sans"
        >
          {/* Header do Drawer */}
          <div className="p-4 border-b border-slate-800 dark:border-slate-800 border-slate-200 flex justify-between items-center bg-slate-900/90 dark:bg-slate-900/90 bg-white/95 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <Bot size={18} />
              </div>
              <div>
                <h3 id="copilot-drawer-title" className="font-extrabold text-sm text-slate-100 dark:text-slate-100 text-slate-900 flex items-center gap-1.5">
                  Seu Copiloto de Carreira
                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Ativo" />
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-400 text-slate-500 font-medium">
                  Orientação personalizada para sua jornada
                </span>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Fechar copiloto"
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 text-slate-500 hover:text-slate-100 dark:hover:text-slate-100 hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Recomendações Proativas Diárias */}
          <div className="p-4 bg-slate-800/40 dark:bg-slate-800/40 bg-slate-50/90 border-b border-slate-800/80 dark:border-slate-800/80 border-slate-200 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 text-slate-500 tracking-wider">
                Ações Prioritárias Recomendadas
              </span>
              {isPro && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 dark:text-emerald-400 text-emerald-700">
                  <ShieldCheck size={11} />
                  Plano Pro Ativo
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleExecuteAction(rec.targetTab, rec.targetAppId, rec.id)}
                  className="p-2.5 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 bg-white border border-slate-800/80 dark:border-slate-800/80 border-slate-200 hover:border-brand-500/40 cursor-pointer transition-all flex items-center justify-between gap-2 group shadow-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-slate-200 dark:text-slate-200 text-slate-800 group-hover:text-brand-400 dark:group-hover:text-brand-400 text-brand-600 block truncate">
                      {rec.title}
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 text-slate-600 leading-snug line-clamp-1">
                      {rec.description}
                    </p>
                  </div>
                  <div className="p-1 rounded-lg bg-brand-500/10 text-brand-400 dark:text-brand-400 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors shrink-0">
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Interativo */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col gap-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} />
                    </div>
                  )}
                  <div
                    className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-brand-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-800/90 dark:bg-slate-800/90 bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 border-slate-200 text-slate-200 dark:text-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                    }`}
                  >
                    {renderCopilotMarkdown(m.text)}
                  </div>
                </div>

                {/* Botão de Ação Explícito quando a IA sugere treino ou navegação */}
                {m.action && (
                  <div className="ml-8 mt-1">
                    <button
                      type="button"
                      onClick={() => handleExecuteAction(m.action?.targetTab, m.action?.appId)}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Play size={13} />
                      <span>{m.action.label}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} className="animate-pulse" />
                </div>
                <div className="p-3 rounded-2xl text-xs bg-slate-800/90 dark:bg-slate-800/90 bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 border-slate-200 text-slate-400 dark:text-slate-400 text-slate-500 rounded-bl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Card de Retry se a última requisição falhou */}
            {lastFailedMessage && !isTyping && (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between gap-2 text-xs">
                <span className="text-red-300">Falha no envio anterior.</span>
                <button
                  type="button"
                  onClick={() => handleSendMessage({} as any, lastFailedMessage)}
                  className="px-3 py-1 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} />
                  <span>Tentar novamente</span>
                </button>
              </div>
            )}
          </div>

          {/* Banner de Paywall Pré-Envio para Usuários Free */}
          {!isPro && (
            <div className="p-3 mx-3 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 shrink-0">
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-bold text-amber-300 dark:text-amber-300 text-amber-800 block">
                  Copiloto Conversacional Pro
                </span>
                <p className="text-[10px] text-slate-300 dark:text-slate-300 text-slate-600 leading-snug">
                  Destrave conversas ilimitadas e mentoria personalizada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  tracker.track('copilot_paywall_prompted', 'Copilot', { source: 'pre_send_banner' });
                  setShowCheckout(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow-md shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>Conhecer Pro</span>
                <Sparkles size={11} />
              </button>
            </div>
          )}

          {/* Form do Input */}
          <div className="p-3 border-t border-slate-800 dark:border-slate-800 border-slate-200 bg-slate-900/90 dark:bg-slate-900/90 bg-slate-50 shrink-0 space-y-2">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Pergunte ao Copiloto sobre seu momento..."
                className="flex-1 bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 dark:border-slate-700 border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 dark:text-slate-100 text-slate-900 outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 placeholder:text-slate-500 dark:placeholder:text-slate-500 placeholder:text-slate-400 shadow-xs"
              />
              <button
                type="submit"
                disabled={isTyping}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Enviar
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                if (setActiveTab) setActiveTab('coach');
                handleClose();
              }}
              className="w-full py-2 text-center text-[10px] font-bold text-slate-400 dark:text-slate-400 text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 hover:text-slate-900 border border-slate-800 dark:border-slate-800 border-slate-200 hover:border-slate-700 dark:hover:border-slate-700 hover:border-slate-300 rounded-xl bg-slate-800/40 dark:bg-slate-800/40 bg-white transition-colors cursor-pointer"
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
        userName={candidateName || user?.email?.split('@')[0]}
      />
    </>
  );
}
