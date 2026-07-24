# 📊 Plano de Instrumentação & Analytics — Beta Fechado VoCentro

**Responsável**: Head de Growth SaaS B2C  
**Data**: 24 de Julho de 2026  
**Status**: 🟢 **HOMOLOGADO PARA INSTRUMENTAÇÃO DOS 50 USUÁRIOS BETA**

---

## 🎯 1. Respostas aos 5 Objetivos da Instrumentação

| Pergunta de Growth | Evento / Métrica de Resposta | Threshold de Sucesso |
| :--- | :--- | :--- |
| **1. O usuário entendeu o valor do produto?** | `career_score_viewed` + `job_match_viewed` em < 3 min do cadastro | **≥ 80%** dos cadastrados consomem o diagnóstico inicial |
| **2. O Career Score parece confiável?** | % de usuários que acessam "Ver Cargos Compatíveis" e "Pontos Fortes" | **≥ 70%** interagem com as evidências do score |
| **3. As recomendações são relevantes?** | Taxa de conversão de Busca → Clique no Match IA | **≥ 50%** das vagas exibidas resultam em abertura do Match IA |
| **4. O usuário chegou até a candidatura?** | `application_started` (Salvar) + `application_completed` (Aplicar) | **≥ 45%** dos usuários ativos salvam/candidatam-se a 1+ vagas |
| **5. O usuário voltaria a usar?** | Retenção D7 / W2 (Retorno para buscar novas vagas na semana seguinte) | **≥ 40%** de retenção W2 |

---

## 🏆 2. Métrica North Star, Eventos de Ativação & Retenção

### 👑 North Star Metric (NSM)
> **`Weekly Active Applied Jobseekers (WAAJ)`**  
> *Número de candidatos ativos por semana que salvaram (`SAVED`) ou registraram candidatura (`APPLIED`) a pelo menos 1 vaga com Career Fit Score > 75%.*

---

### ⚡ Activation Event (Evento de Ativação)
> **`Jobseeker Activated`** = `signup_completed` ➔ `resume_uploaded` ➔ `career_score_viewed` ➔ `job_match_viewed` (concluído na mesma sessão).

*Definição*: O candidato é considerado **ativado** quando faz upload do currículo, visualiza seu Career Score de Mercado e abre o diagnósitco de fit de pelo menos 1 vaga.

---

### 🔄 Retention Events (Eventos de Retenção)
- **Evento Primário de Retenção**: `application_completed` (Registrar candidatura no Kanban) ou `application_started` (Salvar vaga).
- **Evento Secundário de Retenção**: `job_search_executed` (Execução de nova busca de vagas no hub) ou `resume_adaptation_opened` (Adaptação de currículo).

---

## 🚏 3. Funil Completo de Analytics (SaaS B2C)

```text
[1. Visitante na Landing Page]
       │
       ▼ (signup_completed) - Target: 100% (Base 50 users)
[2. Conta Criada]
       │
       ▼ (resume_uploaded) - Target: > 80% (40 users)
[3. Currículo Processado + Career Score]
       │
       ▼ (career_score_viewed) - Target: > 95% dos uploads (38 users)
[4. Diagnóstico de Mercado Consumido]
       │
       ▼ (job_search_executed) - Target: > 85% dos diagnosticados (32 users)
[5. Busca de Vagas Executada]
       │
       ▼ (job_match_viewed) - Target: > 70% dos buscadores (22 users)
[6. Match IA Explicado Consumido]
       │
       ▼ (application_started / completed) - Target: > 50% dos matches (11 users)
[7. ATIVAÇÃO CONCLUÍDA & JORNADA ALIMENTADA]
```

---

## 🖥️ 4. Dashboard Ideal para os Primeiros 50 Usuários Beta

Para acompanhar a coorte em tempo real no `AdminDashboard`:

### Painel 1: Ativação & Onboarding (Funil de Conversão)
- **KPI**: % de Usuários Ativados (`Jobseeker Activated` / Total Beta Users)
- **Gráfico**: Funil de 6 etapas do cadastro até a candidatura.

### Painel 2: Confiança no Career Score
- **KPI**: Distribuição dos Career Scores (Faixas: 0–60, 61–80, 81–100)
- **Métrica**: Média de tempo gasto no card `CareerScoreDashboardCard`.

### Painel 3: Relevância & Aderência de Vagas
- **KPI**: Proporção de Ações (Salvas vs. Candidatadas vs. Rejeitadas)
- **Gráfico**: Distribuição de Motivos de Rejeição (`Salário baixo`, `Senioridade incompatível`, `Requisitos sem relação`).

### Painel 4: Retenção & Frequência
- **KPI**: Cohort D1, D3, D7, D14 Retention Rate
- **Métrica**: Média de visualizações de Match IA por usuário/semana.

### Painel 5: Satisfação Qualitativa (Net Sentiment)
- **KPI**: CSAT do Widget Beta (% Positivos vs. Negativos)
- **Feed**: Últimos comentários e sugestões gravados na tabela `beta_feedback`.

---

## 💬 5. Roteiro de Entrevista Qualitativa pós-7 dias (User Research)

Aplicar com 10 a 15 usuários do beta após 7 dias de uso:

1. **Percepção de Valor**: *"Quando você enviou seu currículo e viu seu Career Score de Mercado, o que passou pela sua cabeça? Fez sentido com o seu momento profissional?"*
2. **Confiança no Match IA**: *"Ao olhar a explicação 'Por que essa vaga combina com você', você sentiu que a IA realmente entendia seu currículo ou pareceu uma recomendação genérica?"*
3. **Relevância de Vagas**: *"Das vagas que o VoCentro te mostrou, quantas você realmente considerou se candidatar?"*
4. **Resolução de Fricção**: *"Teve algum momento em que você travou, ficou na dúvida do que clicar ou não entendeu o que um número significava?"*
5. **Métrica de PMF (Sean Ellis Question)**: *"Como você se sentiria se não pudesse mais usar o VoCentro amanhã?"*
   - ( ) Muito frustrado
   - ( ) Pouco frustrado
   - ( ) Indiferente

---

## ⚖️ 6. Matriz de Decisão: Escalar vs. Pivotar vs. Iterar

Critérios pós-14 dias do Beta Fechado:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCALED (Escalar para Lançamento Público)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ • WAAJ (Candidatos Ativos Salva/Aplica) ≥ 40%                               │
│ • Ativação (Cadastro ➔ Upload) ≥ 75%                                       │
│ • Retenção D7 ≥ 40%                                                         │
│ • Pergunta de PMF ("Muito Frustrado") ≥ 40%                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ (Se algum indicador estiver abaixo)
┌─────────────────────────────────────────────────────────────────────────────┐
│ ITERATE (Ajustar UX, Rankings e Notificações)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Ativação entre 50% e 74%                                                  │
│ • Retenção D7 entre 20% e 39%                                               │
│ • Ação: Refinar ranking de recomendação (Fórmula Composta) e visual de score│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ (Se os indicadores forem críticos)
┌─────────────────────────────────────────────────────────────────────────────┐
│ PIVOT (Repensar Proposta de Valor)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Ativação < 50%                                                            │
│ • Retenção D7 < 20%                                                         │
│ • Rejeição de vagas > 60% por falta de alinhamento                          │
│ • Ação: Repensar modelo de parsing de currículo e fonte de agregadores.     │
└─────────────────────────────────────────────────────────────────────────────┘
```
