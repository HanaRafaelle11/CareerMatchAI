-- 20260708000000_roadmap_upgrades.sql
-- 1. Snapshot da vaga: adicionar colunas detalhadas na tabela public.jobs
alter table public.jobs 
  add column if not exists company_name text,
  add column if not exists salary text,
  add column if not exists benefits text[],
  add column if not exists location text,
  add column if not exists work_mode text,
  add column if not exists source_url text,
  add column if not exists stages_count integer default 3,
  add column if not exists case_hours integer default 0,
  add column if not exists salary_numeric numeric;

-- 2. Versão do currículo: adicionar na tabela public.resumes
alter table public.resumes 
  add column if not exists version_number integer default 1,
  add column if not exists version_label text default 'Versão Inicial';

-- 3. AI Journal: adicionar novos campos na tabela de logs pós-entrevista
alter table public.post_interview_logs 
  add column if not exists feeling text, -- '😄' | '😐' | '😔'
  add column if not exists what_learned text,
  add column if not exists do_different text;

-- 4. Company Intelligence: Tabela de perfil de empresas
create table if not exists public.company_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_name text not null,
  industry text,
  size text,
  glassdoor_rating numeric,
  interview_process text,
  benefits text[],
  remote_policy text,
  salary_range text,
  user_notes text,
  would_apply_again boolean,
  culture_score integer check (culture_score between 1 and 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, company_name)
);

alter table public.company_profiles enable row level security;
create policy "Usuários podem gerenciar seus próprios perfis de empresa"
  on public.company_profiles for all using (auth.uid() = user_id);

create trigger update_company_profiles_modtime
  before update on public.company_profiles
  for each row execute function update_modified_column();

-- 5. Planner Semanal
create table if not exists public.weekly_planners (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_number integer not null, -- Formato YYYYWW (Ex: 202628)
  planner_data jsonb not null, -- { monday: { tasks: [...] }, tuesday: ... }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, week_number)
);

alter table public.weekly_planners enable row level security;
create policy "Usuários podem gerenciar seu planejamento semanal"
  on public.weekly_planners for all using (auth.uid() = user_id);

create trigger update_weekly_planners_modtime
  before update on public.weekly_planners
  for each row execute function update_modified_column();

-- 6. Metas Semanais
create table if not exists public.weekly_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_number integer not null, -- Formato YYYYWW
  target_applications integer not null default 10,
  target_interviews_rh integer not null default 3,
  target_interviews_manager integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, week_number)
);

alter table public.weekly_goals enable row level security;
create policy "Usuários podem gerenciar suas metas semanais"
  on public.weekly_goals for all using (auth.uid() = user_id);

create trigger update_weekly_goals_modtime
  before update on public.weekly_goals
  for each row execute function update_modified_column();

-- 7. Goal Tracker (Objetivos de Carreira de Longo Prazo)
create table if not exists public.career_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null, -- Ex: "Conseguir emprego até outubro"
  target_date date not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.career_goals enable row level security;
create policy "Usuários podem gerenciar seus objetivos de carreira"
  on public.career_goals for all using (auth.uid() = user_id);

create trigger update_career_goals_modtime
  before update on public.career_goals
  for each row execute function update_modified_column();
