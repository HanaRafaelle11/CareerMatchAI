# Validação Forense do Time To Value (TTFV) — Fase 7

## 1. Definição do Momento de Valor (First Value)
- **Start Moment**: `signup_completed` (`profiles.created_at`).
- **Value Moment**: Primeiro cálculo válido de Match semântico gerado com vaga (`matches.created_at` ou `job_match_viewed`).

## 2. Invariantes de Cálculo
- **Exclusão de Amostras Inválidas**: Diferenças de tempo $\le 0$ (relógio descalibrado do cliente) são descartadas.
- **Usuários sem Match**: Não entram no cálculo da média/percentis (não são transformados em 0 artificial).
- **Percentis**:
  - `P50` (Mediana)
  - `P75`
  - `P90`
  - `Média Aritmética`
- Se não houver amostras válidas, o retorno é determinístico: `{ p50Minutes: 0, p75Minutes: 0, p90Minutes: 0, avgMinutes: 0, sampleCount: 0 }`.
