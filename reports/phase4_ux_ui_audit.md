# 🔍 AUDITORIA INICIAL UX/UI, DESIGN SYSTEM & ACESSIBILIDADE — FASE 4 (VOCENTRO)

**Data**: Agosto de 2026  
**Produto**: VoCentro (`https://vocentro.com.br`)  
**Responsável Técnico**: Senior Product Designer & Frontend Architect  
**Escopo**: Auditoria completa da interface, tokens, navegação, mobile, acessibilidade (WCAG 2.1 AA) e UX Writing.

---

## 1. 📊 RESUMO DO DIAGNÓSTICO ATUAL

A base de código do VoCentro possui uma arquitetura sólida em React 19, TypeScript, Tailwind CSS v4 e TanStack React Query. Todas as regras de negócio, cálculo de Match (`CareerMatchEngineV3`), integrações e RLS estão operacionais e estáveis.

A oportunidade central reside em **elevar a qualidade da experiência do usuário (UX/UI)**, eliminando ruídos visuais, sobrecarga cognitiva no Dashboard, quebras no mobile e consolidando o Design System sob **3 superfícies semânticas** e **touch targets adequados (≥ 44px)**.

---

## 2. 📋 MATRIZ DE PROBLEMAS IDENTIFICADOS (P0 A P3)

### 🔴 P0 — Crítico (Impacto direto em usabilidade e mobile)
1. **Navegação de Abas do Admin no Mobile**: 14 abas horizontais causavam overflow lateral excessivo em smartphones (< 768px).
2. **Tabela de Usuários no Mobile**: 7 colunas espremidas na tabela de usuários do Admin tornavam a visualização truncada em telas menores que 600px.
3. **Duplicação de CTAs no Dashboard**: Card de "Nossa Recomendação" competia visualmente com o `NextStepCard` ("Seu Próximo Passo").

### 🟠 P1 — Importante (Carga cognitiva e clareza)
1. **Hierarquia do Dashboard**: Excesso de seções concorrentes (7 blocos) sem uma leitura sequencial de 30 segundos.
2. **Ações Rápidas no Copiloto IA**: Falta de pílulas de sugestão instantânea acima do formulário de chat no drawer global.
3. **Labels Ocultos em Formulários**: Uso de placeholders como única indicação em campos específicos de edição de perfil.

### 🟡 P2 — Melhoria (Design System & Superfícies)
1. **Cards Aninhados**: Padrão de "card dentro de card" gerando bordas acumuladas.
2. **Espaçamentos e Raios Variados**: Uso ocasional de valores arbitrários em vez dos tokens padronizados (`VDS_SPACING` e `VDS_RADIUS`).
3. **Touch Targets de Ícones**: Alguns botões de ícone com área de clique inferior a 44x44px.

### 🟢 P3 — Refinamento (UX Writing & Acessibilidade)
1. **Jargões Técnicos em Inglês**: Termos como "Stickiness", "TTV", "Weekly Active" no vocabulário do produto.
2. **Botões sem `aria-label`**: Alguns botões de ícone exclusivamente visual sem rótulo para leitores de tela.
3. **Pluralização Rígida de Textos**: Contadores com mensagens como `"1 vagas encontradas"`.

---

## 3. 🗺️ MAPEAMENTO DE COMPONENTES E ARQUIVOS AFETADOS

| Componente / Página | Arquivo | Responsabilidade | Alterações da Fase 4 |
|---|---|---|---|
| **Design Tokens** | [`src/presentation/components/ds/designTokens.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/components/ds/designTokens.ts) | Centralização de espaçamentos, raios e estados | Adicionado token `3xl: 48px` e refinadas matrizes de estados. |
| **Variáveis CSS** | [`src/index.css`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/index.css) | 3 superfícies (Background, Surface, Elevated) | Padronizadas variáveis semânticas para light/dark mode. |
| **Navegação Global** | [`src/presentation/components/Navbar.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/components/Navbar.tsx) | Bottom navigation e sidebar desktop | Touch targets ≥ 44px, tipografia 10px e contraste semântico. |
| **Dashboard** | [`src/presentation/pages/Dashboard.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/pages/Dashboard.tsx) | Visão geral do candidato | Hierarquia estrita de 6 blocos, eliminando cards redundantes. |
| **Card Próximo Passo** | [`src/presentation/components/NextStepCard.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/components/NextStepCard.tsx) | Ação dominante de carreira | Hero dominante contextual ("O que fazer agora?"). |
| **Vagas & Match** | [`src/presentation/pages/JobMatchHub.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/pages/JobMatchHub.tsx) & [`HumanizedMatchCard.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/components/HumanizedMatchCard.tsx) | Descoberta e diagnóstico de compatibilidade | Um único Match Score oficial, 5 dimensões qualitativas. |
| **Pipeline Kanban** | [`src/presentation/pages/StrategyPage.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/pages/StrategyPage.tsx) | Gestão de candidaturas | Seletor de etapa rápida no mobile, timeline de status. |
| **Copiloto IA** | [`src/presentation/components/GlobalCopilotDrawer.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/components/GlobalCopilotDrawer.tsx) & [`CoachDashboard.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/pages/CoachDashboard.tsx) | Chat global e simulador STAR | Pílulas de ação rápida ("🔍 Vagas", "📄 CV", "🎯 STAR"). |
| **Admin Dashboard** | [`src/presentation/pages/AdminDashboard.tsx`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/pages/AdminDashboard.tsx) | Command Center | Seletor dropdown mobile para 14 abas, tabela em cards verticais no mobile. |

---

## 4. 🛡️ INVARIANTES CONGELADOS PRESERVADOS

1. `CareerMatchEngineV3` e `MATCHING_WEIGHTS`: **100% INTACTOS**.
2. Fórmulas de Match, thresholds matemáticos e ranking: **INTACTOS**.
3. RLS, Supabase, Edge Functions e endpoints de pagamento: **INTACTOS**.
4. Nenhuma funcionalidade de lixeira, restauração, carta ou histórico foi removida.

---

## 5. 🌊 PLANO DE ONDAS DE EXECUÇÃO

* **Onda 1**: Design System, Tokens, 3 Superfícies e Componentes Base.
* **Onda 2**: Navbar, Bottom Navigation Mobile e Dashboard Hierarquizado.
* **Onda 3**: Vagas & Match (Único score), Kanban Mobile e Copiloto IA.
* **Onda 4**: Perfil, Formulários, Admin Mobile, Acessibilidade WCAG 2.1 AA e Quality Gate.
