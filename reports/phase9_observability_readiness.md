# Matriz de Prontidão de Observabilidade & Alertas — Fase 9

## 1. Matriz de Monitoramento e Alertas Propostos

| Sinal de Alerta | Gatilho Técnico | Impacto no Negócio | Severidade | Ação de Resposta |
| :--- | :--- | :--- | :--- | :--- |
| **Pico de Falhas de Pagamento** | $> 3$ pagamentos falhos em 15 min | Perda direta de receita | P0 (Crítica) | Verificar status do gateway Stripe/Asaas |
| **Pico de Erros de IA** | $> 5$ erros de cota/timeout em 10 min | Interrupção do Coach/Otimizador | P1 (Alta) | Inspecionar limites de cota no Google AI Studio |
| **Queda Abrupta de Eventos** | Queda $> 80\%$ no volume diário | Queda de engajamento ou falha de rede | P1 (Alta) | Inspecionar conectividade do Supabase |
| **Violação de Invariante ($DAU > MAU$)** | Inconsistência matemática nas queries | Distorção em relatórios | P1 (Alta) | Auditoria de queries rolling |
| **Freshness Excedido ($> 2\text{h}$)** | Timestamp sem novas atualizações | Dados desatualizados para o admin | P2 (Média) | Refetch forçado |

## 2. Status de Prontidão
Matriz documentada e pronta para integração com canais externos de notificação (ex: Discord/Slack/Email).
