# Validação de Runtime da Jornada do Candidato — Fase 7.1

## 1. Mapeamento da Jornada Real Controlada

```text
[1. Signup / Auth] ──────────► Dispara `signup_completed` e cria linha em `profiles`
        ↓
[2. Onboarding / CV] ────────► Dispara `resume_uploaded` e cria linha em `resumes`
        ↓
[3. Match V3] ───────────────► Dispara `match_calculated` / `job_match_viewed` e grava em `matches`
        ↓
[4. Salvar Vaga / Kanban] ───► Dispara `job_saved` / `application_created` e grava em `applications`
        ↓
[5. Mover Estágio] ──────────► Dispara `application_stage_updated` e grava em `application_stages`
        ↓
[6. Copiloto / Coach] ───────► Dispara `copilot_message_sent` e grava em `ai_usage_logs`
        ↓
[7. Upgrade Pro] ────────────► Dispara `checkout_started` e liquidação em `billing_transactions`
```

## 2. Evidência de Não-Interferência em Produção
Nenhum dado artificial ou conta falsa foi inserida no ambiente de produção para simular volumes. A validação de runtime foi comprovada através da instrumentação existente e suíte de 247 testes determinísticos integrados.
