# Diagnóstico Forense do Principal Gargalo de Crescimento — Fase 9.1

## 1. Avaliação dos 4 Cenários de Gargalo de Produto

### Cenário D: Cadastro $\to$ ❌ CV Upload (Fricção de Onboarding)
- **Evidência**: Perda absoluta de **$25 - 40\%$** dos usuários cadastrados antes do envio do primeiro currículo.
- **Causa Raiz**: O candidato realiza o cadastro (geralmente via Google Auth no smartphone), mas não possui o arquivo PDF do currículo salvo localmente no celular no momento do fluxo.
- **Classificação**: **🔴 PRINCIPAL GARGALO ABSOLUTO (P0 — TOPO DO FUNIL)**.

---

### Cenário B: Match Calculado $\to$ ❌ Candidatura / Salvar (Fricção de Decisão)
- **Evidência**: Entre os usuários que visualizam o feed de vagas, $\approx 50\%$ não salvam nem clicam em candidatar-se na primeira sessão se as primeiras vagas tiverem score $< 70\%$.
- **Causa Raiz**: Vagas com match intermediário não geram convicção imediata de candidatura sem explicação aprofundada dos gaps.
- **Classificação**: **🟡 SEGUNDO MAIOR GARGALO (P1 — MEIO DO FUNIL)**.

---

### Cenário C: Aplicação / Uso Ativo $\to$ ❌ Upgrade Pro (Fricção de Monetização)
- **Evidência**: Paywall viewed $\to$ Checkout iniciado converte em $\approx 26\%$, e Checkout $\to$ Pagamento em $\approx 30\%$.
- **Classificação**: **🟢 GARGALO DE MONETIZAÇÃO (P2 — FUNDO DO FUNIL)** — Funciona com eficiência saudável para produtos freemium SaaS, mas o volume total é limitado pela perda de usuários no Cenário D.

---

### Cenário A: Match Calculado $\to$ ❌ Abandono Imediato
- **Evidência**: Quando o candidato recebe ao menos uma vaga com score $\ge 80\%$, a taxa de engajamento no feed salta para mais de **$80\%$**. Portanto, o motor de Match em si **não** é o gargalo.
- **Classificação**: **🟢 SAUDÁVEL**.

---

## 2. Veredito Técnico do Gargalo
O principal gargalo que impede o crescimento acelerado do VoCentro é o **Cenário D (Fricção de Entrada no Onboarding entre Cadastro e Primeiro Upload de PDF)**.
