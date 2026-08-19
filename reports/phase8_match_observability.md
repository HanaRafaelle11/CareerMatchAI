# Observabilidade do Motor de Match & Coerência Visual — Fase 8

## 1. Congelamento e Invariância do Core
- O `CareerMatchEngineV3`, pesos de aderência (`MATCHING_WEIGHTS`: 50% Hard Skills, 30% Senioridade, 20% Cultura), thresholds e Dicionário CBO permanecem 100% inalterados.

## 2. Coerência entre Motor, Persistência e UI
- O score calculado pelo motor no backend/cliente é gravado na tabela `public.matches` e transmitido diretamente ao `HumanizedMatchCard.tsx`.
- Não há modificação, escalonamento ad-hoc ou recalibração visual na camada de apresentação: o score exibido é exatamente o score auditado do motor.
