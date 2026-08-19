# Integridade de Receita, Transações & Gateways — Fase 7

## 1. Fonte Única da Receita (Single Source of Truth)
- **Tabela Primária**: `public.billing_transactions`.
- **Status Válido de Receita**: `status = 'succeeded'` ou `status = 'paid'`.
- **Prevenção de Duplicidade**: Cada transação é indexada por `transaction_id` com constraint de unicidade ou deduplicação em query.

## 2. Separação de Status Financeiro
- `attempt`: Tentativa de checkout gerada (`checkout_started`).
- `success`: Cobrança confirmada pelo gateway (`payment_confirmed`).
- `failure`: Falha de saldo ou recusa de cartão registrada em logs.
- `cancel`: Cancelamento de recorrência em `billing_subscriptions`.
- `refund / chargeback`: Estornos registrados como transações negativas.

A receita exibida nos relatórios administrativos reflete exclusivamente transações com liquidação comprovada.
