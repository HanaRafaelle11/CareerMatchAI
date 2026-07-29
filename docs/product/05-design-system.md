# 05 — Design System & Tokens Visuais (Vocentro Product KB)

## 1. Paleta de Cores & Tokens
- **Background Principal**: `#0B0F17` (Dark Mode Profundo) / `#121929` (Containers Principais).
- **Brand Primary**: Indigo/Violet (`#4F8EF7` / `brand-500`).
- **Accent High-Match**: Emerald (`#22C7A8` / `emerald-400`).
- **Alert / Risk High**: Rose/Red (`#F43F5E` / `red-400`).
- **Warning / Medium Risk**: Amber (`#F59E0B` / `amber-400`).
- **Texto Principal**: `#F8FAFC` (Slate-50) / `#B8C2CC` (Slate-400).

## 2. Componentes Consolidados do Design System
- **`CardGlass`**: Container padrão com efeito de vidro, bordas suaves (`border-slate-800`) e fundos semi-transparentes (`bg-slate-900/40 backdrop-blur-md`).
- **`Modal`**: Container responsivo padrão para diálogos e gavetas (`max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl`).
- **`StatCard`**: Card de métrica individual com valor em destaque, label superior e badge de variação.
- **`Toast`**: Notificações flutuantes temporárias para feedback de ações (`success`, `error`, `info`).
- **`OnboardingModal`**: Modal sequencial em 4 etapas para recepcionar novos usuários.
- **`ContactActionModal`**: Modal para contatos e envio direto de ações sem depender de links `mailto`.
- **`ResumePreviewModal`**: Drawer de visualização e download de currículos em PDF/Texto.

## 3. Diretrizes de Responsividade & Temas
- **Grid Layout**: Adaptação fluida `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- **Modos Visual**: Suporte nativo a Dark Mode e Light Mode via classes Tailwind na tag `html`.
