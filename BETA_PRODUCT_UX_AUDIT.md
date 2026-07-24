# 🎯 Auditoria Estratégica de Produto & UX — VoCentro Beta

**Responsáveis**: Product Manager SaaS + UX Researcher  
**Data**: 24 de Julho de 2026  
**Status do Documento**: 🟢 **ESTRATÉGIA HOMOLOGADA PARA LANÇAMENTO BETA**

---

## 🧭 1. Mapeamento da Jornada do Usuário & Análise de Fricções

### Estágio A: Landing Page → Cadastro
- **Comportamento Esperado**: Entendimento imediato da proposta de valor em menos de 10 segundos ("O copiloto de carreira que analisa seu currículo e encontra as melhores vagas para o seu perfil").
- **Pontos de Confusão / Risco de Abandono**: Formatação de formulários e etapas extras no cadastro podem gerar desistência antes da experiência da IA. O CTA principal deve direcionar o usuário diretamente para a etapa de upload.

### Estágio B: Upload de Currículo → Primeiro Momento de Valor (Time-To-Value < 60s)
- **Time-To-Value (TTV)**: Medido a partir do momento em que o arquivo PDF é enviado.
  - Upload & Parse Edge Function: **~2.5s**
  - Geração do **Career Score de Mercado** (ex: 82/100, 🥇 Cargos Compatíveis, Pontos Fortes, Gaps): **~4.0s**
  - Total TTV: **~6.5 segundos** (MUITO abaixo do limite crítico de 60 segundos!).
- **Entendimento do Usuário**: O diagnóstico imediato do `CareerScoreDashboardCard` entrega um momento "UAU" palpável antes mesmo de o candidato pesquisar vagas manualmente.

### Estágio C: Busca de Vagas & Arquitetura do Funil de Recomendação
- **Equilíbrio de Volume Adzuna (Qualidade vs. Quantidade)**:
  - *Problema Identificado*: Exibir 800 vagas puras do provedor sem filtro de aderência gera sobrecarga de escolha (Paradoxo da Escolha de Barry Schwartz), reduzindo a taxa de candidatura.
  - *Arquitetura Ideal do Funil de Curadoria VoCentro*:
    ```text
    900 Vagas Brutas Encontradas (Adzuna + Jooble + SerpApi)
      ↓ (Deduplicação por Hash de Empresa/Título/Local)
    650 Vagas Únicas
      ↓ (Filtro de Qualidade de Anúncio e Descrição >= 30ch)
    300 Vagas Verificadas de Mercado (Exibidas com Job Score 0–100%)
      ↓ (Filtro Inteligente de Fit do Usuário - Match >= 70%)
    50 Vagas Altamente Recomendadas para Você
    ```
  - *Princípio de Produto*: O candidato não quer "todas as vagas do mercado". Ele quer **"as melhores vagas para o perfil dele"**.

### Estágio D: Job Match Explanation Engine (Career Fit vs. Job Score)
- **🎯 Career Fit Score (76%)**: Quanto essa vaga combina com o perfil do candidato (Skills, Experiência, Senioridade, Objetivos, Salário, Localização, Contexto).
- **🏢 Job Score (92%)**: Qualidade e verificabilidade da vaga no mercado (Empresa, Atualidade, Fonte).
- **Redução de Carga Cognitiva**: O isolamento visual dos dois indicadores em áreas distintas e a presença de tooltips informativos impedem que o usuário confunda a reputação do anúncio com a sua compatibilidade pessoal.

### Estágio E: Salvamento, Candidatura & Minha Jornada (Kanban)
- **Engajamento e Retenção**: Botões com resposta imediata e Notificação Toast (`✓ Vaga salva na sua jornada` / `✓ Candidatura registrada`) garantem o encerramento do ciclo de descoberta e alimentam o pipeline Kanban da Jornada.

---

## 🚦 2. Matriz de Priorização (P0 / P1 / P2)

