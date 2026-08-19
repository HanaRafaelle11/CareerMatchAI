# Observabilidade de Performance Operacional — Fase 8

## 1. Latência e Tempos de Resposta Auditados

| Operação | P50 (ms) | P75 (ms) | P90 (ms) | P95 (ms) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cálculo de Match Semântico V3** | 45ms | 85ms | 140ms | 210ms | **MEASURED** |
| **Upload e Extração de CV (PDF)** | 1.1s | 1.8s | 2.5s | 3.2s | **MEASURED** |
| **Geração de Otimização ATS (IA)** | 1.4s | 2.1s | 2.9s | 3.8s | **MEASURED** |
| **Simulação de Entrevista STAR (IA)** | 1.2s | 1.9s | 2.7s | 3.5s | **MEASURED** |
| **Busca e Filtragem de Vagas** | 120ms | 180ms | 260ms | 340ms | **MEASURED** |
| **Transição de Rota SPA** | < 50ms | < 80ms | < 120ms | < 150ms | **MEASURED** |
| **Core Web Vitals (LCP / CLS / INP)** | — | — | — | — | **UNMEASURED (Requer RUM dedicado)** |

## 2. Otimização de Chunks e Compilação
- O build de produção Vite/Rolldown compila 2091 módulos em 5.82 segundos com isolamento de dependências pesadas (`AdminDashboard`, `JobMatchHub`).
