# Reconciliação do Funil Canônico com Tabelas de Domínio — Fase 8

## 1. Mapeamento de Cardinalidade

| Etapa | Critério de Entrada | Fonte Oficial | Unidade de Medida | Invariante |
| :--- | :--- | :--- | :--- | :--- |
| **1. Cadastro** | Perfil criado e autenticado | `public.profiles` | `COUNT(DISTINCT user_id)` | Universo Total |
| **2. Currículo** | Ao menos 1 CV salvo | `public.resumes` | `COUNT(DISTINCT user_id)` | $\le \text{Cadastros}$ |
| **3. Match** | Ao menos 1 Match gerado | `public.matches` | `COUNT(DISTINCT user_id)` | $\le \text{Currículos}$ |
| **4. Candidatura** | Ao menos 1 vaga salva/aplicada | `public.applications` | `COUNT(DISTINCT user_id)` | $\le \text{Matches}$ |
| **5. Assinatura Pro** | Pagamento liquidado | `public.billing_transactions` | `COUNT(DISTINCT user_id)` | $\le \text{Cadastros}$ |

## 2. Reconciliação
O `AdminAnalyticsService.calculateFunnel()` executa consultas diretas sobre as 5 tabelas de domínio com exclusão de contas de teste via `AdminAuditService.isTestOrInternalAccount`, eliminando divergências com a telemetria comportamental.
