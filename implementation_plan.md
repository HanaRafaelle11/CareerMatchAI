# 📋 PLANO DE IMPLEMENTAÇÃO: AUDITORIA FUNCIONAL, UX/UI, COPY E PREPARAÇÃO DOS PROMPTS 1, 2 E 3

## 🎯 Contexto e Visão Geral

O usuário forneceu 3 prompts mestres estratégicos para o VoCentro:
1. **PROMPT 1 — AUDITORIA FUNCIONAL + UX/UI + COPY**:
   - **P0 Blockers**:
     1. "Apagar todos" (Esvaziar lixeira / Excluir permanentemente em lote)
     2. "Restaurar todos" (Restaurar todas as vagas da lixeira de volta para ativas)
     3. "Gerar carta" (Geração de carta de apresentação resiliente para a vaga selecionada)
   - **P1 UX/UI/Copy**: Varredura de todos os botões/CTAs, consistência entre ações individuais e em massa, estados de loading, feedback toast padronizado, confirmação de ações destrutivas, acessibilidade e mobile.
2. **PROMPT 2 — COMMAND CENTER / ADMIN / UX / UI / DADOS**: Integridade matemática das métricas (WAU >= DAU, Stickiness = DAU / MAU), camada central de analytics, RBAC/RLS, alertas acionáveis "ATENÇÃO AGORA", responsividade mobile das tabelas.
3. **PROMPT 3 — MATCH**: Fonte única de verdade ("Um score oficial, uma fonte"), separação da relevância de busca do score de compatibilidade, explicação determinística + IA.

> **Estratégia de Execução**: Executar sequencialmente, iniciando pelo **Prompt 1 (Correções Funcionais, UX/UI e Copy)**, conforme recomendação estrita.

---

## 🔍 Diagnóstico de Causa Raiz dos Problemas P0 (Prompt 1)

### 1. Causa Raiz de "Restaurar todos" e "Apagar todos" (`useJobTrash.ts` e `JobMatchHub.tsx`)
* **Problema Encontrado**:
  1. Vagas oriundas da descoberta possuem IDs sintéticos (ex: `agg_adzuna_123` ou strings alfanuméricas).
  2. Ao executar operações em lote (`clearTrash` e `restoreAllFromTrash`), o código realizava queries SQL no Supabase com cláusula `.in('job_id', ids)` sobre tabelas com coluna `job_id` tipada estritamente como `UUID` (como `matches` e `job_matches`).
  3. O PostgreSQL disparava erro fatal `22P02: invalid input syntax for type uuid: "agg_adzuna_123"`, abortando a operação em lote e impedindo a exclusão/restauração no banco de dados.
  4. O estado local e o cache do React Query ficavam dessincronizados, fazendo as vagas reaparecerem após reload.
* **Solução**:
  - Filtrar estritamente IDs UUID válidos antes de disparar queries em tabelas tipadas com UUID (`isUuid(id)`).
  - Executar deleção atômica na tabela `job_feedback` (que aceita strings de job_id) e limpar o cache local `localStorage` de metadados.
  - Criar modal de confirmação padronizado com contagem real de vagas (`"Apagar todas as X vagas?"` com botões `[Cancelar]` e `[Apagar definitivamente]`).
  - Adicionar estados de loading explícitos (`"Restaurando..."`, `"Apagando..."`), desabilitar duplo clique e emitir toasts claros de sucesso (`"✓ X vagas restauradas com sucesso."` e `"✓ X vagas apagadas com sucesso."`).

### 2. Causa Raiz de "Gerar carta" (`JobMatchHub.tsx` e `useCoach.ts`)
* **Problema Encontrado**:
  1. A query de recuperação `useCoverLetterQuery` utilizava uma chave composta `['cover-letter', applicationId, jobId]`, enquanto a mutation `generateCoverLetter` gravava o cache sob chaves divergentes (`['cover-letter', applicationId]` ou `['cover-letter', jobId]`).
  2. Se a candidatura (`applicationId`) ainda estivesse sendo criada em background, a chave da query não batia com a chave da mutation, deixando a interface presa no empty state ("Gere cartas de apresentação personalizadas...") mesmo após a IA ter concluído a geração.
  3. A cópia do botão exibia "Gerar Cartas de Apresentação" (plural com caixa alta inconsistente).
