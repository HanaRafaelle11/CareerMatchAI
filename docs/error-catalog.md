# Catálogo de Erros de Produção — CareerMatch AI

Este catálogo lista as exceções tratadas de forma humana pelo frontend do CareerMatch AI, mapeando códigos internos para as respectivas interfaces visuais.

---

## 📶 NETWORK_ERROR

- **Origem:** Queda de internet, falhas de resolução de DNS do cliente ou bloqueios de CORS locais.
- **Descrição Técnica:** O navegador falhou ao efetuar um request (ex: `Failed to fetch`).
- **Título para o Usuário:** Sem Conexão de Rede
- **Mensagem Amigável:** "Não conseguimos conectar com os servidores. Verifique sua conexão com a internet e tente novamente."
- **Nível:** `error`
- **Ação:** Botão de "Tentar Novamente" (Retry).

---

## 🤖 AI_TIMEOUT

- **Origem:** Edge Function `match-job` ou `analyze-resume`.
- **Descrição Técnica:** A chamada ao Gemini 2.5 Flash ultrapassou o tempo máximo limite de processamento HTTP.
- **Título para o Usuário:** Análise Demorou Muito
- **Mensagem Amigável:** "Nossa IA demorou mais que o esperado para responder. Pode ser que o tráfego esteja alto no momento. Você pode tentar novamente em alguns minutos."
- **Nível:** `warning`
- **Ação:** Botão de "Tentar Novamente" (Retry).

---

## 📄 RESUME_NOT_FOUND

- **Origem:** Banco de Dados / Edge Function.
- **Descrição Técnica:** O `resume_version_id` fornecido no corpo da requisição não possui correspondente na tabela `resume_versions`.
- **Título para o Usuário:** Currículo Não Encontrado
- **Mensagem Amigável:** "Não encontramos a versão do seu currículo correspondente. Envie um novo arquivo na aba 'Meu Currículo' para reiniciar."
- **Nível:** `error`
- **Ação:** Link de redirecionamento para a aba "Meu Currículo".

---

## 🔎 JOB_SEARCH_UNAVAILABLE

- **Origem:** Provedor Externo (Adzuna).
- **Descrição Técnica:** A API do Adzuna não está configurada nos segredos do Supabase (`API_NOT_CONFIGURED`), ou falhou com status `5xx`.
- **Título para o Usuário:** Busca de Vagas Indisponível
- **Mensagem Amigável:** "O serviço de busca automática de vagas está temporariamente fora do ar. Você pode tentar realizar a busca novamente ou cadastrar suas vagas manualmente."
- **Nível:** `warning`
- **Ação:** Botão de "Importar Vaga Manualmente" habilitado no painel.

---

## 🔒 RLS_BLOCKED

- **Origem:** Supabase PostgREST RLS.
- **Descrição Técnica:** O token JWT de acesso é válido, porém viola a política row-level security para a linha em questão.
- **Título para o Usuário:** Acesso Não Autorizado
- **Mensagem Amigável:** "Você não tem permissão para visualizar ou alterar este recurso. Certifique-se de estar conectado com a conta correta."
- **Nível:** `error`
- **Ação:** Nenhuma (Exibe aviso de segurança explicativo).

---

## 🔑 AUTH_SESSION_EXPIRED

- **Origem:** Supabase Auth JWT.
- **Descrição Técnica:** O token de acesso do usuário expirou e não pôde ser atualizado.
- **Título para o Usuário:** Sessão Expirada
- **Mensagem Amigável:** "Sua sessão de acesso expirou. Faça login novamente para continuar salvando seu progresso."
- **Nível:** `warning`
- **Ação:** Botão de redirecionamento para a página `/login`.
