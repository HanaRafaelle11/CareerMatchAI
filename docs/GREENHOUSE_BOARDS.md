# Configuração Dinâmica de Boards do Greenhouse — VoCentro

Este documento descreve como gerenciar dinamicamente a lista de empresas (boards) monitoradas pelo conector `GreenhouseConnector` no VoCentro.

---

## Estrutura de Resolução de Boards

O conector do Greenhouse segue uma hierarquia de 3 níveis para obter a lista de empresas:

1. **Tabela Supabase (`greenhouse_boards`)** (Maior Prioridade):
   Se a tabela existir no banco de dados, o sistema lê todos os registros onde `is_active = true`.

2. **Variável de Ambiente (`GREENHOUSE_COMPANIES`)**:
   Caso a tabela do banco não esteja populada, o sistema lê a variável de ambiente contendo os slugs separados por vírgula.

3. **Lista Padrão em Código (Fallback)**:
   Empresas brasileiras e globais padrão (`nubank`, `ifood`, `quintoandar`, `stone`, `olist`, `hotmart`, `picpay`, `mercadolivre`, `neon`, `loggi`, `creditas`, `gympass`, `cloudflare`, `figma`, `github`, `hashicorp`, `stripe`, `vtex`).

---

## Opção 1: Adicionar/Remover via Banco de Dados (Recomendado)

### 1. Criar a Tabela no Supabase (caso ainda não exista)

Execute a seguinte Migration SQL no Painel do Supabase ou via CLI:

```sql
CREATE TABLE IF NOT EXISTS public.greenhouse_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir empresas padrão
INSERT INTO public.greenhouse_boards (slug, company_name) VALUES
  ('nubank', 'Nubank'),
  ('ifood', 'iFood'),
  ('quintoandar', 'QuintoAndar'),
  ('stone', 'Stone'),
  ('olist', 'Olist'),
  ('hotmart', 'Hotmart'),
  ('picpay', 'PicPay'),
  ('mercadolivre', 'Mercado Livre'),
  ('neon', 'Neon'),
  ('loggi', 'Loggi'),
  ('creditas', 'Creditas'),
  ('gympass', 'Gympass')
ON CONFLICT (slug) DO NOTHING;
```

### 2. Adicionar uma Nova Empresa
Para incluir uma nova empresa, basta executar no Supabase:

```sql
INSERT INTO public.greenhouse_boards (slug, company_name, is_active)
VALUES ('nome-da-empresa', 'Nome Da Empresa', true);
```

> **Como descobrir o `slug` do Greenhouse?**
> Acesse a página de carreiras da empresa (ex: `boards.greenhouse.io/nubank`). O slug é o termo final da URL (`nubank`).

### 3. Desativar uma Empresa
```sql
UPDATE public.greenhouse_boards SET is_active = false WHERE slug = 'empresa-desativada';
```

---

## Opção 2: Adicionar/Remover via Variável de Ambiente

No painel do Supabase (Edge Functions -> Environment Variables), altere a variável `GREENHOUSE_COMPANIES`:

```env
GREENHOUSE_COMPANIES="nubank,ifood,quintoandar,stone,olist,hotmart,picpay,mercadolivre,neon,loggi,creditas,gympass,cloudflare,figma,github"
```

Não é necessário recompilar o código da aplicação nem fazer novo deploy do frontend.
