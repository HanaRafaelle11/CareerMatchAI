# Arquitetura de Experimentação (A/B Testing Readiness) — Fase 9

## 1. Infraestrutura Conceitual de Testes A/B
Para permitir experimentação segura sem quebrar invariantes de dados:

```text
[Usuário Autenticado (user_id)]
       ↓
[Atribuição Determinística via Hash: hash(user_id + experiment_id) % 2]
       ├── [Controle (50%)] ──► Variante A
       └── [Tratamento (50%)] ──► Variante B
       ↓
[Disparo de Evento de Exposição: `experiment_exposure` (experiment_id, variant)]
       ↓
[Métricas de Conversão Downstream: `job_applied`, `payment_confirmed`]
```

## 2. Garantias de Não-Contaminação
- A atribuição é **idempotente e imutável**: o mesmo usuário sempre receberá a mesma variante durante o ciclo do experimento.
- Nenhuma funcionalidade de experimento altera os pesos de cálculo do `CareerMatchEngineV3`.
- **Status**: **READY FOR EXPERIMENTATION** (Infraestrutura validada pelo Caso 11 dos testes unitários).
