# Auditoria Forense de Métricas Duplicadas — Fase 6.1

## 1. Mapeamento e Consolidação de Fontes

| Métrica | Implementação Anterior | Implementação Canônica Oficial | Status de Consolidação |
| :--- | :--- | :--- | :--- |
| **DAU / WAU / MAU** | `ProductHealthService` & `AdminDashboard` | `AdminAnalyticsService.calculateActiveUserMetrics()` | **CONSOLIDADO** |
| **Stickiness** | Múltiplas fórmulas ad-hoc | `AdminAnalyticsService.calculateActiveUserMetrics()` | **CONSOLIDADO** |
| **Funil de Ativação** | `FunnelTelemetryService` & `AdminAnalyticsService` | `AdminAnalyticsService.calculateFunnel()` | **CONSOLIDADO** |
| **Time to Value** | `ProductHealthService` & `AdminAnalyticsService` | `AdminAnalyticsService.calculateTtfv()` | **CONSOLIDADO** |
| **Custos de IA** | `AdminDashboard` local calculations | `AdminAnalyticsService.calculateAiCosts()` | **CONSOLIDADO** |
| **Filtro de Teste** | `p.is_test_account !== true` isolado | `AdminAuditService.isTestOrInternalAccount()` | **CONSOLIDADO** |

## 2. Eliminação de Divergências
Não existem mais rotas de cálculo concorrentes com fórmulas divergentes. Todos os serviços utilizam o `AdminAnalyticsService` e `AdminAuditService` como autoridades canônicas.
