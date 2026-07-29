# ADR-003 — Provedor de IA Híbrido com Fallbacks Locais

## Status
Accepted

## Contexto
O Vocentro depende fortemente de LLMs para extração de dados, geração de resumos, cálculo de aderência e simulações STAR de entrevista. Era necessário garantir que instabilidades no provedor não derrubassem a aplicação.

## Decisão
Utilizar provedor de IA com camada de abstração em `domain/adapters` e mecanismos determinísticos de fallback.

## Motivo
- Garante resiliência: se a API do provedor retornar timeout ou exceção, o sistema aciona métodos heurísticos locais em `localStorage` ou parsers locais.
- Permite alternar modelos sem alterar as telas da aplicação.

## Consequências
### Positivas
- Zero telas travadas por falha de IA externa.
- Transparência para o candidato sobre quando um dado é estimado por heurística.
### Negativas / Trade-offs
- Necessidade de manter algoritmos locais de fallback atualizados.

## Alternativas Descartadas
- **Chamada direta a um único provedor rígido de IA**: Descartado por criar ponto único de falha (*Single Point of Failure*).
