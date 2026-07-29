# 04 — Regras de Negócio (Vocentro Product KB)

## 1. Planos & Níveis de Acesso
- **Plano Free (Gratuito)**:
  - Upload de até 2 versões de currículo.
  - Cálculo de Match para até 5 vagas por dia.
  - Até 3 simulações de entrevista STAR por mês.
  - Acesso ao Pipeline Kanban com armazenamento padrão.
- **Plano Pro / Premium (R$ 49,90/mês)**:
  - Upload ilimitado de versões de currículo.
  - Cálculo de Match ilimitado em tempo real.
  - Simulações ilimitadas com Copiloto IA de Entrevistas.
  - Análise Avançada de Churn, ROI de Candidaturas e Prioridade Comercial.

## 2. Enums Válidos do Pipeline Kanban
O Pipeline de candidaturas aceita estritamente os 8 enums de status abaixo:
- `found`: Vaga Encontrada / Salva.
- `saved`: Candidatura Planejada.
- `applied`: Candidatura Enviada.
- `hr`: Entrevista RH / Screening.
- `interview`: Entrevista Gestor / Teste Técnico.
- `offer`: Proposta Recebida / Oferta.
- `hired`: Contratado 🎉.
- `rejected`: Arquivada / Rejeitada (Visível ao ativar o toggle "Ver Arquivadas").
- `deleted`: Soft-delete (removido do fluxo ativo).

## 3. Heurísticas & Cálculos de Scores
- **Match da Vaga (0-100%)**: Mede a aderência direta entre as palavras-chave, requisitos técnicos e nível de experiência do currículo em relação à descrição da vaga.
- **Career Fit Score (0-100%)**: Avalia o alinhamento de longo prazo entre a pretensão profissional e o objetivo declarado do candidato.
- **Score de Inatividade**: Determinado pelo timestamp máximo de atividade em eventos, candidaturas, otimizações e acessos (`daysInactive`).
