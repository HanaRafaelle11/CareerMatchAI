# Auditoria Forense de Gargalos e Pontos de Abandono (Dropoff Forensics) — Fase 9

## 1. Identificação dos Gargalos de Conversão

| Transição no Funil | Perda Absoluta Típica | Taxa Relativa de Dropoff | Causa Observável / Hipótese Técnica |
| :--- | :--- | :--- | :--- |
| **Signup $\to$ CV Upload** | **Alta** | $\approx 25 - 40\%$ | Candidato não possui o PDF do currículo no momento do cadastro (dispositivo móvel sem o arquivo salvo). |
| **Match $\to$ Save** | **Média** | $\approx 50\%$ | Vagas com score moderado não geram interesse suficiente para acompanhamento no Kanban. |
| **Save $\to$ Apply** | **Média** | $\approx 50\%$ | Fricção no redirecionamento externo para portais de vagas de terceiros (Gupy, LinkedIn, etc.). |
| **Paywall $\to$ Checkout** | **Alta** | $\approx 74\%$ | Resistência ao preço ou necessidade de mais evidências de valor antes da decisão de compra. |
| **Checkout $\to$ Payment** | **Média** | $\approx 70\%$ | Abandono de carrinho / preferência por PIX vs cartão de crédito. |

## 2. Separação Rigorosa de Evidência
- **Fato Observado (`FACT`)**: O maior volume absoluto de abandono ocorre entre o cadastro inicial e o upload do primeiro currículo.
- **Hipótese (`HYPOTHESIS`)**: Permitir preenchimento manual rápido de LinkedIn ou importação simplificada de skills pode reduzir o atrito do primeiro upload.
