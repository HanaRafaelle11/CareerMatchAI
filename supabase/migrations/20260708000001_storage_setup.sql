-- 20260708000001_storage_setup.sql
-- 1. Alterar a tabela resumes para garantir que as colunas necessárias existam
alter table public.resumes 
  add column if not exists is_primary boolean default false,
  add column if not exists file_name text,
  add column if not exists file_url text,
  add column if not exists storage_path text;

-- 2. Configurar o bucket 'resumes' no Storage do Supabase se não existir
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 
  'resumes', 
  false, -- Privado
  10485760, -- 10MB
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
on conflict (id) do nothing;

-- 3. Habilitar políticas de acesso RLS para o bucket 'resumes' no Storage
-- Remove políticas anteriores para evitar duplicações
drop policy if exists "Usuários autenticados podem fazer upload de seus currículos" on storage.objects;
drop policy if exists "Usuários podem visualizar seus próprios currículos" on storage.objects;
drop policy if exists "Usuários podem atualizar seus próprios currículos" on storage.objects;
drop policy if exists "Usuários podem deletar seus próprios currículos" on storage.objects;

-- Criar políticas baseadas no folder do usuário (auth.uid() = resumes/user_id/file)
create policy "Usuários autenticados podem fazer upload de seus currículos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuários podem visualizar seus próprios currículos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuários podem atualizar seus próprios currículos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuários podem deletar seus próprios currículos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
