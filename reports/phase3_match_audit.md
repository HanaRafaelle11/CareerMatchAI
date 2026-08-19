# 🔎 AUDITORIA PROFUNDA DO MATCH E SCORES — FASE 3 (VOCENTRO)

**Produto**: VoCentro  
**Data**: Agosto de 2026  
**Status**: `CONCLUÍDO & CONSOLIDADO`  

---

## 1. 🚨 INVESTIGAÇÃO DO PROBLEMA DE DIVERGÊNCIA (90% VS 88%)

### Causa Raiz Identificada
1. **Origem**: Na camada legada `MatchingEngine.calculateMatchSync`, era calculado um `scoreOverall` heurístico legado (ex: `90%`). Embora o motor chamasse `CareerMatchEngineV3.calculate`, ele retornava `scoreOverall` (90%) separado de `careerFitScore` (88%).
2. **Propagação**: `buildJobMatchScore` em `UnifiedMatchService.ts` recebia `totalScore` legado sem priorizar `match.careerFitScore`, repassando `90%` para os contadores e radar charts em `JobMatchHub.tsx`.
3. **Consumo**: `HumanizedMatchCard.tsx` executava o `CareerMatchEngineV3` diretamente, obtendo `88%`, enquanto o cabeçalho/card da página exibia `90%`.

### Correção Implementada (Menor Superfície Possível)
1. **Alinhamento em `matchingEngine.ts`**: `scoreOverall` retornado por `calculateMatchSync` agora recebe `officialFitScore = v3Result?.careerFitScore ?? scoreOverall`.
2. **Single Source of Truth em `UnifiedMatchService.ts`**: `buildJobMatchScore` agora utiliza `effectiveScore = match?.careerFitScore ?? (explanation as any)?.careerFitScore ?? totalScore`.
3. **Alinhamento em `JobMatchHub.tsx`**: `currentJobMatchScore` agora consome prioritariamente `currentSelectedMatch?.careerFitScore`.

---

## 2. 📊 CLASSIFICAÇÃO OFICIAL DE SCORES DO PRODUTO

| Nome do Score | Classificação | Exibido na UI? | Contexto |
|---|---|---|---|
| **Career Fit Score** | `A - Score Oficial` | Sim | "Compatibilidade Atual" — quanto a vaga combina com a experiência atual. |
| **Career Goal Score** | `C - Score Complementar` | Sim (se houver objetivo) | "Potencial para Objetivo / Transição" — quanto a vaga aproxima o candidato do objetivo. |
| **Ranking Score** | `B - Score Interno` | Não | Usado exclusivamente pelo `ProductJobRankingService` para ordenar a lista. |
| **Dimensões Qualitativas (5)** | `Explicativo Qualitativo` | Sim (expansível) | Competências, Experiência, Senioridade, Requisitos, Contexto. |
