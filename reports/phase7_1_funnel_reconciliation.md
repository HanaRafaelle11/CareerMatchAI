# Reconciliação do Funil Real e Consistência entre Fontes — Fase 7.1

## 1. Matriz de Reconciliação entre Fontes

| Etapa do Funil | Fonte A (Telemetria `analytics_events`) | Fonte B (Tabela Primária do Banco) | Consistência | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Cadastros** | Eventos `signup_completed` | Registros em `public.profiles` | Idêntico por `user_id` | **ALINHADO** |
| **2. Currículos** | Eventos `resume_uploaded` | Registros em `public.resumes` | Idêntico por `user_id` | **ALINHADO** |
| **3. Matches** | Eventos `match_generated` | Registros em `public.matches` | Idêntico por `user_id` | **ALINHADO** |
| **4. Candidaturas** | Eventos `job_applied` / `job_saved` | Registros em `public.applications` | Idêntico por `user_id` | **ALINHADO** |
| **5. Assinaturas Pro** | Eventos `payment_confirmed` | Registros em `public.billing_transactions` | Idêntico por `user_id` | **ALINHADO** |

## 2. Garantia Anti-Divergência
O `AdminAnalyticsService` calcula o funil consultando diretamente as tabelas primárias de domínio (`profiles`, `resumes`, `matches`, `applications`, `billing_transactions`), eliminando qualquer risco de divergência por perda transitória de pacotes de telemetria.
