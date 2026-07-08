-- 20260708000005_job_matches.sql
create table if not exists public.job_matches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  career_profile_id uuid references public.career_profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  match_score integer not null check (match_score between 0 and 100),
  strengths jsonb not null,
  weaknesses jsonb not null,
  missing_keywords jsonb not null,
  interview_probability integer not null check (interview_probability between 0 and 100),
  recommendation text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.job_matches enable row level security;

-- Política de RLS
drop policy if exists "Usuários podem gerenciar seus próprios matches de vagas" on public.job_matches;
create policy "Usuários podem gerenciar seus próprios matches de vagas" on public.job_matches
  for all using (auth.uid() = user_id);
