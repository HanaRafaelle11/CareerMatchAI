# 02 — Workflow de Desenvolvimento (Vocentro Standard v2.1)

## 1. Classificação Contextual do Trabalho (Níveis 1 a 4)
Toda tarefa é classificada automaticamente antes de ser iniciada:

- **Nível 1 — Correção Simples** (textos, cores, ícones, paddings, tooltips, labels)
  - *Fluxo*: Localizar → Implementar → `npx tsc -b` → `npm run build` → Teste visual → Commit.
- **Nível 2 — Evolução** (novos componentes, modais, dashboards, hooks, queries)
  - *Fluxo*: Análise → Critérios de aceite → Arquitetura → Testes → Build → Commit → Relatório.
- **Nível 3 — Funcionalidade Crítica** (autenticação, pagamentos, IA, onboarding, pipeline, matching, RBAC)
  - *Fluxo*: Pilares completos → Análise de riscos → Plano de rollback → Testes funcionais → Build → Relatório completo.
- **Nível 4 — Arquitetura Core** (refatorações profundas, migrações de banco, core do Design System)
  - *Fluxo*: RFC técnica → Alternativas & trade-offs → Plano de migração/rollback → Testes → Documentação.

## 2. Processo Obrigatório de Implementação
1. **Localizar**: Identificar onde a funcionalidade reside.
2. **Compreender**: Mapear fluxo atual, dependências e impactos.
3. **Planejar**: Apresentar arquivos envolvidos, motivos e riscos antes da primeira edição.
4. **Codificar em Etapas Micro**: Implementar e validar item por item.

## 3. Critérios de Aceite Inflexíveis
- **TypeScript**: `npx tsc -b` aprovado com 0 erros.
- **Build**: `npm run build` executado e limpo em produção.
- **Clean Architecture & RBAC**: Respeito às camadas e permissões.
- **Git & Push**: Commit padronizado e enviado para `origin/main`.
- **Deploy**: Confirmação da URL ativa (`https://vocentro.com.br`).
