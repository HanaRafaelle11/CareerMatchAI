# Impacto de Erros no Negócio e Conversão — Fase 9

## 1. Matriz de Erro vs Conversão

| Tipo de Erro | Severidade | Impacto Direto na Ativação | Impacto na Monetização |
| :--- | :--- | :--- | :--- |
| **`UPLOAD_ERROR`** | Média | **Queda de ~50%** na ativação se o upload falhar no onboarding. | Redução indireta no funil topo. |
| **`PAYMENT_ERROR`** | Alta | Nulo na ativação. | **Perda direta de receita imediata** (~100% no checkout afetado). |
| **`AI_ERROR`** | Baixa | Usuário visualiza mensagem amigável com botão de tentar novamente. | Impacto desprezível se resolvido em retry. |
| **`MATCH_ERROR`** | Baixa | Vaga incompleta omitida do feed sem quebrar a lista de vagas. | Zero impacto no restante do catálogo. |

## 2. Ações de Mitigação
- Implementados feedbacks visuais claros e mensagens orientadas à ação para o usuário em erros de upload e checkout.
