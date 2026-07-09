-- 20260709000005_hardened_status_constraints.sql

-- 1. Atualizar constraint de status da tabela resume_processing_logs
alter table public.resume_processing_logs drop constraint if exists resume_processing_logs_status_check;
alter table public.resume_processing_logs add constraint resume_processing_logs_status_check check (status in ('running', 'completed', 'failed', 'success', 'error'));

-- 2. Auditar políticas RLS para resume_processing_logs
alter table public.resume_processing_logs enable row level security;

drop policy if exists "Usuários podem visualizar seus próprios logs de processamento" on public.resume_processing_logs;
create policy "Usuários podem visualizar seus próprios logs de processamento" on public.resume_processing_logs
  for select using (
    exists (
      select 1 from public.resume_versions rv
      where rv.id = resume_version_id and rv.user_id = auth.uid()
    )
    or ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  );

drop policy if exists "Usuários podem inserir logs de processamento para suas próprias versões" on public.resume_processing_logs;
create policy "Usuários podem inserir logs de processamento para suas próprias versões" on public.resume_processing_logs
  for insert with check (
    exists (
      select 1 from public.resume_versions rv
      where rv.id = resume_version_id and rv.user_id = auth.uid()
    )
  );

-- 3. Auditar políticas RLS para career_match_logs
alter table public.career_match_logs enable row level security;

drop policy if exists "Users can select their own career match logs or admin all" on public.career_match_logs;
create policy "Users can select their own career match logs or admin all" on public.career_match_logs
  for select using (auth.uid() = user_id or ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true));

drop policy if exists "Users can insert their own career match logs" on public.career_match_logs;
create policy "Users can insert their own career match logs" on public.career_match_logs
  for insert with check (auth.uid() = user_id);

-- 4. Auditar políticas RLS para application_events
alter table public.application_events enable row level security;

drop policy if exists "Users can select their own application events or admin all" on public.application_events;
create policy "Users can select their own application events or admin all" on public.application_events
  for select using (auth.uid() = user_id or ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true));

drop policy if exists "Users can insert their own application events" on public.application_events;
create policy "Users can insert their own application events" on public.application_events
  for insert with check (auth.uid() = user_id or user_id is null);

-- 5. Auditar políticas RLS para application_errors
alter table public.application_errors enable row level security;

drop policy if exists "Usuários podem visualizar seus próprios logs de erro" on public.application_errors;
create policy "Usuários podem visualizar seus próprios logs de erro" on public.application_errors
  for select using (auth.uid() = user_id or ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true));

drop policy if exists "Usuários podem inserir seus próprios logs de erro" on public.application_errors;
create policy "Usuários podem inserir seus próprios logs de erro" on public.application_errors
  for insert with check (auth.uid() = user_id or user_id is null);
