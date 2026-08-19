# Conversão de Monetização e Análise de Receita — Fase 9

## 1. Funil de Monetização Real

$$\text{Base Total de Usuários Reais} \xrightarrow{\text{Atingimento de Limite}} \text{Paywall Viewed} \xrightarrow{\approx 26\%} \text{Checkout Started} \xrightarrow{\approx 30\%} \text{Pagamento Confirmado (Pro)}$$

## 2. Indicadores Financeiros Canônicos
- **Taxa de Conversão Free $\to$ Pro**: $\approx 1.2\% - 2.5\%$ da base total cadastrada.
- **Receita Reconhecida**: Somatório estrito de transações liquidadas com `status = 'succeeded'` em `public.billing_transactions`.
- **Prevenção de Falsos Positivos**: Checkouts abandonados são computados no funil de checkout, mas isolados da receita faturada.
