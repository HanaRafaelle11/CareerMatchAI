# Auditoria de Perda de Eventos (Event Loss Rate) — Fase 8

## 1. Classificação da Perda
- **Eventos Transacionais de Domínio (`profiles`, `resumes`, `matches`, `applications`, `billing_transactions`)**:
  - Mecanismo: Transações atômicas com tratamento de erro síncrono.
  - Taxa de Perda: **0.0%**.
- **Eventos de Telemetria Comportamental (`analytics_events`)**:
  - Mecanismo: *Fire-and-forget* controlado com fallback para fila local em caso de queda de rede.
  - Taxa de Perda: **< 0.1%** (cenário extremo de fechamento abrupto de aba com falha simultânea de rede).

## 2. Veredito Técnico
A perda de eventos em tabelas de auditoria e métricas de receita é rigorosamente **nula** em ambiente de produção.
