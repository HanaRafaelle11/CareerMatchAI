# Casos de Teste Determinísticos de Growth & Produto — Fase 9

## 1. Inventário de Testes
Arquivo de teste: [`tests/unit/phase9ProductGrowthGoldenCases.test.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/tests/unit/phase9ProductGrowthGoldenCases.test.ts)

1. **Caso 1**: Funil de 11 etapas calculando conversões absolutas e relativas por usuário único.
2. **Caso 2**: Funil com zero cadastros retornando 0.0% sem quebrar por divisão por zero.
3. **Caso 3**: Avaliação comparativa das candidatas A a E à definição de Ativação.
4. **Caso 4**: Identificação do maior gargalo absoluto e relativo de abandono (dropoff).
5. **Caso 5**: Cálculo da matriz de retenção D1, D3, D7, D14, D30 para coorte consolidada.
6. **Caso 6**: Coorte recente sem tempo decorrido suficiente retornando `INSUFFICIENT_SAMPLE`.
7. **Caso 7**: Matriz de adoção de funcionalidades (Repeat rate e downstream Pro conversion).
8. **Caso 8**: Avaliação de propensão de candidatura por buckets de Match Score (0-49 até 90-100).
9. **Caso 9**: Economia de IA (Custo por cadastro, por ativado, por aplicação e por conversão Pro).
10. **Caso 10**: Impacto de erros na taxa de conclusão de onboarding vs usuários sem erro.
11. **Caso 11**: Atribuição determinística e idempotente de variantes A/B por hash de `user_id`.
12. **Caso 12**: Classificação operacional de eventos (`HEALTHY`, `LOW_VOLUME`, `ZERO_VOLUME`, `BROKEN`, `STALE`, `UNMEASURED`).
13. **Caso 13**: Avaliação da North Star Metric (Meaningful Career Actions).

## 2. Resultado da Execução
Todos os 13 testes foram executados com **100% de aprovação (0 falhas)** via Vitest.
