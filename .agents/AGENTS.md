# Project Rules - CareerMatchAI (VoCentro)

## Workflow Mandatório para Conclusão de Qualquer Implementação
Ao concluir qualquer implementação ou alteração no projeto, siga obrigatoriamente estes passos em sequência:

1. **Linting**: Execute a verificação de linter/tipos (`npx tsc -b` ou `npm run lint`).
2. **Build**: Execute a compilação local (`npm run build`).
3. **Commit**: Crie um commit com mensagem descritiva padronizada.
4. **Push**: Envie as alterações para o repositório remoto (`git push origin main`).
5. **Confirmação GitHub**: Verifique via `git fetch origin` e `git log` que o GitHub recebeu o commit.
6. **Hash do Commit**: Informe explicitamente o hash do commit gerado.
7. **Deploy Vercel**: Aguarde a conclusão do deploy na Vercel (`npx vercel --prod` ou webhook).
8. **Validação de Produção**: Confirme o status e a URL ativa em produção (`https://vocentro.com.br`) antes de declarar a tarefa concluída.

## Regra Fundamental de Engenharia de Qualidade
> **"Se um bug importante foi encontrado manualmente uma vez, o objetivo é que a mesma classe de bug nunca mais precise ser descoberta manualmente."**

