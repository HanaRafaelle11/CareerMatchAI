# Auditoria Forense de Privacidade & PII — Fase 8

## 1. Verificação de Payloads e Chaves Proibidas
O validador `AnalyticsEventValidator.validate(event)` intercepta todos os envios de telemetria e rejeita qualquer payload que contenha chaves como:
- `password`, `token`, `jwt`, `api_key`, `secret`, `access_token`
- `cpf`, `rg`, `credit_card`, `card_number`, `cvv`

## 2. Sanitização de E-mails
- E-mails de candidatos exibidos em listagens analíticas ou eventos são mascarados (`can***`).
- Textos integrais de currículos e portfólios nunca são gravados na tabela `analytics_events`.
- **Status**: **PASS (Conformidade Estrita com a LGPD)**.
