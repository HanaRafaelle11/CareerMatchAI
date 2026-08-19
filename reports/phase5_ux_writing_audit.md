# ✍️ AUDITORIA DE UX WRITING E COPY — FASE 5 (VOCENTRO)

**Produto**: VoCentro  
**Data**: Agosto de 2026  
**Status**: `🟢 LINGUAGEM CLARA, HUMANA E ORIENTADA À AÇÃO`  

---

## 1. 🔍 TERMOS AUDITADOS E TRADUZIDOS

| Termo Técnico / Jargão | Substituição / Tradução no Produto | Justificativa |
|---|---|---|
| *TTV (Time to Value)* | "Tempo até o primeiro diagnóstico" | Reduz abstração técnica para operadores. |
| *TTM (Time to Match)* | "Tempo até a primeira oportunidade encontrada" | Foco na perspectiva do candidato. |
| *Stickiness* | "Frequência de Retorno e Retenção" | Termo claro em português para relatórios de produto. |
| *Weekly Active* | "Usuários Ativos nos últimos 7 dias (WAU)" | Rótulo explícito e contextualizado. |
| *STAR analysis* | "Treino de Entrevistas com Método STAR" | Mantém a metodologia internacional e adiciona explicação em português. |
| *Field invalid* | "Informe seu cargo atual" / "Selecione ao menos 1 área de interesse" | Mensagens de erro com instrução clara de resolução. |

---

## 2. 🛡️ VERIFICAÇÕES DE MENSAGENS DE ERRO

* **Zero "Error 500" ou "UUID invalid" expostos ao usuário final**:
  - Usuário vê: *"Não conseguimos carregar suas vagas agora. [Tentar novamente]"*.
  - Detalhe técnico/stack trace: direcionado exclusivamente ao console/telemetria.
