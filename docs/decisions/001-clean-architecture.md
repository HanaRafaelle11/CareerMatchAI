# ADR-001 — Adoção de Clean Architecture Desacoplada

## Status
Accepted

## Contexto
O Vocentro cresceu rapidamente integrando múltiplos provedores externos de IA, parsers de PDF, conectores de vagas e Supabase. Era necessário garantir desacoplamento para evitar contaminação da interface gráfica com regras de negócio ou APIs de terceiros.

## Decisão
Organizar o código em 4 camadas bem definidas:
1. **`domain/`**: Entidades pura, interfaces de adaptação (`adapters`), modelos e utilitários.
2. **`application/`**: Services de negócio, pipelines, parsers e React Custom Hooks (`useCareerMatch`, `useApplications`, etc.).
3. **`infrastructure/`**: Conectores de APIs externas e cliente Supabase.
4. **`presentation/`**: Componentes de UI React, páginas e componentes visuais desacoplados.

## Motivo
Garante testabilidade isolada das regras de negócio, facilidade de substituição de APIs de IA ou bancos sem impactar componentes visuais, e manutenibilidade a longo prazo.

## Consequências
### Positivas
- Componentes visuais não chamam APIs externas diretamente; dependem de Hooks e Services.
- Permite mocks em ambiente local de forma transparente.
### Negativas / Trade-offs
- Exige disciplina para manter tipos no `domain/` sem vazamento de estado.

## Alternativas Descartadas
- **Monolito de UI**: Misturar chamadas `fetch` dentro de `useEffect` nos componentes visuais (descartado por alto acoplamento e re-renders indesejados).
