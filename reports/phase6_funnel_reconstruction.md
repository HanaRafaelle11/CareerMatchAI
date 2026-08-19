# Reconstrução Forense do Funil Real — Fase 6.1

## 1. Princípio de Contagem: Usuários Únicos
O cálculo de conversão e transição entre etapas é estritamente baseado na cardinalidade de conjuntos de `user_id` únicos, nunca na contagem bruta de eventos:

$$\text{Taxa da Etapa } i = \frac{|\{u \in U_{\text{real}} : u \text{ completou Etapa } i\}|}{|\{u \in U_{\text{real}} : u \text{ completou Etapa } i-1\}|} \times 100$$

## 2. Funil de Ativação do Candidato

| Etapa | Critério de Entrada | Fonte / Tabela | Tipo de Contagem | Invariante |
| :--- | :--- | :--- | :--- | :--- |
| **1. Cadastro** | Perfil criado e autenticado | `profiles` | `COUNT(DISTINCT user_id)` | Base Universo |
| **2. Currículo** | Ao menos 1 currículo salvo | `resumes` | `COUNT(DISTINCT user_id)` | $\le \text{Cadastros}$ |
| **3. Match** | Ao menos 1 match gerado | `matches` / `analytics_events` | `COUNT(DISTINCT user_id)` | $\le \text{Currículos}$ |
| **4. Ação/Kanban** | Ao menos 1 vaga salva ou aplicada | `applications` | `COUNT(DISTINCT user_id)` | $\le \text{Matches}$ |
| **5. Pro** | Assinatura paga confirmada | `billing_transactions` | `COUNT(DISTINCT user_id)` | $\le \text{Cadastros}$ |

## 3. Funil Comercial e Paywall

| Etapa | Evento Disparado | Persistência | Idempotência |
| :--- | :--- | :--- | :--- |
| **Free** | Conta free ativa | `profiles.role = 'user'` | Estado nativo |
| **Paywall Viewed** | `paywall_viewed` | `analytics_events` | 1 por abertura de modal |
| **Checkout Started** | `checkout_started` | `analytics_events` | 1 por início de checkout |
| **Payment Confirmed** | `payment_confirmed` | Webhook Stripe/Asaas -> `billing_transactions` | Idempotency Key via `event.id` do gateway |
| **Subscription Active** | Status `active` | `billing_subscriptions` | Transacional |

Nenhum evento `checkout_started` é computado como receita ou conversão Pro antes da confirmação do webhook do gateway.
