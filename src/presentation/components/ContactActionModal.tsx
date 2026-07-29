import { useState } from 'react';
import { CardGlass } from './CardGlass';
import { Mail, Send, X, Tag, Award, Phone } from 'lucide-react';

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

export function ContactActionModal({ user, onClose, onSuccess }: ContactActionModalProps) {
  if (!user) return null;

  const [actionType, setActionType] = useState<'email' | 'coupon' | 'ambassador' | 'call'>('email');
  const [subject, setSubject] = useState(`Atendimento Especial VoCentro — ${user.name}`);
  const [messageText, setMessageText] = useState(
    user.contextMessage || `Olá, ${user.name}!\n\nIdentificamos seu excelente uso na plataforma VoCentro e gostaríamos de oferecer um acompanhamento personalizado para acelerar seus resultados.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(`Ação "${actionType.toUpperCase()}" registrada e enviada para ${user.email} com sucesso.`);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 font-sans animate-fade-in">
      <CardGlass className="w-full max-w-lg space-y-5 border border-slate-800 p-6 bg-[#121929] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white">Central de Contato e Ação Comercial</h3>
            <p className="text-xs text-slate-400">Usuário: <span className="text-slate-200 font-semibold">{user.name}</span> ({user.email})</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
          {/* Tipo de Ação */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-400 text-[11px] block uppercase tracking-wider">Tipo de Ação</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'email', label: 'E-mail Direto', icon: Mail },
                { id: 'coupon', label: 'Cupom 20%', icon: Tag },
                { id: 'ambassador', label: 'Embaixador', icon: Award },
                { id: 'call', label: 'Ligação / Zap', icon: Phone }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = actionType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActionType(item.id as any);
                      if (item.id === 'coupon') {
                        setSubject(`Presente Especial VoCentro: Cupom de 20% OFF para ${user.name}`);
                      } else if (item.id === 'ambassador') {
                        setSubject(`Convite Especial: Seja Embaixador VoCentro!`);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-brand-400' : 'text-slate-500'} />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assunto */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Assunto</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
              required
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Conteúdo da Mensagem</label>
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500 h-28 resize-none"
              required
            />
          </div>

          {/* Rodapé */}
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              {isSubmitting ? 'Enviando...' : 'Enviar / Registrar Ação'}
            </button>
          </div>
        </form>
      </CardGlass>
    </div>
  );
}
