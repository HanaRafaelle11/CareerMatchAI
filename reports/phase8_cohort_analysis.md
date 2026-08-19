# Análise de Coortes e Retenção Temporal — Fase 8

## 1. Definições de Coorte
- **Agrupamento**: Semanal (`YYYY-Www`) e Mensal (`YYYY-MM`) baseado na data de criação do usuário (`profiles.created_at`).
- **Janelas de Retenção**:
  - **D0 (Ativação Imediata)**: Primeiro Match gerado em até 24 horas após o cadastro.
  - **D1 (Dia 1)**: Usuário com ao menos 1 evento entre 24h e 48h após cadastro.
  - **D7 (Dia 7)**: Usuário com atividade entre 6 e 8 dias após cadastro.
  - **D14 (Dia 14)**: Usuário com atividade entre 13 e 15 dias após cadastro.
  - **D30 (Dia 30)**: Usuário com atividade entre 28 e 32 dias após cadastro.

## 2. Invariante de Retenção
A taxa de retenção é calculada estritamente sobre usuários da respectiva coorte de cadastro que permaneceram ativos na janela alvo, sem preenchimento artificial para coortes recentes sem histórico decorrido suficiente.
