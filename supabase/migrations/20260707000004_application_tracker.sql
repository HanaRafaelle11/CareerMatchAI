-- 20260707000004_application_tracker.sql
-- Modifica tabela de applications para suportar status mais detalhados e feedbacks de rejeição

alter table if exists public.applications 
  drop constraint if exists applications_status_check,
  add column if not exists rejection_reason text check (rejection_reason in (
    'Experiência insuficiente', 'Senioridade incompatível', 'Pretensão salarial', 
    'Falta de conhecimento técnico', 'Idioma', 'Cultura', 'Empresa pausou vaga', 
    'Sem retorno', 'Outro'
  )),
  add column if not exists source_platform text,
  add constraint applications_status_check check (status in (
    '🔎 Encontrada', '⭐ Tenho interesse', '📝 Vou me candidatar', '📨 Me candidatei', 
    '⏳ Aguardando retorno', '👥 Entrevista com recrutador', '🎯 Entrevista com gestor', 
    '🧩 Case técnico', '🤝 Fit cultural', '🏆 Oferta recebida', '✅ Aceita', 
    '❌ Rejeitada', '🚫 Fora do meu objetivo', '👻 Sem resposta'
  ));

-- Tabela de timeline do processo seletivo
create table if not exists public.application_stages (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.applications(id) on delete cascade not null,
  stage_name text not null, -- Ex: '📨 Me candidatei', '👥 Entrevista com recrutador', etc
  status text check (status in ('pending', 'passed', 'failed')) not null default 'pending',
  notes text,
  stage_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.application_stages enable row level security;

-- Política de segurança RLS para os estágios
create policy "Usuários podem gerenciar seus próprios estágios de candidatura" on public.application_stages
  for all using (
    exists (
      select 1 from public.applications 
      where public.applications.id = public.application_stages.application_id 
      and public.applications.user_id = auth.uid()
    )
  );
