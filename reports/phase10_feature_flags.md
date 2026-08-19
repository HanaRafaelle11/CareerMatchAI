# Gestão de Feature Flags & Rollout Gradual — Fase 10

## 1. Catálogo de Flags Experimentais Ativas

| Flag / Experimento ID | Status | Variantes | Rollout Padrão | Rollout Máximo Permitido |
| :--- | :--- | :--- | :--- | :--- |
| **`exp_assisted_onboarding_p0`** | `ACTIVE` | `CONTROL`, `VARIANT_A` | **50%** | 50% (A/B Balanceado) |
| **`exp_match_explanation_p1`** | `ACTIVE` | `CONTROL`, `VARIANT_A` | **50%** | 50% (A/B Balanceado) |
| **`exp_paywall_value_p2`** | `ACTIVE` | `CONTROL`, `VARIANT_A` | **50%** | 50% (A/B Balanceado) |

## 2. Mecanismo de Killswitch & Rollback Instantâneo
- Ao definir `status = 'DISABLED'` ou `rolloutPercentage = 0` no `EXPERIMENTS_REGISTRY`, o sistema reverte 100% dos usuários para `CONTROL` imediatamente, sem necessidade de deploy de emergência.
