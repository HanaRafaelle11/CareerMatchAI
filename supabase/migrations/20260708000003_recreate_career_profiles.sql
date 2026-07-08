-- 20260708000003_recreate_career_profiles.sql
drop table if exists public.career_profiles cascade;

create table public.career_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  resume_version_id uuid references public.resume_versions(id) on delete cascade not null,
  personal jsonb,
  experience jsonb,
  education jsonb,
  skills jsonb,
  soft_skills jsonb,
  languages jsonb,
  certifications jsonb,
  ats_keywords jsonb,
  summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.career_profiles enable row level security;

-- Política de RLS para gerenciamento próprio
create policy "Usuários podem gerenciar seus próprios perfis de carreira" on public.career_profiles
  for all using (auth.uid() = user_id);
