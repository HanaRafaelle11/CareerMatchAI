# Auditoria Forense de Números Hardcoded e Eliminação de Mocks — Fase 6.1

## 1. Classificação Forense de Números e Constantes

| Valor / Sequência | Arquivo de Origem | Contexto Original | Classificação Forense | Ação Executada |
| :--- | :--- | :--- | :--- | :--- |
| `312`, `3450000`, `278.40`, `410.5` | `AdminDashboard.tsx` | Fallback de métricas de IA | **MOCK** | **REMOVIDO**. Substituído por consulta direta a `ai_usage_logs` e zero real. |
| `49`, `39`, `14`, `8`, `3` | `FunnelTelemetryService.ts` | Fallback do funil | **MOCK** | **REMOVIDO**. Substituído por `getEmptyMetrics(excludedCount)`. |
| `48`, `34`, `26`, `19`, `0.45` | `FeatureAdoptionService.ts` | Fallback de adoção de features | **MOCK** | **REMOVIDO**. Substituído por `getEmptyFeatureAdoptionMetrics()`. |
| `64.3`, `82.5`, `28`, `38`, `12` | `ProductHealthService.ts` | Fallback de saúde do produto | **MOCK** | **REMOVIDO**. Substituído por `getEmptyProductHealthMetrics()`. |
| `1.5`, `1.2`, `2.4`, `8.5`, `22.0` | `ProductHealthService.ts` | Médias hardcoded de tempo | **FALLBACK** | **REMOVIDO**. Substituído por `0` real quando a amostra é nula. |
| `80`, `65`, `48` | `ChurnIntelligenceService.ts` | Usuários fictícios de churn | **MOCK** | **REMOVIDO**. Substituído por `getEmptyChurnIntelligence()`. |
| `85`, `75`, `50` | `CommercialIntelligenceService.ts` | Candidatos comerciais fictícios | **MOCK** | **REMOVIDO**. Substituído por `getEmptyCommercialIntelligence()`. |
| `142`, `28.5%`, `92.5%` | `CopilotInsightsService.ts` | Insights simulados em texto | **MOCK** | **REMOVIDO**. Substituído por `getEmptyCopilotInsights()`. |
| 11 cards fictícios | `ProductAtRiskService.ts` | Alertas mockados com pessoas | **MOCK** | **REMOVIDO**. Substituído por `getEmptyRiskAlerts()`. |
| `Vercel`, `Stripe`, `8500` tokens | `AdminDashboard.tsx` | `getMockUserDetails` | **MOCK** | **REMOVIDO**. Substituído por `getEmptyUserDetails()`. |
| `0.50`, `0.30`, `0.20` | `matchingEngine.ts` | Pesos do algoritmo de Match | **CONSTANTE DE NEGÓCIO** | **PRESERVADO** (Invariante oficial). |
| `0.075`, `0.30` | `AdminAnalyticsService.ts` | Tarifas Gemini 3.6 Flash / 1M | **CONSTANTE DE NEGÓCIO** | **PRESERVADO** (Tabela oficial Google Cloud). |
| `5.80` | `AdminAnalyticsService.ts` | Câmbio BRL/USD | **CONSTANTE DE NEGÓCIO** | **PRESERVADO** (Taxa cambial canônica). |

## 2. Veredito Forense
Todos os números fictícios e mocks presentes em caminhos de produção e dashboards foram definitivamente erradicados. O produto opera com 100% de conformidade com o princípio **REAL DATA > PLAUSIBLE DATA**.
