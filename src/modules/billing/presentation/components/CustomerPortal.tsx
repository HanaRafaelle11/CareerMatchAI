import { useState, useEffect } from 'react';
import { 
  CreditCard, Calendar, AlertTriangle, 
  Sparkles, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw
} from 'lucide-react';
import { supabase } from '../../../../infrastructure/api/supabaseClient';
import { PLAN_PRICING } from '../../../../domain/config/pricing';

interface CustomerPortalProps {
  userId?: string;
  onOpenCheckout?: () => void;
}

export function CustomerPortal({ userId, onOpenCheckout }: CustomerPortalProps) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPortalData = async () => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setLoading(false);
        return;
      }

      const res = await supabase.functions.invoke('billing-portal', {
        body: { action: 'get_subscription' },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data) {
        setSubscription(res.data.subscription);
        setInvoices(res.data.invoices || []);
      }
    } catch (err) {
      console.error('[CustomerPortal] Erro ao carregar portal de assinatura:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!supabase) return;
    try {
      setReactivating(true);
      setMessage(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const { data, error } = await supabase.functions.invoke('billing-portal', {
        body: { action: 'reactivate_subscription' },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Erro ao reativar assinatura');
      }

      setMessage({ type: 'success', text: data.message || 'Assinatura reativada com sucesso! Suas renovações automáticas foram restabelecidas.' });
      await fetchPortalData();
    } catch (err: any) {
      console.error('[CustomerPortal] Erro ao reativar assinatura:', err);
      setMessage({ type: 'error', text: err.message || 'Falha ao reativar assinatura. Tente novamente em instantes.' });
    } finally {
      setReactivating(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [userId]);

  const handleCancelSubscription = async () => {
    if (!supabase) return;
    setCanceling(true);
    setMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await supabase.functions.invoke('billing-portal', {
        body: { action: 'cancel_subscription' },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.error || !res.data?.success) {
        throw new Error(res.error?.message || res.data?.error || 'Erro ao cancelar assinatura.');
      }

      setMessage({ type: 'success', text: 'Sua assinatura foi cancelada com sucesso. Você continua com acesso até o fim da vigência atual.' });
      setShowCancelConfirm(false);
      fetchPortalData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao cancelar assinatura.' });
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded-lg" />
        <div className="h-20 bg-slate-800/60 rounded-2xl" />
        <div className="h-32 bg-slate-800/40 rounded-2xl" />
      </div>
    );
  }

  const isUnexpiredCanceled = subscription?.status === 'canceled' && subscription?.current_period_end && new Date(subscription.current_period_end) > new Date();
  const isInActiveGracePeriod = subscription?.status === 'grace_period' && (subscription as any)?.grace_period_end && new Date((subscription as any).grace_period_end) > new Date();
  const isPro = subscription?.status === 'active' || subscription?.status === 'trialing' || Boolean(isUnexpiredCanceled) || Boolean(isInActiveGracePeriod);

  return (
    <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6 text-white font-sans">
      
      {/* Cabecalho da Secao */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="text-brand-400" size={22} />
            <h3 className="text-lg font-bold text-white">Minha Assinatura Vocentro</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie seu plano, faturas e opções de cobrança.</p>
        </div>

        <button
          type="button"
          onClick={fetchPortalData}
          className="px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {message && (
        <div className={`p-3.5 rounded-2xl text-xs font-medium border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Card do Plano Atual */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-white">
              {subscription?.plan?.name 
                ? (subscription.plan.name.toLowerCase().startsWith('plano') ? subscription.plan.name : `Plano ${subscription.plan.name}`)
                : 'Plano Gratuito (Free)'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
              isPro && !isUnexpiredCanceled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : subscription?.status === 'pending'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : isUnexpiredCanceled
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {subscription?.status === 'active' ? '🟢 Ativo' : subscription?.status === 'pending' ? '🟡 Pagamento Pendente' : subscription?.status === 'canceled' ? (isUnexpiredCanceled ? '🟣 Cancelado — Acesso Pro Ativo' : '⚪ Expirado') : 'Free'}
            </span>
            {subscription?.billing_cycle && (
              <span className="text-[10px] text-slate-300 font-medium px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                {subscription.billing_cycle === 'WEEKLY' ? `Ciclo Semanal (${PLAN_PRICING.proWeeklyFormatted}/sem)` : `Ciclo Mensal (${PLAN_PRICING.proMonthlyFormatted}/mês)`}
              </span>
            )}
          </div>

          {subscription?.current_period_end && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar size={14} className="text-brand-400" />
              <span>Vigência até: <strong className="text-slate-200">{new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</strong></span>
            </p>
          )}
        </div>

        {/* Botão de Ação Principal */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isPro ? (
            <button
              type="button"
              onClick={onOpenCheckout}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={16} />
              <span>Fazer Upgrade para Pro</span>
            </button>
          ) : isUnexpiredCanceled ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
              <span className="text-xs font-bold text-slate-400 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
                Assinatura Cancelada (Sem novas cobranças)
              </span>
              <button
                type="button"
                disabled={reactivating}
                onClick={handleReactivateSubscription}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={14} className={reactivating ? "animate-spin" : ""} />
                <span>{reactivating ? 'Reativando...' : 'Reativar Assinatura'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar Assinatura
            </button>
          )}
        </div>
      </div>

      {/* Confirmação de Cancelamento */}
      {showCancelConfirm && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Tem certeza que deseja cancelar?</span>
          </div>
          <p className="text-slate-300">
            Você continuará com acesso total aos recursos Pro até o encerramento do seu período pago atual.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={canceling}
              onClick={handleCancelSubscription}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
            >
              {canceling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs"
            >
              Manter Minha Assinatura
            </button>
          </div>
        </div>
      )}

      {/* Histórico de Faturas */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Histórico de Faturas</h4>

        {invoices.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
            Nenhuma fatura registrada até o momento.
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div 
                key={inv.id} 
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  {inv.status === 'paid' ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  ) : inv.status === 'pending' ? (
                    <Clock size={18} className="text-amber-400 shrink-0" />
                  ) : (
                    <XCircle size={18} className="text-slate-500 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-slate-200">
                      R$ {Number(inv.amount).toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-300'
                  }`}>
                    {inv.status === 'paid' ? 'Pago' : 'Pendente'}
                  </span>

                  {inv.bank_slip_url && (
                    <a
                      href={inv.bank_slip_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title="Abrir Boleto"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
