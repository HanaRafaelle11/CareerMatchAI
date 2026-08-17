import { useEffect, useRef } from 'react';
import { BaseModal } from '../../../../presentation/components/ds/BaseModal';
import { Sparkles, ArrowRight, Bot, Layers, BarChart3, FileText, Send, Calendar } from 'lucide-react';
import type { PaywallTriggerState } from '../..';
import { getDaysUntilNextMonday } from '../../application/hooks/useEntitlements';
import { PLAN_PRICING } from '../../../../domain/config/pricing';
import { tracker } from '../../../../infrastructure/analytics/tracker';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: PaywallTriggerState['feature'];
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onUpgrade: () => void;
}

export function PaywallModal({
  isOpen,
  onClose,
  feature = 'default',
  title,
  description,
  primaryButtonText,
  secondaryButtonText,
  onUpgrade
}: PaywallModalProps) {
  const getFeatureDetails = () => {
    const daysLeft = getDaysUntilNextMonday();
    const daysText = daysLeft === 1 ? '1 dia' : `${daysLeft} dias`;

    switch (feature) {
      case 'weekly_limit':
        return {
          icon: <Calendar className="text-amber-500" size={32} />,
          badge: 'Cota Semanal de Vagas (3/3)',
          defaultTitle: 'Você já encontrou boas oportunidades. Quer acessar todas?',
          defaultDesc: 'Com o PRO, você desbloqueia vagas ilimitadas e ainda pode analisar sua compatibilidade, otimizar seu currículo com IA e aumentar suas chances de passar pelos filtros ATS.',
          defaultPrimaryBtn: 'Desbloquear vagas e recursos PRO',
          defaultSecondaryBtn: `Renova em ${daysText} (Segunda-feira 00:00)`,
          benefits: [
            'Acesso e desbloqueio de vagas 100% ilimitado',
            'Análise de compatibilidade profunda com IA Gemini',
            'Otimização de currículo em PDF ATS & Copiloto IA 24/7'
          ]
        };

      case 'applications':
        return {
          icon: <Send className="text-brand-500" size={32} />,
          badge: 'Limite Semanal Atingido',
          defaultTitle: 'Alcance Mais Oportunidades com o Vocentro Pro 🚀',
          defaultDesc: 'No plano Gratuito, o envio é limitado a 3 candidaturas por semana (reset toda segunda-feira às 00:00). Faça o upgrade para o Pro e envie candidaturas ilimitadas com autofill inteligente!',
          defaultPrimaryBtn: `Fazer Upgrade para Pro (A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana)`,
          defaultSecondaryBtn: 'Continuar no Plano Gratuito',
          benefits: ['Candidaturas ilimitadas por semana', 'Autofill de currículo otimizado com IA', 'Prioridade no Matching de Vagas com Gemini']
        };
      case 'copilot':
        return {
          icon: <Bot className="text-indigo-500" size={32} />,
          badge: 'Recurso Exclusivo Pro',
          defaultTitle: 'Desbloqueie o Copiloto IA de Carreira 🤖',
          defaultDesc: 'O Copiloto IA analisa requisitos de vagas em tempo real, gera cartas de apresentação sob medida e fornece orientações estratégicas de entrevista.',
          defaultPrimaryBtn: `Fazer Upgrade para Pro (A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana)`,
          defaultSecondaryBtn: 'Continuar no Plano Gratuito',
          benefits: ['Copiloto IA 24/7 integrado', 'Gerador ilimitado de cartas de apresentação', 'Simulações comportamentais no método STAR']
        };
      case 'resumes':
        return {
          icon: <FileText className="text-amber-500" size={32} />,
          badge: 'Limite de Currículos Salvos',
          defaultTitle: 'Crie Múltiplas Versões do seu Currículo 📄',
          defaultDesc: 'O plano Gratuito permite manter apenas 1 versão salva do currículo. No Pro você pode ter até 10 versões adaptadas para diferentes cargos.',
          defaultPrimaryBtn: `Fazer Upgrade para Pro (A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana)`,
          defaultSecondaryBtn: 'Continuar no Plano Gratuito',
          benefits: ['Até 10 versões adaptadas simultâneas', 'Exportação ilimitada de PDF em formato ATS', 'Análise profunda de ATS e pontuação de compatibilidade']
        };
      case 'kanban':
        return {
          icon: <Layers className="text-emerald-500" size={32} />,
          badge: 'Pipeline Avançado Pro',
          defaultTitle: 'Organize suas Candidaturas no Kanban Drag & Drop 📊',
          defaultDesc: 'Visualize todo o seu funil de processos seletivos de forma ágil, arraste cards entre etapas e receba alertas de acompanhamento.',
          defaultPrimaryBtn: `Fazer Upgrade para Pro (A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana)`,
          defaultSecondaryBtn: 'Continuar no Plano Gratuito',
          benefits: ['Quadro Kanban dinâmico e arrastável', 'Métricas de conversão de candidaturas por etapa', 'Histórico completo sem restrição de dias']
        };
      case 'analytics':
        return {
          icon: <BarChart3 className="text-purple-500" size={32} />,
          badge: 'Painel de Métricas Pro',
          defaultTitle: 'Acesse Insights Avançados de Desempenho 📈',
          defaultDesc: 'Descubra a taxa de conversão dos seus currículos, lacunas de competências e métricas da sua evolução profissional.',
          defaultPrimaryBtn: `Fazer Upgrade para Pro (A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana)`,
          defaultSecondaryBtn: 'Continuar no Plano Gratuito',
          benefits: ['Métricas de conversão por versão de currículo', 'Insights de lacunas de competências', 'Relatórios executivos de telemetria de carreira']
        };
      case 'ia_training':
        return {
          icon: <Bot className="text-amber-500" size={32} />,
          badge: 'Treinamento IA Exclusivo Pro',
          defaultTitle: 'Pratique Entrevistas com Treinamento IA 🎯',
          defaultDesc: 'Simule entrevistas no método STAR, receba perguntas adaptadas ao cargo e obtenha feedback comportamental instantâneo para conquistar o recrutador.',
          defaultPrimaryBtn: `Fazer Upgrade para Pro (A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana)`,
          defaultSecondaryBtn: 'Continuar no Plano Gratuito',
          benefits: ['Simulações ilimitadas no método STAR', 'Feedback em tempo real da IA sobre respostas', 'Relatórios de calibragem comportamental']
        };
      case 'pdf_export':
        return {
          icon: <FileText className="text-emerald-500" size={32} />,
          badge: 'Exportação PDF Pro',
          defaultTitle: 'Baixe seu Currículo em PDF Otimizado para ATS 📄',
          defaultDesc: 'No plano Gratuito você pode cadastrar e editar seu currículo. A exportação direta em formato PDF profissional pronto para ATS é exclusiva do Pro.',
          defaultPrimaryBtn: `Fazer Upgrade para Pro (A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana)`,
          defaultSecondaryBtn: 'Continuar no Plano Gratuito',
          benefits: ['Download ilimitado de currículos em PDF ATS', 'Exportação de cartas de recomendação em PDF', 'Modelos executivos validados por recrutadores']
        };
      default:
        return {
          icon: <Sparkles className="text-amber-500" size={32} />,
          badge: 'Evolua sua Carreira',
          defaultTitle: 'Acelere sua Recolocação com o Vocentro Pro 🚀',
          defaultDesc: 'Obtenha acesso ilimitado a todas as ferramentas de IA, simulações de entrevista e métricas avançadas.',
          defaultPrimaryBtn: `Fazer Upgrade para Pro (A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana)`,
          defaultSecondaryBtn: 'Continuar no Plano Gratuito',
          benefits: ['Acesso ilimitado ao Copiloto IA', 'Pipeline Kanban e candidaturas sem limites', 'Exportação ilimitada de PDF ATS']
        };
    }
  };

  const details = getFeatureDetails();
  const displayTitle = title || details.defaultTitle;
  const displayDesc = description || details.defaultDesc;
  const displayPrimaryBtn = primaryButtonText || details.defaultPrimaryBtn || `Fazer Upgrade para Pro (A partir de ${PLAN_PRICING.proWeeklyFormatted}/semana)`;
  const displaySecondaryBtn = secondaryButtonText || details.defaultSecondaryBtn || 'Continuar no Plano Gratuito';

  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!hasTrackedViewRef.current) {
        hasTrackedViewRef.current = true;
        tracker.trackPaywallViewed(feature, { title: displayTitle });
      }
    } else {
      hasTrackedViewRef.current = false;
    }
  }, [isOpen, feature, displayTitle]);

  const handleAction = () => {
    tracker.trackPaywallCtaClicked(feature, { cta_text: displayPrimaryBtn });
    onClose();
    onUpgrade();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-sm"
      showCloseButton={true}
    >
      <div className="space-y-5 text-center font-sans py-1 animate-fade-in">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
          {details.icon}
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-extrabold text-[10px] uppercase tracking-wider">
            {details.badge}
          </span>
          <h3 className="text-lg sm:text-xl font-black text-foreground leading-tight">
            {displayTitle}
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {displayDesc}
          </p>
        </div>

        <div className="pt-1 space-y-2">
          <button
            type="button"
            onClick={handleAction}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-white font-black text-sm shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>{displayPrimaryBtn}</span>
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer"
          >
            {displaySecondaryBtn}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
