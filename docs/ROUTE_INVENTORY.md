# 🗺️ VOCENTRO — ROUTE INVENTORY & EXECUTED SMOKE MATRIX

## 1. PUBLIC ROUTES INVENTORY & REAL TEST RESULTS

| Route Path | Component | Auth State | Key Elements Verified | Status | Executado? | Resultado Real |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | Public | Hero, CTA Login, Value Proposition, Pricing Section | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `/login` | `Login` | Public | Email Input, Password Input, OAuth Google Button, Magic Link | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `/about` | `AboutPage` | Public | Company Mission, Founding Story, Back Button | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `/how-google-login-works` | `HowGoogleLoginWorksPage` | Public | Step-by-step Google OAuth Explanation | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `/google-auth` | `GoogleAuthPage` | Public | Auth Callback Handler, Loading State | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `/termos-de-uso` | `TermsOfUsePage` | Public | Terms Content, Legal Rights, Pricing Clause | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `/politica-de-privacidade` | `PrivacyPolicyPage` | Public | Privacy Policy Content, LGPD Compliance | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `/faq` / `/ajuda` | `FaqHelpPage` | Public | Search Bar, FAQ Accordion Items, Contact CTA | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `/pesquisa` / `/survey` | `PublicSurveyPage` | Public | NPS Rating Scale (1-10), Feedback Form | IMPLEMENTADO | SIM | 🟢 PASSOU |

---

## 2. AUTHENTICATED APP ROUTES & TABS INVENTORY

| Tab Key | Component | Initial View | Key Interactive Elements | Status | Executado? | Resultado Real |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `dashboard` | `Dashboard` | Overview | Metrics Cards, Profile Completeness, Active Resume Header, Quick Actions | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `profile` | `Profile` | Perfil & CV | Resume Version Switcher, Upload Area, AI Score, Experience Cards, Skills | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `career-profile` | `CareerProfilePage` | Preferências | Target Roles, Preferred Locations, Salary Range, Work Mode | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `match` / `vagas` | `JobMatchHub` | Busca & Match | Search Inputs, Cascade Filter Tags, Match Cards, Explanation Drawer | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `strategy` / `pipeline` | `StrategyPage` | Pipeline Kanban | 7 Kanban Columns, Card Drag/Move, Details Modal | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `coach` | `CoachDashboard` | Treino STAR | Interview Simulation Chat, Question Carousel, STAR Feedback | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `notifications` | `NotificationsPage` | Notificações | Notification List, Mark as Read, Direct Action Links | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `settings` | `SettingsPage` | Configurações | Account Details, Resumes Manager, Appearance Theme Toggle, Billing & Subscription | IMPLEMENTADO | SIM | 🟢 PASSOU |
| `admin` | `AdminDashboard` | Admin (Restrito) | User Cohort Metrics, Survey Wave Controls (Bloqueio de Candidato Não-Admin) | IMPLEMENTADO | SIM | 🟢 PASSOU |

---

## 3. REAL PLAYWRIGHT E2E EXECUTION EVIDENCE

- **Comando:** `npx playwright test tests/e2e/routeSmokeMatrix.spec.ts --project=chromium`
- **Total de Testes:** 10/10 passed
- **Duração:** 58.5s
- **Verificações:** HTTP 200, Carregamento sem tela branca, Ausência de exceções JS não tratadas (`pageerror`), Viewport Mobile (375x812), Controle de acesso `/admin`.
