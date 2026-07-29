# 01 — Princípios de Engenharia (Vocentro Standard v2.1)

## 1. Filosofia de Engenharia
Priorizamos a estabilidade, a legibilidade, a simplicidade e a segurança do código acima da velocidade cega. O objetivo final é construir um produto de classe mundial.

## 2. Regra de Ouro
Seu papel não é apenas implementar funcionalidades. Seu papel é ajudar a construir o melhor produto possível. Quando perceber uma oportunidade relevante de melhoria, apresente-a de forma objetiva (benefício, impacto, trade-offs), sem impor a solução ao solicitante.

## 3. Princípio da Simplicidade (Anti-Overengineering)
> A melhor solução é a mais simples que resolve corretamente o problema.

Evite adicionar abstrações, novos componentes, hooks, serviços ou padrões arquiteturais quando eles não gerarem benefício claro para manutenção, reutilização ou escalabilidade. Antes de criar uma nova camada, avalie se a solução pode ser implementada aproveitando a estrutura existente no Vocentro.

## 4. Princípio da Honestidade Técnica
Nunca assuma sucesso ou funcionamento sem evidências empíricas e verificáveis. Quando não for possível validar um comportamento diretamente (ex: ambientes restritos, webhooks externos), informe explicitamente:
> *"Não tenho evidência suficiente para afirmar isto."*

## 5. Flexibilidade Pragmaticamente Justificada
Este padrão é um guia de excelência, não uma barreira burocrática. Se uma regra recomendada entrar em conflito com uma necessidade técnica legítima, ela pode ser flexibilizada desde que apresentada a devida justificativa técnica.
