# Casos de Teste Determinísticos (Golden Cases) — Fase 6.1

## 1. Inventário dos 20 Golden Cases de Analytics
Arquivo de teste: [`tests/unit/analyticsGoldenCases.test.ts`](file:///c:/Users/Sthephany/Projetos/CareerMatchAI/tests/unit/analyticsGoldenCases.test.ts)

1. **Cenário 1**: DAU com usuário único emitindo 1 evento nas últimas 24h.
2. **Cenário 2**: Usuário único emitindo múltiplos eventos na mesma janela temporal (deduplicação estrita).
3. **Cenário 3**: Usuário ativo em múltiplas sessões com IDs de sessão distintos.
4. **Cenário 4**: Evento duplicado por retry de rede (idempotência de user_id).
5. **Cenário 5**: Evento registrado exatamente na fronteira de 24h (23h59min).
6. **Cenário 6**: Evento registrado fora da janela de 24h (25h atrás) — incluído em WAU/MAU mas excluído de DAU.
7. **Cenário 7**: Exclusão de contas internas com domínio `@vocentro.com.br` ou `admin@`.
8. **Cenário 8**: Exclusão de contas de teste marcadas com `is_test_account: true` ou nomes `teste/qa/demo/example/e2e`.
9. **Cenário 9**: Base de dados vazia (retorno de 0 legítimo e taxas 0.0% sem crash).
10. **Cenário 10**: Erro de conexão com banco de dados encapsulado em `AnalyticsResult.error`.
11. **Cenário 11**: Rejeição de evento inválido sem campos obrigatórios pelo `AnalyticsEventValidator`.
12. **Cenário 12**: Bloqueio compulsório de PII/segredos (`password`, `cpf`, `credit_card`, `token`).
13. **Cenário 13**: Checkout iniciado sem pagamento confirmado (não computado como receita Pro).
14. **Cenário 14**: Pagamento duplicado do mesmo usuário (deduplicação de assinante ativo).
15. **Cenário 15**: Assinatura cancelada (usuário não computado como assinante Pro ativo).
16. **Cenário 16**: TTFV com timestamp negativo (descarte seguro da anomalia).
17. **Cenário 17**: TTFV para candidato sem nenhum cálculo de Match (amostra válida desconsiderada sem distorção).
18. **Cenário 18**: Requisição de IA com erro registrada em log sem contaminação de custo.
19. **Cenário 19**: Requisição de IA com 0 tokens computada com custo zero (R$ 0,00).
20. **Cenário 20**: Cálculo determinístico dos percentis P50, P75 e P90 do TTFV.

## 2. Resultado da Execução
Todos os 20 casos foram executados via Vitest com **100% de aprovação** (0 falhas).
