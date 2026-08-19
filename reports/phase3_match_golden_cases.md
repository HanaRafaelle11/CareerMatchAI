# 🏆 GOLDEN CASES DO MATCH — FASE 3 (VOCENTRO)

**Arquivo de Teste**: [`tests/unit/matchGoldenCases.test.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/tests/unit/matchGoldenCases.test.ts)  
**Status**: `10/10 TESTES APROVADOS (100% PASS)`  

---

## 1. 📋 RESULTADOS DOS 10 CASOS DETERMINÍSTICOS

| Caso | Cenário | Comportamento Esperado | Resultado |
|---|---|---|---|
| **Caso 1** | Match Muito Alto | Senior Dev React para Senior Dev React (Fit ≥ 80, Goal ≥ 80) | ✅ PASS |
| **Caso 2** | Match Médio | Stack mista (Python/React) para Senior Frontend (Fit entre 25 e 80) | ✅ PASS |
| **Caso 3** | Match Baixo | Frontend aplicando para Médico Cardiologista (Fit ≤ 30) | ✅ PASS |
| **Caso 4** | Campos Ausentes | Currículo sem requisitos da vaga gera score baixo sem quebra (Fit ≤ 30) | ✅ PASS |
| **Caso 5** | Senioridade Incompatível | Júnior aplicando para Tech Lead (Penalização em senioridade ≤ 50) | ✅ PASS |
| **Caso 6** | Competências Incompatíveis | Java Backend para UI/UX Designer (Detecção de gaps técnicos ≥ 3) | ✅ PASS |
| **Caso 7** | Transição de Carreira | CareerGoalScore calculado com segregação clara de FitScore | ✅ PASS |
| **Caso 8** | Dados Extremos | Caracteres especiais e strings longas sem NaN ou estouro (0–100) | ✅ PASS |
| **Caso 9** | Score Exibido = Calculado | Single source of truth entre `UnifiedMatchService` e `buildJobMatchScore` | ✅ PASS |
| **Caso 10** | Score Persistido = Calculado | `MatchingEngine.calculateMatchSync` alinhado ao V3 determinístico | ✅ PASS |
