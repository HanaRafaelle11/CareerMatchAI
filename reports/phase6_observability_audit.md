# Relatório de Observabilidade, Custos de IA e Monitoramento — Fase 6

## 1. Rastreamento de Custos de Inteligência Artificial
O VoCentro utiliza o Google Gemini (modelo `gemini-3.6-flash`).
Todos os custos de IA agora são calculados diretamente da tabela `ai_usage_logs` do Supabase via `AdminAnalyticsService.calculateAiCosts()`.

### Tarifário Canônico Aplicado:
- **Input Tokens**: $0.075 por 1 milhão de tokens.
- **Output Tokens**: $0.30 por 1 milhão de tokens.
- **Câmbio Aplicado**: USD 1.00 = BRL 5.80.

### Eliminação de Mocks:
- Removidos valores hardcoded de fallback (`312` requests, `3.45M` tokens, `R$ 278,40` e `410.5ms`) do `AdminDashboard.tsx`.
- Se a tabela estiver vazia, o dashboard exibe `0 requests`, `0 tokens` e `R$ 0,00`. Se houver erro na query, exibe estado de erro amigável.

## 2. Latência e Conexão de Saúde (Health Check)
- A saúde da infraestrutura monitora latência de round-trip com Supabase, Edge Functions e gateways de pagamento.
- Falhas de conexão não mascaram dados analíticos como zero, informando o operador de administração de forma explícita.
