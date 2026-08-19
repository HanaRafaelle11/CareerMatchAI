# Auditoria Forense de Duplicação e Idempotência — Fase 7.1

## 1. Chaves de Idempotência e Unicidade
- **DAU / WAU / MAU**: Deduplicação compulsória por `Set<user_id>`. Múltiplos eventos disparados pelo mesmo usuário na mesma janela contam como **1 único usuário ativo**.
- **Cálculo de Match**: Chave composta `user_id + job_id` na tabela `matches` com `ON CONFLICT (user_id, job_id) DO UPDATE` ou atualização atômica de score.
- **Kanban Stages**: Registros de estágio associados a `application_id`.
- **Gateways Financeiros**: Idempotency Key via `event.id` do Stripe e `payment.id` do Asaas em webhooks.

## 2. Taxa de Duplicidade Observada
As consultas analíticas aplicam deduplicação determinística em memória e no banco, garantindo **0% de inflação artificial** em métricas de funil e usuários ativos.
