-- 20260708000004_career_insights.sql
create table if not exists public.career_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  resume_version_id uuid references public.resume_versions(id) on delete cascade not null,
  seniority_prediction jsonb not null,
  industry_prediction jsonb not null,
  methodologies jsonb not null,
  recommended_keywords jsonb not null,
  missing_skills jsonb not null,
  confidence_scores jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.career_insights enable row level security;

-- Política de RLS
drop policy if exists "Usuários podem gerenciar seus próprios insights de carreira" on public.career_insights;
create policy "Usuários podem gerenciar seus próprios insights de carreira" on public.career_insights
  for all using (auth.uid() = user_id);
