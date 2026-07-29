# ADR-004 — Estrutura do Pipeline Kanban com 8 Status Estritamente Mapeados

## Status
Accepted

## Contexto
O acompanhamento de candidaturas é o coração operacional do candidato no Vocentro. Havia o risco de proliferação de estágios não padronizados que comprometeriam a agregação de dados e métricas do produto.

## Decisão
Fixar o Pipeline Kanban em 8 status universais no enum do banco:
`found`, `saved`, `applied`, `hr`, `interview`, `offer`, `hired`, `rejected` (mais o estado de soft-delete `deleted`).

## Motivo
- Padronização matemática das taxas de conversão de candidaturas para entrevistas RH/Gestor.
- Experiência de uso consistente e intuitiva em Kanban responsivo via HTML5 DnD nativo.

## Consequências
### Positivas
- Mapeamento uniforme das probabilidades de avanço em tempo real pelo Copiloto IA.
- Prevenção de divergências de nomenclatura entre o app e o Command Center.
### Negativas / Trade-offs
- Estágios customizados de empresas específicas devem ser mapeados dentro dessas 8 categorias base.

## Alternativas Descartadas
- **Colunas livres criadas pelo usuário sem enum**: Descartado por impossibilitar métricas globais e algoritmos de recomendação.
