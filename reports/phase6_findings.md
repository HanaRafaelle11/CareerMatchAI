# Relatório de Achados Forenses (Findings) — Fase 6.1

## 1. Inventário de Findings Auditados

### FINDING F6.1-01: Mocks em Fallbacks de Serviços Administrativos
- **Classificação**: P1 — Impacto Alto
- **Evidência**: `FeatureAdoptionService`, `ProductHealthService`, `ChurnIntelligenceService`, `CommercialIntelligenceService`, `CopilotInsightsService` e `ProductAtRiskService` continham métodos `getMock*` com contagens falsas acionados quando `rawProfiles.length <= 1`.
- **Causa Raiz**: Código herdado de prototipagem offline inicial.
- **Risco**: Exibição de dados sintéticos para o operador administrativo quando a base de produção possuía poucos registros reais.
- **Recomendação**: Substituir todos os `getMock*` por `getEmpty*` com contagens `0` reais e arrays vazios.
- **Status**: **RESOLVIDO / CORRIGIDO**.

---

### FINDING F6.1-02: Dados de Usuário Mockados em Detalhes de Admin
- **Classificação**: P1 — Impacto Alto
- **Evidência**: Função `getMockUserDetails` em `AdminDashboard.tsx` gerava empresas e aplicações falsas (`Vercel`, `Stripe`) e tokens artificiais (`8500`).
- **Causa Raiz**: Fallback para ambiente local offline.
- **Risco**: Confusão de auditoria de suporte ao inspecionar perfis reais no painel de administração.
- **Recomendação**: Substituir por `getEmptyUserDetails` retornando arrays vazios.
- **Status**: **RESOLVIDO / CORRIGIDO**.

---

### FINDING F6.1-03: Multiplicadores Artificiais de WAU/DAU em ProductHealthService
- **Classificação**: P2 — Impacto Médio
- **Evidência**: Multiplicadores `Math.round(allProfiles.length * 0.6)` e `Math.round(wau * 0.35)` em `ProductHealthService.ts`.
- **Causa Raiz**: Estimativa heurística para preencher dashboards vazios.
- **Risco**: Inflar artificialmente o WAU e DAU.
- **Recomendação**: Utilizar contagem estrita de sets de usuários ativos nos períodos rolling de 24h e 7d.
- **Status**: **RESOLVIDO / CORRIGIDO**.
