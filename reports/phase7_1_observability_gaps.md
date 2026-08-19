# Mapeamento de Gaps de Observabilidade — Fase 7.1

## 1. Classificação de Observabilidade por Componente

| Componente / Fluxo | Visibilidade Atual | Tipo de Registro | Risco de Silêncio | Ação Recomendada |
| :--- | :--- | :--- | :--- | :--- |
| **Envio de Eventos (`tracker.track`)** | `partially observable` | `console.warn` em falha + `localDB` | Baixo | Adicionar fila de retry automático pós-reconexão |
| **Chamadas ao Gemini AI** | `observable` | Gravado em `public.ai_usage_logs` com status | Zero | Nenhuma (comportamento ideal) |
| **Movimentação de Estágios Kanban** | `observable` | Gravado em `public.application_stages` | Zero | Nenhuma |
| **Feedback de Match do Candidato** | `observable` | Gravado em `public.job_match_feedback` | Zero | Nenhuma |
| **Webhooks de Pagamento** | `observable` | Edge Functions + `billing_transactions` | Zero | Nenhuma |
| **Erros de Renderização React** | `observable` | ErrorBoundary UI + log | Zero | Nenhuma |

## 2. Resumo de Gaps
Nenhum fluxo crítico de negócio opera de forma silenciosa ou oculta.
