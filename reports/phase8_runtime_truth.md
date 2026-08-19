# Prova de Verdade de Runtime & Execução de Eventos — Fase 8

## 1. Critérios de Prova de Runtime
Para que um evento seja considerado **comprovado em runtime**, não basta a existência estática de sua declaração TypeScript. É obrigatório que:
1. O gatilho na UI ou backend seja alcançável por ação real do usuário.
2. O payload seja validado pelo `AnalyticsEventValidator` sem erros de schema ou PII.
3. A requisição de escrita no banco de dados seja executada.
4. O resultado seja consumido por serviços de agregação e exibido com fidelidade no dashboard.

## 2. Matriz de Auditoria dos 28 Eventos Canônicos

| Evento | Onde Dispara | Ação Real do Usuário | Risco de Duplo Disparo | Persistência Comprovada | Consumo em Métrica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `signup_completed` | `useAuth.ts` | Conclusão do fluxo OAuth / Magic link | Baixo (deduplicado por `profiles.id`) | `profiles`, `analytics_events` | DAU, MAU, Funil (Etapa 1), TTFV |
| `login_completed` | `useAuth.ts` | Inicialização de sessão com sucesso | Baixo (deduplicado por `session_id`) | `analytics_events`, `sessions` | DAU, WAU, MAU, Retenção |
| `resume_uploaded` | `useCareerMatch.ts` | Upload de PDF na tela de currículo | Baixo (deduplicado por `resume.id`) | `resumes`, `analytics_events` | Funil (Etapa 2), Upload Rate |
| `resume_parsed` | `useCareerMatch.ts` | Extração de dados pelo backend | Baixo | `resumes`, `analytics_events` | Parsing Health |
| `resume_optimized` | `useCoach.ts` | Geração de versão ATS por IA | Baixo (deduplicado por job/version) | `resume_optimizations` | Feature Adoption |
| `match_calculated` | `matchingEngine.ts` | Execução do CareerMatchEngineV3 | Baixo (chave `user_id + job_id`) | `matches`, `analytics_events` | Volume de Matches, TTFV |
| `job_match_viewed` | `HumanizedMatchCard.tsx` | Visualização do card no feed | Médio (debounce por sessão) | `analytics_events` | Funil (Etapa 3), CTR |
| `match_explanation_opened` | `HumanizedMatchCard.tsx` | Expansão de critérios de match | Médio (debounce por clique) | `analytics_events` | Explainability Rate |
| `match_apply_clicked` | `HumanizedMatchCard.tsx` | Clique no link de inscrição | Médio (debounce por clique) | `analytics_events` | Apply CTR |
| `job_saved` | `useApplications.ts` | Salvamento no Kanban | Baixo (deduplicado por `app.id`) | `applications`, `analytics_events` | Funil (Etapa 4) |
| `job_applied` | `useApplications.ts` | Transição para estágio 'applied' | Baixo (deduplicado por `app.id`) | `applications`, `analytics_events` | Application Volume |
| `application_stage_updated` | `StrategyPage.tsx` | Drag-and-drop no Kanban | Baixo | `application_stages` | Milestone Velocity |
| `interview_scheduled` | `StrategyPage.tsx` | Agendamento de entrevista | Baixo | `applications` | Time to Interview |
| `interview_started` | `useCoach.ts` | Início de simulação STAR | Baixo | `interview_preps` | STAR Simulator Adoption |
| `interview_finished` | `useCoach.ts` | Término de simulação STAR | Baixo | `interview_preps` | Simulator Completion Rate |
| `copilot_drawer_opened` | `GlobalCopilotDrawer.tsx`| Abertura do painel de assistência | Baixo (1 por sessão) | `analytics_events` | Copilot Engagement |
| `copilot_message_sent` | `GlobalCopilotDrawer.tsx`| Envio de mensagem no chat | Baixo (por message_id) | `ai_usage_logs` | AI Token Usage |
| `paywall_viewed` | `PaywallModal.tsx` | Cota gratuita atingida | Baixo (1 por abertura) | `analytics_events` | Paywall Hit Rate |
| `paywall_cta_clicked` | `PaywallModal.tsx` | Clique em Upgrade | Baixo | `analytics_events` | Paywall CTR |
| `checkout_started` | `useCheckout.ts` | Abertura de checkout | Baixo | `analytics_events` | Checkout Intent Rate |
| `payment_confirmed` | `useCheckout.ts` | Webhook assinado do gateway | Zero (idempotency key do gateway)| `billing_transactions` | Funil (Etapa 5), Net Revenue |
| `survey_started` | `PublicSurveyPage.tsx` | Abertura de pesquisa | Baixo | `survey_events` | Survey Funnel |
| `survey_completed` | `PublicSurveyPage.tsx` | Submissão de respostas | Zero (1 por response_id) | `user_surveys` | NPS & Pro Intent |
