# 🎯 Matriz de Validação de Match — Vocentro

## Objetivo

Validar que o score de compatibilidade gerado pelo Gemini 2.5 Flash é **coerente** e **justificável**.

---

## Critérios de Aprovação

- ✅ Currículo compatível com a vaga → score **> 70%**
- ✅ Currículo incompatível com a vaga → score **< 40%**
- ✅ Justificativa (strengths/weaknesses) deve ser coerente com a combinação
- ✅ Missing keywords devem ser reais e relevantes
- ✅ Recommendation deve ser acionável

---

## Cenários de Teste

### Cenários de Alta Compatibilidade (score esperado: > 70%)

| # | Perfil do Candidato | Vaga | Score Esperado | Score Real | Coerente? | Status |
|---|---|---|---|---|---|---|
| 1 | Customer Success Sênior | Customer Success Manager | > 75% | | | ⬜ |
| 2 | Frontend React Pleno | Frontend Developer React | > 75% | | | ⬜ |
| 3 | Backend Node.js Sênior | Backend Engineer Node.js | > 75% | | | ⬜ |
| 4 | Product Manager | Product Manager SaaS | > 70% | | | ⬜ |
| 5 | UX Designer | UX/UI Designer | > 70% | | | ⬜ |

### Cenários de Baixa Compatibilidade (score esperado: < 40%)

| # | Perfil do Candidato | Vaga | Score Esperado | Score Real | Coerente? | Status |
|---|---|---|---|---|---|---|
| 6 | Customer Success Sênior | Desenvolvedor Java Backend | < 40% | | | ⬜ |
| 7 | Frontend React Júnior | CFO / Diretor Financeiro | < 30% | | | ⬜ |
| 8 | Estagiário Marketing | Arquiteto de Software Sênior | < 25% | | | ⬜ |
| 9 | Comercial/Vendas | Engenheiro de Dados | < 35% | | | ⬜ |
| 10 | Primeiro Emprego | VP de Engenharia | < 20% | | | ⬜ |

### Cenários de Compatibilidade Parcial (score esperado: 40-70%)

| # | Perfil do Candidato | Vaga | Score Esperado | Score Real | Coerente? | Status |
|---|---|---|---|---|---|---|
| 11 | Backend Python | Frontend React | 40-55% | | | ⬜ |
| 12 | PM Sênior | Scrum Master | 50-65% | | | ⬜ |
| 13 | CS Sênior | Analista de Dados | 30-50% | | | ⬜ |
| 14 | UX Designer | Product Manager | 45-60% | | | ⬜ |
| 15 | Marketing Digital | Growth Hacker | 55-70% | | | ⬜ |

---

## Validações Adicionais por Cenário

Para cada cenário acima, verificar:

1. **Strengths**: Os pontos fortes listados são reais e mencionados no currículo?
2. **Weaknesses**: Os gaps identificados são reais e ausentes no currículo?
3. **Missing Keywords**: As palavras-chave sugeridas são relevantes para a vaga?
4. **Interview Probability**: Está coerente com o match_score?
5. **Recommendation**: A recomendação é acionável e específica?

---

## Instruções para Execução

1. Criar perfis de teste na interface (upload de currículo para cada perfil).
2. Inserir vagas manualmente com título e descrição completos.
3. Calcular match para cada combinação candidato × vaga.
4. Preencher colunas **Score Real** e **Coerente?**
5. Marcar **Status** como ✅ Aprovado ou ❌ Reprovado.
