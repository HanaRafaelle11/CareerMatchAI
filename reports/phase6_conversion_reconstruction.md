# Reconstrução de Conversão, Receita & Idempotência — Fase 6.1

## 1. Regra de Ouro de Reconhecimento de Receita
> *"Checkout iniciado NÃO é receita. Receita e conversão Pro só existem a partir de evento ou status de pagamento confirmado pelo Gateway."*

## 2. Rastreamento e Idempotência nos Gateways
- **Stripe**: As notificações de webhook (`checkout.session.completed`, `invoice.payment_succeeded`) validam a assinatura criptográfica (`stripe-signature`) e utilizam o `event.id` para deduplicação em tabela de logs de webhook.
- **Asaas**: As notificações de cobrança (`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`) são processadas atomicamente por chave de transação (`payment.id`).
- **Resiliência a Retries de Webhook**: As inserções em `billing_transactions` utilizam `ON CONFLICT (transaction_id) DO NOTHING` ou verificação prévia de existência de transação já liquidada.

## 3. Métricas de Conversão Calculadas
- **Taxa de Conversão Pro**:
  $$\text{Pro Conversion Rate} = \frac{\text{Usuários Pagantes Ativos}}{\text{Total de Usuários Reais Cadastrados}} \times 100$$
- **Taxa de Checkout para Pagamento**:
  $$\text{Checkout Success Rate} = \frac{\text{Pagamentos Confirmados}}{\text{Checkouts Iniciados}} \times 100$$
- Sem risco de divisão por zero: quando o denominador é zero, o serviço retorna explicitamente `0.0%`.
