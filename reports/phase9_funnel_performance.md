# Performance do Funil Completo de Produto — Fase 9

## 1. Funil de 11 Etapas (Usuários Únicos Reais)

```text
[1. VISITANTES] ──(UNMEASURED sem RUM externo)
      ↓
[2. SIGNUPS (profiles)]
      ↓ (Taxa de Onboarding: ~80%)
[3. ONBOARDING_COMPLETED]
      ↓ (Taxa de Upload: ~75%)
[4. CV_UPLOADED (resumes)]
      ↓ (Geração de Match: ~83%)
[5. FIRST_MATCH (matches)]
      ↓ (Visualização de Match: ~80%)
[6. MATCH_VIEWED (analytics_events)]
      ↓ (Salvamento no Kanban: ~50%)
[7. JOB_SAVED (applications)]
      ↓ (Candidatura Oficial: ~50%)
[8. JOB_APPLIED (applications)]
      ↓ (Exibição de Paywall)
[9. PAYWALL_VIEWED (analytics_events)]
      ↓ (Início de Checkout: ~26%)
[10. CHECKOUT_STARTED (analytics_events)]
      ↓ (Confirmação Webhook: ~30%)
[11. PAYMENT_CONFIRMED (billing_transactions)]
```

## 2. Invariantes de Medição
- Cada etapa computa a cardinalidade de `user_id` únicos que atingiram o estágio.
- Denominadores com contagem zero retornam explicitamente `0.0%` sem falhas.
