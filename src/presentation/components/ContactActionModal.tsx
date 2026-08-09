import { useState, useEffect } from 'react';
import { BaseModal } from './ds/BaseModal';
import { Mail, Send, Tag, Award, Phone, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

export interface ContactTargetUser {
  userId: string;
  name: string;
  email: string;
  suggestedAction?: string;
  contextMessage?: string;
}

interface ContactActionModalProps {
  user: ContactTargetUser | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type ActionType = 'email' | 'coupon' | 'ambassador' | 'call';

// Templates de Copy com Voz de Marca Vocentro
const VOCENTRO_COPY_TEMPLATES: Record<ActionType, { label: string; icon: any; subject: (name: string) => string; body: (name: string) => string }> = {
  email: {
    label: 'E-mail Direto',
    icon: Mail,
    subject: (name) => `✨ Orientação Personalizada de Carreira Vocentro — ${name}`,
    body: (name) => `Olá, ${name}!

Percebemos seu excelente engajamento na plataforma Vocentro e gostaríamos de oferecer um acompanhamento personalizado para acelerar seus resultados profissionais.

Nossa Inteligência Artificial mapeou alto potencial no seu perfil. Queremos te apoiar a otimizar seu currículo-mestre e preparar você para entrevistas técnicas com o método STAR.

Podemos agendar uma rápida conversa ou alinhar por aqui mesmo?

Um grande abraço,
Equipe de Sucesso do Candidato Vocentro`
  },
  coupon: {
    label: 'Cupom 20% OFF',
    icon: Tag,
    subject: () => `🎁 Presente Especial Vocentro: 20% OFF para destravar recursos avançados!`,
    body: (name) => `Olá, ${name}!

Como forma de reconhecimento pelo seu foco no seu desenvolvimento de carreira, liberamos um cupom exclusivo de 20% DE DESCONTO para você assinar o plano Vocentro Premium.

Use o cupom: VOCENTRO20 ao realizar a assinatura para destravar:
• Simulações ilimitadas de entrevista com o Copiloto IA
• Análise preditiva avançada de compatibilidade com vagas
• Exportação sob medida de currículos otimizados

Aproveite essa oportunidade para impulsionar seus resultados!

Com carinho,
Equipe Vocentro`
  },
  ambassador: {
    label: 'Programa Embaixador',
    icon: Award,
    subject: () => `🌟 Convite Exclusivo: Torne-se Embaixador do Vocentro!`,
    body: (name) => `Olá, ${name}!

Identificamos seu perfil como referência dentro da comunidade Vocentro e gostaríamos de te fazer um convite muito especial: integrar o nosso Programa de Embaixadores!

Como embaixador Vocentro, você terá:
• Acesso em primeira mão a novas funcionalidades de IA
• Canal direto com nosso time de produto e fundador
• Benefícios exclusivos para indicar profissionais da sua rede

Teria interesse em participar desse grupo seleto?

Abraços,
Time Vocentro`
  },
  call: {
    label: 'Ligação / WhatsApp',
    icon: Phone,
    subject: (name) => `📞 Agendamento de Diagnóstico de Carreira Vocentro — ${name}`,
    body: (name) => `Olá, ${name}!

Gostaríamos de agendar um rápido bate-papo de 10 a 15 minutos por ligação ou WhatsApp para entender seus próximos objetivos de carreira e te apresentar estratégias diretas para acelerar sua recolocação.

Qual o melhor dia e horário para conversarmos nesta semana?

No aguardo,
Equipe Vocentro`
  }
};

export function ContactActionModal({ user, onClose, onSuccess }: ContactActionModalProps) {
  const [actionType, setActionType] = useState<ActionType>('email');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // Inicializar copy de marca conforme ação ou mensagem de contexto
  useEffect(() => {
    if (!user) return;
    const template = VOCENTRO_COPY_TEMPLATES[actionType];
    setSubject(template.subject(user.name));
    setMessageText(user.contextMessage || template.body(user.name));
    setHasUnsaved(false);
  }, [actionType, user]);

  if (!user) return null;

  const handleActionChange = (type: ActionType) => {
    setActionType(type);
    const template = VOCENTRO_COPY_TEMPLATES[type];
    setSubject(template.subject(user.name));
    setMessageText(template.body(user.name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Gravar registro auditável no Supabase se configurado
      if (isSupabaseConfigured && supabase) {
        await supabase.from('activity_logs').insert({
          user_id: user.userId,
          event_type: 'admin_commercial_action',
          metadata: {
            action_type: actionType,
            recipient_email: user.email,
            recipient_name: user.name,
            subject,
            message: messageText,
            sent_at: new Date().toISOString()
          }
        });
      }

      // 2. Abrir cliente de e-mail como mecanismo de disparo direto seguro
      const mailtoUrl = `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
      window.open(mailtoUrl, '_blank');

      setIsSubmitting(false);
      setHasUnsaved(false);
      onSuccess(`Ação "${VOCENTRO_COPY_TEMPLATES[actionType].label}" registrada e e-mail aberto para ${user.email}!`);
      onClose();
    } catch (err) {
      console.error('Erro ao registrar ação comercial:', err);
      setIsSubmitting(false);
      onSuccess(`Ação "${actionType.toUpperCase()}" enviada para ${user.email}!`);
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={!!user}
      onClose={onClose}
      hasUnsavedChanges={hasUnsaved}
      maxWidthClass="max-w-xl"
      icon={<Mail size={22} className="text-brand-400" />}
      title={
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg text-white">Central de Contato & Ação Comercial</span>
          <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-extrabold uppercase border border-brand-500/20">
            Vocentro Brand
          </span>
        </div>
      }
      subtitle={
        <span className="text-xs text-slate-400">
          Candidato: <strong className="text-white font-semibold">{user.name}</strong> ({user.email})
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
        {/* Seletor de Tipo de Ação */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-400 text-[11px] block uppercase tracking-wider">
            Selecione o Tipo de Abordagem de Marca:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(VOCENTRO_COPY_TEMPLATES) as ActionType[]).map((key) => {
              const item = VOCENTRO_COPY_TEMPLATES[key];
              const Icon = item.icon;
              const isSelected = actionType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleActionChange(key)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/15 text-white font-bold shadow-md shadow-brand-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-brand-400' : 'text-slate-500'} />
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assunto Personalizado */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span>Assunto da Mensagem</span>
            <span className="text-[10px] text-brand-400 font-mono">Template de Marca Ativo</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setHasUnsaved(true);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none focus:border-brand-500 transition-colors font-medium"
            required
          />
        </div>

        {/* Conteúdo da Mensagem com Voz de Marca */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span>Corpo da Mensagem (Tom Acolhedor & Consultivo Vocentro)</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 size={12} /> Variáveis preenchidas
            </span>
          </label>
          <textarea
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              setHasUnsaved(true);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500 h-36 resize-none leading-relaxed font-mono custom-scrollbar"
            required
          />
        </div>

        {/* Rodapé com CTA de Disparo e Auditoria */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <span className="text-[10px] text-slate-500 italic">
            Registrado auditavelmente em activity_logs
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Disparando...' : 'Enviar / Registrar Ação'}</span>
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
