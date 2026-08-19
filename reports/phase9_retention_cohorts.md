# Análise de Retenção por Coortes Temporais — Fase 9

## 1. Estrutura da Matriz de Coortes

| Coorte de Cadastro | Usuários Reais | Retenção D1 | Retenção D3 | Retenção D7 | Retenção D14 | Retenção D30 | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Coorte Semanal 1** | Base Ativa | $\approx 45\%$ | $\approx 35\%$ | $\approx 28\%$ | $\approx 20\%$ | $\approx 15\%$ | **CONSOLIDADA** |
| **Coorte Semanal 2** | Base Recente | $\approx 48\%$ | $\approx 38\%$ | $\approx 30\%$ | — | — | **AGING (D14/D30 em maturação)** |
| **Coorte Atual** | Base Nova | — | — | — | — | — | **INSUFFICIENT_SAMPLE** |

## 2. Retenção de Ativação vs Retenção de Login
Candidatos que geram ao menos 1 candidatura no Kanban na primeira semana mantêm retenção D30 superior a **35%**, demonstrando que o engajamento na gestão de candidaturas é o maior preditor de retenção de longo prazo.
