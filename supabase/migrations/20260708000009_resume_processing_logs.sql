-- 20260708000009_resume_processing_logs.sql
create table if not exists public.resume_processing_logs (
  id uuid default gen_random_uuid() primary key,
  resume_version_id uuid references public.resume_versions(id) on delete cascade not null,
  step text not null,
  status text not null check (status in ('success', 'error')),
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.resume_processing_logs enable row level security;

-- Políticas de RLS
drop policy if exists "Usuários podem visualizar seus próprios logs de processamento" on public.resume_processing_logs;
create policy "Usuários podem visualizar seus próprios logs de processamento" on public.resume_processing_logs
  for select using (
    exists (
      select 1 from public.resume_versions rv
      where rv.id = resume_version_id and rv.user_id = auth.uid()
    )
  );

drop policy if exists "Usuários podem inserir logs de processamento para suas próprias versões" on public.resume_processing_logs;
create policy "Usuários podem inserir logs de processamento para suas próprias versões" on public.resume_processing_logs
  for insert with check (
    exists (
      select 1 from public.resume_versions rv
      where rv.id = resume_version_id and rv.user_id = auth.uid()
    )
  );
