-- 20260707000001_job_discovery.sql
-- Adiciona tabela de preferências de vagas para suportar o módulo de Job Discovery

create table if not exists public.job_preferences (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  desired_roles text[] not null, -- Cargos pretendidos (Ex: ['React Developer', 'Engenheiro Frontend'])
  preferred_work_modes text[], -- Modelos: ['remote', 'hybrid', 'onsite']
  minimum_salary numeric,
  location_preference text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security
alter table public.job_preferences enable row level security;

-- Política de segurança RLS
create policy "Usuários podem gerenciar suas próprias preferências de vaga" on public.job_preferences
  for all using (auth.uid() = user_id);

-- Trigger para data de atualização
create trigger update_job_preferences_modtime
  before update on public.job_preferences
  for each row execute function update_modified_column();
