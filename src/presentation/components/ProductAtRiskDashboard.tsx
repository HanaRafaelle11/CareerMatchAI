import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldAlert, Users, ArrowUpRight, 
  RefreshCw, HelpCircle, Filter, Activity
} from 'lucide-react';
import { ProductAtRiskService, type RiskAlert } from '../../application/services/ProductAtRiskService';
import { ProductAtRiskUsersModal } from './ProductAtRiskUsersModal';

export function ProductAtRiskDashboard() {
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: alerts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['product-at-risk-alerts'],
    queryFn: () => ProductAtRiskService.getRiskAlerts(),
    refetchInterval: 30000
  });

  const p1Count = alerts.filter(a => a.priority === 'P1 - Crítica').reduce((acc, a) => acc + a.count, 0);
  const p2Count = alerts.filter(a => a.priority === 'P2 - Alta').reduce((acc, a) => acc + a.count, 0);
  const p3Count = alerts.filter(a => a.priority === 'P3 - Média').reduce((acc, a) => acc + a.count, 0);
  const totalAffected = alerts.reduce((acc, a) => acc + a.count, 0);

  const filteredAlerts = categoryFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.category === categoryFilter);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Banner Principal do Módulo 2.1 */}
      <div className="p-6 rounded-2xl bg-card border border-red-500/30 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider">
                Módulo 2.1 — Command Center
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Telemetria & Diagnóstico Ativo
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground mt-2 flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={24} />
              <span>Produto em Risco — Central de Alertas Proativos</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Mapeamento automático de candidatos estagnados, falhas de onboarding e gargalos na jornada do funil. Identifica proativamente pontos de fricção para intervenção do time de suporte e produto.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="px-4 py-2 rounded-xl bg-card hover:bg-card/80 border border-border text-foreground font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start md:self-center shrink-0 shadow-xs"
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin text-brand-500' : ''} />
            <span>Atualizar Métricas</span>
          </button>
        </div>

        {/* Resumo de Indicadores de Risco */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-card/80 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total de Alertas</span>
            <strong className="text-2xl font-black text-foreground">{totalAffected}</strong>
            <span className="text-[10px] text-muted-foreground block">casos monitorados</span>
          </div>

          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">P1 - Severidade Crítica</span>
            <strong className="text-2xl font-black text-red-500">{p1Count}</strong>
            <span className="text-[10px] text-red-500/80 block">ação imediata requerida</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">P2 - Severidade Alta</span>
            <strong className="text-2xl font-black text-amber-500">{p2Count}</strong>
            <span className="text-[10px] text-amber-500/80 block">atenção em 24h-48h</span>
          </div>

          <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/30 space-y-1">
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">P3 - Severidade Média</span>
            <strong className="text-2xl font-black text-brand-500">{p3Count}</strong>
            <span className="text-[10px] text-brand-500/80 block">acompanhamento</span>
          </div>
        </div>
      </div>

      {/* Filtros de Categoria */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-muted-foreground font-bold flex items-center gap-1 shrink-0 mr-1">
            <Filter size={12} /> Categoria:
          </span>
          {[
            { id: 'all', label: 'Todos os Alertas' },
            { id: 'onboarding', label: 'Onboarding' },
            { id: 'match', label: 'Match' },
            { id: 'engagement', label: 'Engajamento & Acesso' },
            { id: 'pipeline', label: 'Pipeline & Kanban' },
            { id: 'parsing', label: 'Parsing & OCR' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Alertas de Risco */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground space-y-3">
          <Activity className="animate-spin text-brand-500 mx-auto" size={32} />
          <p className="text-xs font-semibold text-foreground">Carregando telemetria de alertas do produto...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlerts.map((alert: RiskAlert) => (
            <div 
              key={alert.id}
              className={`p-5 rounded-2xl bg-card border transition flex flex-col justify-between space-y-4 shadow-xs hover:border-brand-500/40 ${
                alert.status === 'parcial'
                  ? 'border-purple-500/30 bg-purple-500/5'
                  : alert.priority === 'P1 - Crítica'
                  ? 'border-red-500/30 bg-red-500/5'
                  : alert.priority === 'P2 - Alta'
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-border'
              }`}
            >
              <div className="space-y-2.5">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    alert.priority === 'P1 - Crítica'
                      ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                      : alert.priority === 'P2 - Alta'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : 'bg-brand-500/20 text-brand-500 border border-brand-500/30'
                  }`}>
                    {alert.priority}
                  </span>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground">{alert.count}</span>
                    <span className="text-[10px] text-muted-foreground">afetados</span>
                  </div>
                </div>

                {/* Título & Indicador de Dado Parcial */}
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-snug">{alert.title}</h3>

                  {alert.status === 'parcial' && (
                    <div className="mt-1.5 p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[9px] text-purple-500 font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle size={12} className="text-purple-500 shrink-0" />
                      <span>{alert.statusLabel || 'DADO PARCIAL — INSTRUMENTAÇÃO ADICIONAL NECESSÁRIA'}</span>
                    </div>
                  )}
                </div>

                {/* Impacto */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {alert.impact}
                </p>
              </div>

              {/* Botão de Ação */}
              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    alert.status === 'parcial'
                      ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-500 border border-purple-500/30'
                      : alert.priority === 'P1 - Crítica'
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30'
                      : 'bg-card hover:bg-card/80 text-foreground border border-border'
                  }`}
                >
                  <Users size={14} />
                  <span>Abrir Lista de Usuários Afetados</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhamento dos Usuários Afetados */}
      <ProductAtRiskUsersModal 
        alert={selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
      />
    </div>
  );
}
