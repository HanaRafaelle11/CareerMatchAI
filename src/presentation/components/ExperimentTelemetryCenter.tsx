// src/presentation/components/ExperimentTelemetryCenter.tsx
import { useState, useEffect } from 'react';
import { ExperimentService, EXPERIMENTS_REGISTRY } from '../../application/services/ExperimentService';
import type { ExperimentEvaluation } from '../../application/services/ExperimentService';
import { supabase, isSupabaseConfigured } from '../../infrastructure/api/supabaseClient';
import { AdminAuditService } from '../../application/services/AdminAuditService';

export const ExperimentTelemetryCenter = () => {
  const [evaluations, setEvaluations] = useState<ExperimentEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadExperimentData();
  }, []);

  const loadExperimentData = async () => {
    setIsLoading(true);
    try {
      // In production, queries public.analytics_events for 'experiment_exposed' and 'experiment_conversion'
      let exposedEvents: any[] = [];
      let conversionEvents: any[] = [];

      if (isSupabaseConfigured && supabase) {
        const { data: exposed } = await supabase
          .from('analytics_events')
          .select('user_id, metadata, created_at')
          .eq('event_name', 'experiment_exposed');
        
        const { data: converted } = await supabase
          .from('analytics_events')
          .select('user_id, metadata, created_at')
          .eq('event_name', 'experiment_conversion');

        exposedEvents = (exposed || []).filter(e => !AdminAuditService.isTestOrInternalAccount(e.user_id || ''));
        conversionEvents = (converted || []).filter(e => !AdminAuditService.isTestOrInternalAccount(e.user_id || ''));
      }

      const results: ExperimentEvaluation[] = Object.keys(EXPERIMENTS_REGISTRY).map(expId => {
        const expExposed = exposedEvents.filter(e => e.metadata?.experiment_id === expId);
        const expConverted = conversionEvents.filter(e => e.metadata?.experiment_id === expId);

        const ctrlExposedUsers = new Set(expExposed.filter(e => e.metadata?.variant === 'CONTROL').map(e => e.user_id)).size;
        const ctrlConvertedUsers = new Set(expConverted.filter(e => e.metadata?.variant === 'CONTROL').map(e => e.user_id)).size;

        const varAExposedUsers = new Set(expExposed.filter(e => e.metadata?.variant === 'VARIANT_A').map(e => e.user_id)).size;
        const varAConvertedUsers = new Set(expConverted.filter(e => e.metadata?.variant === 'VARIANT_A').map(e => e.user_id)).size;

        return ExperimentService.evaluateExperiment(expId, {
          control: { exposed: ctrlExposedUsers, converted: ctrlConvertedUsers },
          variantA: { exposed: varAExposedUsers, converted: varAConvertedUsers }
        });
      });

      setEvaluations(results);
    } catch (err) {
      console.error('[ExperimentCenter] Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🧪 Central de Experimentos & Growth (Fase 10)
          </h2>
          <p className="text-sm text-slate-400">
            Monitoramento causal, atribuição determinística e decisões de A/B testing em tempo real.
          </p>
        </div>
        <button
          onClick={loadExperimentData}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-medium transition"
        >
          {isLoading ? 'Atualizando...' : 'Recarregar Dados'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {evaluations.map((exp: ExperimentEvaluation) => (
          <div
            key={exp.experimentId}
            className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {exp.experimentId}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    exp.decision === 'WIN'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : exp.decision === 'LOSS'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {exp.decision}
                </span>
              </div>

              <h3 className="font-semibold text-slate-200 text-base mb-2">{exp.name}</h3>
              <p className="text-xs text-slate-400 mb-4">
                Métrica Primária: <span className="text-indigo-300 font-mono">{exp.primaryMetric}</span>
              </p>

              {/* Tabela de Variantes */}
              <div className="space-y-2 mb-4 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 font-medium pb-1 border-b border-slate-800">
                  <span>Variante</span>
                  <span>Expostos</span>
                  <span>Conversão</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="text-slate-400">CONTROL</span>
                  <span>{exp.stats.CONTROL.exposedCount}</span>
                  <span className="font-mono">{exp.stats.CONTROL.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="text-indigo-400 font-semibold">VARIANT A</span>
                  <span>{exp.stats.VARIANT_A.exposedCount}</span>
                  <span className="font-mono">{exp.stats.VARIANT_A.conversionRate.toFixed(1)}%</span>
                </div>
              </div>

              {/* Racional da Decisão */}
              <div className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-lg border border-slate-700/40 mb-4">
                <div className="font-semibold text-slate-400 mb-1">Diagnóstico Causal:</div>
                <p>{exp.decisionRationale}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
              <span>Uplift: {exp.relativeUplift >= 0 ? `+${exp.relativeUplift.toFixed(1)}%` : `${exp.relativeUplift.toFixed(1)}%`}</span>
              <span>Confiança: {exp.confidenceScore}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
