-- 20260707000005_coach_module.sql
-- Adiciona tabelas de suporte para o AI Career Coach e Automações de Busca

-- 1. Otimizações de Currículos (resume_optimizations)
create table if not exists public.resume_optimizations (
  id uuid default gen_random_uuid() primary key,
  resume_id uuid references public.resumes(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade,
  optimized_summary text not null,
  key_experiences jsonb not null, -- Array de { role, company, description }
  missing_keywords text[] not null,
  redundant_info text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Cartas de Apresentação (cover_letters)
create table if not exists public.cover_letters (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.applications(id) on delete cascade not null,
  text_formal text not null,
  text_direct text not null,
  text_executive text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Preparação para Entrevistas (interview_preparations)
create table if not exists public.interview_preparations (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  questions jsonb not null, -- Array de { question, answer_star: { context, action, result }, type }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Simulação de Entrevistas (interview_simulations)
create table if not exists public.interview_simulations (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.applications(id) on delete cascade not null,
  chat_history jsonb not null, -- Array de { role: 'interviewer' | 'candidate', text }
  evaluations jsonb, -- Métrica final: { clarity, objectivity, adherence, strengths, improvements }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Logs Pós-Entrevista (post_interview_logs)
create table if not exists public.post_interview_logs (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.applications(id) on delete cascade not null,
  confidence_score integer check (confidence_score between 1 and 10) not null,
  difficult_questions text[] not null,
  improvements text not null,
  company_perception text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Notificações / Alertas Inteligentes (notifications)
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  message text not null,
  is_read boolean default false not null,
  type text check (type in ('job_alert', 'inactivity', 'desired_company')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.resume_optimizations enable row level security;
alter table public.cover_letters enable row level security;
alter table public.interview_preparations enable row level security;
alter table public.interview_simulations enable row level security;
alter table public.post_interview_logs enable row level security;
alter table public.notifications enable row level security;

-- Criar políticas de segurança RLS básicas
create policy "Usuários podem gerenciar suas próprias otimizações de currículo" on public.resume_optimizations
  for all using (
    exists (
      select 1 from public.resumes 
      where public.resumes.id = public.resume_optimizations.resume_id 
      and public.resumes.user_id = auth.uid()
    )
  );

create policy "Usuários podem gerenciar suas próprias cartas de apresentação" on public.cover_letters
  for all using (
    exists (
      select 1 from public.applications 
      where public.applications.id = public.cover_letters.application_id 
      and public.applications.user_id = auth.uid()
    )
  );

create policy "Usuários podem visualizar preparações de entrevista" on public.interview_preparations
  for all using (true); -- Tabelas associadas a vagas públicas

create policy "Usuários podem gerenciar suas próprias simulações" on public.interview_simulations
  for all using (
    exists (
      select 1 from public.applications 
      where public.applications.id = public.interview_simulations.application_id 
      and public.applications.user_id = auth.uid()
    )
  );

create policy "Usuários podem gerenciar seus próprios logs pós-entrevista" on public.post_interview_logs
  for all using (
    exists (
      select 1 from public.applications 
      where public.applications.id = public.post_interview_logs.application_id 
      and public.applications.user_id = auth.uid()
    )
  );

create policy "Usuários podem gerenciar suas próprias notificações" on public.notifications
  for all using (user_id = auth.uid());
