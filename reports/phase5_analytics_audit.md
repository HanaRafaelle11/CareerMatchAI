# 📊 AUDITORIA DE TELEMETRIA E ANALYTICS — FASE 5 (VOCENTRO)

**Produto**: VoCentro  
**Data**: Agosto de 2026  
**Status**: `🟢 CONFORME (ZERO VAZAMENTO DE PII)`  

---

## 1. 📋 MAPEAMENTO DE EVENTOS ESSENCIAIS

| Evento | Categoria | Payload | Proteção de PII |
|---|---|---|---|
| `signup_completed` | `Auth` | `{ method, timestamp }` | ✅ Sem e-mail ou senha |
| `resume_uploaded` | `Resume` | `{ file_type, size_kb }` | ✅ Sem texto do CV |
| `career_goal_defined` | `CareerGoal` | `{ intent_type, seniority }` | ✅ Anônimo |
| `match_viewed` | `JobMatch` | `{ job_id, score }` | ✅ Apenas IDs e Score |
| `application_stage_changed` | `Strategy` | `{ job_id, from_stage, to_stage }` | ✅ Apenas Metadados |
| `simulation_completed` | `Coach` | `{ job_id, duration_sec, score }` | ✅ Sem transcrição de áudio |
| `paywall_viewed` | `Billing` | `{ trigger_source, current_plan }` | ✅ Métricas puras |
| `checkout_started` | `Billing` | `{ provider, plan_tier }` | ✅ Sem dados de cartão |

---

## 2. 🛡️ GARANTIAS DE PRIVACIDADE E CONTRATOS

* **Testes de Privacidade**: Testes em [`tests/unit/analyticsPrivacy.test.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/tests/unit/analyticsPrivacy.test.ts) e [`tests/unit/phase9AnalyticsContract.test.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/tests/unit/phase9AnalyticsContract.test.ts) validam que nenhuma informação pessoal identificável (PII) é transmitida em eventos de telemetria.
* **Isolamento de Contas Internas**: `AdminAnalyticsService.filterProductionUsers` assegura que eventos de desenvolvedores e testes automatizados não poluem as métricas de conversão e retenção.
