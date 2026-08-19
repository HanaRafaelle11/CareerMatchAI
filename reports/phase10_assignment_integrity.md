# Integridade e Consistência da Atribuição de Variantes — Fase 10

## 1. Algoritmo de Hashing Determinístico
- Implementado em `ExperimentService.hash(key)`.
- Chave composta: `${subjectId}_${experimentId}`.
- O hash é puramente aritmético sobre os caracteres ASCII da chave, garantindo a mesma variante em 100% das sessões e re-renders.

## 2. Testes de Stress de Atribuição
O Caso 2 da suíte de Golden Cases confirmou **50 invocações consecutivas** por usuário com **100% de estabilidade** e zero desvios de variante.
