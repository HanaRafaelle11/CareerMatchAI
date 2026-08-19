# Relatório de Auditoria Forense do Funil de Ativação — Fase 6

## 1. Estrutura do Funil de Ativação do Candidato
O funil de ativação do VoCentro monitora as 5 etapas críticas da jornada do candidato:

```
[1. Cadastro Concluído] 
        ↓ (Taxa de Upload)
[2. Currículo Enviado e Processado]
        ↓ (Taxa de Visualização de Match)
[3. Match / Vagas Calculadas]
        ↓ (Taxa de Candidatura / Ação)
[4. Candidatura Kanban / Vaga Salva]
        ↓ (Taxa de Conversão Pro)
[5. Assinatura Pro Confirmada]
```

## 2. Eliminação de Fórmulas e Números Mocks
Anteriormente, o `FunnelTelemetryService` possuía uma função `getFallbackMetrics()` que retornava valores artificiais (`49` cadastros, `39` currículos, `14` matches, `8` paywalls, `3` checkouts).

**Correção Aplicada:**
- Substituição por `getEmptyMetrics(excludedCount)`.
- Quando a consulta à base não encontra usuários reais ou quando não há dados, retorna legitimamente `0` e `0.0%`.
- Em caso de falha de conexão ou erro do Supabase, o serviço registra o erro e devolve o envelope de contagens limpas sem inventar métricas plausíveis.

## 3. Isolamento de Contas Internas
Todas as etapas filtram rigorosamente contas `@vocentro.com.br`, `admin@`, `test`, `qa`, `exemplo`, `example`, `demo`, `e2e` e `is_test_account: true`, garantindo que ações de desenvolvedores e automações não inflem as métricas de produto.
