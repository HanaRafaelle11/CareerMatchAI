# Integridade de Conversão e Paywall — Fase 7

## 1. Mapeamento de Eventos da Esteira Comercial
A esteira de monetização divide-se claramente em 4 etapas sequenciais:

1. **`pricing_viewed` / `paywall_viewed`**: Exibição da tela de planos ou do modal de cota de análises gratuitas atingida.
2. **`paywall_cta_clicked`**: Clique explícito no botão de upgrade para o Plano Pro.
3. **`checkout_started`**: Inicialização do checkout com parâmetros de plano (`pro`), método (`PIX` ou `CREDIT_CARD`) e ciclo (`MONTHLY`).
4. **`payment_confirmed`**: Confirmação assinada por webhook do gateway de pagamento.

## 2. Reconhecimento de Conversão
- `checkout_started` **NÃO** é considerado conversão e **NÃO** compõe métricas de receita.
- Conversão Pro é calculada estritamente a partir do status `active` em `billing_subscriptions` e transações liquidadas em `billing_transactions`.
