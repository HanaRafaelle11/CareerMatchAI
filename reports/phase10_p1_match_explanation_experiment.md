# Especificação do Experimento P1 — Explicabilidade Pró-Ativa no Card de Match

## 1. Identificação do Experimento
- **ID**: `exp_match_explanation_p1`
- **Nome**: Explicabilidade Pró-Ativa no Card de Match (Destaques 70-79%)
- **Hipótese de Growth**: Candidatos ignoram vagas com fit intermediário ($70 - 79\%$) por falta de clareza imediata sobre sua aderência. Destacar diretamente no card os 3 principais fatores positivos eleva a conversão em candidaturas.

## 2. Variantes
- **CONTROL**: Card padrão com score percentual e títulos.
- **VARIANT_A**: Inclusão direta do bloco "Por que combina com você?" listando 3 pontos fortes e 1 gap sem necessidade de clique prévio.

## 3. Métricas e Guardrails
- **Métrica Primária**: `MATCH_TO_MEANINGFUL_ACTION_RATE` (Salvamento no Kanban ou Clique em Candidatura).
- **Métricas Secundárias**: `JOB_SAVED_RATE`, `APPLY_CLICK_RATE`.
- **Guardrails**: `CAREER_MATCH_ENGINE_V3_CONGELADO`, `RENDER_LATENCY_MS < 100ms`.
- **Tamanho Mínimo da Amostra**: 300 interações expostas por variante.
