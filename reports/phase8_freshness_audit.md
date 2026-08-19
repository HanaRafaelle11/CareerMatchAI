# Auditoria de Freshness de Dados em Dashboards — Fase 8

## 1. Classificação de Atualização por Domínio

| Tabela / Fonte | Threshold Fresh | Threshold Aging | Threshold Stale | Motivação |
| :--- | :--- | :--- | :--- | :--- |
| **`analytics_events`** | $< 5$ min | $5 - 30$ min | $> 30$ min | Eventos de navegação em tempo real |
| **`ai_usage_logs`** | $< 5$ min | $5 - 60$ min | $> 60$ min | Uso de recursos de IA |
| **`matches`** | $< 15$ min | $15 - 120$ min | $> 2$ horas | Recálculo de aderência |
| **`applications`** | $< 10$ min | $10 - 120$ min | $> 2$ horas | Movimentações no Kanban |
| **`billing_transactions`**| $< 60$ min | $1 - 24$ horas | $> 24$ horas | Transações financeiras e liquidações |

## 2. Formato e Rótulo
O helper `AdminAnalyticsService.getFreshness(timestamp, now)` fornece os rótulos determinísticos ("Atualizado há X min", "Dados desatualizados", etc.) para a interface.
