# 🚀 VoCentro Beta Launch Readiness Checklist

**Data da Auditoria**: 24 de Julho de 2026  
**Status Final**: 🟢 **PRONTO PARA 20-50 USUÁRIOS BETA REAIS**  
**Resultado da Compilação**: ✅ **0 Errors (2423 modules transformed)**

---

## 1. Produto & Funcionalidades Core

- [x] **Cadastro e Autenticação**
  - Supabase Auth ativo com sincronização de preferências do usuário.
  - Suporte a onboarding fluido sem fricção.
- [x] **Upload e Parsing de Currículo**
  - Leitura assíncrona de PDF via Supabase Storage + Edge Function `analyze-resume`.
  - Tratamento de erro resiliente com orientações amigáveis em português caso o PDF possua proteção por senha ou falhe no OCR.
- [x] **Career Score de Mercado**
  - Diagnóstico em tempo real calculado no upload do primeiro currículo (0–100/100).
  - Exibição instantânea de Cargos Compatíveis (🥇, 🥈, 🥉), Pontos Fortes e Lacunas de Evolução.
- [x] **Job Match Engine com IA**
  - Análise explicativa dos 7 fatores de fit (Skills 30%, Experiência 25%, Senioridade 15%, Objetivos 15%, Salário 5%, Localização 5%, Contexto Semântico 5%).
  - Eliminação de scores ambíguos ou concorrentes: exibição explícita do **Career Fit Score** (Alinhamento do Perfil) e do **Job Score** (Qualidade da Vaga de Mercado).
- [x] **Busca Inteligente de Vagas**
  - Ativação simultânea dos adaptadores Adzuna, Jooble e SerpApi sem truncamento artificial.
  - Threshold de descrição de qualidade otimizado para 30 caracteres, preservando todo o volume dos provedores.
- [x] **Salvamento de Vagas & Registro de Candidatura**
  - Botão "Salvar Vaga": persiste na tabela `job_feedback` (`SAVED`) e `job_applications` (`SAVED`) com Toast `✓ Vaga salva na sua jornada`.
  - Botão "Candidatado": altera status no pipeline Kanban para `APPLIED` com Toast `✓ Candidatura registrada`.
- [x] **Jornada Profissional (Pipeline Kanban)**
  - Acompanhamento das candidaturas organizadas em colunas (Salvas → Aplicadas → Entrevistas → Ofertas).

---

## 2. Dados, Telemetria & Segurança

- [x] **Analytics & Telemetria Ativa**
  - Disparo de todos os 8 eventos estratégicos do funil de produto:
    `signup_completed`, `resume_uploaded`, `career_score_viewed`, `job_match_viewed`, `resume_adaptation_opened`, `application_started`, `application_completed`, `beta_feedback_sent`.
- [x] **Observabilidade e Logs de Erro**
  - Captura estruturada de exceções na tabela `application_errors` via `AppError.logError()`.
  - Logs detalhados no console de cada etapa da busca (`SEARCH PIPELINE`) e extração de senioridade (`Seniority Detection`).
- [x] **Segurança & RLS (Row Level Security)**
  - Políticas RLS aplicadas e validadas em `job_applications`, `job_feedback`, `career_profile_snapshots`, `resume_adaptations`, e `job_match_explanations` garantindo estritamente `auth.uid() = user_id`.

---

## 3. UX, Acessibilidade WCAG & Design System

- [x] **Design Tokens & Contraste WCAG 4.5:1**
  - Modo Claro: Fundo `#F8FAFC`, Cards `#FFFFFF`, Títulos `#0F172A`, Textos `#475569`.
  - Modo Escuro: Fundo `#0B132B`, Cards `#1E293B`, Títulos `#F1F5F9`, Textos `#CBD5E1`.
  - Correção definitiva das cores de cards de diagnóstico e widget de feedback para leitura em qualquer tema.
- [x] **Modais Centralizados & Prevenção de Transbordo**
  - Modais montados no nível do `document.body` via React Portals (`createPortal`), garantindo centralização em viewports Desktop (1920x1080), Notebook (1366x768) e Mobile (390x844).
  - Bloqueio de rolamento da página de fundo (`document.body.style.overflow = 'hidden'`) enquanto o modal está ativo.
- [x] **Eliminação de Termos Genéricos ("Geral")**
  - Limpeza automática de dados nulos ou rotulados como "Geral", substituindo-os por narrativas profissionais detalhadas no diagnóstico do Copiloto.

---

## 4. Critérios de Aprovação do Lançamento Beta

- ✅ `npm run build`: **0 erros**
- ✅ Busca agregada trazendo o volume real das fontes de vagas
- ✅ Clareza dos scores sem necessidade de documentação externa
- ✅ Fluxo ponta a ponta sem falhas: **Landing → Onboarding → Upload → Career Score → Match → Salvar → Candidatar → Jornada**
