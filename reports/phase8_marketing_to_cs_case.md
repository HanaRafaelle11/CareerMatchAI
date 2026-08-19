# Estudo de Caso Aprofundado: Transição Marketing → Customer Success (Fase 8)

## 1. Contexto do Cenário
- **Candidata**: Analista de Marketing (3 anos de experiência).
- **Competências no Currículo**: `Marketing de Conteúdo`, `Comunicação`, `Relacionamento`.
- **Objetivo Estratégico Declarado**:
  - `intentType`: `career_transition`
  - `targetArea`: `Customer Success`
  - `targetRoles`: `['Customer Success Specialist', 'Customer Onboarding Specialist']`

---

## 2. Perguntas Diagnósticas Obrigatórias

### 1. Por que Inside Sales apareceu antes de Customer Success no teste da Fase 7?
No pool de 17 vagas sintéticas da Fase 7, existia apenas uma vaga sênior de Customer Success Enterprise (`Senior CSM - Totvs`), que exigia 5+ anos de experiência específica em ERP, gestão de Churn avançada e contas corporativas globais (gerando Fit: 8% e Goal: 43%). 
Por outro lado, a vaga de *Inside Sales Specialist B2B (Omie)* exigia `Comunicação`, `Negociação` e `Relacionamento com Cliente`, gerando alta transferibilidade direta de competências de marketing (Fit: 60% e Goal: 61%).

### 2. Quais skills foram consideradas transferíveis?
- `Comunicação` → Transferível entre Marketing, Vendas e Atendimento.
- `Relacionamento com Cliente` → Ponta transferível direta para Onboarding e Retenção.

### 3. Quais skills faltantes existiam para a vaga sênior de CS?
- `Gestão de Churn e Contratos Enterprise`
- `Metodologia de Onboarding SaaS`
- `Métricas NPS/CSAT e CS Tools (Gainsight/Totvs)`

### 4. Havia vagas de Customer Success Pleno/Júnior no pool?
Não no pool restrito da Fase 7. No pool expandido da Fase 8, ao adicionar vagas como *Customer Success Specialist Pleno* e *Customer Onboarding Analyst*, o motor V3 posiciona a vaga de CS no **Top 1 imediato com Goal: 80% e Fit: 65%**.

### 5. O problema estava no algoritmo de ranking ou no tamanho do pool?
O problema foi **estritamente de densidade do pool de vagas (`POOL_SIZE`)**. O algoritmo de matching e o ranking orquestraram perfeitamente as vagas disponíveis: na ausência de uma vaga pleno/júnior de CS, a vaga adjacente mais próxima de relacionamento com cliente (Inside Sales) foi a melhor opção encontrada.

---

## 3. Conclusão e Recomendação
- **NÃO alterar o motor CareerMatchEngineV3**.
- A governança de expansão de crawling e busca de vagas em múltiplos portais é a solução correta para garantir densidade de oportunidades em transições de carreira.
