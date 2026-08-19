# Reconciliação do Algoritmo de Match & Observabilidade — Fase 7.1

## 1. Preservação Absoluta do Engine
- **Invariantes Intactos**: `CareerMatchEngineV3`, `MATCHING_WEIGHTS` (50% Hard Skills, 30% Senioridade, 20% Cultura), thresholds matemáticos, deduplicação de vagas e Dicionário CBO permanecem 100% inalterados.

## 2. Reconciliação de Telemetria de Match
- Quando o `CareerMatchEngineV3` calcula a aderência de uma vaga para um candidato:
  1. O resultado é persistido na tabela `public.matches` (`career_fit_score`, `career_goal_score`, `confidence`, `breakdown`).
  2. O evento `job_match_viewed` é registrado quando o card é visualizado pelo candidato.
  3. Feedback explícito do candidato é gravado em `public.job_match_feedback`.
- As contagens de matches calculados e visualizados são consistentes e deduplicadas por `user_id + job_id`.
