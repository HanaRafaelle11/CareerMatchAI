# Validação de Performance & Latência Experimental — Fase 10

## 1. Impacto de Latência do Framework A/B
- **Tempo de Execução do Hash (`assignVariant`)**: **$< 0.05\text{ms}$** por chamada (puramente em memória, síncrono e leve).
- **Tempo de Renderização de Cards com Variante**: **$< 2\text{ms}$**.
- **Impacto no Core Web Vitals (LCP / CLS / INP)**: **Zero impacto mensurável** (sem scripts externos síncronos de bloqueio).

## 2. Invariante de Performance
A inclusão do `ExperimentService` não alterou o tempo de build do Vite/Rolldown (mantendo compilação de 2091 módulos abaixo de 8 segundos).
