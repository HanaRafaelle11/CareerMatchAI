# Observabilidade de IA, Tokens & Custos Gemini — Fase 8

## 1. Rastreabilidade em `ai_usage_logs`
Cada requisição de inteligência artificial registra:
- `user_id`: Identificador do candidato;
- `feature`: Funcionalidade (`matching`, `resume_optimization`, `cover_letter`, `interview_prep`, `coach_chat`);
- `input_tokens` e `output_tokens`: Tokens auditados pela API;
- `latency_ms`: Tempo de processamento;
- `status`: `success` ou `error`.

## 2. Precificação Canônica (Gemini 3.6 Flash)
- **Input**: \$0.075 / 1M tokens (\$0.000000075 / token).
- **Output**: \$0.30 / 1M tokens (\$0.00000030 / token).
- **Câmbio**: USD 1.00 = BRL 5.80.

Requisições com erro registram tokens = 0 e custo R$ 0,00, sem distorção financeira.
