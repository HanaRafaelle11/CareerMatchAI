# Casos de Teste Determinísticos de Experimentação (Golden Cases) — Fase 10

## 1. Inventário dos 21 Golden Cases
Arquivo oficial: [`tests/unit/phase10ExperimentationGoldenCases.test.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/tests/unit/phase10ExperimentationGoldenCases.test.ts)

1. **Caso 1**: Atribuição determinística por hash de `user_id`.
2. **Caso 2**: Estabilidade de variante em múltiplas chamadas consecutivas (sem `Math.random`).
3. **Caso 3**: Rollout 0% sempre retornando `CONTROL`.
4. **Caso 4**: Rollout 100% distribuindo entre `CONTROL` e `VARIANT_A`.
5. **Caso 5**: Proporção equilibrada entre variantes com amostra grande.
6. **Caso 6**: Exposição separada estritamente de atribuição.
7. **Caso 7**: Conversão associada à variante correta do usuário.
8. **Caso 8**: Deduplicação de múltiplas exposições do mesmo usuário.
9. **Caso 9**: Prevenção de contaminação cruzada (1 variante por experimento).
10. **Caso 10**: Rejeição de conversão antes da exposição.
11. **Caso 11**: Amostra insuficiente retornando `INSUFFICIENT_SAMPLE`.
12. **Caso 12**: Variante com uplift e guardrails saudáveis retornando `WIN`.
13. **Caso 13**: Variante com performance inferior retornando `LOSS`.
14. **Caso 14**: Diferença pequena sem significância retornando `INCONCLUSIVE`.
15. **Caso 15**: Violação de guardrail impedindo `WIN` e forçando `LOSS`.
16. **Caso 16**: Detecção de experimento quebrado com zero exposições.
17. **Caso 17**: Exclusão de contas de teste e internas via `AdminAuditService`.
18. **Caso 18**: Killswitch de emergência (`status = 'DISABLED'` reverte para `CONTROL`).
19. **Caso 19**: Guardrail de Custo de IA (Alerta quando custo por ativado excede R$ 1,50).
20. **Caso 20**: Contrato de acessibilidade mobile (touch target $\ge 44\text{px}$).
21. **Caso 21**: Invariante do Core: `CareerMatchEngineV3` e pesos 100% preservados.

## 2. Resultado da Execução
Todos os 21 testes foram executados com **100% de aprovação (0 falhas)** via Vitest.
