# ADR-010 — Modelo Freemium com R$ 49,90/mês e Limites de Uso

## Status
Accepted

## Contexto
Definir uma estratégia de monetização justa que permita a candidatos em busca do primeiro emprego utilizar os recursos essenciais gratuitamente, oferecendo uma assinatura acessível para quem deseja acelerar sua recolocação com uso ilimitado de IA.

## Decisão
Implementar a estrutura Freemium:
- **Plano Free**: Upload de 2 CVs, 5 cálculos de Match/dia e 3 simulações STAR/mês.
- **Plano Premium (R$ 49,90/mês)**: Acesso ilimitado a todas as ferramentas inteligentes, análises avançadas de ROI e suporte prioritário.

## Motivo
- **Baixa barreira de entrada**: Atração contínua de novos candidatos (Aquisição).
- **Proposta de valor clara**: Conversão motivada pela alta frequência de candidaturas e treino diário de entrevistas.

## Consequências
### Positivas
- Sustentabilidade financeira da infraestrutura de IA e Supabase.
- Mapeamento transparente do funil de conversão no Módulo 2.5 (Saúde do Negócio).
### Negativas / Trade-offs
- Necessidade de gerenciar a transição suave de telas bloqueadas por limite para não frustrar o candidato Free.

## Alternativas Descartadas
- **Modelo Pay-per-use por token de IA**: Descartado por gerar ansiedade no usuário durante o uso.
- **Modelo 100% Pago (Sem Plano Free)**: Descartado por reduzir drasticamente a taxa de aquisição orgânica.
