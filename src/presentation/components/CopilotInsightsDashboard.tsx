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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
              Módulo 2.2 — Command Center
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Síntese & Interpretação de Telemetria por IA
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <Sparkles className="text-blue-400" size={24} />
            <span>Insights do Copiloto — Interpretação Sintética em Linguagem Natural</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Diagnósticos executivos automatizados sobre a utilização do produto, retenção, latência e gargalos de funil, acompanhados da declaração auditável da fonte dos dados.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start md:self-center shrink-0"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin text-blue-400' : ''} />
          <span>Sintetizar Insights</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-500 space-y-3">
          <Bot className="animate-spin text-blue-500 mx-auto" size={32} />
          <p className="text-xs font-semibold text-slate-300">Processando motor de interpretação de telemetria...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Insights Ativos Sintetizados</span>
              <strong className="text-3xl font-black text-slate-100">{activeInsights.length}</strong>
              <span className="text-[10px] text-slate-500 block">diagnósticos gerados com dados reais</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Eventos Analisados</span>
              <strong className="text-3xl font-black text-blue-400">{insightsData?.totalTelemetryEventsAnalyzed}</strong>
              <span className="text-[10px] text-slate-500 block">registros cruzados nas tabelas</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Última Atualização</span>
              <strong className="text-3xl font-black text-purple-400">{insightsData?.generatedAt}</strong>
              <span className="text-[10px] text-slate-500 block">síntese em tempo real</span>
            </div>
          </div>

          {/* Grid de Insights Ativos em Linguagem Natural */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-400" />
              <span>Insights Preditivos Ativos (Dados Disponíveis Hoje)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeInsights.map((insight: CopilotInsightItem) => (
                <div 
                  key={insight.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {insight.category}
                        </span>
                        <strong className="text-xs font-bold text-slate-100">{insight.title}</strong>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        insight.impactLevel === 'Alto Impacto'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : insight.impactLevel === 'Impacto Moderado'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {insight.impactLevel}
                      </span>
                    </div>

                    {/* Síntese em Linguagem Natural */}
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {insight.naturalLanguageSummary}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-slate-800/60">
                    {/* Recomendação de Ação */}
                    <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1">
                      <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-blue-400" /> Ação Recomendada
                      </span>
                      <p className="text-[11px] text-blue-100 font-medium leading-snug">
                        {insight.actionableRecommendation}
                      </p>
                    </div>

                    {/* Declarativo Auditável de Fonte de Dados */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Database size={11} className="text-slate-400" /> Fonte Auditável:
                      </span>
                      <span className="text-slate-300 truncate max-w-[240px]" title={insight.dataSourceAudit}>
                        {insight.dataSourceAudit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ⚠️ SEÇÃO SEPARADA: INSIGHTS FUTUROS — PENDENTE DE DADOS */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-purple-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-purple-400" />
                  <span>Insights Futuros — Pendente de Dado (Faturamento & Checkout)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Métricas estratégicas de faturamento que aguardam a conclusão da integração dos webhooks oficiais de checkout.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                [PENDENTE DE INSTRUMENTAÇÃO]
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {futureInsights.map((future: CopilotInsightItem) => (
                <div key={future.id} className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-slate-200">{future.title}</strong>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 font-mono">
                      {future.metricValueText}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-snug">
                    {future.naturalLanguageSummary}
                  </p>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                    <span className="text-purple-400 font-bold block mb-0.5">Fonte da Pendência:</span>
                    {future.dataSourceAudit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
