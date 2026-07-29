# ADR-007 — Estratégia de Telemetria e Analytics no Supabase

## Status
Accepted

## Contexto
O Vocentro necessitava de observabilidade real de produto (Event Stream, alertas de risco de churn, uso de ferramentas de IA) sem depender exclusivamente de ferramentas de terceiros sujeitas a ad-blockers.

## Decisão
Criar a estrutura interna de rastreamento em `analytics_events` e `ai_usage_logs` no Supabase, registrando eventos de uso de forma assíncrona e não-bloqueante.

## Motivo
- Total visibilidade da jornada do candidato dentro do Command Center.
- Permite calcular o custo exato de IA por candidato e identificar quem precisa de suporte pró-ativo.

## Consequências
### Positivas
- Dados de telemetria integrados nativamente com os perfis de usuários no banco.
- Isenção contra bloqueadores de anúncios de navegadores.
### Negativas / Trade-offs
- Necessidade de rotinas de limpeza e filtros para desconsiderar eventos de ruidosos de testes (contas @example.com).

## Alternativas Descartadas
- **Depender apenas de Google Analytics / Mixpanel**: Descartado devido a ad-blockers e falta de integração direta com os perfis do banco PostgreSQL.
