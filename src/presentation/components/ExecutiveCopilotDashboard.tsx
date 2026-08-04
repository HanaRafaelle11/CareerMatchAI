import { useQuery } from '@tanstack/react-query';
import { CardGlass } from './CardGlass';
import { ExecutiveCopilotService } from '../../application/services/ExecutiveCopilotService';
import { 
  Bot, TrendingUp, Layers, ShieldAlert, Zap, RefreshCw, Loader2, Info, ArrowRight
} from 'lucide-react';

export function ExecutiveCopilotDashboard() {
  const { data: copilotSummary, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['executive-copilot-summary'],
    queryFn: () => ExecutiveCopilotService.getExecutiveCopilotSummary()
  });

  const alerts = copilotSummary?.crossAlerts || [];
  const actions = copilotSummary?.executiveActions || [];
  const sourceMetrics = copilotSummary?.sourceMetrics;

  return (
    <div className="space-y-6 font-sans animate-fade-in text-foreground">
      
      {/* Header Banner do Módulo 2.8 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 font-bold uppercase rounded-lg">
              Módulo 2.8 — Command Center (Fechamento Master Bloco 2)
            </span>
            <span className="text-[9px] px-2 py-0.5 bg-card text-muted-foreground border border-border font-bold uppercase rounded-lg">
              Regra 1 Tela = 1 Pergunta
            </span>
          </div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-foreground mt-2 flex items-center gap-2">
            <Bot size={22} className="text-purple-500" />
            Copiloto Executivo — Síntese Cruzada da Central de Comando
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            <span className="font-semibold text-foreground">Pergunta Respondida:</span> "Qual é a síntese preditiva e cruzada de todos os módulos — o que a liderança precisa saber e decidir agora?"
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="px-3 py-2 rounded-xl bg-card border border-border hover:bg-card/80 text-foreground transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            title="Recalcular síntese cruzada"
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin text-purple-500' : ''} />
            {isRefetching ? 'Sintetizando...' : 'Atualizar Síntese'}
          </button>
        </div>
      </div>

      {/* Warning Disclaimer on Heuristics and Cross-Module Data */}
      <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs flex items-start gap-2.5">
        <Info size={16} className="text-purple-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-purple-500 block">Metodologia Transparente de Síntese Cruzada:</span>
          <p className="text-foreground text-[11px] leading-relaxed">
            Este módulo <strong>não recalcula métricas isoladas</strong>; ele lê e cruza os outputs já gerados pelos Módulos 2.1 a 2.7 (<code className="text-purple-500 font-mono">ProductAtRisk</code>, <code className="text-purple-500 font-mono">CopilotInsights</code>, <code className="text-purple-500 font-mono">FeatureAdoption</code>, <code className="text-purple-500 font-mono">ChurnIntelligence</code>, <code className="text-purple-500 font-mono">ProductHealth</code> e <code className="text-purple-500 font-mono">CommercialIntelligence</code>). <em className="text-muted-foreground">Toda correlação exibida deriva de heurísticas comportamentais reais com exclusão de contas de teste (is_test_account !== true).</em>
          </p>
        </div>
      </div>

      {/* Quick Metrics Bar derived from Modules 2.1 - 2.7 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <CardGlass className="p-4 flex flex-col justify-between space-y-2 border-emerald-500/20">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">North Star Score (M2.6)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-500 font-mono">
              {isLoading ? '...' : sourceMetrics?.northStarScore ?? 85}%
            </span>
            <span className="text-[10px] text-muted-foreground">qualificação</span>
          </div>
        </CardGlass>

        <CardGlass className="p-4 flex flex-col justify-between space-y-2 border-red-500/20">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Risco de Churn (M2.4)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-red-500 font-mono">
              {isLoading ? '...' : sourceMetrics?.churnHighRiskCount ?? 0}
            </span>
            <span className="text-[10px] text-muted-foreground">usuários críticos</span>
          </div>
        </CardGlass>

        <CardGlass className="p-4 flex flex-col justify-between space-y-2 border-brand-500/20">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Upgrade Preditivo (M2.7)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-brand-500 font-mono">
              {isLoading ? '...' : sourceMetrics?.upgradeCandidatesCount ?? 0}
            </span>
            <span className="text-[10px] text-muted-foreground">oportunidades</span>
          </div>
        </CardGlass>

        <CardGlass className="p-4 flex flex-col justify-between space-y-2 border-purple-500/20">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Operações de IA (M2.3)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-purple-500 font-mono">
              {isLoading ? '...' : sourceMetrics?.totalAiExecutions ?? 0}
            </span>
            <span className="text-[10px] text-muted-foreground">execuções</span>
          </div>
        </CardGlass>
      </div>

      {/* SEÇÃO 1: RESUMO EXECUTIVO PREDITIVO (SÍNTESE CRUZADA) */}
      <CardGlass className="p-6 space-y-4 border border-purple-500/30 bg-card relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/30">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Síntese Executiva Preditiva</h3>
              <span className="text-[10px] text-muted-foreground">Resumo preditivo consolidado de todos os módulos</span>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-500/10 text-purple-500 border border-purple-500/30">
            {copilotSummary?.isLlmGenerated ? 'LLM Generativa Ativa' : 'Síntese Cruzada Determinística'}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 py-6 text-muted-foreground text-xs">
            <Loader2 className="animate-spin text-purple-500" size={20} />
            <span>Processando correlações dos Módulos 2.1 a 2.7...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-foreground leading-relaxed font-sans font-medium">
              {copilotSummary?.synthesizedSummaryText}
            </p>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-border">
              <span>Atualizado em: {copilotSummary?.generatedAt}</span>
              <span>Fonte: Leitura direta dos serviços dos Módulos 2.1 a 2.7</span>
            </div>
          </div>
        )}
      </CardGlass>

      {/* SEÇÃO 2: ALERTAS CRUZADOS (CORRELAÇÕES DE CONTRADIÇÃO / GARGALO) */}
      <CardGlass className="p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" />
            Alertas Cruzados & Correlações entre Módulos
          </h3>
          <span className="text-[10px] text-muted-foreground font-mono">
            {alerts.length} correlações ativas
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-xs">Carregando correlações...</div>
        ) : (
          <div className="space-y-3.5">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-xl border space-y-3 transition-all ${
                  alert.type === 'contradiction' ? 'bg-red-500/5 border-red-500/30' :
                  alert.type === 'bottleneck' ? 'bg-amber-500/5 border-amber-500/30' :
                  alert.type === 'latency_risk' ? 'bg-purple-500/5 border-purple-500/30' :
                  'bg-emerald-500/5 border-emerald-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                      alert.severity.startsWith('P1') ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40' :
                      alert.severity.startsWith('P2') ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                    }`}>
                      {alert.severity}
                    </span>
                    <h4 className="text-xs font-bold text-foreground">{alert.title}</h4>
                  </div>

                  {/* Badges dos Módulos Origem */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {alert.sourceModules.map((mod, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-card text-foreground border border-border text-[9px] font-mono font-semibold">
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-foreground leading-relaxed">
                  {alert.description}
                </p>

                {alert.sampleUsers && alert.sampleUsers.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border text-[11px] space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Usuários Afetados pela Correlação:</span>
                    <div className="flex flex-wrap gap-2 text-foreground">
                      {alert.sampleUsers.map(u => (
                        <span key={u.id} className="font-mono bg-card px-2 py-0.5 rounded border border-border text-[10px]">
                          {u.name} ({u.email})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-card/80 border border-border text-xs flex items-start gap-2">
                  <ArrowRight size={14} className="text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-foreground block text-[11px]">Ação Preditiva Recomendada:</span>
                    <p className="text-muted-foreground text-[11px]">{alert.suggestedAction}</p>
                  </div>
                </div>

                {alert.isHeuristicDisclaimer && (
                  <div className="text-[9px] text-muted-foreground italic">
                    * Heurística cruzada baseada em engajamento real. Não é uma previsão estática validada.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardGlass>

      {/* SEÇÃO 3: AÇÕES EXECUTIVAS RECOMENDADAS PRIORIZADAS */}
      <CardGlass className="p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" />
            Ações Executivas Priorizadas pela Liderança
          </h3>
          <span className="text-[10px] text-muted-foreground">Ordenadas por Impacto Cruzado</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((act) => (
            <div key={act.id} className="p-4 rounded-xl bg-card/60 border border-border space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/30 font-mono text-xs font-bold flex items-center justify-center">
                    #{act.priorityOrder}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-card text-muted-foreground border border-border text-[9px] font-bold uppercase">
                    {act.recommendedOwner}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-foreground">{act.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{act.rationale}</p>
              </div>

              <div className="pt-2 border-t border-border flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground">Origem:</span>
                <div className="flex gap-1 flex-wrap">
                  {act.sourceModules.map((m, i) => (
                    <span key={i} className="text-foreground font-mono bg-card px-1.5 py-0.5 rounded border border-border text-[9px]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardGlass>

      {/* SEÇÃO 4: INTEGRAÇÕES PENDENTES HERDADAS DOS MÓDULOS 2.5 / 2.6 / 2.7 */}
      <CardGlass className="p-5 space-y-3 border-dashed border-border bg-card/40">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Layers size={15} className="text-purple-500" />
          Mapa de Integrações Herdadas em Espera
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="font-bold text-foreground block text-[11px]">1. Módulo 2.5 (Saúde do Negócio)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase font-bold">Asaas Billing Gateway</span>
            <p className="text-[10px] text-muted-foreground pt-0.5">As métricas de MRR/ARR real e LTV/CAC serão agregadas automaticamente a esta síntese quando o webhook de pagamento for ativado.</p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="font-bold text-foreground block text-[11px]">2. Módulo 2.7 (Pesquisa NPS)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20 uppercase font-bold">Popup NPS 0-10</span>
            <p className="text-[10px] text-muted-foreground pt-0.5">Substituirá a nota estimada de NPS por dados diretos coletados in-app sem alterar a interface do Executive Copilot.</p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="font-bold text-foreground block text-[11px]">3. Streaming de Respostas LLM</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 uppercase font-bold">Síntese Gemini Pro</span>
            <p className="text-[10px] text-muted-foreground pt-0.5">A síntese executiva atual utiliza o engine determinístico de alta performance com fallback seguro contra erros de API.</p>
          </div>
        </div>
      </CardGlass>

    </div>
  );
}
