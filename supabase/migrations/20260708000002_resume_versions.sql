-- 20260708000002_resume_versions.sql
create table if not exists public.resume_versions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_url text not null,
  file_name text not null,
  professional_goal text,
  status text not null check (status in ('uploaded', 'processing', 'completed', 'failed')) default 'uploaded',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table public.resume_versions enable row level security;

-- Política de RLS para controle de acesso do usuário dono
drop policy if exists "Usuários podem gerenciar suas próprias versões de currículo" on public.resume_versions;
create policy "Usuários podem gerenciar suas próprias versões de currículo" on public.resume_versions
  for all using (auth.uid() = user_id);
