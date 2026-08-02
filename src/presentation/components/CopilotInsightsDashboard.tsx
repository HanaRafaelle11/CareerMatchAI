import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, Bot, RefreshCw, 
  Lightbulb, CheckCircle2, 
  Database, ShieldCheck
} from 'lucide-react';
import { CopilotInsightsService, type CopilotInsightItem } from '../../application/services/CopilotInsightsService';

export function CopilotInsightsDashboard() {
  const { data: insightsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['copilot-insights-metrics'],
    queryFn: () => CopilotInsightsService.getCopilotInsights(),
    refetchInterval: 30000
  });

  const activeInsights = insightsData?.activeInsights || [];
  const futureInsights = insightsData?.futurePendingInsights || [];

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header Banner do Módulo 2.2 */}
      <div className="p-6 rounded-2xl bg-card border border-brand-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20 uppercase tracking-wider">
              Módulo 2.2 — Command Center
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Síntese & Interpretação de Telemetria por IA
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-2 flex items-center gap-2">
            <Sparkles className="text-brand-500" size={24} />
            <span>Insights do Copiloto — Interpretação Sintética em Linguagem Natural</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            Diagnósticos executivos automatizados sobre a utilização do produto, retenção, latência e gargalos de funil, acompanhados da declaração auditável da fonte dos dados.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="px-4 py-2 rounded-xl bg-card hover:bg-card/80 border border-border text-foreground font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start md:self-center shrink-0 shadow-xs"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin text-brand-500' : ''} />
          <span>Sintetizar Insights</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground space-y-3">
          <Bot className="animate-spin text-brand-500 mx-auto" size={32} />
          <p className="text-xs font-semibold text-foreground">Processando motor de interpretação de telemetria...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Insights Ativos Sintetizados</span>
              <strong className="text-3xl font-black text-foreground">{activeInsights.length}</strong>
              <span className="text-[10px] text-muted-foreground block">diagnósticos gerados com dados reais</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Eventos Analisados</span>
              <strong className="text-3xl font-black text-brand-500">{insightsData?.totalTelemetryEventsAnalyzed}</strong>
              <span className="text-[10px] text-muted-foreground block">registros cruzados nas tabelas</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block">Última Atualização</span>
              <strong className="text-3xl font-black text-purple-500">{insightsData?.generatedAt}</strong>
              <span className="text-[10px] text-muted-foreground block">síntese em tempo real</span>
            </div>
          </div>

          {/* Grid de Insights Ativos em Linguagem Natural */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              <span>Insights Preditivos Ativos (Dados Disponíveis Hoje)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeInsights.map((insight: CopilotInsightItem) => (
                <div 
                  key={insight.id}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-brand-500/40 transition space-y-3.5 flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-card border border-border text-foreground">
                          {insight.category}
                        </span>
                        <strong className="text-xs font-bold text-foreground">{insight.title}</strong>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        insight.impactLevel === 'Alto Impacto'
                          ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                          : insight.impactLevel === 'Impacto Moderado'
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      }`}>
                        {insight.impactLevel}
                      </span>
                    </div>

                    {/* Síntese em Linguagem Natural */}
                    <p className="text-xs text-foreground leading-relaxed font-sans">
                      {insight.naturalLanguageSummary}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-border">
                    {/* Recomendação de Ação */}
                    <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-1">
                      <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-brand-500" /> Ação Recomendada
                      </span>
                      <p className="text-[11px] text-foreground font-medium leading-snug">
                        {insight.actionableRecommendation}
                      </p>
                    </div>

                    {/* Declarativo Auditável de Fonte de Dados */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Database size={11} className="text-muted-foreground" /> Fonte Auditável:
                      </span>
                      <span className="text-foreground truncate max-w-[240px]" title={insight.dataSourceAudit}>
                        {insight.dataSourceAudit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ⚠️ SEÇÃO SEPARADA: INSIGHTS FUTUROS — PENDENTE DE DADOS */}
          <div className="p-5 rounded-2xl bg-card border border-purple-500/20 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-purple-500" />
                  <span>Insights Futuros — Pendente de Dado (Faturamento & Checkout)</span>
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {futureInsights.map((insight: CopilotInsightItem) => (
                <div key={insight.id} className="p-4 rounded-xl bg-card/60 border border-border space-y-2">
                  <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block">{insight.category}</span>
                  <h4 className="text-xs font-bold text-foreground">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.naturalLanguageSummary}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
