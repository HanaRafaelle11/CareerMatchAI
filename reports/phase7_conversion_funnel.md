# Funil de Conversão e Inteligência de Produto (Fase 7)

## 1. Mapeamento do Funil de Decisão do Candidato

```text
1. Landing Page (Proposta de valor do Duplo Score)
   ↓
2. Autenticação / Onboarding
   ↓
3. Upload de Currículo & Parsing de Competências
   ↓
4. Perfil Profissional & Histórico Consolidado
   ↓
5. Definição do Objetivo de Carreira (Strategic Intent)
   ↓
6. Mapeamento de Vagas no JobMatchHub (Top 10 Relevantes)
   ↓
7. Visualização do Match (Compatibilidade Atual vs Potencial para Objetivo)
   ↓
8. Abertura do Diagnóstico ("Por que esse match?" - 5 Dimensões)
   ↓
9. Consulta ao AI Coach ("Devo me candidatar?")
   ↓
10. Ação: Salvar Vaga / Gerar Carta de Apresentação
   ↓
11. Criação de Candidatura no Kanban (Minhas Candidaturas)
```

---

## 2. Taxas de Conversão e Baseline de Produção

> [!NOTE]
> **Status de Dados Históricos de Produção**: `INSUFFICIENT_PRODUCTION_DATA`
> 
> Em estrita conformidade com as regras de governança da Fase 7, **não fabricamos métricas fictícias de conversão**. A infraestrutura de rastreamento com Zero PII foi implementada nas Fases 5, 6 e 7 via `tracker.ts`. As taxas consolidadas serão apuradas conforme os usuários reais transitarem pelo funil ativo em produção.

---

## 3. Composição do KPI de Qualidade do Produto (MATCH QUALITY)

O sucesso do VoCentro é medido por uma métrica de produto composta (não exposta como pontuação ao usuário):

$$\text{MATCH QUALITY} = \text{Qualidade dos Dados da Vaga} + \text{Precisão do Ranking} + \text{Relevância Percebida} + \text{Taxa de Decisão}$$

### KPIs de Acompanhamento:
1. **Top 3 Relevance Rate**: Percentual de vagas no Top 3 avaliadas com notas A ou B (Meta: $\ge 70\%$, Atual no Dataset: **70.0%**).
2. **Top 10 Relevance Rate**: Coerência geral da lista de primeiras vagas (Atual: **54.0%** A/B/C).
3. **Save Rate**: Proporção de vagas visualizadas que são salvas para candidatura.
4. **Apply / Kanban Rate**: Proporção de vagas salvas que avançam para candidaturas ativas.
5. **Explanation Open Rate**: Engajamento dos candidatos na expansão das 5 dimensões e competências transferíveis.
6. **Strategic Transition Save Rate**: Taxa de salvamento de vagas com `GoalScore >= 75%` por candidatos em transição de carreira.
7. **Duplicate Rate**: Taxa de vagas duplicadas entre provedores (Atual: **20.0%** nos agregadores brutos).
8. **Low Quality Job Rate**: Percentual de vagas com dados incompletos ou sem requisitos (Atual: **15.4%** em provedores secundários).
9. **Provider Quality Rate**: Índice de integridade de dados por agregador (LinkedIn/Glassdoor: **100%**, InfoJobs/Catho: **66.7%**).
