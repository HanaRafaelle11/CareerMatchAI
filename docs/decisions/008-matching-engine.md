# ADR-008 — Engine Híbrida de Matching (IA + Heurísticas)

## Status
Accepted

## Contexto
O cálculo de compatibilidade entre o currículo do candidato e as exigências da vaga precisa ser preciso, veloz e justificável. Depender 100% de IA em todas as reavaliações geraria custos elevados e latência desnecessária.

## Decisão
Adotar uma engine híbrida de dois níveis:
1. **Match da Vaga (Compatibilidade Geral %)**: Calculado via sobreposição de competências técnicas, senioridade e palavras-chave.
2. **Career Fit & Justificativa Semântica**: Gerado pela IA para explicar pontos fortes e lacunas estratégicas do perfil.

## Motivo
- **Redução de custo**: O score de compatibilidade geral pode ser recalculado localmente em milissegundos sem consumo de API.
- **Maior clareza para o candidato**: Destaca a nota geral em evidência e detalha o fit de carreira com explicações didáticas.

## Consequências
### Positivas
- Resposta instantânea na listagem de vagas.
- Redução de consumo de tokens em requisições repetidas.
### Negativas / Trade-offs
- Exige calibração constante dos pesos das heurísticas de competências.

## Alternativas Descartadas
- **Cálculo 100% via IA para toda listagem**: Descartado por ser lento e caro.
- **Match 100% baseado em regex de palavras-chave**: Descartado por ignorar contexto de senioridade e sinônimos.
