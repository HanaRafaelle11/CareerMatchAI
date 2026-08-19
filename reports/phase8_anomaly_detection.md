# Regras de Detecção de Anomalias em Dados — Fase 8

## 1. Regras Determinísticas Implementadas
1. **$DAU > MAU$**: Anomalia matemática grave (inclusão de conjuntos violada) $\longrightarrow$ **Alerta Crítico**.
2. **$WAU > MAU$**: Anomalia matemática grave $\longrightarrow$ **Alerta Crítico**.
3. **$\text{Pagamentos Confirmados} > \text{Checkouts Iniciados}$**: Anomalia de telemetria $\longrightarrow$ **Alerta de Investigação**.
4. **Receita Negativa Não-Autorizada**: Faturamento $< 0$ sem estorno registrado $\longrightarrow$ **Alerta Financeiro**.
5. **Queda Abrupta de Volume ($> 80\%$)**: Volume de eventos diário $< 20\%$ da média semanal $\longrightarrow$ **Alerta de Telemetria**.

## 2. Testes de Cobertura
Todas as 5 regras de violação foram cobertas e validadas nos Casos 51 a 54 e 61 da suíte de Golden Cases.
