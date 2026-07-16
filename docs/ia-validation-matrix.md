# 🧠 Matriz de Validação de Qualidade da IA — Vocentro

## Objetivo

Validar que a extração do Gemini 2.5 Flash gera perfis corretos, completos e coerentes para diferentes tipos de candidatos.

---

## Critérios de Aprovação

Para cada perfil, o resultado da IA deve:

- ✅ Extrair nome completo corretamente
- ✅ Identificar headline/cargo correto
- ✅ Mapear **todas** as experiências profissionais (empresa, cargo, período)
- ✅ Não inventar empresas ou cargos que não existem no currículo
- ✅ Classificar senioridade de forma coerente (Intern → VP)
- ✅ Extrair skills técnicas e soft skills reais
- ✅ Gerar `source_type` correto (extracted, inferred, recommended)
- ✅ Gerar `confidence` entre 0.5 e 1.0

---

## Perfis de Teste

### 1. Customer Success — Sênior
| Campo | Esperado |
|---|---|
| **Headline** | Supervisora/Gerente de CS, Customer Success Manager |
| **Senioridade** | Senior ou Manager |
| **Skills** | Churn, NPS, Onboarding, CRM, Salesforce, Hubspot |
| **Indústria** | SaaS / Tecnologia |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 2. Backend Developer — Pleno
| Campo | Esperado |
|---|---|
| **Headline** | Desenvolvedor Backend, Software Engineer |
| **Senioridade** | Mid ou Senior |
| **Skills** | Node.js, Python, SQL, Docker, AWS, REST API |
| **Indústria** | Tecnologia |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 3. Frontend Developer — Júnior
| Campo | Esperado |
|---|---|
| **Headline** | Desenvolvedor Frontend, Web Developer |
| **Senioridade** | Junior ou Mid |
| **Skills** | React, TypeScript, CSS, HTML, Git |
| **Indústria** | Tecnologia |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 4. Product Manager — Sênior
| Campo | Esperado |
|---|---|
| **Headline** | Product Manager, Gerente de Produto |
| **Senioridade** | Senior ou Lead |
| **Skills** | Discovery, Roadmap, OKR, A/B Testing, Analytics |
| **Indústria** | Tecnologia / SaaS |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 5. UX Designer — Pleno
| Campo | Esperado |
|---|---|
| **Headline** | UX Designer, Designer de Produto |
| **Senioridade** | Mid ou Senior |
| **Skills** | Figma, Design Thinking, Pesquisa, Prototipagem, Wireframe |
| **Indústria** | Tecnologia / Design |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 6. Comercial / Vendas — Pleno
| Campo | Esperado |
|---|---|
| **Headline** | Executivo de Vendas, Consultor Comercial |
| **Senioridade** | Mid ou Senior |
| **Skills** | Inside Sales, Outbound, CRM, Funil de Vendas, Cold Calling |
| **Indústria** | Diversos |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 7. Marketing Digital — Júnior
| Campo | Esperado |
|---|---|
| **Headline** | Analista de Marketing, Social Media |
| **Senioridade** | Junior ou Mid |
| **Skills** | Google Ads, Meta Ads, SEO, Copywriting, Analytics |
| **Indústria** | Marketing / Comunicação |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 8. Financeiro / Controladoria — Sênior
| Campo | Esperado |
|---|---|
| **Headline** | Controller, Analista Financeiro Sênior |
| **Senioridade** | Senior ou Manager |
| **Skills** | Excel, SAP, ERP, DRE, Fluxo de Caixa, IFRS |
| **Indústria** | Finanças / Corporativo |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 9. Primeiro Emprego — Estagiário
| Campo | Esperado |
|---|---|
| **Headline** | Estagiário, Estudante |
| **Senioridade** | Intern |
| **Skills** | Poucas ou nenhuma técnica |
| **Indústria** | Genérico |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 10. Executivo / Diretor — C-Level
| Campo | Esperado |
|---|---|
| **Headline** | Diretor, VP, CEO |
| **Senioridade** | Director ou VP |
| **Skills** | Gestão, P&L, Board, M&A, Fundraising |
| **Indústria** | Diversos |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 11. Currículo em Inglês
| Campo | Esperado |
|---|---|
| **Headline** | Em inglês (Software Engineer, Data Scientist, etc.) |
| **Senioridade** | Qualquer |
| **Skills** | Em inglês |
| **Idiomas** | English — deve detectar |
| **Resultado** | |
| **Status** | ⬜ Pendente |

### 12. Currículo em Português (Brasil)
| Campo | Esperado |
|---|---|
| **Headline** | Em português |
| **Senioridade** | Qualquer |
| **Skills** | Em português e/ou inglês |
| **Idiomas** | Português — deve detectar |
| **Resultado** | |
| **Status** | ⬜ Pendente |

---

## Instruções para Execução

1. Para cada perfil acima, criar um arquivo `.txt` com um currículo fictício (ou usar um real anonimizado).
2. Fazer upload via interface do Vocentro.
3. Aguardar processamento do pipeline.
4. Comparar o resultado da IA com os critérios esperados.
5. Preencher coluna **Resultado** com o que foi efetivamente gerado.
6. Marcar **Status** como ✅ Aprovado ou ❌ Reprovado.
