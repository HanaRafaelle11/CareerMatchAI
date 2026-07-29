# ADR-009 — Design System Vanilla CSS/Tailwind sem Bibliotecas UI Pesadas

## Status
Accepted

## Contexto
Garantir máxima performance, velocidade de renderização e identidade visual única "glassmorphism" no Vocentro sem inchar o bundle da aplicação com bibliotecas UI pesadas.

## Decisão
Construir o Design System usando Vanilla CSS e utilitários TailwindCSS com um conjunto enxuto de componentes consolidados em `src/presentation/components/` (`CardGlass`, `Modal`, `StatCard`, `Toast`, `OnboardingModal`, `ContactActionModal`, `ResumePreviewModal`).

## Motivo
- **Performance**: Manter o bundle leve (compilação do Vite em ~3.9s).
- **Controle Total de UX**: Flexibilidade para criar micro-animações, estados de vidro e adaptação perfeita entre Dark e Light Mode.

## Consequências
### Positivas
- Carregamento instantâneo da aplicação sem dependências externas de UI como Material UI ou AntD.
- Coerência estética em todas as telas.
### Negativas / Trade-offs
- Responsabilidade do time de engenharia em manter a acessibilidade (foco, ARIA, teclado) nos componentes próprios.

## Alternativas Descartadas
- **Adotar Material UI ou Chakra UI**: Descartado por inflar o bundle em dezenas de megabytes e impor estilos rígidos difíceis de customizar.
