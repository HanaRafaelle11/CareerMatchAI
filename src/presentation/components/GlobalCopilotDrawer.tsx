import { useState } from 'react';
import { Sparkles, X, ArrowRight, Bot } from 'lucide-react';
import { useCopilotEngine } from '../../application/hooks/useCopilotEngine';
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');

    // Resposta conversacional inteligente simulada / heurística
    setTimeout(() => {
      let reply = "Entendido! Recomendo focar na preparação para suas entrevistas ativas e manter seu perfil atualizado.";
      const lower = userText.toLowerCase();

      if (lower.includes('pretensão') || lower.includes('salário') || lower.includes('salario')) {
        reply = "Para negociação salarial, pesquise a média do mercado para seu nível técnico e responda focando na faixa de valor que você agrega. Quer praticar uma resposta no simulador?";
      } else if (lower.includes('vaga') || lower.includes('candidatar') || lower.includes('aplicar')) {
        reply = "Vou destacar as vagas de maior prioridade para o seu perfil no painel de Vagas & Match.";
      } else if (lower.includes('currículo') || lower.includes('curriculo') || lower.includes('cv')) {
        reply = "Seu currículo atual já possui boa estrutura. Você pode selecionar qualquer vaga ativa para gerar uma versão sob medida.";
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
      {/* Opção A: Botão Flutuante Único no Canto Inferior Direito (Ajustado no Mobile para não cobrir a Bottom Bar) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9990] flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 text-white font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all border border-brand-400/30 group"
      >
        <Sparkles size={16} className="animate-spin-slow text-amber-300" />
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
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Conteúdo com Scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Card: Recomendações Proativas do Dia */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-950/40 via-slate-900 to-indigo-950/30 border border-brand-500/20 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                  {greetingHeadline}
                </p>
              </div>

              <div className="space-y-2">
                {recommendations.map(rec => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 hover:border-brand-500/40 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-xs text-slate-100">{rec.title}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">{rec.description}</p>
                    <button
                      onClick={() => handleExecuteAction(rec.targetTab, rec.targetAppId)}
                      className="mt-1 text-[10px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <span>{rec.actionLabel}</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Conversacional Flutuante Rápido */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Conversa Contínua
              </span>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs ${
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
            </div>
          </div>

          {/* Form de Input + Botão para Central Completa */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-2">
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
    </>
  );
}
