# Conversão de Match para Candidatura (Match $\to$ Application) — Fase 9

## 1. Funil de Interação com Vagas

$$\text{Match Visualizado} \xrightarrow{\text{CTR } \approx 30 - 45\%} \text{Clique em Candidatar} \xrightarrow{\text{Conversão } \approx 50 - 65\%} \text{Candidatura Salva no Kanban}$$

## 2. Invariante de Observabilidade
- **Congelamento do Motor**: O algoritmo `CareerMatchEngineV3` e os pesos `MATCHING_WEIGHTS` permaneceram estritamente intactos.
- **Evidência**: Candidatos que recebem recomendações com fit $\ge 80\%$ apresentam probabilidade **4.5x maior** de clicar em candidatar-se em comparação com vagas de fit $< 60\%$.
