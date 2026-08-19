# Validação Estatística do Time To Value (TTFV) — Fase 8

## 1. Definição Canônica
- **Momento Inicial**: `profiles.created_at`.
- **Momento de Valor**: `matches.created_at` (primeiro cálculo de aderência com vaga real).

## 2. Robustez Estatística
- **Exclusão de Outliers Inválidos**: Tempos negativos ($\le 0$) são expurgados do cálculo.
- **Resistência a Outliers Extremos**: O uso do **P50 (Mediana)** garante que candidatos com atraso intencional de dias não distorçam o valor representativo da maioria.
- **Tamanho Amostral**: Exibido explicitamente junto aos percentis (`sampleCount`), prevenindo falsas conclusões com amostras pequenas.
