# 03 — Pensamento de Produto & SaaS (Vocentro Standard v2.1)

## 1. Produto antes do Código
Antes de codificar, avaliamos o impacto real para o candidato/usuário e negócio:
- Esta funcionalidade reduz atrito?
- Ela melhora a retenção, ativação, conversão ou recorrência?
- Existe uma solução mais simples ou mais intuitiva?

## 2. Visão de Impacto SaaS
Mapeamento dos efeitos da funcionalidade na jornada:
- **Aquisição**: Atração de novos usuários.
- **Ativação**: Primeiro valor percebido (ex: cálculo do primeiro Match).
- **Retenção**: Frequência de uso (ex: Plano de Hoje de 15 min).
- **Monetização & Expansão**: Conversão Free → Premium e upsell.

## 3. Diretrizes de UX & Design System
- **Matriz de Estados**: Todo fluxo deve contemplar *Loading*, *Empty*, *Error*, *Success* e *Offline*.
- **Reuso do Design System**: Priorizar componentes consolidados (`Modal`, `CardGlass`, `Badge`, `Tooltip`, `Tabs`, `Table`).
- **Acessibilidade & Responsividade**: Suporte verificado em Mobile, Tablet e Desktop (Dark Mode).

## 4. IA Responsável & Escalabilidade
- Respostas de IA devem possuir tratamento de erro, timeout e fallback determinístico.
- Previsões heurísticas são apresentadas com transparência de limitação e grau de confiança.
- Avaliação prévia de gargalos para cargas de 10 a 100.000 usuários.
