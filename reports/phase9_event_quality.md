# Qualidade e Classificação de Eventos de Telemetria — Fase 9

## 1. Classificação Operacional dos Eventos

| Evento | Instrumentação | Persistência | Consumo em Métrica | Classificação de Qualidade |
| :--- | :--- | :--- | :--- | :--- |
| `signup_completed` | ✅ Ativa | ✅ Supabase | ✅ DAU/MAU/Funil | **HEALTHY** |
| `login_completed` | ✅ Ativa | ✅ Supabase | ✅ DAU/WAU/MAU | **HEALTHY** |
| `resume_uploaded` | ✅ Ativa | ✅ Supabase | ✅ Funil (Etapa 2) | **HEALTHY** |
| `match_calculated` | ✅ Ativa | ✅ Supabase | ✅ Volume de Match | **HEALTHY** |
| `job_match_viewed` | ✅ Ativa | ✅ Supabase | ✅ Funil (Etapa 3) | **HEALTHY** |
| `job_saved` | ✅ Ativa | ✅ Supabase | ✅ Funil (Etapa 4) | **HEALTHY** |
| `job_applied` | ✅ Ativa | ✅ Supabase | ✅ Pipeline Kanban | **HEALTHY** |
| `payment_confirmed` | ✅ Ativa | ✅ Supabase | ✅ Receita Líquida | **HEALTHY** |
| `survey_completed` | ✅ Ativa | ✅ Supabase | ✅ NPS & Pesquisa | **HEALTHY** |
| `mobile_nav_item_clicked` | ✅ Ativa | ✅ Supabase | ⚠️ Telemetria exploratória | **LOW_VOLUME** (uso mobile pontual) |
| `visitor_page_view` | ❌ Ausente | ❌ Ausente | ❌ Não instrumentado | **UNMEASURED** (requer RUM) |

## 2. Veredito
Eventos críticos de jornada e monetização operam com status **HEALTHY** sem anomalias de schema ou perdas de entrega.
