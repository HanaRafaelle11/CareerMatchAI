# 📜 VOCENTRO — HISTORICAL REGRESSION DATABASE & MEMORY

> **REGRA DE ENGENHARIA VOCENTRO:**  
> *"Se um bug importante foi encontrado manualmente uma vez, o objetivo é que a mesma classe de bug nunca mais precise ser descoberta manualmente."*

---

## REGRESSION INVENTORY

| REG-ID | Area | Severity | Root Cause Summary | Fix Description | Automated Protection Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REG-001** | Profile Completeness | ALTO | Discrepância entre Perfil (80%) e Sidebar (100%) por cálculos de progresso duplicados em componentes distintos. | Unificação do cálculo em `ProfileCompletenessService.ts` consumido por `Profile.tsx`, `Dashboard.tsx` e `Navbar.tsx`. | `tests/unit/businessInvariants.test.ts` (Invariant 6) & `tests/e2e/profile_completeness_sync.spec.ts` |
| **REG-002** | Candidate Cohorts | ALTO | Divergência de classificação `activated` vs `not_activated` entre frontend e Edge Functions. | Unificação via `CohortService.ts` e View SQL `view_candidate_cohorts` no Supabase. | `tests/unit/businessInvariants.test.ts` (Invariant 1 & 5) |
| **REG-003** | Survey Wave Metrics | ALTO | Prévia de ondas mostrava números idênticos por falta de filtro por coorte e contagem duplicada com `.length`. | Filtro estrito por coorte e deduplicação de candidatos com `Set(user_id)`. | `tests/unit/surveyWaveMetrics.test.ts` & `tests/unit/businessInvariants.test.ts` (Invariant 2, 3, 4) |
| **REG-004** | Edge Functions Deploy | ALTO | Deploy falhava em lote por HTTP 522 na CDN do `esm.sh` recompilando funções não alteradas (`billing-portal`). | Deploy seletivo via `scripts/deploy-edge-functions.js` (detecta git diff) com retry + backoff. | `tests/unit/businessInvariants.test.ts` & CI Workflow `deploy-supabase-functions.yml` |
| **REG-005** | Active Resume Switch | CRÍTICO | Receio de limpeza de dados do Kanban/Pipeline ao trocar o currículo ativo. | Preservação total de `job_applications_v2` por `user_id`. Troca afeta apenas busca/match. | `tests/unit/businessInvariants.test.ts` (Invariant 7) & `tests/e2e/userJourney.spec.ts` |
| **REG-006** | Gemini Model Pricing | CRÍTICO | IA Cost Dashboard superestimava custos por presumiu modelo inexistente (`gemini-3.6-flash`). | Correção do modelo para `gemini-2.5-flash` / `gemini-2.0-flash` e atualização da tabela de SKUs. | `tests/unit/pricing.test.ts` |
| **REG-007** | Search Relevance & Cascade | ALTO | Termo "cozinheira" trazia vagas de Customer Success / SAC por mistura de categorias de busca. | Implementação da busca em cascata de 5 camadas e isolamento semântico de ocupação. | `tests/unit/real_relevance_verification.test.ts` |
