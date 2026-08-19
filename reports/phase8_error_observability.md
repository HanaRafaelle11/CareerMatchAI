# Observabilidade de Erros & Taxonomia Unificada — Fase 8

## 1. Taxonomia Canônica de Erros

| Código de Erro | Severidade | Origem Típica | Tratamento & Recuperação |
| :--- | :--- | :--- | :--- |
| **`AUTH_ERROR`** | P1 (Alta) | Token expirado / sessão revogada | Redirecionamento limpo para login |
| **`DATABASE_ERROR`** | P0 (Crítica) | Timeout de query / falha RLS | Envelope `AnalyticsResult.error` sem crash |
| **`API_ERROR`** | P2 (Média) | Rate limit de integrações externas | Fallback gracioso com retry |
| **`AI_ERROR`** | P2 (Média) | Cota excedida no Gemini | Log com status error e R$ 0,00 |
| **`PAYMENT_ERROR`** | P1 (Alta) | Recusa de cartão / timeout gateway | Toast explicativo sem mascaramento |
| **`MATCH_ERROR`** | P2 (Média) | Vaga sem dados de skills suficientes | Rejeição segura com score 0 |
| **`UPLOAD_ERROR`** | P3 (Baixa) | Arquivo não-PDF ou corrompido | Validação imediata no frontend |

## 2. Garantia Anti-Silenciamento
Nenhuma falha é convertida silenciosamente em zero numérico sem o registro estruturado de erro.
