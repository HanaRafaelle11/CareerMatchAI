# Observabilidade de IA, Tokens & Custos — Fase 7

## 1. Rastreabilidade de Requisições de IA
Cada invocação ao Google Gemini é registrada na tabela `public.ai_usage_logs` contendo:
- `user_id`: Identificador do candidato.
- `feature_name`: Recurso utilizado (`resume_optimization`, `cover_letter`, `interview_prep`, `coach_chat`, `matching_v3`).
- `input_tokens` e `output_tokens`: Contagem real extraída do payload de resposta da API do Gemini.
- `processing_time_ms`: Latência de execução da IA.
- `status`: `success` ou `error`.

## 2. Precificação Oficial Gemini 3.6 Flash
- **Input**: \$0.075 / 1.000.000 tokens.
- **Output**: \$0.30 / 1.000.000 tokens.
- **Câmbio**: BRL 5.80 / USD.

## 3. Prevenção de Erros Silenciosos de IA
- Requisições com falha registram `tokens = 0` e `cost = 0`, evitando cobrança virtual de operações não entregues.
- Se a tabela `ai_usage_logs` estiver vazia, o dashboard exibe `R$ 0,00` e `0 chamadas`, sem números hardcoded simulados.
