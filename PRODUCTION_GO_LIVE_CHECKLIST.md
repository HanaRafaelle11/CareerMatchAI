# 📋 Checklist de Prontidão Operacional & Matriz de Contingência (Go-Live) — VoCentro Beta

**Data**: 24 de Julho de 2026  
**Status**: 🟢 **HOMOLOGADO PARA LIBERAÇÃO BETA (20-50 USUÁRIOS REAIS)**

---

## 📋 1. Checklist de Operações Pré-Lançamento

| Item de Infraestrutura / Produto | Status | Mecanismo de Verificação | Detalhes & Localização |
| :--- | :---: | :--- | :--- |
| **Domínio Configurado** | ✅ Concluído | DNS / CNAME no Vercel/Netlify | Apontado para o ambiente oficial de produção VoCentro. |
| **HTTPS Válido** | ✅ Concluído | Certificado SSL / TLS 1.3 | Forçado via HSTS e renovação automática. |
| **Supabase Backup** | ✅ Concluído | Backup Diário Automatizado (PITR) | Habilitado em nível de projeto Supabase Cloud. |
| **Logs Funcionando** | ✅ Concluído | Telemetria centralizada | `application_errors` e `tracker.ts` gravando eventos. |
| **Analytics Funcionando** | ✅ Concluído | `tracker.track()` ativo | Rastreamento do funil completo, `aha_moment_reached` e `qualified_career_action`. |
| **Alertas de Erro** | ✅ Concluído | Notificação visual & DB Log | `AppError.logError()` exibe Toast e grava log estruturado. |
| **Variáveis de Ambiente Conferidas** | ✅ Concluído | `.env` e `.env.example` auditados | `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` verificados. |
| **Limites de Storage Conferidos** | ✅ Concluído | Supabase Storage Bucket (`resumes`) | RLS ativado com cota máxima de 10MB por PDF. |
| **Rate Limit Configurado** | ✅ Concluído | Supabase / Edge Functions | Proteção contra spam de requisições ativada. |
| **Política de Privacidade Publicada** | ✅ Concluído | Aba Privacidade em Configurações | Texto oficial LGPD publicado em [`Settings.tsx`](file:///C:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/pages/Settings.tsx#L933). |
| **Termos de Uso Publicados** | ✅ Concluído | Aba Privacidade em Configurações | Consentimento explícito de processamento IA ativo. |
| **Contato para Suporte** | ✅ Concluído | E-mail oficial & Widget | Canal direto configurado (`suporte@vocentro.com`). |
| **Canal de Feedback** | ✅ Concluído | `BetaFeedbackWidget` & Match Feedback | Avaliação 👍/👎 integrada no Match IA e no rodapé. |
| **Política LGPD Revisada** | ✅ Concluído | Direito de Exportação & Exclusão | Botão "Exportar Meus Dados (JSON)" ativo em [`Settings.tsx`](file:///C:/Users/Sthephany/Projetos/CareerMatchAI/src/presentation/pages/Settings.tsx#L970). |

---

## 🛡️ 2. Matriz Completa de Gestão de Riscos & Mitigação

| Risco Mapeado | Probabilidade | Impacto | Plano de Ação / Mitigação Implementado |
| :--- | :---: | :---: | :--- |
| **APIs externas indisponíveis** (Adzuna / Jooble) | Média | Alto | **Fallback Automático & Resiliência**: Se o Adzuna estiver fora, o motor recua automaticamente para a busca unificada nos adaptadores secundários (Jooble/SerpApi) e banco interno. |
| **Mudança na API de terceiros** | Média | Alto | **Normalização por Adapter Layer + Monitoramento**: Cada agregador implementa a interface `BaseJobConnector`. Alterações em APIs externas afetam apenas o adaptador específico sem quebrar o core do sistema. |
| **Limite de cota das APIs** | Alta | Alto | **Cache Inteligente React Query (10 min) + Multiple Providers**: Armazenamento em cache de buscas frequentes no cliente e chaveamento automático entre Adzuna, Jooble e SerpApi ao atingir cotas. |
| **Edge Function lenta** (Gemini AI / Parsing) | Média | Médio | **Timeout Defensivo + Polling de Estado**: Se a Edge Function exceder 30s, o sistema transita para `ProcessingState` permitindo navegação contínua. |
| **Upload de PDF corrompido / Protegido** | Média | Médio | **Validação de MIME Type + Mensagem Amigável**: Tratamento de exceção em `analyze-resume` com retorno claro de orientação ao candidato em português e log de erro em `application_errors`. |
| **Pico de acessos após divulgação** | Baixa/Média | Alto | **Monitoramento de Consumo Vercel/Supabase + React Lazy Loading**: Arquitetura estática CDN desacoplada da camada de APIs Supabase com escalonamento automático de infraestrutura. |
| **Baixa qualidade de alguns anúncios** | Alta | Médio | **Fórmula Composta de Relevância + Filtro de Requisitos**: Ordenação via `calculateJobRelevanceScore` (70% Fit / 20% Job Score / 10% Recência) e descarte de textos < 30 caracteres. |
| **Match incorreto** | Média | Médio | **Feedback Tátil 👍/👎 + Coleta de Motivos**: O widget `job_match_feedback` grava o motivo exato da rejeição (`seniority_mismatch`, `skill_gap`, etc.), realimentando o modelo. |
