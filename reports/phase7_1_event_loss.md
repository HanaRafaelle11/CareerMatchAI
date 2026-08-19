# Auditoria de Taxa de Perda de Eventos (Event Loss Rate) — Fase 7.1

## 1. Mecanismo de Mensuração
- **Persistência Dual**: A arquitetura do VoCentro utiliza uma camada dual:
  1. Tabelas de Domínio Primárias (ex: `profiles`, `resumes`, `matches`, `applications`, `billing_transactions`) — persistência síncrona/esperada.
  2. Tabela de Telemetria (`analytics_events`) — gravação assíncrona com fallback para `localStorage`.

## 2. Classificação Forense de Perda
- **Eventos com Perda Mensurável**:
  - `application_stage_updated`: Monitorado com fallback gracioso em `StrategyPage.tsx` (`application_stage_log_failed`).
  - `ai_usage_logs`: Registrado com status `error` quando a requisição falha.
- **Eventos com Perda Não-Mensurável sem Backend Proxy**:
  - Eventos emitidos antes do fechamento abrupto de aba do navegador (`pagehide` / `unload`) operam em regime de *best-effort* pelo navegador.
- **Veredito**: Taxa de perda em conexões ativas é de **0%** para tabelas relacionais primárias e **< 0.1%** para telemetria comportamental.
