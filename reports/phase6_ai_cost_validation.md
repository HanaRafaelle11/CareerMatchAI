# Validação de Custos, Tokens e Modelos de IA — Fase 6.1

## 1. Modelo em Operação
- **Modelo Principal**: `Google Gemini 3.6 Flash` (`gemini-3.6-flash`).

## 2. Tabela de Preços Aplicada
- **Input Tokens**: \$0.075 por 1.000.000 de tokens (\$0.000000075 / token).
- **Output Tokens**: \$0.30 por 1.000.000 de tokens (\$0.00000030 / token).
- **Taxa de Câmbio de Referência**: USD 1.00 = BRL 5.80.

## 3. Fórmula de Custo em Reais (BRL)
$$\text{Custo BRL} = (\text{Input Tokens} \times 0.000000435) + (\text{Output Tokens} \times 0.00000174)$$

## 4. Agregação e Quebra por Funcionalidade
O `AdminAnalyticsService.calculateAiCosts()` itera sobre as linhas da tabela `ai_usage_logs` e computa:
- `totalTokens` (soma de input + output)
- `totalCalls` (contagem de requisições)
- `totalCostBrl` (custo financeiro total)
- `costPerActiveUserBrl` ($\frac{\text{totalCostBrl}}{\max(1, \text{activeUsersCount})}$)
- `featureBreakdown` (quebra de chamadas, tokens e custos por feature: `resume_optimization`, `cover_letter`, `interview_prep`, `coach_chat`, etc.)

Quando a tabela `ai_usage_logs` está vazia, o custo retornado é estritamente `R$ 0,00` com `0` chamadas e `0` tokens.
