# Especificação do Experimento P2 — Amostra Interativa no Paywall STAR

## 1. Identificação do Experimento
- **ID**: `exp_paywall_value_p2`
- **Nome**: Amostra Interativa de Feedback STAR
- **Hipótese de Growth**: Exibir uma análise detalhada completa da primeira resposta na simulação STAR antes de travar as questões subsequentes eleva o valor percebido e a conversão para a assinatura Pro.

## 2. Variantes
- **CONTROL**: Paywall modal direto bloqueando a visualização de feedback após a 1ª resposta.
- **VARIANT_A**: Exibição da avaliação completa da 1ª resposta com CTA focado nas questões adicionais e preparação completa.

## 3. Métricas e Guardrails
- **Métrica Primária**: `PAYWALL_TO_PAID_RATE` (Assinatura Pro Confirmada).
- **Métricas Secundárias**: `PAYWALL_TO_CHECKOUT`, `CHECKOUT_TO_PAID`.
- **Guardrails**: `AI_COST_PER_ACTIVATED_USER <= R$ 1,50`, `REFUND_RATE < 2%`.
- **Tamanho Mínimo da Amostra**: 150 exposições por variante.
