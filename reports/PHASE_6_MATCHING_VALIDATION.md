# Relatório de Validação e Calibração Real do Matching V3 (Fase 6)

## Executive Summary
A **Fase 6** teve como missão exclusiva avaliar o comportamento, a acurácia ordinal, a estabilidade e a sensibilidade do `CareerMatchEngineV3` sob condições realistas e variadas, **sem qualquer alteração prematura ou desnecessária no motor de cálculo**.

Os resultados empíricos demonstraram que o `CareerMatchEngineV3` opera com **100% de determinismo**, **0 regressões nos Golden Cases**, **100% de acurácia ordinal no dataset realista de 24 cenários**, **0 falsos positivos críticos**, **0 falsos negativos críticos** e um rendimento de mais de **37.000 avaliações de vagas por segundo** (~0.027ms/vaga).

Portanto, o parecer final é: **🟢 ENGINE APPROVED (Congelamento do Motor V3)**.

---

## Engine Baseline
- **Snapshot Gerado**: [`matching_v3_snapshot.json`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/matching_v3_snapshot.json)
- **Versão**: `CareerMatchEngineV3`
- **Pesos Determinísticos**:
  - *Fit Score*: Competências (35%), Experiência (25%), Senioridade (15%), Domínio/Contexto (15%), Modalidade/Local (10%).
  - *Goal Score*: Alinhamento de Cargo-Alvo (35%), Competências Transferíveis (25%), Conexão Setorial (15%), Oportunidade de Aprendizado (15%), Trajetória de Senioridade (10%).
- **Dimensões**: 5 dimensões independentes desacopladas de heurísticas estocásticas ou scores paralelos.

---

## Dataset de Validação Realista (24 Cenários)
O dataset [`tests/fixtures/realWorldMatchingCases.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/tests/fixtures/realWorldMatchingCases.ts) cobriu 6 grupos de casos reais/realistas anonimizados:
1. **Grupo A — Continuidade (4 casos)**: CSM Sr → CSM Sr, CSM B2B → CSM B2B, PM → PM, Backend Dev → Backend Dev.
2. **Grupo B — Promoção (4 casos)**: CSM Pl → CSM Sr, CSM Sr → CS Lead, Product Analyst → PM, Dev Pleno → Tech Lead.
3. **Grupo C — Transição Próxima (4 casos)**: CS → PM, CS → Product Ops, Ops → Project Manager, Sales → CS.
4. **Grupo D — Transição Moderada (4 casos)**: Legal → Privacy/DPO, Ops → Product, Marketing → CS, Finance → Ops.
5. **Grupo E — Transição Distante / Incompatíveis (4 casos)**: Backend Dev → Enfermeiro UTI, Advogado → Eng. Civil, Designer → Médico, Operador de Caixa → Cloud Architect.
6. **Grupo F — Dados Incompletos / Resiliência (4 casos)**: CV sem experiências, Vaga sem requisitos, Vaga sem senioridade, Descrições curtas.

---

## Golden Case Regression
- **Execução**: [`scripts/phase6_golden_regression.mjs`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/scripts/phase6_golden_regression.mjs)
- **Total de Golden Cases**: 7 casos
- **Aprovados**: 7/7 (100%)
- **Regressões**: 0
- **Evidência**: [`reports/phase6_golden_regression.json`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/reports/phase6_golden_regression.json)

---

## False Positives & False Negatives Audit
- **Falsos Positivos Críticos**: 0
  - Vagas incompatíveis (ex: Advogado para Engenheiro Civil ou Dev para Enfermeiro UTI) receberam invariavelmente `Fit <= 19%` e `Goal <= 46%`, com classificação estrita de `Transição Distante`.
- **Falsos Negativos Críticos**: 0
  - Transições com competências transferíveis mapeadas (ex: CS para PM ou Operações para Projetos) receberam `Goal >= 72%` e `Fit` moderado coerente.
- **Acurácia Ordinal Global**: **100.0% (24/24)**.

---

## Skill Genericity Audit
- O motor utiliza diferenciação de peso entre *Hard Skills/Domínio Técnico* (peso 35%) e *Contexto Geral*.
- Ter competências genéricas como "Comunicação" ou "Organização" não infla vagas altamente técnicas (ex: Cloud Architect ou Engenheiro Civil) além de 10-19%.

---

## Seniority Audit
- Saltos de 1 nível de senioridade (Pleno → Senior ou Senior → Lead) mantêm `GoalScore` alto (~75-80%) e reduzem o `FitScore` de forma gradual e determinística (-9% a -15%), refletindo que a pessoa está pronta para o próximo passo.
- Saltos de múltiplos níveis ou cargos executivos sem histórico prévio sofrem penalização determinística pela matriz de senioridade.

---

## Transition Audit
- Todas as classificações de transição (`none`, `near`, `moderate`, `challenging`, `distant`) respeitam o índice de gap funcional e competências transferíveis.
- Nenhuma anomalia de transição foi detectada.

---

## Confidence Audit
- `confidenceScore` varia organicamente entre 40% (currículos muito curtos ou vagas vazias) e 85-95% (currículos detalhados e vagas com requisitos explícitos).
- Não houve ocorrência de *false confidence* (scores altos com dados faltantes).

---

## Sensitivity Analysis
- **Script**: [`scripts/phase6_sensitivity_analysis.mjs`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/scripts/phase6_sensitivity_analysis.mjs)
- **Remoção de Hard Skill Crítica (Node.js)**: Δ Fit = -12%, Δ Goal = -11%.
- **Mudança de Senioridade (Pleno → Lead)**: Δ Fit = -9%.
- **Mudança de Objetivo (Backend → Enfermagem)**: Δ Goal = -28%, Δ Fit = 0% (isolamento perfeito).
- **Variações irrelevantes (espaçamento/caixa alta)**: Δ Fit = 0% (robustez total).

---

## Determinism
- **Execuções**: 2.400 chamadas (100 iterações em todos os 24 casos).
- **Falhas de Determinismo**: 0 (100% idêntico bit a bit).

---

## Performance
- **1 Vaga**: 0.0535ms (~18.699 vagas/s)
- **10 Vagas**: 0.0359ms/vaga (~27.888 vagas/s)
- **50 Vagas**: 0.0397ms/vaga (~25.171 vagas/s)
- **100 Vagas**: 0.0377ms/vaga (~26.537 vagas/s)
- **500 Vagas**: 0.0269ms/vaga (~37.153 vagas/s)

---

## AI Coach & Explanation Consistency
- Coerência total entre os vereditos do Coach (`🟢 Sim`, `🟡 Ajustar antes`, `🔴 Match baixo`) e as explicações textuais geradas pelo V3.
- Sem scores numéricos paralelos no Coach.

---

## Telemetry Privacy (Zero PII)
- Testado e validado em [`tests/unit/analyticsPrivacy.test.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/tests/unit/analyticsPrivacy.test.ts).
- Todos os eventos emitem apenas metadados agregados e anônimos.

---

## Bugs e Riscos Restantes
- **Bugs Encontrados no Engine**: 0
- **Alterações no Engine**: Nenhuma necessária. O algoritmo permaneceu 100% intacto.

---

## Final Decision

### 🟢 ENGINE APPROVED (Congelamento do Motor V3)
O motor `CareerMatchEngineV3` é matematicamente robusto, determinístico, veloz e expressa fielmente a proposta de valor do VoCentro para candidatos reais.
