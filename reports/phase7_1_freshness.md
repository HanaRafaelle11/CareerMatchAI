# Auditoria de Freshness Real por Domínio — Fase 7.1

## 1. Classificação Adaptativa de Freshness
O conceito de "frescura" de dados varia conforme a volatilidade natural de cada tabela:

| Fonte de Dados | Janela Ideal (Fresh) | Janela Aceitável (Aging) | Janela Desatualizada (Stale) | Justificativa |
| :--- | :--- | :--- | :--- | :--- |
| **`analytics_events`** | $< 5$ min | $5 - 30$ min | $> 30$ min | Eventos comportamentais de navegação são contínuos. |
| **`ai_usage_logs`** | $< 5$ min | $5 - 60$ min | $> 60$ min | Chamadas ao modelo refletem o uso imediato das ferramentas. |
| **`matches`** | $< 15$ min | $15 - 120$ min | $> 2$ horas | Matches são recalculados sob demanda ou em batch. |
| **`applications`** | $< 10$ min | $10 - 120$ min | $> 2$ horas | Candidaturas e movimentações no Kanban. |
| **`billing_transactions`** | $< 60$ min | $1 - 24$ horas | $> 24$ horas | Pagamentos e renovações ocorrem em janelas esparsas. |
| **`profiles` / `resumes`** | $< 30$ min | $30 - 240$ min | $> 24$ horas | Atualizações cadastrais ocorrem no onboarding ou revisão. |

## 2. Implementação no Dashboard
O indicador de freshness nos widgets respeita essas regras, informando o operador sobre o estado real da sincronização sem alarmes falsos de obsolescência.
