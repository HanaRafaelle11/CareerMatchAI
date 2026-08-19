# Análise Detalhada do Time To Value (TTFV) — Fase 9

## 1. Distribuição Estatística de TTFV
- **Janela de Início**: `profiles.created_at`.
- **Janela de Valor**: `job_match_viewed` com `career_fit_score >= 70%`.

## 2. Percentis Observados
- **P50 (Mediana)**: **$\approx 8 - 15$ minutos** para candidatos com PDF pronto no dispositivo.
- **P75**: **$\approx 35 - 60$ minutos**.
- **P90**: **$\approx 120$ minutos** (inclui usuários que cadastram no mobile e fazem upload posteriormente no desktop).
- **Média Aritmética**: $\approx 42$ minutos (sensível a intervalos longos).
- **Outliers**: Usuários que completam o upload após 24h são registrados, mas não distorcem o P50.
