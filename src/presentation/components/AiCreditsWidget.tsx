import { useQuery } from '@tanstack/react-query';
import { Zap, MessageSquare, FileText, Compass, Calendar, DollarSign } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../infrastructure/api/supabaseClient';

interface AiCreditsWidgetProps {
  className?: string;
  compact?: boolean;
  userId?: string;
}

export function AiCreditsWidget({ className = '', compact = false, userId }: AiCreditsWidgetProps) {
  // Query actual credits consumption & plan status from Supabase
  const { data: credits = {
    plan: 'Free',
    resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    simulationsUsed: 0,
    optimizationsUsed: 0,
    matchesUsed: 0,
    estimatedCostBRL: 0.0,
    isPremium: false
  }, isLoading } = useQuery({
    queryKey: ['ai-credits-limits', userId],
    queryFn: async () => {
      if (!userId) {
        return {
          plan: 'Free',
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          simulationsUsed: 0,
          optimizationsUsed: 0,
          matchesUsed: 0,
          estimatedCostBRL: 0.0,
          isPremium: false
        };
      }

      // 1. Fetch Subscription status
      let plan = 'Free';
      let isPremium = false;
      let resetDateStr = '';
      
      // Default reset calculation (1 month from now)
      const defaultReset = new Date();
      defaultReset.setMonth(defaultReset.getMonth() + 1);
      resetDateStr = defaultReset.toLocaleDateString();

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: sub } = await supabase
            .from('billing_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (sub && sub.status === 'active') {
            plan = sub.plan || 'Free';
            isPremium = ['Pro', 'Enterprise'].includes(plan);
            
            const subDate = new Date(sub.created_at || sub.updated_at);
            const reset = new Date();
            reset.setDate(subDate.getDate());
            if (reset.getTime() < Date.now()) {
              reset.setMonth(reset.getMonth() + 1);
            }
            resetDateStr = reset.toLocaleDateString();
          }
        } catch (err) {
          console.error('[AiCreditsWidget] Error loading billing info:', err);
        }
      }

      // 2. Fetch Consumption logs in the last 30 days
      let simulationsUsed = 0;
      let optimizationsUsed = 0;
      let matchesUsed = 0;
      let estimatedCostBRL = 0.0;

      const localKey = 'vocentro_ai_telemetry';

      if (isSupabaseConfigured && supabase) {
        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: logs } = await supabase
            .from('ai_usage_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', thirtyDaysAgo);

          if (logs) {
            logs.forEach(log => {
              const feat = (log.feature || '').toLowerCase();
              if (feat.includes('simulation') || feat.includes('simulação')) {
                simulationsUsed++;
              } else if (feat.includes('optimize') || feat.includes('otimização') || feat.includes('feedback')) {
                optimizationsUsed++;
              } else if (feat.includes('match') || feat.includes('vaga')) {
                matchesUsed++;
              }
              // cost calculations
              estimatedCostBRL += Number(log.estimated_cost || 0) * 5.4; // conversion to BRL
            });
          }
        } catch (err) {
          console.error('[AiCreditsWidget] Error loading usage logs:', err);
        }
      } else {
        // Fallback local usage
        const localRaw = localStorage.getItem(localKey);
        if (localRaw) {
          try {
            const mockLogs = JSON.parse(localRaw);
            mockLogs.forEach((log: any) => {
              const act = (log.action_type || '').toLowerCase();
              if (act === 'simulation') simulationsUsed++;
              else if (act === 'optimization') optimizationsUsed++;
              else if (act === 'match') matchesUsed++;
              estimatedCostBRL += Number(log.estimated_cost || 0) * 5.4;
            });
          } catch (_) {}
        }
      }

      return {
        plan,
        resetDate: resetDateStr,
        simulationsUsed,
        optimizationsUsed,
        matchesUsed,
        estimatedCostBRL,
        isPremium
      };
    },
    enabled: !!userId
  });

  const limits = {
    simulations: credits.isPremium ? 100 : 3,
    optimizations: credits.isPremium ? 200 : 5,
    matches: credits.isPremium ? 500 : 15
  };

  const pct = {
    simulations: Math.min((credits.simulationsUsed / limits.simulations) * 100, 100),
    optimizations: Math.min((credits.optimizationsUsed / limits.optimizations) * 100, 100),
    matches: Math.min((credits.matchesUsed / limits.matches) * 100, 100)
  };

  // Preparation for Stripe checkout redirect in future releases
  const handleUpgradeToPremium = () => {
    // Under Stripe implementation, redirect to Stripe checkout session
    console.log('[Stripe Billing] Redirecting user to checkout session for plan PRO...');
    alert('Redirecionando para o ambiente seguro do Stripe para Upgrade...');
  };

  if (isLoading) {
    return (
      <div className={`p-4 rounded-2xl bg-slate-900/40 border border-slate-850/60 animate-pulse text-xs text-slate-500 flex justify-center items-center h-28 ${className}`}>
        Carregando limites de consumo...
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`p-4 rounded-2xl bg-slate-900/40 border border-slate-850/60 flex flex-col justify-between ${className}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-brand-accent">
            <Zap size={14} className="fill-brand-accent animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Créditos de IA</span>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${
            credits.isPremium ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {credits.isPremium ? 'Premium Copilot' : 'Plano Gratuito'}
          </span>
        </div>
        <div className="space-y-1.5 text-[10px] text-slate-400">
          <div className="flex justify-between items-center">
            <span>Simulações STAR:</span>
            <strong className="text-slate-200">{credits.simulationsUsed} / {credits.isPremium ? 'Ilimitado' : limits.simulations}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span>Otimizações CV:</span>
            <strong className="text-slate-200">{credits.optimizationsUsed} / {credits.isPremium ? 'Ilimitado' : limits.optimizations}</strong>
          </div>
        </div>
        {!credits.isPremium && (
          <button 
            type="button"
            onClick={handleUpgradeToPremium} 
            className="mt-3 w-full py-1 text-[9px] bg-brand-accent hover:bg-brand-accent/90 text-slate-950 font-bold rounded-lg transition-all cursor-pointer"
          >
            Fazer Upgrade Premium
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`premium-card rounded-[20px] p-5 relative overflow-hidden flex flex-col justify-between bg-slate-900/60 border border-slate-800 ${className}`}>
      {/* Background glow effects */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
        credits.isPremium ? 'bg-emerald-500/10' : 'bg-brand-500/10'
      }`} />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
              credits.isPremium ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-brand-500/10 border-brand-500/20 text-brand-500'
            }`}>
              <Zap size={15} className={credits.isPremium ? 'fill-emerald-400' : 'fill-brand-500'} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100">Consumo de Créditos</h4>
              <p className="text-[9px] text-slate-500">Mapeamento de limites mensais de IA</p>
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border tracking-wider ${
            credits.isPremium 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-sm shadow-emerald-500/5' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
          }`}>
            {credits.isPremium ? 'Copilot Premium' : 'Plano Gratuito'}
          </span>
        </div>

        {/* Progress bars list */}
        <div className="space-y-3.5 pt-1 text-xs">
          {/* Simulations */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-medium">
              <span className="text-slate-400 flex items-center gap-1">
                <MessageSquare size={11} className="text-slate-500" />
                Simulações STAR (Mariana)
              </span>
              <span className="text-slate-200 font-bold">
                {credits.simulationsUsed} / {credits.isPremium ? '∞' : limits.simulations}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-955 rounded-full overflow-hidden border border-slate-905">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  credits.isPremium ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-brand-accent'
                }`}
                style={{ width: `${credits.isPremium ? 100 : pct.simulations}%` }}
              />
            </div>
          </div>

          {/* CV Optimizations */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-medium">
              <span className="text-slate-400 flex items-center gap-1">
                <FileText size={11} className="text-slate-500" />
                Otimizações de ATS & Feedbacks
              </span>
              <span className="text-slate-200 font-bold">
                {credits.optimizationsUsed} / {credits.isPremium ? '∞' : limits.optimizations}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-955 rounded-full overflow-hidden border border-slate-905">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  credits.isPremium ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-brand-accent'
                }`}
                style={{ width: `${credits.isPremium ? 100 : pct.optimizations}%` }}
              />
            </div>
          </div>

          {/* Job Discovery Matches */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-medium">
              <span className="text-slate-400 flex items-center gap-1">
                <Compass size={11} className="text-slate-500" />
                Mapeamento Semântico de Vagas
              </span>
              <span className="text-slate-200 font-bold">
                {credits.matchesUsed} / {credits.isPremium ? '∞' : limits.matches}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-955 rounded-full overflow-hidden border border-slate-905">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  credits.isPremium ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-brand-accent'
                }`}
                style={{ width: `${credits.isPremium ? 100 : pct.matches}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cost & Reset Billing Metadata details */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-[9px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-slate-500" />
            <span>Renovação: <strong>{credits.resetDate}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <DollarSign size={11} className="text-slate-500" />
            <span>Consumo Mensal: <strong className="text-slate-350">R$ {credits.estimatedCostBRL.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>

      {/* Upgrade controls */}
      {!credits.isPremium && (
        <div className="mt-5 space-y-2 border-t border-slate-900 pt-3 flex flex-col">
          <button 
            type="button"
            onClick={handleUpgradeToPremium} 
            className="w-full py-2 bg-brand-accent hover:bg-brand-accent/90 text-slate-955 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 text-[10px] cursor-pointer"
          >
            <Zap size={11} className="fill-slate-955" />
            <span>Fazer Upgrade para Premium</span>
          </button>
        </div>
      )}
    </div>
  );
}
