# ADR-002 — Escolha do Supabase para Banco, Auth e Edge Functions

## Status
Accepted

## Contexto
Necessidade de uma infraestrutura backend robusta, segura e serverless capaz de tratar autenticação (OAuth Google e Email), armazenamento de arquivos PDF de currículos, banco de dados PostgreSQL relacional com RLS e Edge Functions para tarefas pesadas.

## Decisão
Adotar a suíte Supabase integrada (Auth + Postgres + Storage + Edge Functions Deno) como backend oficial do Vocentro.

## Motivo
- Suporte nativo a Row Level Security (RLS) para proteção estrita dos dados dos candidatos.
- Edge Functions Deno para parsing visual de currículos em PDF sem sobrecarregar o bundle da aplicação web.
- Integração simplificada de autenticação e suporte a WebSockets/Realtime.

## Consequências
### Positivas
- Redução drástica da complexidade de infraestrutura e custos iniciais de servidores operacionais.
- Segurança garantida no nível do banco via RLS.
### Negativas / Trade-offs
- Dependência do ambiente Supabase e necessidade de fallbacks locais para execuções sem conexão.

## Alternativas Descartadas
- **Firebase / Firestore**: Descartado devido ao modelo NoSQL não relacional, inviabilizando consultas agregadas e relacionamentos do Command Center.
- **Backend Node.js dedicado em VM**: Descartado devido ao custo alto de manutenção e deploys de infraestrutura.
