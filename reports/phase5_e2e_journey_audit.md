# 🧪 AUDITORIA DE JORNADA REAL END-TO-END — FASE 5 (VOCENTRO)

**Produto**: VoCentro  
**Data**: Agosto de 2026  
**Status Geral**: `🟢 VALIDADO PARA PRODUÇÃO`  

---

## 1. 👥 AUDITORIA POR PERSONAS DE USUÁRIO

### 👤 Persona A — Novo Candidato (Primeiro Acesso)
* **Fluxo**: `LandingPage` → `Login (Cadastro)` → `OnboardingModal` → `Upload de CV` → `Parsing IA` → `Definição de Objetivo` → `Dashboard` → `Descoberta de Vagas` → `Diagnóstico de Match` → `Candidatura`.
* **Análise de Fricção**:
  * **Onde estou?**: Cabeçalho e modal de onboarding esclarecem o momento imediatamente.
  * **O que fazer?**: O `NextStepCard` no topo do Dashboard direciona em 1 clique ("Definir objetivo" ou "Ver vagas com match").
  * **CTAs Concorrentes**: Eliminados — apenas 1 ação hero dominante por contexto.
  * **Feedback**: Upload exibe progresso de parsing; estados vazios instruem como cadastrar dados.
* **Avaliação**: `🟢 VALIDADO`

---

### 👤 Persona B — Usuário Recorrente (Engajamento e Acompanhamento)
* **Fluxo**: `Login` → `Dashboard` → `Visualização de Match em novas vagas` → `StrategyPage (Kanban)` → `Movimentação de Estágio` → `CoachDashboard (Simulação STAR)`.
* **Análise de Fricção**:
  * **Pipeline Kanban**: Suporta movimentação de candidaturas com feedback visual imediato; no mobile, o seletor por coluna evita rolagem horizontal indesejada.
  * **Simulador STAR**: Perguntas contextualizadas por vaga com gravação/digitação e feedback de diagnóstico por competência.
* **Avaliação**: `🟢 VALIDADO`

---

### 👤 Persona C — Usuário Free (Descoberta & Paywall Ético)
* **Fluxo**: Uso das ações semanais gratuitas → Atingimento do limite semanal → Visualização do `CheckoutModal`.
* **Análise de Fricção**:
  * **Clareza de Limites**: Contador de ações semanais visível e transparente.
  * **Experiência do Paywall**: Mensagem clara explicando quais recursos são exclusivos do plano PRO (exportação ilimitada de PDF, cartas customizadas e simulações STAR ilimitadas), sem bloqueios surpresa.
* **Avaliação**: `🟢 VALIDADO`

---

### 👤 Persona D — Usuário PRO (Valor Contínuo)
* **Fluxo**: Assinatura ativa → Acesso irrestrito ao `CoachDashboard`, `JobMatchHub` sem limites de desbloqueio, exportação de currículos e cartas customizadas.
* **Análise de Fricção**:
  * **Entitlements**: `useEntitlements` consome o status real `isPro` via Supabase/Stripe com resiliência local.
* **Avaliação**: `🟢 VALIDADO`

---

### 👤 Persona E — Administrador / Operador de Produto
* **Fluxo**: `Login (Admin)` → `AdminDashboard (Command Center)` → Inspeção das 14 abas → Gestão de Usuários → Telemetria e Alertas.
* **Análise de Fricção**:
  * **30 Segundos para Diagnóstico**: Seção "Atenção Agora" destaca alertas críticos, erros de parsing e taxa de conversão.
  * **Zero Mocks**: Fallbacks eliminados — métricas refletem o estado real do banco de dados.
* **Avaliação**: `🟢 VALIDADO`
