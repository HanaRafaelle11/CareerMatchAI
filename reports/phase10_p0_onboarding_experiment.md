# Especificação do Experimento P0 — Onboarding Assistido Híbrido

## 1. Identificação do Experimento
- **ID**: `exp_assisted_onboarding_p0`
- **Nome**: Onboarding Assistido Híbrido (Skills Rápidas vs Upload Direto de PDF)
- **Hipótese de Growth**: Usuários móveis abandonam o fluxo inicial por não terem o PDF arquivado no smartphone. Permitir a inserção preliminar de cargo desejado + 3 skills chave entrega valor imediato de Match antes de solicitar o upload de PDF.

## 2. Variantes
- **CONTROL**: Tela de upload obrigatório de currículo logo após o cadastro.
- **VARIANT_A**: Fluxo em 2 passos: (1) Seleção rápida de objetivo e 3 skills $\longrightarrow$ (2) Exibição de matches preliminares com convite para upload do PDF visando 100% de precisão.

## 3. Métricas e Guardrails
- **Métrica Primária**: `ACTIVATION_RATE` (Cadastro $\to$ Visualização do Primeiro Match $\ge 70\%$).
- **Métricas Secundárias**: `CV_UPLOAD_RATE`, `TIME_TO_VALUE_P50`.
- **Guardrails**: `ERROR_RATE < 2%`, `D7_RETENTION >= 25%`.
- **Tamanho Mínimo da Amostra**: 200 usuários expostos por variante.
