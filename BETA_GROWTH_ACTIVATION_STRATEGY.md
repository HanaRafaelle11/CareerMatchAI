# 🚀 Estratégia de Growth, Ativação & Retenção — VoCentro Beta Fechado

**Responsável**: Head of Product Growth  
**Data**: 24 de Julho de 2026  
**Status**: 🟢 **HOMOLOGADO PARA O BETA FECHADO (50 USUÁRIOS)**

---

## 🧭 1. Auditoria de Ativação & Retenção (Respostas Diretas)

### 1. O usuário entende o valor nos primeiros 60 segundos?
**SIM**. O Time-to-Value (TTV) do VoCentro é de **~6.5 segundos**. Ao arrastar o PDF do currículo, o sistema não exige o preenchimento manual de formulários longos. A IA extrai os dados e renderiza imediatamente o **Career Score de Mercado (0–100)** com os 3 cargos mais aderentes, pontos fortes e lacunas. A proposta de valor é experimentada em menos de 10% do tempo limite de 60s.

### 2. O Career Score gera confiança ou parece um número arbitrário?
**Gera alta confiança**, porque o número **nunca é apresentado de forma isolada**. Ele é ancorado em 3 pilares de evidências extraídas do próprio histórico do candidato:
- 🥇 **Cargos Mais Compatíveis no Mercado** (ex: *1º CSM Pleno, 2º CS Operations, 3º Customer Experience Lead*)
- ✓ **Pontos Fortes Confirmados** (ex: *Gestão de carteira SaaS, Redução de Churn*)
- ⚠ **Pontos a Evoluir / Gaps** (ex: *Ferramentas Enterprise como Gainsight/Salesforce*)  
Essa ancoragem transforma a pontuação em um **diagnóstico profissional tangível**.

### 3. O ranking de vagas deve usar apenas Career Fit Score ou uma fórmula composta?
**Recomendação de Growth: Fórmula Composta de Relevância de Growth**.  
Exibir uma vaga com Fit de 95% postada há 6 meses gera frustração de candidatura morta. O ranking de recomendação do buscador deve utilizar a seguinte ponderação:

$$\text{Score de Relevância} = (\text{Career Fit Score} \times 0.70) + (\text{Job Score} \times 0.20) + (\text{Atualidade} \times 0.10)$$

*Onde*:
- **Career Fit Score (70%)**: Adequação do perfil do candidato.
- **Job Score (20%)**: Confiabilidade da fonte e qualidade do anúncio no mercado.
- **Atualidade (10%)**: Anúncios publicados nos últimos 14 dias recebem multiplicador de prioridade.

### 4. Qual seria o momento "Aha!" do produto?
O Momento "Aha!" ocorre quando o candidato clica em uma vaga recomendada e o **Job Match Explanation Engine** responde em linguagem natural:
1. *"Por que essa vaga combina com você"* (listando pontos fortes exatos e justificativa de mercado).
2. *"Adaptar meu currículo para essa vaga em 1 clique"* (gerando sugestões de palavras-chave ATS aprováveis).  
Nesse instante, o usuário percebe que o VoCentro não é apenas um buscador de vagas, mas sim um **Copiloto Estratégico de Carreira**.

### 5. QUAIS EVENTOS INDICAM QUE O USUÁRIO ENCONTROU VALOR (Value Realization)?
1. `career_score_viewed`: Visualização do diagnóstico inicial pós-upload.
2. `job_match_viewed`: Consumo do diagnóstico de fit de uma vaga específica.
3. `resume_adaptation_opened`: Utilização da IA para otimização de currículo.
4. `application_started` / `application_completed`: Ação tátil de salvar ou registrar candidatura no Kanban da Jornada.

---

## 🌟 2. Métrica North Star & Árvore de KPIs de Growth

### 🏆 Métrica North Star (NSM)
> **`Weekly Active Applied Jobseekers (WAAJ)`**  
> *Número de candidatos ativos por semana que salvaram ou se candidataram a pelo menos 1 vaga com Career Fit Score > 75%.*

