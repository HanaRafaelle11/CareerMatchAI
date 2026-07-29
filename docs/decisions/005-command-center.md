# ADR-005 — Arquitetura do Command Center em 11 Abas Especializadas

## Status
Accepted

## Contexto
Durante o Bloco 2 de expansão do Vocentro, diversos dashboards administrativos (Alertas de Risco, Inatividade, Churn, Adoção de Features, Saúde do Negócio) estavam sendo anexados ao topo de abas legadas, violando a regra "1 Tela = 1 Pergunta do Usuário".

## Decisão
Refatorar a estrutura do `AdminDashboard.tsx` organizando o painel em 11 abas dedicadas e isoladas (Executive Overview, Produto em Risco, Insights do Copiloto, Feature Adoption, Churn Intelligence, Saúde do Negócio, Saúde do Produto, Inteligência Comercial, Executive Copilot, Usuários & RBAC, Event Stream).

## Motivo
Garante clareza cognitiva absoluta: cada aba do Command Center responde a apenas uma pergunta estratégica da liderança.

## Consequências
### Positivas
- Eliminação de contaminação cruzada de métricas entre abas.
- Reutilização limpa dos componentes dos Módulos 2.1 a 2.8.
### Negativas / Trade-offs
- Exige atenção no gerenciamento de estado de navegação por sub-abas.

## Alternativas Descartadas
- **Manter dashboards empilhados no topo de abas antigas**: Descartado devido à poluição visual e violação de experiência de uso.
