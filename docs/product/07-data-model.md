# 07 — Modelo de Dados & Schema (Vocentro Product KB)

## Principal Esquema Relacional no Supabase

- **`profiles`**: Dados cadastrais do candidato/usuário (`id`, `full_name`, `email`, `role`, `headline`, `phone`, `location`, `updated_at`).
- **`resumes`**: Arquivos de currículo uploaded/criados (`id`, `user_id`, `version_label`, `raw_text`, `is_primary`, `created_at`).
- **`jobs`**: Vagas importadas ou cadastradas (`id`, `user_id`, `title`, `company_name`, `description`, `requirements`, `created_at`).
- **`matches`**: Resultados de aderência calculados (`id`, `user_id`, `job_id`, `resume_id`, `score_overall`, `explanation`, `created_at`).
- **`applications`**: Candidaturas ativas no Pipeline (`id`, `user_id`, `job_id`, `status`, `notes`, `created_at`, `updated_at`).
- **`ai_usage_logs`**: Logs de telemetria e custo das chamadas de IA (`id`, `user_id`, `feature`, `tokens_used`, `cost_brl`, `created_at`).
- **`analytics_events`**: Stream de eventos da jornada (`id`, `user_id`, `event_name`, `properties`, `created_at`).
- **`beta_feedback`**: Feedbacks da versão Beta enviados pelos usuários (`id`, `user_id`, `feedback_text`, `rating`, `created_at`).

## Politicas de Segurança & Camada de Acesso
- **RLS (Row Level Security)**: Ativado em todas as tabelas, restringindo a leitura e escrita ao próprio `auth.uid()`, exceto para perfis com cargos de administração no Command Center.
