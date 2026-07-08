-- 20260708000007_ai_usage_logs_insert_policy.sql
create policy "Usuários podem inserir seus próprios logs de IA" on public.ai_usage_logs
  for insert with check (auth.uid() = user_id or user_id is null);
