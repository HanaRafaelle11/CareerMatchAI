-- 20260707000002_career_profile.sql
-- Adiciona tabela de perfis de carreira auto-inferidos pela IA

create table if not exists public.career_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete cascade not null unique,
  target_roles text[] not null, -- Cargos Alvo (Ex: ['Frontend Engineer', 'React Developer'])
  seniority text not null, -- Ex: 'junior', 'pleno', 'senior'
  industries text[], -- Setores/Indústrias
  skills text[] not null, -- Competências chave extraídas
  preferred_locations text[] not null, -- Locais desejados (Ex: ['Remoto', 'Florianópolis'])
  preferred_work_modes text[] not null, -- ['remote', 'hybrid', 'onsite']
  search_keywords text[] not null, -- Palavras-chave otimizadas para busca automática
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security
alter table public.career_profiles enable row level security;

-- Política de RLS
create policy "Usuários podem gerenciar seus próprios perfis de carreira" on public.career_profiles
  for all using (auth.uid() = user_id);

-- Trigger para data de atualização
create trigger update_career_profiles_modtime
  before update on public.career_profiles
  for each row execute function update_modified_column();
