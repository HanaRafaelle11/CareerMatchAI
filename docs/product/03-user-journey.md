# 03 — Jornada do Usuário (Vocentro Product KB)

## Fluxo Completo da Jornada do Candidato

```
Cadastro / Login (Email ou Google OAuth)
   │
   ▼
Onboarding Interativo (Modal de 4 Etapas)
   │
   ▼
Upload do Currículo (PDF/TXT com Extração Automática via Edge Function)
   │
   ▼
Geração da Matriz de Competências & Otimização do CV
   │
   ▼
Cálculo de Match Semântico de Vagas (Aderência % + Fit de Carreira)
   │
   ▼
Gestão de Candidaturas no Pipeline Kanban (8 Status Válidos)
   │
   ▼
Treinamento de Entrevistas com Método STAR (Copiloto IA)
   │
   ▼
Avanço de Fase no Pipeline (Entrevista RH → Entrevista Gestor → Oferta)
   │
   ▼
Conversão / Upgrade para Plano Premium (Acesso Ilimitado & Recursos Avançados)
```

## Etapas Detalhadas & Ações da IA
1. **Onboarding**: Apresentação dos pilares da plataforma e convite imediato para envio do CV.
2. **Upload & Parsing**: Extração de texto via Edge Function / PDF Parser local com sanitização anti-XSS.
3. **Análise de Fit**: Agregação do Career Score (0 a 100) com base no preenchimento de experiências, LinkedIn e habilidades.
4. **Candidaturas & Pipeline**: Organização visual do progresso em colunas (*Salvas*, *Enviadas*, *Entrevista RH*, *Entrevista Gestor*, *Proposta/Contratado*, *Rejeitadas/Arquivadas*).
5. **Coach de Entrevista**: Simulação de perguntas comportamentais com avaliação em tempo real da estrutura STAR (Situação, Tarefa, Ação, Resultado).
