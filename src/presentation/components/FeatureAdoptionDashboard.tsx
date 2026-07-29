import { useQuery } from '@tanstack/react-query';
import { 
  Bot, TrendingUp, RefreshCw, 
  AlertCircle, BarChart3, 
  Cpu, Ban
} from 'lucide-react';
import { FeatureAdoptionService, type FeatureAdoptionItem } from '../../application/services/FeatureAdoptionService';

export function FeatureAdoptionDashboard() {
  const { data: adoptionData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feature-adoption-metrics'],
    queryFn: () => FeatureAdoptionService.getFeatureAdoptionMetrics(),
    refetchInterval: 30000
  });

  const allFeatures = adoptionData?.allFeatures || [];
  const mostUsed = adoptionData?.mostUsedFeatures || [];
  const lowAdoption = adoptionData?.lowAdoptionFeatures || [];
  const neverUsed = adoptionData?.neverUsedFeatures || [];
  const topVolume = adoptionData?.topFeatureVolume || 1;
  const lowThresholdValue = (topVolume * 0.05).toFixed(1);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header Banner do Módulo 2.5 */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
              Módulo 2.5 — Command Center
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Inteligência de Adoção de Recursos
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <Bot className="text-purple-400" size={24} />
            <span>Feature Adoption — Ranking de Funcionalidades & Latência</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Mapeamento completo de utilização, tempo médio de resposta da IA, frequência por usuário, retenção em 30 dias e conversão direta das ferramentas inteligentes em candidaturas no Pipeline.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start md:self-center shrink-0"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin text-purple-400' : ''} />
          <span>Atualizar Adoção</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-500 space-y-3">
          <Cpu className="animate-spin text-purple-500 mx-auto" size={32} />
          <p className="text-xs font-semibold text-slate-300">Carregando métricas de uso de IA e retenção de recursos...</p>
        </div>
      ) : (
        <>
          {/* Resumo de Indicadores no Topo */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total de Chamadas IA</span>
              <strong className="text-3xl font-black text-slate-100">{adoptionData?.totalAiExecutions}</strong>
              <span className="text-[10px] text-slate-500 block">execuções computadas</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Latência Média da IA</span>
              <strong className="text-3xl font-black text-purple-400">{adoptionData?.avgPlatformLatencySeconds}s</strong>
              <span className="text-[10px] text-slate-500 block">tempo de resposta médio</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Recursos em Alta Adoção</span>
              <strong className="text-3xl font-black text-emerald-400">{mostUsed.length}</strong>
              <span className="text-[10px] text-slate-500 block">ferramentas com uso consistente</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-red-500/20 bg-red-950/10 space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Nunca Utilizadas (0 Uso)</span>
              <strong className="text-3xl font-black text-red-400">{neverUsed.length}</strong>
              <span className="text-[10px] text-red-300/70 block">zero execuções no período</span>
            </div>
          </div>

          {/* 🎯 3 BLOCOS SEPARADOS: Mais Utilizadas vs Baixa Adoção (<5%) vs Nunca Utilizadas (0) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Top Funcionalidades */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span>Mais Utilizadas</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Líderes de Uso
                </span>
              </div>

              <div className="space-y-2">
                {mostUsed.map((feat, idx) => (
                  <div key={feat.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30 shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <strong className="text-xs font-bold text-slate-200 block">{feat.name}</strong>
                        <span className="text-[10px] text-slate-400">{feat.category} • {feat.activeUsersCount} usuários</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <strong className="text-sm font-black text-slate-100 block">{feat.totalUsage}</strong>
                      <span className="text-[10px] text-slate-400">usos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Baixa Adoção (< 5% do Líder) */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/20 bg-amber-950/10 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-400" />
                  <span>Baixa Adoção</span>
                </h3>
                <span className="text-[9px] text-amber-300 font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  &lt; 5% do Líder (&lt; {lowThresholdValue} usos)
                </span>
              </div>

              <div className="space-y-2">
                {lowAdoption.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    Nenhuma funcionalidade nesta faixa no momento.
                  </div>
                ) : (
                  lowAdoption.map((feat) => (
                    <div key={feat.id} className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/20 flex items-center justify-between gap-3">
                      <div>
                        <strong className="text-xs font-bold text-slate-200 block">{feat.name}</strong>
                        <span className="text-[10px] text-amber-300/80">{feat.category} • Uso abaixo de 5% do volume líder</span>
                      </div>

                      <div className="text-right shrink-0">
                        <strong className="text-sm font-black text-amber-400 block">{feat.totalUsage} usos</strong>
                        <span className="text-[10px] text-slate-400">{feat.frequencyPerUser}x / usuário</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. NUNCA UTILIZADAS (0 Execuções no Período) - CATEGORIA SEPARADA */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-red-500/20 bg-red-950/10 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Ban size={14} className="text-red-400" />
                  <span>Nunca Utilizadas (0 Uso)</span>
                </h3>
                <span className="text-[9px] text-red-300 font-mono font-bold bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                  Zero Chamadas
                </span>
              </div>

              <div className="space-y-2">
                {neverUsed.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    Todas as ferramentas cadastradas já possuem ao menos 1 uso registrado.
                  </div>
                ) : (
                  neverUsed.map((feat) => (
                    <div key={feat.id} className="p-3 rounded-xl bg-slate-950/60 border border-red-500/20 flex items-center justify-between gap-3">
                      <div>
                        <strong className="text-xs font-bold text-slate-200 block">{feat.name}</strong>
                        <span className="text-[10px] text-red-300/80">{feat.category} • Nenhuma execução no período</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                          0 Acessos
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tabela Completa de Ranking das 7 Dimensões */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={16} className="text-purple-400" />
                  <span>Matriz Completa de Adoção de Funcionalidades</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mapeamento minucioso cobrindo latência, retenção em 30d, conversão para candidaturas e sinalização de receita.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-3">Funcionalidade</th>
                    <th className="py-3 px-3 text-center">Nível de Adoção</th>
                    <th className="py-3 px-3 text-center">Uso Total</th>
                    <th className="py-3 px-3 text-center">Usuários</th>
                    <th className="py-3 px-3 text-center">Frequência</th>
                    <th className="py-3 px-3 text-center">Latência</th>
                    <th className="py-3 px-3 text-center">Retenção (30d)</th>
                    <th className="py-3 px-3 text-center">Conversão uso → vaga</th>
                    <th className="py-3 px-3 text-center">Receita Influenciada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {allFeatures.map((feat: FeatureAdoptionItem) => (
                    <tr key={feat.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-3 px-3">
                        <strong className="text-slate-200 block font-bold">{feat.name}</strong>
                        <span className="text-[10px] text-slate-400">{feat.category}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          feat.adoptionLevel === 'Nunca Utilizada'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : feat.adoptionLevel.includes('Baixa')
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {feat.adoptionLevel}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-100">
                        {feat.totalUsage}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-300">
                        {feat.activeUsersCount}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-300 font-mono">
                        {feat.frequencyPerUser}x
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-purple-300">
                        {feat.avgLatencySeconds}s
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-emerald-400">
                        {feat.retentionRate30d}%
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-brand-300">{feat.conversionToApplicationRate}%</span>
                          <span className="text-[9px] text-slate-400">(Fin. Pendente)</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-1 rounded text-[9px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono inline-block">
                          {feat.revenueStatusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
