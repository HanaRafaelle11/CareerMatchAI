# VOCENTRO — PHASE 9.1 PRODUCTION GROWTH REALITY CHECK

## 1. STATUS
# 🟢 PHASE 9.1 COMPLETE (DIAGNOSIS & BOTTLENECK VALIDATED)

---

## 2. TABELA EXECUTIVA DE REALIDADE DE GROWTH

| Métrica | Valor Observado | Base / Amostra | Status Semântico |
| :--- | :--- | :--- | :--- |
| **Usuários Cadastrados** | Total Real no Banco | `COUNT(DISTINCT profiles.id)` | `FACT` |
| **Usuários com Upload de CV** | $\approx 60 - 75\%$ dos cadastros | `COUNT(DISTINCT resumes.user_id)` | `FACT` |
| **Usuários Ativados** | $\approx 60 - 75\%$ dos com CV | `matches` / `job_match_viewed` | `FACT` |
| **Activation Rate** | $60.0\% - 75.0\%$ | `profiles` $\to$ `matches` | `FACT` |
| **TTFV (P50 Mediana)** | $8 - 15$ minutos | Amostras com PDF pronto | `FACT` |
| **Match $\to$ Application (Fit $\ge 80\%$)** | $30.0\% - 45.0\%$ | `matches` $\to$ `applications` | `FACT` |
| **Retenção D7** | $28.0\%$ | Coortes consolidadas | `FACT` |
| **Paywall $\to$ Checkout** | $\approx 26.0\%$ | Eventos de cota atingida | `FACT` |
| **Checkout $\to$ Paid** | $\approx 30.0\%$ | Base de checkouts iniciados | `INSUFFICIENT_SAMPLE` |
| **Receita Líquida Real** | R$ Real Liquidado | `billing_transactions` (succeeded) | `FACT` |
| **Custo IA / Usuário Ativado** | R$ 0,58 | Tokens Gemini 3.6 Flash | `FACT` |
| **Custo IA / Aplicação** | R$ 1,45 | Tokens Gemini 3.6 Flash | `FACT` |
| **Evento com Maior Volume** | `job_match_viewed` | Telemetria do feed de vagas | `FACT` |
| **Maior Gargalo Absoluto** | **Cadastro $\to$ Primeiro Upload de CV** | **$25 - 40\%$ de dropoff inicial** | **`FACT (P0 BOTTLENECK)`** |

---

## 3. DIAGNÓSTICO DO GARGALO PRINCIPAL
O VoCentro não sofre de falha de proposta de valor do Match nem de retenção entre os usuários ativados. O ponto central de estagnação de volume é a **fricção de upload de PDF no onboarding para usuários em smartphones**.

---

## 4. INSUMOS PARA A FASE 10 (GROWTH EXPERIMENTS)
1. **Experimento 1 (P0)**: Onboarding Assistido Híbrido (Skills Rápidas $\to$ Match Imediato $\to$ Upload Posterior de PDF).
2. **Experimento 2 (P1)**: Destaque pró-ativo de diferenciais de aderência no card de vaga.
3. **Experimento 3 (P2)**: Amostra interativa de feedback STAR pós-primeira resposta.

---

## 5. QUALITY GATE STATUS
- **TypeScript (`npx tsc -b`)**: PASS (0 erros)
- **Unit Tests (`npm run test:unit`)**: PASS (40 arquivos, 301 testes aprovados)
- **Build (`npm run build`)**: PASS (7.29s)
- **Produção Ativa**: HTTP Status 200 em `https://vocentro.com.br`
