# Observabilidade de Erros Críticos & Resiliência — Fase 7

## 1. Classificação e Tratamento de Erros Críticos

| Categoria | Origem Típica | Tratamento Aplicado | Log & Telemetria | Risco de PII |
| :--- | :--- | :--- | :--- | :--- |
| **`AUTH_ERROR`** | Sessão expirada / token inválido | Redirecionamento limpo para login | `auth_error` com código limpo | Zero (tokens nunca salvos em log) |
| **`DATABASE_ERROR`** | Timeout / RLS / Conexão Supabase | Envelope `AnalyticsResult.error` | `console.error` sanitizado | Zero |
| **`API_ERROR`** | Rate limit Adzuna / Gemini | Fallback gracioso com retry | `api_request_failed` | Zero |
| **`AI_ERROR`** | Cota de tokens atingida | Mensagem amigável ao usuário | `ai_usage_logs.status = 'error'` | Zero |
| **`PAYMENT_ERROR`** | Cartão recusado | Exibição de motivo claro | `payment_failed` com gateway reason | Zero (sem dados de cartão) |
| **`MATCH_ERROR`** | Dados incompletos de vaga | Rejeição segura com score 0 | `match_calculation_failed` | Zero |
| **`UPLOAD_ERROR`** | Arquivo corrompido / não-PDF | Toast de validação de formato | `resume_processing_errors` | Zero |

## 2. Garantia Anti-Crash
Nenhum erro de banco ou requisição de API derruba a aplicação ou é convertido silenciosamente em zero numérico sem o estado explícito de erro.