* **Solução**:
  - Unificar a chave do cache do React Query para indexar consistentemente por `['cover-letter', jobId]` e `['cover-letter', applicationId]`.
  - Exibir estado de loading no botão e no container com microcopy: `"Gerando sua carta de apresentação personalizada..."` e desabilitar duplo clique.
  - Fornecer gerador contextual resiliente caso a Edge Function remota esteja em timeout, garantindo que o candidato nunca fique sem resposta.
  - Feedback toast padronizado: `"✓ Carta de apresentação gerada com sucesso."` e padronização da cópia para `"Gerar carta de apresentação"`.

---

## 🛠️ Mudanças Propostas no Código (Prompt 1)

### 1. Módulo de Lixeira e Operações em Massa
#### [MODIFY] [`src/application/hooks/useJobTrash.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/application/hooks/useJobTrash.ts)
- Tratar UUIDs vs IDs sintéticos em `clearTrashMutation`, `restoreAllFromTrashMutation`, `restoreFromTrashMutation` e `deletePermanentlyMutation`.
- Assegurar persistência no Supabase (`job_feedback`) e limpeza atômica no `localStorage`.
- Garantir que as mutations retornem estados de loading reativos (`isRestoring`, `isRestoringAll`, `isDeletingPermanently`, `isClearingTrash`).

#### [MODIFY] [`src/presentation/pages/JobMatchHub.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/pages/JobMatchHub.tsx)
- Implementar modal de confirmação transparente para "Apagar definitivamente todas as vagas" com contagem real e bloqueio de duplo clique.
- Atualizar botões de ação com estados `isRestoringAll ? "Restaurando..." : "Restaurar todas as vagas"` e `isClearingTrash ? "Apagando..." : "Apagar definitivamente"`.
- Adicionar toasts com contadores reais e feedback sem termos técnicos.

### 2. Módulo de Geração de Carta de Apresentação
#### [MODIFY] [`src/application/hooks/useCoach.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/application/hooks/useCoach.ts)
- Sincronizar chaves de cache do React Query (`['cover-letter', jobId]`, `['cover-letter', applicationId]`).
- Garantir persistência no `localDB` e atualização otimista imediata na UI.

#### [MODIFY] [`src/presentation/pages/JobMatchHub.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/pages/JobMatchHub.tsx)
- Padronizar texto do botão para `"Gerar carta de apresentação"`.
- Exibir nome da vaga no cabeçalho da carta (`"Vaga: [nome da vaga] · [empresa]"`).
- Tratar estados de loading com spinner e bloqueio de cliques concorrentes.

### 3. Matriz de Auditoria de Botões e CTAs
- Realizar varredura nos botões de:
  - `JobMatchHub.tsx` (Calcular Match, Salvar Vaga, Descartar, Restaurar, Gerar Carta, Copiar, Esvaziar Lixeira).
  - `StrategyPage.tsx` (Mover estágio, Excluir candidatura, Filtrar por abas mobile).
  - `CoachDashboard.tsx` (Iniciar Simulação Gratuita, Reiniciar Simulação, Encerrar e Gerar Relatório STAR, Enviar Resposta).
  - `CareerGoalCard.tsx` (Salvar Objetivo Profissional).
  - `LandingPage.tsx` (Menu hamburger mobile, Criar conta, Entrar, Scroll suave).

---

## 🧪 Plano de Verificação e Testes

### 1. Testes Automatizados (Vitest)
- Criar suíte de testes de integração e persistência: `tests/unit/jobTrashAndBulkOperations.test.ts`
  - Testar exclusão individual e em lote com IDs sintéticos e UUIDs.
  - Testar restauração individual e em lote garantindo que `trashedJobs.length === 0`.
  - Testar persistência após reload simulado (limpeza de cache e storage).
  - Testar geração de carta de apresentação e consulta por `jobId`.
- Executar a suíte completa de testes: `npm run test:unit`.

### 2. Verificação de Tipos e Build
- Executar `npx tsc -b`.
- Executar `npm run build`.

### 3. Validação em Produção (Mandatória)
- Commit com mensagem padronizada (`fix(hub): fix bulk trash operations, cover letter generator and cta hardening`).
- Push para `origin/main`.
- Validação do status HTTP 200 em `https://vocentro.com.br`.
