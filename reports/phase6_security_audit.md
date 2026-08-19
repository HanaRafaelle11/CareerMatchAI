# Relatório de Segurança e RLS de Telemetria — Fase 6

## 1. RLS e Acesso a Eventos
- Inserções na tabela `analytics_events` são permitidas tanto para usuários autenticados quanto anônimos (com `user_id` nulo ou temporário).
- Leituras consolidadas de telemetria e agregação no `AdminAnalyticsService` e `AdminDashboard` são restritas a usuários com role `admin` ou executadas em contextos seguros com auditoria.

## 2. Prevenção de Injeção e Vazamento de Segredos
- Zero exposição de chaves privadas (Service Role Key, JWTs, Webhook secrets) no frontend ou nos relatórios.
- As consultas analíticas utilizam o client tipado do Supabase com sanitização de parâmetros de entrada.

## 3. Logs de Auditoria de Acesso a Dados Pessoais
- Toda visualização ou download de currículos por parte de administradores é registrada na tabela `admin_access_logs`.
