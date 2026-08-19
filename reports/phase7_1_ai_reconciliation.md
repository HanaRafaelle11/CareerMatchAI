# Reconciliação de IA, Tokens & Uso do Copiloto — Fase 7.1

## 1. Reconciliação entre Requisições e Logs de IA
- Cada chamada realizada para os recursos inteligentes (`useCoach`, `AdaptiveResumeService`, `useCopilotEngine`) gera um registro estruturado em `public.ai_usage_logs`.
- Os tokens de entrada e saída registrados correspondem à contagem real retornada pela API do Gemini.
- A precificação utiliza os multiplicadores oficiais:
  - Input: USD \$0.075 / 1M tokens
  - Output: USD \$0.30 / 1M tokens
  - Câmbio: BRL 5.80 / USD

## 2. Coerência entre Copiloto e Banco
- Mensagens de chat com o Copiloto disparam `copilot_message_sent` em telemetria e gravam o consumo em `ai_usage_logs`.
- Se a requisição de IA falha por timeout ou cota, o registro em `ai_usage_logs` é marcado com `status = 'error'` e `token_count = 0`, garantindo que custos não sejam calculados sobre falhas.
