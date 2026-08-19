# Integridade do Funil e Contagem de Usuários Únicos — Fase 7

## 1. Regra Inviolável: Contagem por Usuário Único
Todas as taxas de conversão de funil no VoCentro são calculadas sobre **cardinalidade de usuários únicos**, nunca sobre contagem bruta de eventos:

```
[1. Cadastro (profiles)]
      ↓  (uploadedResume / totalRegistered * 100)
[2. Currículo (resumes)]
      ↓  (viewedMatch / uploadedResume * 100)
[3. Match (matches / analytics_events)]
      ↓  (appliedOrSaved / viewedMatch * 100)
[4. Candidatura (applications)]
      ↓  (proConverted / totalRegistered * 100)
[5. Assinatura Pro (billing_transactions)]
```

## 2. Deduplicação e Proteção contra Inflação de Métricas
- Se um usuário abrir 15 vagas ou calcular 30 matches, ele é computado como **1 único usuário ativo** na etapa de Match.
- Se um usuário mover 10 vezes um card no Kanban, ele é computado como **1 único usuário ativo** na etapa de Candidatura.
- Usuários internos (`@vocentro.com.br`, `admin@`, `test`, `qa`, `is_test_account: true`) são expurgados antes da contagem.
