# 🧪 PLANO DE TESTES DE COMPORTAMENTO DE PRODUTO (BEHAVIORAL QA) — FASE 13

**Objetivo**: Proteger os 10 comportamentos fundamentais do produto através de testes orientados a comportamento (Behavior-Driven Testing), garantindo que futuras refatorações arquiteturais não causem regressões funcionais.

---

## 1. MATRIZ DE COMPORTAMENTOS PROTEGIDOS

| # | Comportamento Chave | Teste Unitário Associado | Critério de Aceite Inviolável |
|---|---|---|---|
| **1** | **Busca de Vagas** | `tests/unit/real_relevance_verification.test.ts` | Busca por termos específicos respeita cascata de ocupações sem misturar famílias incompatíveis. |
| **2** | **Filtros de Modalidade** | `tests/unit/phase9FilterIntegrity.test.ts` | Filtro 'Apenas Remoto' isola estritamente vagas remotas; multimodalidade preserva opções híbridas. |
| **3** | **Deduplicação de Vagas** | `tests/unit/jobDeduplication.test.ts` | Duplicatas de múltiplos agregadores (Gupy, Greenhouse, Adzuna) são consolidadas em 1 único card. |
| **4** | **Matching Determinístico V3** | `tests/unit/careerMatchEngineV3.test.ts`, `tests/unit/goldenCasesMatchingV3.test.ts` | 7/7 Golden Cases mantêm pontuações exatas com determinismo 100%. |
| **5** | **Duplo Score & UI Contract** | `tests/unit/matchingUXContract.test.ts` | Fit Atual (Hoje) e Potencial Alvo (Transição) nunca são sobrepostos ou zerados. |
| **6** | **Persistência Round-Trip** | `tests/unit/roundTripPersistenceAndGoldenAudit.test.ts` | Engine -> Save -> Clear Cache -> Load -> Deep Compare sem perda de campos estruturais. |
| **7** | **Isolamento de Dados (RLS)** | `tests/unit/careerGoalsRlsIsolation.test.ts` | Usuário A nunca enxerga ou sobrescreve objetivos e histórico do Usuário B. |
| **8** | **Privacidade e Zero PII** | `tests/unit/analyticsPrivacy.test.ts` | Eventos de telemetria nunca contêm nomes, e-mails, telefones ou textos de currículos. |
| **9** | **Limites e Degustação Free** | `tests/unit/phase12ActivationAndTrial.test.ts`, `tests/unit/pro_entitlements_resilience.test.ts` | 1 simulação de entrevista STAR gratuita liberada para novos usuários; paywall acionado na 2ª tentativa. |
| **10** | **Resiliência do Pipeline** | `tests/unit/kanbanStageMoveAudit.test.ts` | Movimentação de cards no painel absorve falhas secundárias com toast único e feedback claro. |

---

## 2. COMANDOS DE EXECUÇÃO E REPRODUÇÃO

Para executar todos os testes comportamentais:

```bash
# Execução completa da suíte de testes unitários e de comportamento
npm run test:unit

# Verificação estrita de tipagem TypeScript
npx tsc -b

# Validação do build de produção
npm run build
```
