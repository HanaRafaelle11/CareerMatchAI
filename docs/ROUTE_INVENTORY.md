# 🗺️ VOCENTRO — ROUTE INVENTORY & SMOKE MATRIX

## 1. PUBLIC ROUTES INVENTORY

| Route Path | Component | Auth State | Key Elements Verified | Smoke Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | Public | Hero, CTA Login, Value Proposition, Pricing Section | PASS |
| `/login` | `Login` | Public | Email Input, Password Input, OAuth Google Button, Magic Link | PASS |
| `/about` | `AboutPage` | Public | Company Mission, Founding Story, Back Button | PASS |
| `/how-google-login-works` | `HowGoogleLoginWorksPage` | Public | Step-by-step Google OAuth Explanation | PASS |
| `/google-auth` | `GoogleAuthPage` | Public | Auth Callback Handler, Loading State | PASS |
| `/termos-de-uso` | `TermsOfUsePage` | Public | Terms Content, Legal Rights, Pricing Clause | PASS |
| `/politica-de-privacidade` | `PrivacyPolicyPage` | Public | Privacy Policy Content, LGPD Compliance | PASS |
| `/faq` / `/ajuda` | `FaqHelpPage` | Public | Search Bar, FAQ Accordion Items, Contact CTA | PASS |
| `/pesquisa` / `/survey` | `PublicSurveyPage` | Public | NPS Rating Scale (1-10), Feedback Form | PASS |

---

## 2. AUTHENTICATED APP ROUTES & TABS INVENTORY

| Tab Key | Component | Initial View | Key Interactive Elements |
| :--- | :--- | :--- | :--- |
| `dashboard` | `Dashboard` | Overview | Metrics Cards, Profile Completeness, Active Resume Header, Quick Actions |
| `profile` | `Profile` | Perfil & CV | Resume Version Switcher, Upload Area, AI Score, Experience Cards, Skills |
| `career-profile` | `CareerProfilePage` | Preferências | Target Roles, Preferred Locations, Salary Range, Work Mode |
| `match` / `vagas` | `JobMatchHub` | Busca & Match | Search Inputs, Cascade Filter Tags, Match Cards, Explanation Drawer |
| `strategy` / `pipeline` | `StrategyPage` | Pipeline Kanban | 7 Kanban Columns (Encontradas, Salvas, Aplicadas, Entrevistas...), Card Drag/Move, Details Modal |
| `coach` | `CoachDashboard` | Treino STAR | Interview Simulation Chat, Question Carousel, STAR Feedback |
| `notifications` | `NotificationsPage` | Notificações | Notification List, Mark as Read, Direct Action Links |
| `settings` | `SettingsPage` | Configurações | Account Details, Resumes Manager, Appearance Theme Toggle, Billing & Subscription |
| `admin` | `AdminDashboard` | Admin (Restrito) | User Cohort Metrics, Survey Wave Campaign Controls, AI Usage Logs |

---

## 3. ROUTE SMOKE MATRIX MATRIX AUDIT RULES

For every route in the system, Playwright tests verify:
- **HTTP Response:** Status 200 OK (no 404/500 server errors).
- **JS Runtime Error Detection:** Listen for `pageerror` and console `error` events. Fail test if uncaught exception occurs.
- **Loading State Termination:** Screen resolves from loading skeleton to interactive content within timeout.
- **Viewport Responsiveness:** Validated on Desktop (1440x900), Tablet (768x1024), and Mobile (375x812).
- **Theme Support:** Validated under both Dark Mode (`.dark`) and Light Mode (`.light`).
