# ADR-006 — Estratégia de Fallbacks Determinísticos de IA

## Status
Accepted

## Contexto
Erros não-2xx de Edge Functions, indisponibilidade temporária de rede ou limitações de quota da API de IA não devem causar telas em branco ou mensagens de erro criptográficas para o candidato.

## Decisão
Implementar padrão de tratamento gracioso via `AppError` com fallbacks determinísticos no frontend:
1. Em parsing de PDF: se a Edge Function falhar, aciona parser local de texto com instrução clara de formatação.
2. Em cálculo de Match: se o serviço remoto indisponibilizar a nota, calcula pontuação heurística local baseada nas habilidades sobrepostas.

## Motivo
Manter a confiabilidade do produto e evitar perda de progresso durante o uso do candidato.

## Consequências
### Positivas
- Resiliência total do produto.
- Usuário recebe mensagens amigáveis orientando a ação necessária.
### Negativas / Trade-offs
- Notas calculadas via fallback são sinalizadas como aproximação heurística.

## Alternativas Descartadas
- **Lançar erro não capturado na interface**: Descartado por ser inaceitável em produção.
