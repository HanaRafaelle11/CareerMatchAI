# Auditoria Forense de Privacidade & LGPD — Fase 7

## 1. Princípio de Minimização de Dados
A telemetria do VoCentro é estritamente comportamental e anônima. Nenhuma informação pessoal identificável (PII) é transmitida em metadados de eventos:
- E-mails são mascarados (`can***`).
- Textos brutos de currículos e senhas são bloqueados pelo `AnalyticsEventValidator`.
- Dados financeiros (números de cartão, CVV) nunca passam pelo backend do produto (tokenizados diretamente pelos SDKs do Stripe/Asaas).

## 2. Bloqueio Preventivo no Frontend
O `AnalyticsEventValidator.validate(event)` intercepta todos os envios antes de acionar a escrita no Supabase. Caso detecte qualquer chave proibida (`password`, `cpf`, `credit_card`, `token`, `secret`), o evento é rejeitado com aviso em console.
