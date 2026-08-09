# 📜 VOCENTRO — HISTORICAL REGRESSION DATABASE & EXECUTED MEMORY

> **REGRA DE ENGENHARIA VOCENTRO:**  
> *"Se um bug importante foi encontrado manualmente uma vez, a mesma classe de bug não deve precisar ser descoberta manualmente novamente."*

---

## REGRESSION INVENTORY & EXECUTION EVIDENCE

| REG-ID | Area | Severity | Root Cause Summary | Fix Description | Teste de Proteção | Executado? | Resultado Real |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REG-001** | Profile Completeness | ALTO | Discrepância entre Perfil (80%) e Sidebar (100%) por cálculos de progresso duplicados em componentes distintos. | Unificação do cálculo em `ProfileCompletenessService.ts` consumido por `Profile.tsx`, `Dashboard.tsx` e `Navbar.tsx`. | `businessInvariants.test.ts` (Invariant 6) & `userJourney.spec.ts` | SIM | 🟢 PASSOU |
| **REG-002** | Candidate Cohorts | ALTO | Divergência de classificação `activated` vs `not_activated` entre frontend e Edge Functions. | Unificação via `CohortService.ts` e View SQL `view_candidate_cohorts` no Supabase. | `businessInvariants.test.ts` (Invariant 1 & 5) | SIM | 🟢 PASSOU |
| **REG-003** | Survey Wave Metrics | ALTO | Prévia de ondas mostrava números idênticos por falta de filtro por coorte e contagem duplicada com `.length`. | Filtro estrito por coorte e deduplicação de candidatos com `Set(user_id)`. | `surveyWaveMetrics.test.ts` & `businessInvariants.test.ts` (Invariant 2, 3, 4) | SIM | 🟢 PASSOU |
| **REG-004** | Edge Functions Deploy | ALTO | Deploy falhava em lote por HTTP 522 na CDN do `esm.sh` recompilando funções não alteradas (`billing-portal`). | Deploy seletivo via `scripts/deploy-edge-functions.js` (detecta git diff) com retry + backoff. | `businessInvariants.test.ts` & CI Workflow `deploy-supabase-functions.yml` | SIM | 🟢 PASSOU |
| **REG-005** | Active Resume Switch | CRÍTICO | Receio de limpeza de dados do Kanban/Pipeline ao trocar o currículo ativo. | Preservação total de `job_applications_v2` por `user_id`. Troca afeta apenas busca/match. | `businessInvariants.test.ts` (Invariant 7) & `userJourney.spec.ts` | SIM | 🟢 PASSOU |
| **REG-006** | Gemini Model Pricing | CRÍTICO | IA Cost Dashboard superestimava custos por presumiu modelo inexistente (`gemini-3.6-flash`). | Correção do modelo para `gemini-2.5-flash` / `gemini-2.0-flash` e atualização da tabela de SKUs. | `pricing.test.ts` | SIM | 🟢 PASSOU |
| **REG-007** | Search Relevance & Cascade | ALTO | Termo "cozinheira" trazia vagas de Customer Success / SAC por mistura de categorias de busca. | Implementação da busca em cascata de 5 camadas e isolamento semântico de ocupação. | `real_relevance_verification.test.ts` | SIM | 🟢 PASSOU |
| **REG-008** | Resume Switch Handler | CRÍTICO | Botão de trocar CV no CompactHeader passava `selectActiveResume` em vez de `handleSelectResumeVersion`, gerando mismatch entre `resumeVersionId` e `resumes.id`. | Passagem do handler `handleSelectResumeVersion` no `CompactHeader` e fallback de resolução em `selectActiveResumeMutation`. | `resume_switcher_persistence.spec.ts` | SIM | 🟢 PASSOU |
| **REG-009** | Pro Entitlement Flash | CRÍTICO | Usuário PRO visualizava modal "Seja Pro" / Paywall por 1-2 frames pois `isPro` inicializava como `false` antes da checagem assíncrona. | Inicialização síncrona de `isPro` via cache local `vocentro_is_pro_${uid}` e bloqueio de `triggerPaywall` durante `loading` / `isPro`. | `pro_entitlement_no_flash.spec.ts` | SIM | 🟢 PASSOU |
| **REG-010** | Journey Progress 40% vs 80% | ALTO | Barra lateral calculava `journeyProgress` apontando diretamente para `profileCompleteness` em vez dos passos da jornada. | Unificação das métricas: Completude do Perfil (dados do candidato, 80%) e Progresso da Jornada (passos da aceleração, 100% quando concluídas). Adicionado `?` info tooltip com `aria-label`. | `userJourney.spec.ts` & `Navbar.tsx` | SIM | 🟢 PASSOU |
