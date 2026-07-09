# Catálogo de Erros de Produção — CareerMatch AI

Este catálogo lista as exceções tratadas de forma humana pelo frontend do CareerMatch AI, mapeando códigos internos para as respectivas interfaces visuais.

---

## 🔑 Categoria: Autenticação e Segurança

### AUTH_SESSION_EXPIRED
- **Origem:** Supabase Auth JWT.
- **Quando acontece:** O token de acesso do usuário expirou e o refresh token falhou.
- **Mensagem Técnica:** `JWT expired` ou `Invalid token claim`.
- **Título para o Usuário:** Sessão Expirada
- **Mensagem Amigável:** "Sua sessão expirou. Entre novamente para continuar salvando seu progresso."
- **Severidade:** `warning`
- **Ação Recomendada:** Redirecionar para a tela de Login `/login`.

### RLS_BLOCKED
- **Origem:** Supabase Row Level Security (RLS).
- **Quando acontece:** Tentativa de ler ou gravar dados pertencentes a outro usuário.
- **Mensagem Técnica:** `new row violates row-level security policy`.
- **Título para o Usuário:** Acesso Não Autorizado
- **Mensagem Amigável:** "Você não tem permissão para visualizar, alterar ou excluir este recurso. Seus dados continuam seguros."
- **Severidade:** `error`
- **Ação Recomendada:** Entrar com a conta correta ou relatar o problema.

---

## 📄 Categoria: Documento e Currículo

### RESUME_UPLOAD_INVALID
- **Origem:** Cliente/Storage.
- **Quando acontece:** O arquivo selecionado não é um PDF válido ou excede o limite de tamanho (10MB).
- **Mensagem Técnica:** `File is not a valid application/pdf` ou `Size exceeds 10MB`.
- **Título para o Usuário:** Não conseguimos ler esse arquivo
- **Mensagem Amigável:** "Envie um arquivo em formato PDF com até 10MB de tamanho."
- **Severidade:** `warning`
- **Ação Recomendada:** Selecionar outro arquivo.

### PARSE_ERROR (PDF Corrompido)
- **Origem:** analyze-resume Edge Function / PDF Parser library.
- **Quando acontece:** O arquivo PDF está protegido por senha ou sua estrutura de dados está corrompida.
- **Mensagem Técnica:** `Invalid PDF structure` ou `Failed to parse PDF document`.
- **Título para o Usuário:** Estrutura de Currículo Inválida
- **Mensagem Amigável:** "Não conseguimos extrair o texto desse currículo. Verifique se o arquivo não está protegido por senha ou corrompido."
- **Severidade:** `error`
- **Ação Recomendada:** Gerar novamente o PDF do currículo a partir do Word/Canva e reenviar.

### RESUME_EMPTY
- **Origem:** analyze-resume Edge Function.
- **Quando acontece:** O arquivo enviado não contém texto legível (ex: PDF escaneado apenas com imagens, sem OCR).
- **Mensagem Técnica:** `Nenhum texto legível pôde ser extraído do documento`.
- **Título para o Usuário:** Currículo sem Conteúdo Legível
- **Mensagem Amigável:** "Não identificamos nenhum texto no seu arquivo. Verifique se ele não é um PDF digitalizado como imagem direta (sem texto selecionável)."
- **Severidade:** `warning`
- **Ação Recomendada:** Habilitar OCR ou exportar o arquivo contendo texto digital.

### RESUME_INVALID_PROFILE (Sem Experiências)
- **Origem:** analyze-resume Edge Function / Gemini output validation.
- **Quando acontece:** O currículo foi lido, mas a IA não identificou experiências de trabalho ou nome do profissional.
- **Mensagem Técnica:** `Resume extraction returned invalid profile: missing name or work experiences`.
- **Título para o Usuário:** Dados de Currículo Insuficientes
- **Mensagem Amigável:** "Identificamos o arquivo, mas não encontramos experiências profissionais ou competências claras estruturadas nele. Tente enviar uma versão mais detalhada."
- **Severidade:** `warning`
- **Ação Recomendada:** Adicionar histórico profissional detalhado ao arquivo e enviar novamente.

---

## 🤖 Categoria: Inteligência Artificial (Gemini)

### AI_TIMEOUT
- **Origem:** Gemini API / Edge Functions.
- **Quando acontece:** A chamada à API do Gemini excede o tempo limite de processamento HTTP (geralmente devido a congestionamento).
- **Mensagem Técnica:** `Edge Function connection timeout` ou `Fetch to Gemini API failed`.
- **Título para o Usuário:** Análise Demorou Muito
- **Mensagem Amigável:** "Nossa inteligência artificial está demorando mais que o normal. Vamos tentar novamente em alguns instantes."
- **Severidade:** `warning`
- **Ação Recomendada:** Botão "Tentar Novamente" (Retry).

### RATE_LIMIT_EXCEEDED
- **Origem:** Rate limiter do Supabase Edge Functions.
- **Quando acontece:** O usuário executa mais de 10 chamadas de match por hora.
- **Mensagem Técnica:** `Rate limit exceeded` ou `Too many requests`.
- **Título para o Usuário:** Limite de Consultas Atingido
- **Mensagem Amigável:** "Você atingiu o limite de análises de vaga por hora. Por favor, aguarde alguns minutos antes de tentar novamente."
- **Severidade:** `warning`
- **Ação Recomendada:** Aguardar o tempo de cooldown de 1 hora.

---

## 🌎 Categoria: Provedor de Vagas (Adzuna)

### JOB_SEARCH_UNAVAILABLE (API Fora do Ar)
- **Origem:** Adzuna External API Connector.
- **Quando acontece:** A API do Adzuna retorna status `5xx` ou as credenciais do Supabase Vault não estão configuradas.
- **Mensagem Técnica:** `Falha ao consultar API do Adzuna` ou `API_NOT_CONFIGURED`.
- **Título para o Usuário:** Busca de Vagas Indisponível
- **Mensagem Amigável:** "O serviço de busca de vagas está temporariamente fora de serviço. Tente novamente mais tarde ou insira sua vaga manualmente."
- **Severidade:** `warning`
- **Ação Recomendada:** Utilizar o botão "Colar Nova Vaga" para inserir a descrição manualmente.

### JOB_SEARCH_EMPTY
- **Origem:** Adzuna Search / Job Discovery.
- **Quando acontece:** Nenhum resultado de vaga é retornado para a palavra-chave e localidade fornecidas.
- **Mensagem Técnica:** `results length is 0`.
- **Título para o Usuário:** Nenhuma vaga compatível
- **Mensagem Amigável:** "Não encontramos vagas públicas com os filtros fornecidos. Tente ajustar os termos ou remover a cidade da busca."
- **Severidade:** `info`
- **Ação Recomendada:** Redefinir filtros para termos mais abrangentes ou remover localização restritiva.

---

## ⚙️ Categoria: Infraestrutura e Banco

### NETWORK_ERROR
- **Origem:** Cliente Navegador.
- **Quando acontece:** O usuário perde a conexão com a internet ou os servidores de DNS estão bloqueados.
- **Mensagem Técnica:** `Failed to fetch`.
- **Título para o Usuário:** Sem Conexão de Rede
- **Mensagem Amigável:** "Não conseguimos conectar com os servidores. Verifique sua conexão com a internet e tente novamente."
- **Severidade:** `error`
- **Ação Recomendada:** Recarregar a página e conferir cabos/Wi-Fi.
