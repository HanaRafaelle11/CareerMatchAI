# Reconciliação Financeira de Receita & Gateways — Fase 7.1

## 1. Mapeamento de Transações Financeiras
- **Faturamento Real**: Somatório estrito de `billing_transactions.amount` onde `status = 'succeeded'` e `created_at` pertence à janela temporal consultada.
- **Diferenciação de Eventos**:
  - `checkout_started`: Indicador de intenção de compra (taxa de abandono do checkout).
  - `payment_attempted`: Requisição submetida ao gateway.
  - `payment_approved`: Liquidação confirmada via Webhook.
  - `subscription_active`: Estado liberado em `billing_subscriptions`.

## 2. Veredito de Receita
Nenhum valor estimado, projetado ou de carrinho abandonado é somado à receita do VoCentro.
