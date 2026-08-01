import { BaseModal } from '../../../../presentation/components/ds/BaseModal';
import { Sparkles, ArrowRight, Lock, CheckCircle2, Bot, Layers, BarChart3, FileText, Send } from 'lucide-react';
import type { PaywallTriggerState } from '../..';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: PaywallTriggerState['feature'];
  title?: string;
  description?: string;
  onUpgrade: () => void;
}

export function PaywallModal({
  isOpen,
  onClose,
  feature = 'default',
  title,
  description,
  onUpgrade
}: PaywallModalProps) {
  const getFeatureDetails = () => {
    switch (feature) {
      case 'applications':
        return {
          icon: <Send className="text-brand-400" size={32} />,
          badge: 'Limite Semanal Atingido',
          defaultTitle: 'Alcance Mais Oportunidades com o Vocentro Pro 🚀',
          defaultDesc: 'No plano Gratuito, o envio é limitado a 3 candidaturas por semana (reset toda segunda-feira às 00:00). Faça o upgrade para o Pro e envie candidaturas ilimitadas com autofill inteligente!',
          benefits: ['Candidaturas ilimitadas por semana', 'Autofill de currículo otimizado com IA', 'Prioridade no Matching de Vagas com Gemini']
        };
      case 'copilot':
        return {
          icon: <Bot className="text-indigo-400" size={32} />,
          badge: 'Recurso Exclusivo Pro',
          defaultTitle: 'Desbloqueie o Copiloto IA de Carreira 🤖',
          defaultDesc: 'O Copiloto IA analisa requisitos de vagas em tempo real, gera cartas de apresentação sob medida e fornece orientações estratégicas de entrevista.',
          benefits: ['Copiloto IA 24/7 integrado', 'Gerador ilimitado de cartas de apresentação', 'Simulações comportamentais no método STAR']
        };
      case 'resumes':
        return {
          icon: <FileText className="text-amber-400" size={32} />,
          badge: 'Limite de Currículos Salvos',
          defaultTitle: 'Crie Múltiplas Versões do seu Currículo 📄',
          defaultDesc: 'O plano Gratuito permite manter apenas 1 versão salva do currículo. No Pro você pode ter até 10 versões adaptadas para diferentes cargos.',
          benefits: ['Até 10 versões adaptadas simultâneas', 'Exportação ilimitada de PDF em formato ATS', 'Análise profunda de ATS e pontuação de compatibilidade']
        };
      case 'kanban':
        return {
          icon: <Layers className="text-emerald-400" size={32} />,
          badge: 'Pipeline Avançado Pro',
          defaultTitle: 'Organize suas Candidaturas no Kanban Drag & Drop 📊',
          defaultDesc: 'Visualize todo o seu funil de processos seletivos de forma ágil, arraste cards entre etapas e receba alertas de acompanhamento.',
          benefits: ['Quadro Kanban dinâmico e arrastável', 'Métricas de conversão de candidaturas por etapa', 'Histórico completo sem restrição de dias']
        };
      case 'analytics':
        return {
          icon: <BarChart3 className="text-violet-400" size={32} />,
          badge: 'Painel de Métricas Pro',
          defaultTitle: 'Acesse Insights Avançados de Desempenho 📈',
          defaultDesc: 'Descubra a taxa de conversão dos seus currículos, lacunas de competências e métricas da sua evolução profissional.',
          benefits: ['Métricas de conversão por versão de currículo', 'Insights de lacunas de competências', 'Relatórios executivos de telemetria de carreira']
        };
      default:
        return {
          icon: <Sparkles className="text-amber-400" size={32} />,
          badge: 'Evolua sua Carreira',
          defaultTitle: 'Acelere sua Recolocação com o Vocentro Pro 🚀',
          defaultDesc: 'Obtenha acesso ilimitado a todas as ferramentas de IA, simulações de entrevista e métricas avançadas.',
          benefits: ['Acesso ilimitado ao Copiloto IA', 'Pipeline Kanban e candidaturas sem limites', 'Exportação ilimitada de PDF ATS']
        };
    }
  };

  const details = getFeatureDetails();
  const displayTitle = title || details.defaultTitle;
  const displayDesc = description || details.defaultDesc;

  const handleAction = () => {
    onClose();
    onUpgrade();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      showCloseButton={true}
    >
      <div className="space-y-6 text-center font-sans py-2 animate-fade-in">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center shadow-lg shadow-brand-500/10">
          {details.icon}
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-extrabold text-[10px] uppercase tracking-wider">
            {details.badge}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {displayTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {displayDesc}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            O que você libera no Vocentro Pro:
          </span>
          {details.benefits.map((b, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleAction}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-slate-950 font-black text-sm shadow-xl cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            <span>Fazer Upgrade para Pro (R$ 29,90/mês)</span>
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
          >
            Continuar no Plano Gratuito
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