### 🔴 Prioridade P0 (Lançamento Beta - Bloqueadores de Retenção)
1. **Curadoria e Ordenação Padrão por Match (Funil 900 -> 50)**:
   - Garantir que as buscas listem por padrão as vagas ordenadas por `Career Fit Score DESC`, apresentando prioritariamente as 50 vagas mais aderentes (Match >= 70%), mantendo a opção de carregar mais resultados.
2. **Manutenção da Clareza nos Tooltips de Score**:
   - Manter visíveis os tooltips que explicam a distinção entre `Career Fit Score` (Adequação Pessoal) e `Job Score` (Qualidade de Mercado) em telas desktop e mobile.

### 🟡 Prioridade P1 (Primeiros 14 dias do Beta - Otimizações de UX)
1. **Banner de Incentivo para Perfis Incompletos**:
   - Se o currículo parseado possuir poucos dados (< 3 experiências ou < 5 habilidades), apresentar sugestão para complementar dados no Meu Perfil.
2. **Filtro Rápido "Alta Aderência"**:
   - Manter a chave seletora rápida `"Exibir apenas Match Superior a 80%"` visível no topo do buscador.

### 🔵 Prioridade P2 (Pós-Beta - Expansão de Features)
1. **Exportação da Jornada**:
   - Permitir exportar as candidaturas salvas no Kanban para acompanhamento externo.
2. **Resumo Semanal por E-mail**:
   - Envio semanal automático com as 5 vagas com maior Career Fit Score descobertas pela IA.

---

## 📈 3. Plano de Analytics & Telemetria do Beta

Tabela de rastreamento dos eventos do funil via `tracker.track()`:

| Evento Analytics | Estágio do Funil | Propriedades Capturadas | KPI de Produto |
| :--- | :--- | :--- | :--- |
| `signup_completed` | Ativação | `user_id`, `source` | Conversão Landing → Cadastro |
| `resume_uploaded` | Time-to-Value | `processing_time_ms`, `file_type` | Sucesso no Upload do PDF |
| `career_score_viewed` | Momento UAU | `base_score`, `has_resume` | Engajamento com Diagnóstico IA |
| `job_search_executed` | Descoberta | `keyword`, `location`, `results_count` | Relevância da Busca |
| `job_match_viewed` | Inteligência | `job_id`, `career_fit_score`, `job_score` | Aderência aos Resultados |
| `resume_adaptation_opened` | IA Produtiva | `job_id` | Interesse em Adaptação de CV |
| `application_started` | Retenção | `job_id`, `action: 'SAVED'` | Vagas Salvas para Depois |
| `application_completed` | Retenção | `job_id`, `action: 'APPLIED'` | Candidaturas Efetivadas |
| `beta_feedback_sent` | Feedback | `rating`, `comment`, `feature` | CSAT / NPS do Beta |

---

## 💡 4. Hipóteses de Melhoria & Experimentos

1. **Hipótese de Apresentação Curada (As 50 Melhores Vagas)**:
   - *Hipótese*: Apresentar em destaque as 50 vagas com maior `Career Fit Score` gera 3x mais candidaturas do que apresentar uma lista bruta de 300 vagas não ordenadas.
2. **Hipótese de Diagnóstico Imediato**:
   - *Hipótese*: Mostrar o `CareerScoreDashboardCard` com pontos fortes e lacunas assim que o currículo é processado reduz a taxa de abandono da primeira sessão de 45% para menos de 15%.

---

## 🏁 5. Recomendações Finais para Liberação dos 50 Usuários Beta

1. **Liberação em Coortes (Rollout Gradual)**:
   - Convidar os primeiros **10 usuários no Dia 1**, monitorar logs e interações no `AdminDashboard`, e expandir para os **40 usuários restantes no Dia 3**.
2. **Acompanhamento Ativo de Feedback**:
   - Avaliar diariamente os registros recebidos via `BetaFeedbackWidget` para responder rapidamente a dúvidas dos usuários beta.
3. **Estabilidade de Compilação**:
   - Garantir que todas as alterações futuras mantenham a compilação limpa (`npm run build = 0 errors`).
