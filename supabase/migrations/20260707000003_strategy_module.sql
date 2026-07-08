-- 20260707000003_strategy_module.sql
-- Drop da tabela simplificada anterior para recriação com novo schema avançado
drop table if exists public.career_profiles cascade;

-- Tabela avançada de Perfil de Carreira Auto-inferred / Manual
create table public.career_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete cascade not null unique,
  
  -- Meta Profissional
  target_roles text[] not null,
  seniority text not null,
  industries text[] not null,
  
  -- Competências
  skills text[] not null,
  tools text[] not null,
  languages text[] not null,
  
  -- Preferências
  preferred_work_modes text[] not null,
  preferred_locations text[] not null,
  target_companies text[] not null,
  
  -- Salário e Palavras-chave
  salary_expectation_min numeric not null default 0,
  search_keywords text[] not null,
  is_approved_by_user boolean default false not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Histórico de Candidaturas do Usuário
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  
  company_name text not null,
  job_title text not null,
  status text check (status in ('Encontrada', 'Interessante', 'Aplicada', 'Entrevista RH', 'Entrevista Gestor', 'Oferta', 'Recusada')) not null default 'Encontrada',
  resume_used_id uuid references public.resumes(id) on delete set null,
  notes text,
  applied_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security
alter table public.career_profiles enable row level security;
alter table public.applications enable row level security;

-- Criar políticas de segurança RLS
create policy "Usuários podem gerenciar seus próprios perfis de carreira" on public.career_profiles
  for all using (auth.uid() = user_id);

create policy "Usuários podem gerenciar suas próprias candidaturas" on public.applications
  for all using (auth.uid() = user_id);

-- Triggers de Modtime
create trigger update_career_profiles_modtime_v2
  before update on public.career_profiles
  for each row execute function update_modified_column();

create trigger update_applications_modtime
  before update on public.applications
  for each row execute function update_modified_column();
