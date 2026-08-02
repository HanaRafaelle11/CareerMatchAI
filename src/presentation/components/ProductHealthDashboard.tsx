import { useQuery } from '@tanstack/react-query';
import { 
  Activity, Star, Zap, Users, Clock, RefreshCw, 
  TrendingUp, CheckCircle2, Info
} from 'lucide-react';
import { ProductHealthService } from '../../application/services/ProductHealthService';

export function ProductHealthDashboard() {
  const { data: health, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['product-health-metrics'],
    queryFn: () => ProductHealthService.getProductHealthMetrics(),
    refetchInterval: 30000
  });

  const ns = health?.northStar;
  const eng = health?.engagement;
  const vel = health?.velocity;

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-card border border-brand-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20 uppercase tracking-wider">
              Módulo 2.6 — Command Center
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Saúde do Produto & Velocidade da Jornada
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-2 flex items-center gap-2">
            <Activity className="text-brand-500" size={24} />
            <span>Saúde do Produto — Indicadores Operacionais & Retenção</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            Acompanhamento em tempo real da North Star Metric, taxa de ativação de usuários, frequência de retorno (Stickiness) e velocidade de avanço do candidato do cadastro até a contratação.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="px-4 py-2 rounded-xl bg-card hover:bg-card/80 border border-border text-foreground font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start md:self-center shrink-0 shadow-xs"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin text-brand-500' : ''} />
          <span>Atualizar Indicadores</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground space-y-3">
          <Activity className="animate-spin text-brand-500 mx-auto" size={32} />
          <p className="text-xs font-semibold text-foreground">Agregando métricas de saúde do produto e retenção...</p>
        </div>
      ) : (
        <>
          {/* 🌟 1. BLOCO NORTH STAR METRIC (EM DESTAQUE) */}
          <div className="p-6 rounded-2xl bg-card border border-amber-500/30 space-y-4 relative overflow-hidden shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="text-amber-500 fill-amber-500" size={20} />
                  <h3 className="text-base font-bold text-foreground">North Star Metric (Métrica Estrela-Guia)</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                    WAU Qualificado
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Candidatos Ativos Semanais com ao menos 1 Candidatura em Vaga de Match Alto (&gt;=75%) OU com processo ativo nas etapas avançadas (<code className="text-foreground">hr</code>, <code className="text-foreground">interview</code>, <code className="text-foreground">offer</code>).
                </p>
              </div>

              <div className="flex items-baseline gap-2 bg-amber-500/10 border border-amber-500/20 px-5 py-3 rounded-2xl shrink-0">
                <span className="text-4xl font-black font-display text-amber-500">{ns?.scorePercentage}%</span>
                <span className="text-xs font-bold text-amber-500">Qualificação Semanal</span>
              </div>
            </div>

            {/* Breakdown da North Star */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-card/80 border border-border space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Candidatos Qualificados (7d)</span>
                <strong className="text-xl font-bold text-foreground">{ns?.qualifiedCandidatesCount} de {ns?.totalActiveCandidates7d}</strong>
                <span className="text-[10px] text-muted-foreground block">ativos no ciclo semanal</span>
              </div>

              <div className="p-3.5 rounded-xl bg-card/80 border border-border space-y-1">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Aplicou em Match &gt;=75%</span>
                <strong className="text-xl font-bold text-emerald-500">{ns?.candidatesWithHighMatchApp} candidatos</strong>
                <span className="text-[10px] text-muted-foreground block">decisão estratégica realizada</span>
              </div>

              <div className="p-3.5 rounded-xl bg-card/80 border border-border space-y-1">
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Em Fase Avançada de Entrevista</span>
                <strong className="text-xl font-bold text-brand-500">{ns?.candidatesInAdvancedStages} candidatos</strong>
                <span className="text-[10px] text-muted-foreground block">comportamento saudável no funil</span>
              </div>
            </div>

            {/* NOTA EXPLICATIVA DE LIMITAÇÃO CONHECIDA */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 leading-relaxed flex items-start gap-2.5">
              <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-500 font-bold block mb-0.5">Nota Metodológica & Limitação de Nicho:</strong>
                <span>{ns?.nicheMarketLimitationNote}</span>
              </div>
            </div>
          </div>

          {/* ⚡ 2. GRID DE ENGAJAMENTO & RETENÇÃO */}
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap size={16} className="text-brand-500" />
              <span>Engajamento, Ativação & Retenção</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Activation Rate */}
              <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Activation Rate</span>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <strong className="text-3xl font-black text-foreground">{eng?.activationRate}%</strong>
                  <span className="text-xs text-muted-foreground">upload de CV</span>
                </div>
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${eng?.activationRate}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  {eng?.activatedUsersCount} de {eng?.totalUsersCount} candidatos enviaram currículo.
                </p>
              </div>

              {/* WAU */}
              <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weekly Active (WAU)</span>
                  <Users size={16} className="text-brand-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <strong className="text-3xl font-black text-foreground">{eng?.wau}</strong>
                  <span className="text-xs text-muted-foreground">usuários / 7d</span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Candidatos ativos com ao menos 1 sessão na última semana.
                </p>
              </div>

              {/* MAU */}
              <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Monthly Active (MAU)</span>
                  <Activity size={16} className="text-purple-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <strong className="text-3xl font-black text-foreground">{eng?.mau}</strong>
                  <span className="text-xs text-muted-foreground">usuários / 30d</span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Base de usuários ativos no período mensal completo.
                </p>
              </div>

              {/* Stickiness (DAU/MAU) */}
              <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stickiness (DAU/MAU)</span>
                  <TrendingUp size={16} className="text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <strong className="text-3xl font-black text-foreground">{eng?.stickinessRate}%</strong>
                  <span className="text-xs text-muted-foreground">frequência diária</span>
                </div>
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${eng?.stickinessRate}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Média de {eng?.dau} acessos diários recorrentes sobre a base MAU.
                </p>
              </div>
            </div>
          </div>

          {/* ⏱ 3. GRID DE VELOCIDADE DE JORNADA (TIME-TO-MILESTONE) */}
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock size={16} className="text-brand-500" />
              <span>Velocidade de Evolução do Candidato (Time-to-Milestone)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* TTV */}
              <div className="p-4 rounded-xl bg-card/80 border border-border space-y-1 shadow-xs">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">1. Time to Value (TTV)</span>
                <strong className="text-2xl font-black text-brand-500">{vel?.timeToValueHours}h</strong>
                <span className="text-[10px] text-muted-foreground block">Cadastro → Diagnóstico CV</span>
              </div>

              {/* Time to Match */}
              <div className="p-4 rounded-xl bg-card/80 border border-border space-y-1 shadow-xs">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">2. Time to Match</span>
                <strong className="text-2xl font-black text-brand-500">{vel?.timeToMatchHours}h</strong>
                <span className="text-[10px] text-muted-foreground block">Cadastro → 1º Match com Vaga</span>
              </div>

              {/* Time to Application */}
              <div className="p-4 rounded-xl bg-card/80 border border-border space-y-1 shadow-xs">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">3. Time to Application</span>
                <strong className="text-2xl font-black text-emerald-500">{vel?.timeToApplicationDays}d</strong>
                <span className="text-[10px] text-muted-foreground block">1ª vaga no Kanban</span>
              </div>

              {/* Time to Interview */}
              <div className="p-4 rounded-xl bg-card/80 border border-border space-y-1 shadow-xs">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">4. Time to Interview</span>
                <strong className="text-2xl font-black text-brand-500">{vel?.timeToInterviewDays}d</strong>
                <span className="text-[10px] text-muted-foreground block">1ª entrevista RH/Gestor</span>
              </div>

              {/* Time to Hire */}
              <div className="p-4 rounded-xl bg-card/80 border border-border space-y-1 shadow-xs">
                <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider block">5. Time to Hire</span>
                <strong className="text-2xl font-black text-purple-500">{vel?.timeToHireDays}d</strong>
                <span className="text-[10px] text-muted-foreground block">Amostra: {vel?.hiredSampleCount} contratações</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
