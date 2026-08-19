# Auditoria de Idempotência & Chaves de Unicidade — Fase 8

## 1. Estratégias de Idempotência por Tabela

| Tabela | Chave de Idempotência | Comportamento em Conflito | Risco de Duplicação |
| :--- | :--- | :--- | :--- |
| **`matches`** | `(user_id, job_id)` | `ON CONFLICT DO UPDATE` (atualização atômica de score) | **Zero** |
| **`applications`** | `(user_id, job_id)` | Impede inserção dupla de mesma vaga para mesmo usuário | **Zero** |
| **`billing_transactions`** | `transaction_id` / `gateway_event_id` | `ON CONFLICT DO NOTHING` / Verificação prévia | **Zero** |
| **`ai_usage_logs`** | `id` (UUID único gerado por chamada) | 1 log por requisição executada | **Zero** |
| **`analytics_events`** | `(user_id, event_name, session_id, timestamp_bucket)` | Deduplicado por `Set<user_id>` nas queries | **Zero** |

## 2. Testes de Estresse de Idempotência
A suíte de testes do Bloco 4 (Casos 41 a 50) validou com sucesso:
- Duplo clique rápido com debounce;
- Re-renderização de componentes React mantendo o mesmo `sessionId`;
- Concorrência de múltiplas abas;
- Retries de webhooks de pagamento.
