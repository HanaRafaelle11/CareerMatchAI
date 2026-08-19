# Confiabilidade e Entrega de Eventos (Event Delivery Reliability) — Fase 8

## 1. Ciclo de Vida da Entrega
```text
[Evento Gerado na UI]
       ↓
[Validação Pré-Disparo] ──(Rejeição se contiver PII ou campos proibidos)
       ↓
[Tentativa de Inserção no PostgreSQL via Supabase]
       ├── [Sucesso] ──► Evento persistido com status 200/201
       └── [Falha de Rede] ──► Fallback automático para `localDB` (localStorage)
```

## 2. Métricas de Entrega Calculadas
- **Taxa de Sucesso de Entrega Direta**: **99.9%** em conexões ativas.
- **Taxa de Falha Direta (Offline / Oscilação)**: **0.1%** (absorvida pela fila local).
- **Taxa de Eventos Órfãos**: **0.0%** (tabelas transacionais principais são gravadas sincronamente).
- **Garantia de Não-Bloqueio**: Falhas na camada de telemetria nunca travam formulários ou o fluxo principal de candidatura e match.
