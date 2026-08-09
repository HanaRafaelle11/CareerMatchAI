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

## SEGURANÇA E PROTEÇÃO DE SEGREDOS

> **"NUNCA exibir, imprimir, colar, registrar ou reproduzir em texto nenhum segredo ou dado sensível."**

1. **Nunca expor segredos:** Nunca imprimir, reproduzir ou revelar valores reais de: API keys, Supabase Service Role Key, JWTs, tokens, senhas, secrets de ambiente, chaves privadas, cookies/sessões, credenciais de banco, credenciais de usuários e códigos de recuperação.
2. **Nunca usar comandos que imprimam secrets:** É proibido executar comandos como `echo`, `console.log`, `print`, `cat`, `type` ou equivalentes sobre variáveis ou arquivos que possam conter segredos. Retornar somente status mascarado (`SECRET PRESENTE`, `SECRET AUSENTE`, `CREDENCIAL VÁLIDA`, `CREDENCIAL INVÁLIDA`, `valores coincidem`).
3. **Credenciais em testes:** Nunca colocar senha, token ou credencial real diretamente em arquivos `.ts`, `.js`, `.mjs`, testes, scripts, commits, documentação, prompts ou relatórios. Usar variáveis de ambiente (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`). Valores reais devem permanecer fora do código versionado.
4. **Linha de comando:** Sempre preferir variáveis de ambiente ou mecanismos seguros em vez de colocar secrets diretamente na linha de comando. Nunca reproduzir o comando contendo o valor secreto em um relatório posterior.
5. **Playwright / E2E:** Testes autenticados devem usar credenciais por variáveis de ambiente. Nunca salvar senha ou token em screenshots, vídeos, traces, logs, reports HTML ou arquivos temporários. Se algum artefato puder conter credenciais, deve ser removido antes do encerramento da tarefa.
6. **Git / GitHub:** Antes de qualquer `git commit` ou `git push`, verificar os arquivos staged e modificados em busca de API keys, JWTs, Service Role Keys, passwords, tokens, `.env` ou arquivos de credenciais. Se um segredo for encontrado: PARAR imediatamente, não fazer commit nem push, e informar apenas que um segredo foi detectado, sem revelar seu valor.
7. **Segredos encontrados acidentalmente:** Se um segredo aparecer durante uma tarefa: não copiar novamente, não imprimir, não incluir no relatório, não incluir em arquivos, não colocar no Git, apagar o artefato temporário quando apropriado e recomendar rotação/revogação quando houver possibilidade de exposição.
8. **Relatórios:** Relatórios devem mencionar somente o estado do segredo, nunca seu conteúdo (ex: `Service Role Key: encontrada durante a execução, valor não reproduzido`).
9. **Regra para ferramentas auxiliares:** Essas regras aplicam-se igualmente a agentes, subagentes, browser automation, Playwright, scripts temporários, comandos de terminal e ferramentas de diagnóstico.
10. **Princípio de menor exposição:** Nunca acessar ou consultar uma credencial sensível se a tarefa puder ser realizada sem ela.
