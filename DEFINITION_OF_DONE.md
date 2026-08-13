# Definition of Done (DoD) - Vocentro (CareerMatchAI)

Para que qualquer tarefa, correção de bug, refatoração ou nova funcionalidade seja considerada oficialmente **CONCLUÍDA**, todos os critérios deste documento devem ser rigorosamente atendidos.

---

## 1. Regra Fundamental de Qualidade & Engenharia

> **"Se um bug importante foi encontrado manualmente uma vez, o objetivo é que a mesma classe de bug nunca mais precise ser descoberta manualmente."**

- **Sem Correções Superficiais**: É proibido mascarar erros, engolir exceções com `try/catch` vazios ou retornar dados falsos de fallback para simular funcionamento.
- **Transparência de Fallbacks**: Qualquer fallback ativado deve registrar telemetria explícita (`match_source: 'fallback_deterministic'`) e expor seu status no painel de administração (`/admin`).

---

## 2. Checklist Obrigatório de Fechamento (Definition of Done)

- [ ] **1. Qualidade de Código & Tipagem (Static Analysis)**:
  - `npx tsc -b` deve passar com **0 erros**.
  - Linter (`npm run lint` ou equivalente) deve passar sem avisos críticos.

- [ ] **2. Compilação Local (Build)**:
  - `npm run build` deve compilar o bundle de produção sem erros em tempo hábil.

- [ ] **3. Teste & Evidência Funcional Bruta (Runtime Verification)**:
  - Execução de script automatizado chamando a API/Edge Function real em produção ou staging.
  - Verificação de resposta `HTTP 200 OK` com dados dinâmicos reais (ex.: IA Gemini processando e retornando análise estruturada).
  - Nunca aceitar "passou no CI" como prova de que a funcionalidade está rodando em produção.

- [ ] **4. Deploy de Infraestrutura & Backend**:
  - Edge Functions atualizadas implantadas via `npx supabase functions deploy`.
  - Confirmação de disponibilidade da função no painel do Supabase.

- [ ] **5. Versionamento & Rastreabilidade**:
  - `git commit` com mensagem padronizada descrevendo com precisão as alterações.
  - `git push origin main` enviando o commit ao repositório remoto.
  - Confirmação via `git fetch origin` e `git log` de que o GitHub recebeu o commit.
  - O hash do commit gerado deve ser informado explicitamente no relatório de conclusão.

- [ ] **6. Deploy em Produção & Aliasing**:
  - Deploy da aplicação web em produção via `npx vercel --prod`.
  - Confirmação de status `READY` e alias ativo no domínio oficial (`https://vocentro.com.br`).

- [ ] **7. Validação Visual / E2E de Produção**:
  - Confirmação visual em navegador (ou validação manual informada ao usuário com passos explícitos) provando que os elementos da interface (scores, cards, relatórios, modais) renderizam corretamente na URL final de produção.

---

## 3. Classificação das 3 Salvaguardas

| Salvaguarda | Descrição | Status Atual |
| :--- | :--- | :--- |
| **Salvaguarda 2** | Teste de smoke pós-deploy automatizado no CI/CD | **PARCIAL** (Quality Gate + deploy seletivo ativos em `.github/workflows/deploy-supabase-functions.yml`; teste de smoke em produção é executado via script local `scratch/verify_all_fixes_in_production.mjs`) |
| **Salvaguarda 3** | Verificação automática de timestamp real da Edge Function vs. hash do commit | **PARCIAL** (Script `verify_all_fixes_in_production.mjs` valida o timestamp da API do Supabase e a presença de `matches` no banco; falta integrar a trava de build no GitHub Actions) |
| **Salvaguarda 5** | Documentação `DEFINITION_OF_DONE.md` exigindo evidência funcional bruta em produção antes de fechar bugs | **FEITO (100%)** (Criado e integrado ao projeto no diretório raiz) |
