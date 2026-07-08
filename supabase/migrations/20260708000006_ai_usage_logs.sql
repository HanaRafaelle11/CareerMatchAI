-- 20260708000006_ai_usage_logs.sql
create table if not exists public.ai_usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null,
  model text not null,
  input_tokens integer not null,
  output_tokens integer not null,
  estimated_cost numeric(12, 8) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.ai_usage_logs enable row level security;

-- Política de RLS
drop policy if exists "Usuários podem visualizar seus próprios logs de IA" on public.ai_usage_logs;
create policy "Usuários podem visualizar seus próprios logs de IA" on public.ai_usage_logs
  for select using (auth.uid() = user_id);