### 🌲 Árvore de KPIs de Suporte

```text
                        ┌──────────────────────────────────────────────┐
                        │   Weekly Active Applied Jobseekers (WAAJ)    │
                        └──────────────────────┬───────────────────────┘
                                               │
        ┌──────────────────────────────────────┼──────────────────────────────────────┐
        │                                      │                                      │
┌───────┴────────┐                     ┌───────┴────────┐                     ┌───────┴────────┐
│   Ativação     │                     │  Engajamento   │                     │   Retenção     │
│  (Activation)  │                     │  (Engagement)  │                     │  (Retention)   │
└───────┬────────┘                     └───────┬────────┘                     └───────┬────────┘
        │                                      │                                      │
  • % Signup ->                          • Média de Vagas                       • W2 Retention Rate
    Resume Upload (>75%)                   Analisadas/User (>5)                   (>40%)
  • Time to Value                        • % Clicks em "Adaptar                 • Frequência de Visitas
    (<10s)                                 Currículo" (>30%)                      na Jornada (>2x/sem)
```

---

## 🚏 3. Funil de Ativação de Growth (Benchmarks do Beta)

| Etapa do Funil | Evento Rasteado | Meta de Conversão (Benchmark Beta) |
| :--- | :--- | :---: |
| **1. Cadastro** | `signup_completed` | 100% (Base do funil) |
| **2. Upload de Currículo** | `resume_uploaded` | **> 80%** dos cadastrados |
| **3. Diagnóstico Inicial** | `career_score_viewed` | **> 95%** dos uploads |
| **4. Descoberta de Vagas** | `job_search_executed` | **> 85%** dos diagnosticados |
| **5. Consumo do Match IA** | `job_match_viewed` | **> 70%** dos buscadores |
| **6. Ativação Real (Aha!)** | `application_started` ou `completed` | **> 50%** dos que consumiram Match |

---

## 🏁 4. Critérios de Sucesso do Beta Fechado (50 Usuários)

Para declarar o Beta Fechado como **BEM-SUCEDIDO** e autorizar a abertura pública:

1. **Taxa de Ativação (Signup → Resume Upload)**: **≥ 75%**
2. **Engajamento com IA (Match Explanation consumidos por usuário)**: **≥ 3 vagas/usuário**
3. **Taxa de Retenção D7 (Retorno na 1ª semana)**: **≥ 40%**
4. **Satisfação com Recomendações (CSAT no Feedback Widget)**: **≥ 80% de avaliações POSITIVE**
5. **Estabilidade Técnica**: Zero travamentos de Edge Function e **0 erros de compilação**.

---

## 🧪 5. Matriz de Experimentos de Growth (Primeiros 50 Usuários)

### Experimento 1: Recomendações Curadas ("As 50 Melhores Vagas para Você")
- **Hipótese**: Limitar e ordenar os resultados da busca exibindo as 50 vagas de maior `Career Fit Score` aumenta a taxa de candidatura de 20% para 45% em comparação com exibir 300 vagas não ordenadas.
- **Métrica de Sucesso**: `application_completed / job_search_executed`.

### Experimento 2: Prompt de Notificação de Novo Match Relevante
- **Hipótese**: Exibir um badge discreto no cabeçalho *"3 novas vagas com Match > 85% encontradas hoje"* aumenta a taxa de retorno diário (D1/D3 Retention) em 30%.
- **Métrica de Sucesso**: Retorno diário na aba `Vagas & Match`.

### Experimento 3: Micro-copy no Botão de Otimização
- **Variante A**: *"Adaptar meu currículo para essa vaga"* (Controle)
- **Variante B**: *"Gerar Otimização ATS para essa Vaga em 1 Clique"*
- **Métrica de Sucesso**: Taxa de clique em `resume_adaptation_opened`.
