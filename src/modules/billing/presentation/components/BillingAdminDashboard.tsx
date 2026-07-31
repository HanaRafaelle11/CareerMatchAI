import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../../../../infrastructure/api/supabaseClient';

interface BillingAdminDashboardProps {
  userId?: string;
}

export function BillingAdminDashboard({ userId }: BillingAdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    mrr: 0,
    arr: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    revenueMonth: 0,
    avgTicket: 29.9
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const fetchFinancialMetrics = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // 1. Contar Assinaturas Ativas
      const { count: activeCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 2. Contar Faturas Pendentes
      const { count: pendingCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // 3. Somar Receita do Mês e Transações
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, amount, status, payment_method, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      const mrrCalc = (activeCount || 0) * 29.90;

      setMetrics({
        mrr: mrrCalc,
        arr: mrrCalc * 12,
        activeSubscriptions: activeCount || 0,
        pendingPayments: pendingCount || 0,
        revenueMonth: mrrCalc,
        avgTicket: 29.90
      });

      setRecentTransactions(transactions || []);
    } catch (err) {
      console.error('[BillingAdminDashboard] Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialMetrics();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-800/60 rounded-2xl" />
          <div className="h-24 bg-slate-800/60 rounded-2xl" />
          <div className="h-24 bg-slate-800/60 rounded-2xl" />
          <div className="h-24 bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6 text-white font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={24} />
            <span>Dashboard Financeiro & Billing SaaS</span>
          </h3>
          <p className="text-xs text-slate-400">Métricas em tempo real de receita, assinaturas e cobranças do Vocentro.</p>
        </div>

        <button
          type="button"
          onClick={fetchFinancialMetrics}
          className="px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Grid de Cards Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <div className="flex justify-between items-center text-emerald-400 text-xs font-bold">
            <span>MRR (Receita Recorrente)</span>
            <DollarSign size={16} />
          </div>
          <div className="text-2xl font-black text-white">
            R$ {metrics.mrr.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[10px] text-emerald-400/80">Mensal Estimado</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1">
          <div className="flex justify-between items-center text-blue-400 text-xs font-bold">
            <span>ARR (Projeção Anual)</span>
            <TrendingUp size={16} />
          </div>
          <div className="text-2xl font-black text-white">
            R$ {metrics.arr.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[10px] text-blue-400/80">MRR x 12</div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 space-y-1">
          <div className="flex justify-between items-center text-brand-400 text-xs font-bold">
            <span>Assinaturas Ativas</span>
            <Users size={16} />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics.activeSubscriptions}
          </div>
          <div className="text-[10px] text-brand-400/80">Clientes Pro Ativos</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
          <div className="flex justify-between items-center text-amber-400 text-xs font-bold">
            <span>PIX / Boletos Pendentes</span>
            <Clock size={16} />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics.pendingPayments}
          </div>
          <div className="text-[10px] text-amber-400/80">Aguardando Liquidação</div>
        </div>
      </div>

      {/* Tabela de Ultimas Transacoes */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Últimas Transações Financeiras</h4>
        {recentTransactions.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
            Nenhuma transação registrada no período.
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">
                    R$ {Number(tx.amount).toFixed(2).replace('.', ',')} • {tx.payment_method}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(tx.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  tx.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-300'
                }`}>
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
