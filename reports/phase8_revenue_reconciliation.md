# Reconciliação Financeira de Receita & Gateways — Fase 8

## 1. Fonte Oficial e Faturamento Líquido
- **Tabela Fonte**: `public.billing_transactions`.
- **Fórmulas Oficiais**:
  - **Receita Bruta (Gross Revenue)**: Soma de todas as transações com `status = 'succeeded'`.
  - **Estornos / Reembolsos (Refunds)**: Soma de estornos e contestações confirmadas.
  - **Receita Líquida (Net Revenue)**: $\text{Gross Revenue} - \text{Refunds}$.
  - **ARPPU**: $\frac{\text{Net Revenue}}{\text{Paid Users}}$.

## 2. Invariante Comercial
Eventos de `checkout_started` representam apenas a intenção de compra na esteira de conversão e jamais são computados como faturamento ou receita antes da confirmação do webhook do gateway.
