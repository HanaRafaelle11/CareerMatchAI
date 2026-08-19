# Relatório de Auditoria de Conversão e Paywall — Fase 6

## 1. Gatilhos Canônicos de Monetização (Plano Pro)
O VoCentro possui três pontos de contato principais com o modelo freemium/Pro:
1. **Limite de Análises Semanais**: Bloqueio transparente após atingir a cota gratuita semanal.
2. **Features Avançadas de IA**: Otimização profunda de currículo orientada a ATS e geração customizada de carta de apresentação.
3. **Simulador de Entrevistas Ilimitado**: Perguntas situacionais e técnicas ilimitadas com feedback em tempo real.

## 2. Rastreamento e Telemetria de Conversão
A esteira de conversão dispara 4 eventos canônicos encadeados:
1. `paywall_viewed`: Exibição do modal de limite de cota atingida.
2. `paywall_cta_clicked`: Clique no botão "Fazer Upgrade para Pro".
3. `checkout_started`: Abertura da tela de checkout com plano (`pro`), método (`PIX` / `CREDIT_CARD`) e ciclo (`MONTHLY`).
4. `payment_confirmed`: Disparo autenticado após retorno positivo do webhook do Stripe / Asaas.

## 3. Integridade das Taxas de Conversão
- Taxa de conversão calculada estritamente como $\frac{\text{Assinantes Pro Ativos}}{\text{Total de Usuários Reais Cadastrados}} \times 100$.
- Sem risco de divisão por zero quando a base de cadastros é nula.
