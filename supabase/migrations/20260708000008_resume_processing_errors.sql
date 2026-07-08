-- 20260708000008_resume_processing_errors.sql
create table if not exists public.resume_processing_errors (
  id uuid default gen_random_uuid() primary key,
  resume_version_id uuid references public.resume_versions(id) on delete cascade not null,
  error_type text not null,
  error_message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.resume_processing_errors enable row level security;

-- Políticas de RLS
drop policy if exists "Usuários podem visualizar seus próprios erros de processamento" on public.resume_processing_errors;
create policy "Usuários podem visualizar seus próprios erros de processamento" on public.resume_processing_errors
  for select using (
    exists (
      select 1 from public.resume_versions rv
      where rv.id = resume_version_id and rv.user_id = auth.uid()
    )
  );

drop policy if exists "Usuários podem inserir erros de processamento para suas próprias versões" on public.resume_processing_errors;
create policy "Usuários podem inserir erros de processamento para suas próprias versões" on public.resume_processing_errors
  for insert with check (
    exists (
      select 1 from public.resume_versions rv
      where rv.id = resume_version_id and rv.user_id = auth.uid()
    )
  );
