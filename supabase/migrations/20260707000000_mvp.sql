-- 20260707000000_mvp.sql
-- Habilitar a extensão pgvector para buscas semânticas vetoriais baseadas em IA
create extension if not exists vector;

-- 1. Perfis de Usuários (estendendo a tabela auth.users do Supabase)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  headline text,
  skills_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger para atualizar a data de modificação automaticamente
create or replace function update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_modtime
  before update on public.profiles
  for each row execute function update_modified_column();

-- 2. Currículos (Carregados via Storage e parseados via OpenAI)
create table public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_path text not null,
  raw_text text,
  structured_data jsonb,
  embedding vector(1536), -- Vector embedding para o resumo profissional e competências (1536 dimensões - OpenAI default)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create trigger update_resumes_modtime
  before update on public.resumes
  for each row execute function update_modified_column();

-- 3. Vagas Coladas Manualmente pelo Usuário
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  requirements text[],
  embedding vector(1536), -- Vector embedding para a vaga
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create trigger update_jobs_modtime
  before update on public.jobs
  for each row execute function update_modified_column();

-- 4. Análise de Compatibilidade (Match + Gap Analysis)
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  resume_id uuid references public.resumes(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  score_overall integer check (score_overall between 0 and 100) not null,
  score_technical integer check (score_technical between 0 and 100) not null,
  score_behavioral integer check (score_behavioral between 0 and 100) not null,
  score_seniority integer check (score_seniority between 0 and 100) not null,
  explanation jsonb not null, -- { strengths: [], weaknesses: [], details: {} }
  gap_analysis jsonb not null, -- { missingSkills: [], toInclude: [], toExclude: [] }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.jobs enable row level security;
alter table public.matches enable row level security;

-- Políticas para Profiles
create policy "Usuários podem ver seu próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil" on public.profiles
  for update using (auth.uid() = id);

create policy "Usuários podem inserir seu próprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

-- Políticas para Resumes
create policy "Usuários podem gerenciar seus próprios currículos" on public.resumes
  for all using (auth.uid() = user_id);

-- Políticas para Jobs
create policy "Usuários podem gerenciar suas próprias vagas inseridas" on public.jobs
  for all using (auth.uid() = user_id);

-- Políticas para Matches (Garantindo que o usuário seja dono do currículo relacionado)
create policy "Usuários podem acessar seus próprios matches de currículo" on public.matches
  for all using (
    exists (
      select 1 from public.resumes
      where resumes.id = matches.resume_id
      and resumes.user_id = auth.uid()
    )
  );

-- ==========================================
-- PERFORMANCE INDEXES (B-Tree & pgvector HNSW)
-- ==========================================

-- Índices B-Tree normais para pesquisas de chaves estrangeiras rápidas
create index idx_resumes_user on public.resumes(user_id);
create index idx_jobs_user on public.jobs(user_id);
create index idx_matches_resume on public.matches(resume_id);
create index idx_matches_job on public.matches(job_id);

-- Índices HNSW (Hierarchical Navigable Small World) para pesquisas de similaridade de cosseno de vetor rápidas
-- Obs: HNSW é mais rápido e preciso para grandes conjuntos de dados do que IVFFlat
create index idx_resumes_embedding_hnsw on public.resumes using hnsw (embedding vector_cosine_ops);
create index idx_jobs_embedding_hnsw on public.jobs using hnsw (embedding vector_cosine_ops);
