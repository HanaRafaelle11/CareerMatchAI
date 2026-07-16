# Catálogo de Erros de Produção — Vocentro

Este catálogo lista as exceções tratadas de forma humana pelo frontend do Vocentro, mapeando códigos internos para as respectivas interfaces visuais e eventos de telemetria correspondentes.

---

## 📊 Tabela de Auditoria de Erros

| Código | Serviço | Usuário entende? | Retry | Evento de Telemetria |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH_SESSION_EXPIRED** | Autenticação | Sim (Sessão Expirada) | Não (requer login) | `auth_session_expired` |
| **RLS_BLOCKED** | Banco de Dados | Sim (Acesso Não Autorizado) | Não | `rls_blocked` |
| **RESUME_UPLOAD_INVALID** | Upload / Cliente | Sim (Não conseguimos ler esse arquivo) | Não (Enviar novo currículo) | `resume_upload_invalid` |
| **PARSE_ERROR** | Parser de Currículo | Sim (Estrutura de Currículo Inválida) | Não (Enviar novo currículo) | `resume_parse_failed` |
| **RESUME_EMPTY** | Parser de Currículo | Sim (Currículo sem Conteúdo Legível) | Não (Enviar novo currículo) | `resume_empty` |
| **RESUME_INVALID_PROFILE** | Parser de Currículo | Sim (Dados de Currículo Insuficientes) | Não (Reenviar versão detalhada) | `resume_invalid_profile` |
| **AI_TIMEOUT** | Gemini AI | Sim (Não conseguimos concluir sua análise) | Sim (Tentar novamente) | `gemini_timeout` |
| **RATE_LIMIT_EXCEEDED** | Gemini AI / Gateway | Sim (Limite de Consultas Atingido) | Sim (Após cooldown de 1h) | `rate_limit_exceeded` |
| **JOB_SEARCH_UNAVAILABLE** | Adzuna / Busca | Sim (Busca de Vagas Indisponível) | Sim (Tentar Novamente) | `adzuna_api_failed` |
| **JOB_SEARCH_EMPTY** | Adzuna / Busca | Sim (Nenhuma vaga compatível) | Não (Mudar filtros de busca) | `job_search_empty` |
| **NETWORK_ERROR** | Rede / Cliente | Sim (Sem Conexão de Rede) | Sim (Tentar Novamente) | `network_error` |

---

## 🔑 Categoria: Autenticação e Segurança

### AUTH_SESSION_EXPIRED
- **Origem:** Supabase Auth JWT / Cliente
- **Severidade:** `warning`
- **Mensagem interna (Técnica):** `JWT expired` ou `Invalid token claim`.
- **Mensagem usuário (Amigável):** "Sua sessão expirou. Entre novamente para continuar salvando seu progresso."
- **Retry permitido?:** Não (Requer nova autenticação do usuário).
- **Evento de telemetria:** `auth_session_expired`
- **Ação Recomendada:** Redirecionar para a tela de Login `/login`.

### RLS_BLOCKED
- **Origem:** Supabase Row Level Security (RLS) / Banco
- **Severidade:** `error`
- **Mensagem interna (Técnica):** `new row violates row-level security policy` ou `violates row-level security`.
- **Mensagem usuário (Amigável):** "Você não tem permissão para visualizar, alterar ou excluir este recurso. Seus dados continuam seguros."
- **Retry permitido?:** Não (Violação definitiva de segurança).
- **Evento de telemetria:** `rls_blocked`
- **Ação Recomendada:** Entrar com a conta correta ou relatar o problema.

---

## 📄 Categoria: Documento e Currículo

### RESUME_UPLOAD_INVALID
- **Origem:** Cliente / Storage
- **Severidade:** `warning`
- **Mensagem interna (Técnica):** `File is not a valid application/pdf` ou `Size exceeds 10MB`.
- **Mensagem usuário (Amigável):** "Envie um arquivo em formato PDF com até 10MB de tamanho."
- **Retry permitido?:** Não (Requer que o usuário escolha outro arquivo adequado).
- **Evento de telemetria:** `resume_upload_invalid`
- **Ação Recomendada:** Exibir botão de ação "Enviar novo currículo".

### PARSE_ERROR (PDF Corrompido)
- **Origem:** analyze-resume Edge Function / PDF Parser library
- **Severidade:** `error`
- **Mensagem interna (Técnica):** `Invalid PDF structure` ou `Failed to parse PDF document`.
- **Mensagem usuário (Amigável):** "Não conseguimos extrair o texto desse currículo. Verifique se o arquivo não está protegido por senha ou corrompido."
- **Retry permitido?:** Não (O arquivo precisa ser reparado ou exportado novamente).
- **Evento de telemetria:** `resume_parse_failed`
- **Ação Recomendada:** Exibir botão de ação "Enviar novo currículo".

