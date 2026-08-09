# 🛡️ VOCENTRO — MASTER PLAN DE ENGENHARIA DE QUALIDADE & HARDENING ARQUITETURAL

> **REGRA DE ENGENHARIA VOCENTRO:**  
> *"Se um bug importante foi encontrado manualmente uma vez, o objetivo é que a mesma classe de bug nunca mais precise ser descoberta manualmente."*

---

## 📌 ESTRATÉGIA EM 5 FASES

### 🚀 Fase 1 — Fundação Arquitetural (Implementada & Ativa)
- **Single Source of Truth (SSOT):**
  - **Ativação (`activated` vs `not_activated`):** Centralizado via `CohortService.ts` e View SQL `view_candidate_cohorts`.
  - **Completude de Perfil:** Centralizada via `ProfileCompletenessService.ts` (exibição idêntica de **80% Completo** no Perfil, Dashboard e Sidebar/Navbar).
- **Quality Gate CI/CD:** Linting, TypeScript Typecheck, Vitest Unit Tests e Build estrito.
- **Deploy Seletivo de Edge Functions:** Script `scripts/deploy-edge-functions.js` que detecta alterações via `git diff` e implanta apenas Edge Functions modificadas (com retry + backoff para resiliência contra instabilidade de CDN).
- **Proteção de Persistência:** Troca de currículo ativo preserva 100% dos dados de candidaturas no Kanban (`job_applications_v2`).

---

### 🤖 Fase 2 — QA Usuário & Robô Usuário (Em Produção)
- **Cobertura de Jornadas P0:**
  - Login e Autenticação Supabase / OAuth.
  - Perfil Profissional & Seleção de CV Ativo.
  - Vagas & Match (Busca, Cascata de 5 Camadas e Relevância).
  - Jornada & Pipeline Kanban (Movimentação entre estágios).
  - Pesquisa de Satisfação & Concessão do Plano PRO.
  - Paywall & Preços Oficiais (R$ 29,90/mês).
- **Ambiente de Testes:** Suíte E2E desacoplada do Vitest via Playwright Test runner.

---

### 🎨 Fase 3 — Proteção Visual & Responsividade
- **Responsividade Mobile (375px Viewport):** Garantia de usabilidade em telas pequenas (iPhone / Android).
- **Suporte Dark/Light Mode:** Contraste WCAG 2.1 AA preservado em ambos os temas.
- **Visual Regression Testing:** Capturas de tela de referência para modais críticos e visualização da jornada.

---

### 📡 Fase 4 — Pós-Produção & Observabilidade
- **Production Smoke Test (`tests/e2e/productionSmokeTest.spec.ts`):**
  - Executado automaticamente após todo deploy na branch `main`.
  - Validação HTTP 200 em `https://vocentro.com.br`.
  - Verificação de rotas públicas P0 (`/login`, `/termos-de-uso`, `/politica-de-privacidade`).
- **Política de Rollback Seguro:** Vercel e Supabase CLI configurados para reversão instantânea em caso de regressão de produção.

---

### 📈 Fase 5 — Expansão Programada (Continuous Reliability)
- **Estratégia de Performance do Pipeline:**
  - **A cada commit:** CI rápido (Linting, Typecheck, Unit/Invariants, Build — < 2 min).
  - **Nightly / Pre-Release:** Suíte completa estendida de E2E e testes de carga.
