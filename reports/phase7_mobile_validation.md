# Validação de Telemetria e UX em Dispositivos Móveis — Fase 7

## 1. Breakpoints Auditados
- **320px** (Small Mobile / SE)
- **360px** (Android Standard)
- **390px** (iPhone Standard)
- **414px / 430px** (iPhone Pro Max / Plus)
- **768px** (Tablet Portrait)
- **1024px** (Tablet Landscape / Desktop Compact)
- **1440px** (Desktop Wide)

## 2. Paridade de Telemetria Mobile vs Desktop
- Todos os cliques na barra de navegação inferior (`bottom navigation`) emitem `mobile_nav_item_clicked`.
- Aberturas de gaveta e drawers no mobile disparam `copilot_drawer_opened` com os mesmos atributos de sessão e sem perda de contexto.
- Visualização de vagas e cartões de Match registram `job_match_viewed` com as 5 dimensões sem diferença de payload entre telas sensíveis ao toque e desktops.
- Cards, tabelas e formulários analíticos adaptam-se sem overflow horizontal.
