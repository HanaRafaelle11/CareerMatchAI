# Métricas Guardrail & Proteção de Qualidade de Produto — Fase 10

## 1. Tabela de Guardrails Operacionais

| Guardrail | Limite Máximo Tolerado | Ação Automática em Caso de Violação |
| :--- | :--- | :--- |
| **`ERROR_RATE`** | $> 2.0\%$ dos usuários afetados | Classificação imediata como **`LOSS`** e alerta no painel |
| **`TIME_TO_VALUE_P50`** | $> 30$ minutos | Alerta de fricção no onboarding |
| **`AI_COST_PER_ACTIVATED_USER`** | $> \text{R\$} 1,50$ | Trava de cota e revisão de tokens de prompt |
| **`D7_RETENTION`** | Queda $> 10\%$ relativa | Bloqueio de rollout da variante |
| **`REFUND_RATE`** | $> 2.0\%$ das assinaturas | Revisão imediata da proposta de valor Pro |

## 2. Princípio do Guardrail
Nenhum experimento pode ser declarado **`WIN`** baseado em uplift de métrica primária (ex: CTR) se houver violação simultânea de qualquer métrica guardrail.
