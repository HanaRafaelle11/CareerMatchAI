# Casos de Teste Determinísticos (Golden Cases) — Fase 8

## 1. Inventário dos 61 Golden Cases
Arquivo oficial: [`tests/unit/analyticsGoldenCases.test.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/tests/unit/analyticsGoldenCases.test.ts)

### Bloco 1: Analytics Core & Rolling Windows (Casos 1 a 20)
1. **Caso 1**: DAU com 10 eventos de 3 usuários $\longrightarrow$ DAU = 3.
2. **Caso 2**: WAU com usuários entre 1 e 7 dias.
3. **Caso 3**: MAU com usuários entre 8 e 30 dias (expurgando $>30$ dias).
4. **Caso 4**: Invariante natural $DAU \le WAU \le MAU$.
5. **Caso 5**: Stickiness com 2 DAU e 10 MAU $\longrightarrow$ 20.0%.
6. **Caso 6**: Stickiness com base vazia $\longrightarrow$ 0.0% sem NaN.
7. **Caso 7**: Deduplicação estrita de 100 eventos do mesmo usuário $\longrightarrow$ 1 usuário.
8. **Caso 8**: Filtro universal de contas de teste e internas.
9. **Caso 9**: TTFV com percentis P50, P75, P90 e média determinística.
10. **Caso 10**: TTFV com lista vazia $\longrightarrow$ 0 sem erro.
11. **Caso 11**: Custos de IA por tokens de input e output com quebra por feature.
12. **Caso 12**: Freshness (<5m fresh, 5-30m aging, >30m stale).
13. **Caso 13**: Validação de evento canônico com schema correto.
14. **Caso 14**: Rejeição de PII no payload (`password`, `cpf`, `token`).
15. **Caso 15**: Rejeição de evento sem nome ou data inválida.
16. **Caso 16**: Envelope `AnalyticsResult` preservando status de erro sem mascarar como 0.
17. **Caso 17**: Fronteira exata de 24h (23h59min conta em DAU, 24h01min não).
18. **Caso 18**: Resiliência a `user_id` nulo ou datas corrompidas.
19. **Caso 19**: Custo zero quando tokens = 0.
20. **Caso 20**: Exclusão de contas corporativas internas (`@vocentro.com.br`).

### Bloco 2: Funil Real & Conversão de Usuários Únicos (Casos 21 a 30)
21. **Caso 21**: Funil canônico de 5 etapas com contagem de usuários únicos.
22. **Caso 22**: Funil com zero cadastros $\longrightarrow$ 0% para todas as taxas.
23. **Caso 23**: Cálculo exato de dropoff rate entre etapas.
24. **Caso 24**: Invariante de não-inversão de etapas de funil.
25. **Caso 25**: Conversão D0 (ativação em até 24h).
26. **Caso 26**: Coorte semanal ISO (`YYYY-Www`).
27. **Caso 27**: Retenção D7 (atividade no 7º dia).
28. **Caso 28**: Retenção D30 (atividade no 30º dia).
29. **Caso 29**: Taxa de conversão Pro global baseada em usuários reais.
30. **Caso 30**: Resistência do P50 (Mediana) a outliers extremos de tempo.

### Bloco 3: Reconciliação Financeira & Gateways (Casos 31 a 40)
31. **Caso 31**: Checkout iniciado NÃO é computado como receita.
32. **Caso 32**: Receita Bruta (Gross Revenue) vs Líquida (Net Revenue).
33. **Caso 33**: Deduplicação de webhook duplicado por idempotency key.
34. **Caso 34**: Assinatura cancelada não conta como usuário Pro ativo.
35. **Caso 35**: ARPPU (Average Revenue Per Paying User).
36. **Caso 36**: ARPPU com zero pagantes $\longrightarrow$ 0.00 sem crash.
37. **Caso 37**: Reconciliação multigateway (Stripe + Asaas).
38. **Caso 38**: Pagamento recusado não incrementa assinantes Pro.
39. **Caso 39**: Transação com estorno (chargeback) computa saldo negativo.
40. **Caso 40**: Conversão de moeda oficial (Câmbio BRL 5.80 / USD).

### Bloco 4: Telemetria, Entrega & Idempotência (Casos 41 a 50)
41. **Caso 41**: Prevenção de duplo clique com debounce na UI.
42. **Caso 42**: Re-render do React não gera evento duplicado na mesma sessão.
43. **Caso 43**: Fila offline (`localDB`) retendo eventos em queda de rede.
44. **Caso 44**: Replay da fila offline após reconexão.
45. **Caso 45**: Ordem cronológica dos eventos preservada (FIFO).
46. **Caso 46**: Concorrência multi-aba compartilhando sessão.
47. **Caso 47**: Expiração de sessão após inatividade (TTL 30 min).
48. **Caso 48**: Logout/Login gerando novo Session ID.
49. **Caso 49**: Limite máximo de retenção da fila offline (500 itens).
50. **Caso 50**: Sanitização automática de chaves proibidas no payload.

### Bloco 5: Data Quality, Observabilidade & Anomalias (Casos 51 a 61)
51. **Caso 51**: Violação $DAU > MAU$ detectada como anomalia crítica.
52. **Caso 52**: Violação $WAU > MAU$ detectada como anomalia crítica.
53. **Caso 53**: Pagamentos confirmados > checkouts iniciados detectado como anomalia.
54. **Caso 54**: Receita negativa sem estorno detectada como anomalia.
55. **Caso 55**: Cálculo formal do Data Quality Score (Completeness, Freshness, Validity, Uniqueness, Delivery).
56. **Caso 56**: Semântica de 5 estados: `SUCCESS`, `EMPTY`, `ERROR`, `UNMEASURED`, `STALE`.
57. **Caso 57**: Semântica de `EMPTY` retornando 0 legítimo sem erro.
58. **Caso 58**: Semântica de `ERROR` preservando mensagem técnica.
59. **Caso 59**: Semântica de `UNMEASURED` para métricas sem instrumentação.
60. **Caso 60**: Semântica de `STALE` para timestamps além da tolerância.
61. **Caso 61**: Alerta de queda abrupta de volume ($>80\%$).

## 2. Resultado da Execução
Todos os 61 testes foram executados via Vitest com **100% de aprovação (0 falhas)**.
