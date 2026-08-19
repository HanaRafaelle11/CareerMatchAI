# Auditoria Forense de Privacidade e Proteção de PII — Fase 6.1

## 1. Classificação de Campos de Telemetria

| Categoria | Definição | Campos Auditados | Regra de Tratamento |
| :--- | :--- | :--- | :--- |
| **SAFE** | Metadados anônimos, contadores, scores, IDs de vaga e enums | `job_id`, `career_fit_score`, `career_goal_score`, `feature`, `tokens`, `stage` | Permitido sem restrição |
| **SENSITIVE** | E-mails de candidatos, IPs e identificadores de sessão | `email`, `ip_address`, `session_id` | Mascaramento compulsório (`can***`) |
| **PII** | Nomes completos, telefones, links de portfólio | `full_name`, `phone`, `linkedin_url` | Proibido em payloads de eventos analíticos |
| **FORBIDDEN** | Senhas, CPFs, números de cartão, tokens JWT, Service Role Keys | `password`, `cpf`, `credit_card`, `token`, `secret`, `api_key` | **Bloqueio e Rejeição Imediata** via `AnalyticsEventValidator` |

## 2. Validador Ativo (`AnalyticsEventValidator`)
O `AnalyticsEventValidator` bloqueia o disparo de qualquer evento cujo payload contenha chaves ou valores proibidos, emitindo aviso em console e impedindo o tráfego de dados confidenciais para a tabela `analytics_events`.
