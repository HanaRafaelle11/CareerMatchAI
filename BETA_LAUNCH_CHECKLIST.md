# 🚀 Checklist de Lançamento Beta — VoCentro (Career OS)

Data de Aprovação: 2026-07-24  
Público Beta Inicial: 20 a 50 usuários selecionados  
Meta Principal: Validar retenção, acurácia do Career Fit Engine e usabilidade do Assistente de Carreira IA.

---

## 📋 1. Funcionalidades Liberadas no Beta

- [x] **Motor de Busca Multi-Provedor**: Integração agregada de vagas com balanceamento dinâmico de diversidade.
- [x] **Job Match Explanation Engine**: Explicação transparente dos 7 fatores de fit ($30\%$ skills, $25\%$ experiência, $15\%$ senioridade, $15\%$ objetivos, $5\%$ salário, $5\%$ localização, $5\%$ contexto).
- [x] **Diagnóstico "Primeiro Momento IA"**: Card de Career Score de Mercado (0-100) com Top 3 cargos recomendados, pontos fortes e lacunas.
- [x] **Minha Jornada (Funil CRM)**: Visualização em pipeline Kanban (Encontradas → Salvas → Aplicadas → Entrevistas → Ofertas).
- [x] **Planner Operacional Semanal**: Organização de tarefas diárias de recolocação com funcionalidade de adição e exclusão.
- [x] **Simulador de Entrevistas STAR**: Treino comportamental interativo com recrutadora IA.
- [x] **Adaptative Resume Engine**: Sugestões aprováveis de currículo com rastreabilidade de status (`PENDING` → `APPLIED`).
- [x] **Feature Flags & Remote Config**: Tabela `feature_flags` no Supabase com fallback local.
- [x] **Widget Flutuante de Feedback Beta**: Coleta direta de avaliações dos usuários (`POSITIVE`, `NEGATIVE`, `NEUTRAL`).
- [x] **Admin Beta Dashboard**: Telemetria em tempo real para acompanhamento do beta pelo time.

---

## ⚠️ 2. Limitações Conhecidas & Fallbacks Ativos

| Funcionalidade | Limitação Conhecida | Estratégia de Fallback Ativa |
| :--- | :--- | :--- |
| **Parsing de PDF complexo** | PDFs escaneados (sem camada de texto OCR) podem não extrair dados completos. | Fallback para parser de texto bruto local e preenchimento manual no formulário. |
| **Limites de cota Gemini API** | Em momentos de pico, a API do Gemini pode sofrer rate limiting. | Cálculo determinístico dos 7 fatores ($70\%$) garante exibição de score sem depender do Gemini. |
| **Conexão Offline** | Ausência de internet impede requisição remota ao Supabase. | Banco de dados `localStorage` local cuida de persistir histórico sem perda de dados. |

---

## 📊 3. Métricas de Sucesso do Beta (KPIs)

1. **Adesão ao Dashboard**: $\ge 80\%$ dos usuários visualizam o `career_score_viewed` nas primeiras 24 horas pós-cadastro.
2. **Engajamento no Funil**: $\ge 50\%$ dos usuários adicionam pelo menos 3 vagas à aba **Minha Jornada**.
3. **Satisfação com Explicações IA**: $\ge 75\%$ de feedbacks positivos (`POSITIVE`) no widget flutuante.
4. **Resoluções de Senioridade**: zero erros de classificação incorreta de sênior/liderança como júnior graças ao algoritmo de 4 níveis.

---

## 🔬 4. Próximos Experimentos & Roadmap Pós-Beta

- [ ] **Application Intelligence**: Geração automática de cartas de apresentação personalizadas e pitches de 60 segundos por vaga.
- [ ] **Simulador Estendidos com Voz**: Suporte a áudio via Web Speech API no Simulador STAR.
- [ ] **Notificações Ativas via WhatsApp/E-mail**: Alertas diários de vagas com compatibilidade $\ge 85\%$.
