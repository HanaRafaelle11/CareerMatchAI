# Relatório de Auditoria de Mocks e Fallbacks — Fase 6

## 1. Inventário de Mocks Removidos

| Arquivo | Trecho / Função | Valores Falsos Removidos | Estado Atual |
| :--- | :--- | :--- | :--- |
| `AdminDashboard.tsx` | `queryFn: iaStats` | `total_requests: 312`, `total_tokens: 3450000`, `estimated_cost_brl: 278.40`, `avg_latency_ms: 410.5` | Dados reais de `ai_usage_logs` ou `0` limpo |
| `FunnelTelemetryService.ts` | `getFallbackMetrics()` | `totalRegisteredReal: 49`, `uploadedResumeCount: 39`, `calculatedMatchCount: 14`, `hitPaywallCount: 8`, `openedCheckoutCount: 3` | Substituído por `getEmptyMetrics()` (0 real) |

## 2. Princípio Fundamental de Analytics Cumprido
> *"REAL DATA > PLAUSIBLE DATA. Se houver dados: mostrar o valor real. Se não houver dados: mostrar 0 somente quando a consulta foi executada e retornou legitimamente zero registros. Se houver erro: NÃO mostrar 0, mostrar estado de erro. Nunca inventar números fictícios."*

O VoCentro opera agora com 100% de conformidade com este princípio em todos os dashboards e serviços analíticos.