### RESUME_EMPTY
- **Origem:** analyze-resume Edge Function
- **Severidade:** `warning`
- **Mensagem interna (Técnica):** `Nenhum texto legível pôde ser extraído do documento`.
- **Mensagem usuário (Amigável):** "Não identificamos nenhum texto no seu arquivo. Verifique se ele não é um PDF digitalizado como imagem direta (sem texto selecionável)."
- **Retry permitido?:** Não (Requer arquivo contendo texto selecionável ou OCR habilitado).
- **Evento de telemetria:** `resume_empty`
- **Ação Recomendada:** Exibir botão de ação "Enviar novo currículo".

### RESUME_INVALID_PROFILE (Sem Experiências)
- **Origem:** analyze-resume Edge Function / Gemini output validation
- **Severidade:** `warning`
- **Mensagem interna (Técnica):** `Resume extraction returned invalid profile: missing name or work experiences`.
- **Mensagem usuário (Amigável):** "Identificamos o arquivo, mas não encontramos experiências profissionais ou competências claras estruturadas nele. Tente enviar uma versão mais detalhada."
- **Retry permitido?:** Não (O arquivo precisa de mais informações reais sobre a carreira do candidato).
- **Evento de telemetria:** `resume_invalid_profile`
- **Ação Recomendada:** Adicionar histórico profissional detalhado ao arquivo e enviar novamente.

---

## 🤖 Categoria: Inteligência Artificial (Gemini)

### AI_TIMEOUT
- **Origem:** Gemini API / Edge Functions
- **Severidade:** `error`
- **Mensagem interna (Técnica):** `Edge Function connection timeout` ou `Fetch to Gemini API failed` ou `quota exceeded` ou `Unexpected token < in JSON`.
- **Mensagem usuário (Amigável):** "A inteligência artificial encontrou uma instabilidade temporária."
- **Retry permitido?:** Sim (Tentar novamente de forma imediata ou adaptativa).
- **Evento de telemetria:** `gemini_timeout`
- **Ação Recomendada:** Exibir botão "Tentar novamente" (Retry automático/manual).

### RATE_LIMIT_EXCEEDED
- **Origem:** Rate limiter do Supabase Edge Functions / Gateway
- **Severidade:** `warning`
- **Mensagem interna (Técnica):** `Rate limit exceeded` ou `Too many requests`.
- **Mensagem usuário (Amigável):** "A inteligência artificial encontrou uma instabilidade temporária." (unificado sob instabilidade Gemini para melhor experiência) ou "Você atingiu o limite de análises de vaga por hora. Por favor, aguarde alguns minutos antes de tentar novamente."
- **Retry permitido?:** Sim (Após aguardar tempo de cooldown).
- **Evento de telemetria:** `rate_limit_exceeded`
- **Ação Recomendada:** Aguardar o tempo de cooldown de 1 hora.

---

## 🌎 Categoria: Provedor de Vagas (Adzuna)

### JOB_SEARCH_UNAVAILABLE
- **Origem:** Adzuna External API Connector / Rede
- **Severidade:** `warning`
- **Mensagem interna (Técnica):** `Falha ao consultar API do Adzuna`, `API_NOT_CONFIGURED` ou `Failed request`.
- **Mensagem usuário (Amigável):** "Não conseguimos buscar vagas agora."
- **Retry permitido?:** Sim (Tentar Novamente).
- **Evento de telemetria:** `adzuna_api_failed`
- **Ação Recomendada:** Botão "Tentar Novamente" e/ou orientar inserção manual da vaga via "Colar Nova Vaga".

### JOB_SEARCH_EMPTY
- **Origem:** Adzuna Search / Job Discovery
- **Severidade:** `info`
- **Mensagem interna (Técnica):** `results length is 0`.
- **Mensagem usuário (Amigável):** "Não encontramos vagas públicas com os filtros fornecidos. Tente ajustar os termos ou remover a cidade da busca."
- **Retry permitido?:** Não (Requer mudança manual de palavras-chave/cidade).
- **Evento de telemetria:** `job_search_empty`
- **Ação Recomendada:** Redefinir filtros para termos mais abrangentes ou remover localização restritiva.

---

## ⚙️ Categoria: Infraestrutura e Rede

### NETWORK_ERROR
- **Origem:** Cliente Navegador
- **Severidade:** `error`
- **Mensagem interna (Técnica):** `Failed to fetch` ou `NetworkError`.
- **Mensagem usuário (Amigável):** "Não conseguimos conectar com os servidores. Verifique sua conexão com a internet e tente novamente."
- **Retry permitido?:** Sim (Tentar Novamente / Automático ao reconectar).
- **Evento de telemetria:** `network_error`
- **Ação Recomendada:** Recarregar a página e conferir cabos/Wi-Fi.
