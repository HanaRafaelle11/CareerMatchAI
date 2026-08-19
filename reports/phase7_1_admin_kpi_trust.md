# Matriz de Confiança dos KPIs Administrativos — Fase 7.1

## 1. Rastreabilidade Completa dos Indicadores

| KPI do Admin | Tabela de Origem | Query Executada | Unidade | Janela Temporal | Filtro Aplicado | Timezone | Status de Confiança |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DAU** | `analytics_events` & `profiles` | `select user_id, created_at` | Usuários Únicos | 24 Horas Rolling | `isTestOrInternalAccount` | UTC / Local | **TRUSTED** |
| **WAU** | `analytics_events` & `profiles` | `select user_id, created_at` | Usuários Únicos | 7 Dias Rolling | `isTestOrInternalAccount` | UTC / Local | **TRUSTED** |
| **MAU** | `analytics_events` & `profiles` | `select user_id, created_at` | Usuários Únicos | 30 Dias Rolling | `isTestOrInternalAccount` | UTC / Local | **TRUSTED** |
| **Stickiness** | Calculado de DAU/MAU | `(dau / mau) * 100` | Percentual (%) | 24h vs 30d | N/A | N/A | **TRUSTED** |
| **Funil** | `profiles`, `resumes`, `matches`, `applications`, `transactions` | `Promise.all()` em tabelas | Usuários Únicos | Todas as contas reais | `isTestOrInternalAccount` | UTC | **TRUSTED** |
| **TTFV** | `profiles` e `matches` | Comparação timestamps | Minutos (P50/P75/P90) | Histórico | Amostras válidas > 0 min | UTC | **TRUSTED** |
| **Custos IA** | `ai_usage_logs` | `select * from ai_usage_logs` | Reais (R$ BRL) | Total / Mensal | Contas reais | UTC | **TRUSTED** |

## 2. Diagnóstico de Gaps de Confiança (Trust Gaps)
Zero *trust gaps* identificados nos KPIs principais do painel administrativo.
