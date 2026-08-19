# Arquitetura do Framework de Experimentação & Testes A/B — Fase 10

## 1. Fluxo de Vida do Experimento

```text
[Usuário Autenticado / Sessão]
       ↓
[Atribuição Determinística via Hash: hash(subjectId + expId)]
       ├── [Rollout Bucket < %] ──► Variante Determinística (CONTROL / VARIANT_A)
       └── [Rollout Bucket >= %] ──► CONTROL (Fallback Seguro)
       ↓
[Renderização no Frontend via `useExperiment(expId)`]
       ↓
[Disparo de Exposição: `tracker.trackExperimentExposed(expId, variant)`]
       ↓
[Ação de Valor do Candidato: `tracker.trackExperimentConversion(expId, variant, metric)`]
       ↓
[Avaliação Causal no Admin: `ExperimentService.evaluateExperiment()`]
       └── [WIN / LOSS / INCONCLUSIVE / INSUFFICIENT_SAMPLE]
```

## 2. Garantias Inegociáveis
1. **Idempotência Estrita**: A função `assignVariant` nunca invoca `Math.random()` no ciclo de render.
2. **Separação Causal**: `ASSIGNED` $\neq$ `EXPOSED` $\neq$ `CONVERTED`. Usuários só entram no cálculo de conversão após a confirmação do evento de exposição.
3. **Isolamento de Negócio**: O motor `CareerMatchEngineV3` e os pesos `MATCHING_WEIGHTS` são 100% preservados.
