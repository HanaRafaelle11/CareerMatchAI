-- 20260709000004_production_hardening.sql

-- 1. Atualizar a tabela resume_processing_logs
alter table public.resume_processing_logs add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.resume_processing_logs add column if not exists completed_at timestamp with time zone;
alter table public.resume_processing_logs add column if not exists message text;

-- Habilitar RLS e atualizar políticas
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

-- 2. Criar a tabela career_match_logs
create table if not exists public.career_match_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade,
  step text not null,
  duration_ms integer not null,
  status text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.career_match_logs enable row level security;

drop policy if exists "Users can select their own career match logs or admin all" on public.career_match_logs;
create policy "Users can select their own career match logs or admin all" on public.career_match_logs
  for select using (auth.uid() = user_id or ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true));

drop policy if exists "Users can insert their own career match logs" on public.career_match_logs;
create policy "Users can insert their own career match logs" on public.career_match_logs
  for insert with check (auth.uid() = user_id);

-- 3. Criar a tabela application_events
create table if not exists public.application_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  event_name text not null,
  service text not null,
  status text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.application_events enable row level security;

drop policy if exists "Users can select their own application events or admin all" on public.application_events;
create policy "Users can select their own application events or admin all" on public.application_events
  for select using (auth.uid() = user_id or ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true));

drop policy if exists "Users can insert their own application events" on public.application_events;
create policy "Users can insert their own application events" on public.application_events
  for insert with check (auth.uid() = user_id or user_id is null);

-- 4. Criar a tabela ai_analysis_cache
create table if not exists public.ai_analysis_cache (
  id uuid default gen_random_uuid() primary key,
  resume_hash text not null,
  job_hash text not null,
  response jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

create unique index if not exists idx_analysis_cache_hashes on public.ai_analysis_cache(resume_hash, job_hash);

alter table public.ai_analysis_cache enable row level security;

drop policy if exists "Allow all on ai_analysis_cache" on public.ai_analysis_cache;
create policy "Allow all on ai_analysis_cache" on public.ai_analysis_cache
  for all using (true);
