# 04 — Checklist de Entrega & Relatório Final (Vocentro Standard v2.1)

## 1. Segregação Absoluta no Relatório
Toda entrega técnica mantém dois blocos isolados:
1. **O que foi solicitado**: Execução estrita do escopo acordado.
2. **Recomendações de Produto**: Sugestões de melhorias futuras identificadas fora do escopo.

## 2. Checklist da Entrega
- [ ] TypeScript verde (`npx tsc -b`).
- [ ] Production Build limpo (`npm run build`).
- [ ] Validação funcional passo a passo realizada.
- [ ] Hash do commit informado e enviado (`git push origin main`).
- [ ] Deploy Vercel e URL ativa verificada (`https://vocentro.com.br`).
- [ ] Classificação de Risco informada (🟢 Baixo / 🟡 Médio / 🔴 Alto).
- [ ] Registro de débitos técnicos ou oportunidades descobertas.

## 3. Política de Versionamento do Padrão
- **v2.x**: Ajustes de clareza, organização e redação sem alteração de comportamento.
- **v3.0**: Alterações comportamentais, inclusão ou remoção de regras.
- **RFC**: Qualquer mudança estrutural deve nascer como proposta no repositório antes de ser incorporada ao padrão.
