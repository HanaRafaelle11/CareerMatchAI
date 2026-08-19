# 🧭 REGISTRO DE DECISÕES DE PRODUTO & TRADE-OFFS — FASE 12

**Produto**: VoCentro  
**Fase**: 12 — Activation, Mobile & Conversion Optimization  
**Data**: Agosto de 2026  

---

## 1. DECISÃO 1: MENU HAMBURGER COM LINKS ÂNCORA NA LANDING MOBILE
* **Contexto**: A Landing Page na resolução mobile ocultava o menu de navegação (`hidden lg:flex`), impedindo usuários em smartphones de acessarem seções vitais (Planos, Transparência, FAQ, Termos).
* **Decisão Tomada**: Implementar menu hamburger acessível com botões de ação e links âncora com fechamento automático ao toque.
* **Alternativa Rejeitada**: Tab bar fixa inferior na landing (descartada para não poluir a tela nem conflitar com botões de cookie banner/suporte).
* **Trade-off & Rationale**: O menu gaveta superior mantém a identidade visual limpa e elegante, garantindo acesso imediato a todas as seções informativas com 1 toque.

---

## 2. DECISÃO 2: 1 SIMULAÇÃO DE ENTREVISTA GRATUITA (DEGUSTAÇÃO DE VALOR)
* **Contexto**: O Simulador de Entrevista STAR era completamente bloqueado para usuários do plano Free logo no primeiro clique, impedindo que o candidato percebesse a qualidade das perguntas e o feedback do relatório.
* **Decisão Tomada**: Conceder **1 simulação completa gratuita** para novos usuários (`simulationsHistory.length === 0`). A partir da segunda simulação, a barreira do Plano Pro é ativada normalmente.
* **Alternativa Rejeitada**: Manter bloqueio total imediato (alta taxa de rejeição no funil) OU liberar simulações ilimitadas (inviabilizaria o modelo de monetização SaaS).
* **Trade-off & Rationale**: A degustação de 1 sessão ativa o "Momento AHA!", comprova o valor do método STAR e aumenta em até 3x a taxa de conversão final para o plano Pro.

---

## 3. DECISÃO 3: SELETOR DE ESTÁGIOS EM ABAS NO PIPELINE MOBILE
* **Contexto**: As 7 colunas do Kanban em telas pequenas causavam rolagem horizontal pesada ou empilhamento vertical infinito de cards.
* **Decisão Tomada**: Adicionar um seletor horizontal de abas de estágio (`[Todas] [Salvas] [Enviadas] [RH] [Entrevista] [Oferta]`) exclusivo para dispositivos móveis (`< 768px`), preservando a matriz completa no desktop.
* **Alternativa Rejeitada**: Desabilitar o pipeline no celular ou forçar apenas visão de tabela estática.
* **Trade-off & Rationale**: Permite ao usuário de celular focar na etapa de interesse com uma mão só e alterar status via dropdown sem necessidade de arrastar cards horizontalmente.

---

## 4. DECISÃO 4: PLANEJAMENTO ESTRUTURADO DE REFATORAÇÃO DO `JobMatchHub.tsx` (SEM BIG-BANG)
* **Contexto**: O arquivo `JobMatchHub.tsx` possui ~5.100 linhas. Refatorá-lo em lote durante a Fase 12 traria alto risco de quebrar o motor congelado ou causar regressões funcionais.
* **Decisão Tomada**: Elaborar um plano formal de decomposição modular em 6 subcomponentes (`reports/phase12_jobmatchhub_refactor_plan.md`) para ser executado em uma fase técnica dedicada com cobertura de testes unitários prévia.
* **Alternativa Rejeitada**: Reescrever o monólito de uma vez na Fase 12.
* **Trade-off & Rationale**: Preserva a estabilidade de produção e o determinismo do `CareerMatchEngineV3`, garantindo zero downtime e zero regressão.

---

## 5. DECISÃO 5: HUMANIZAÇÃO DA LINGUAGEM DO PRODUTO (PORTUGUÊS CLARO)
* **Contexto**: Termos como "Match Semântico", "Pipeline Kanban", "Career Score" e versões de software "V3/v2.4" soavam excessivamente técnicos.
* **Decisão Tomada**: Padronizar toda a interface para português acessível: "Afinidade com a vaga", "Painel de Candidaturas", "Diagnóstico de Carreira" e "Inteligência de Match".
* **Alternativa Rejeitada**: Manter jargões em inglês para "parecer mais sofisticado".
* **Trade-off & Rationale**: Produtos de carreira precisam acolher e transmitir clareza imediata para candidatos em momentos de transição ou busca de emprego.
