# Validação Forense do Time To Value (TTFV) — Fase 6.1

## 1. Definições Canônicas
- **Momento Inicial (Start)**: Timestamp de criação do cadastro do candidato (`profiles.created_at`).
- **Momento de Valor (Value Moment)**: Timestamp do primeiro cálculo válido de Match ou primeira visualização de diagnóstico (`matches.created_at` ou `job_match_viewed`).

## 2. Regras de Exclusão de Anomalias
- **Valores Negativos**: Rejeitados imediatamente ($\text{match\_time} < \text{signup\_time}$ indica anomalia de relógio de cliente ou importação assíncrona; descartado do cálculo).
- **Contas de Teste**: Excluídas via `AdminAuditService.isTestOrInternalAccount`.
- **Sessões Incompletas**: Usuários cadastrados sem match gerado são excluídos do cálculo do percentil de TTFV, evitando zeros artificiais ou divisão distorcida.

## 3. Percentis Calculados
- **P50 (Mediana)**: Tempo em minutos no qual 50% dos usuários alcançaram o valor.
- **P75**: Percentil 75.
- **P90**: Percentil 90.
- **Média Aritmética**: $\frac{\sum \text{diffMinutes}}{N}$.
- Se $N = 0$: Retorna explicitamente `{ p50Minutes: 0, p75Minutes: 0, p90Minutes: 0, avgMinutes: 0, sampleCount: 0 }`.
