# Auditoria Forense de Freshness de Dados — Fase 6.1

## 1. Classificação Canônica de Frescura
Toda resposta de dados operacionais nos dashboards analíticos do VoCentro computa seu status de freshness relativo ao momento da renderização:

| Status | Janela Temporal | Indicador Visual | Ação Recomendada |
| :--- | :--- | :--- | :--- |
| **`fresh`** | $< 5$ minutos | Pílula Verde ("Atualizado agora" ou "há X min") | Dados operacionais ideais para tomada de decisão |
| **`aging`** | $5 \le t \le 30$ minutos | Pílula Amarela ("Atualizado há X min") | Dados válidos, recarregamento automático em background |
| **`stale`** | $> 30$ minutos | Pílula Cinza / Vermelha ("Dados desatualizados") | Sugerir refetch manual ou verificação de background workers |
| **`error`** | Falha de consulta | Badge Vermelho ("Erro de conexão") | Informar falha explicitamente sem mascarar como zero |

## 2. Implementação
O método `AdminAnalyticsService.getFreshness(timestamp, now)` é a referência única para cálculo determinístico de frescura em todos os painéis administrativos.
