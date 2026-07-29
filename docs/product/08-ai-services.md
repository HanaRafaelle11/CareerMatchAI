# 08 — Serviços de Inteligência Artificial (Vocentro Product KB)

## 1. Módulos Inteligentes Integrados
- **Resume Parsing Engine (Edge Function)**: Processamento de PDF/DOCX com extração visual de seções, experiência, formação e competências técnicas.
- **Semantic Job Matching Engine**: Algoritmo que compara vetores de competências e contexto do currículo com os requisitos da vaga, produzindo o *Match da Vaga* (%) e a justificativa textual do *Career Fit*.
- **Copiloto de Entrevistas STAR**: Treinador interativo que conduz simulações comportamentais, avaliando o candidato em 4 pilares: Situação, Tarefa, Ação e Resultado.
- **Gerador de Cartas de Apresentação**: Criação de cartas customizadas alinhadas à cultura e tom de voz da empresa contratante.

## 2. Resiliência & Fallbacks Determinísticos
- Toda chamada de IA possui timeout e fallback determinístico (ex: cálculos locais em `localStorage` ou heurísticas estáticas quando sem conexão com o provedor).
- Notificação de erro graciosa via `AppError`, garantindo que falhas de Edge Function não quebrem a interface nem percam os dados do candidato.
