# Relatório de Privacidade, LGPD e Mascaramento de Telemetria — Fase 6

## 1. Diretriz de Privacidade
A telemetria do VoCentro é estritamente comportamental e agregada. É terminantemente proibido trafegar dados de identificação pessoal desprotegidos (PII), senhas, segredos ou dados financeiros brutos em payloads de telemetria e analytics.

## 2. Validações Implementadas no `AnalyticsEventValidator`
Qualquer evento submetido para envio é submetido ao validador canônico que bloqueia as seguintes chaves no objeto `properties`:
1. `password`, `pass`, `senha`
2. `token`, `secret`, `api_key`, `authorization`
3. `cpf`, `credit_card`, `card_number`, `ccv`, `cvv`
4. `resume_raw_text` (o texto completo do currículo não deve ir para o payload de telemetria)

## 3. Sanitização no `AnalyticsTracker`
- **E-mails**: Mascaramento estrito retendo apenas os 3 primeiros caracteres (`can***`).
- **Cartão de Crédito e Pagamentos**: Registro exclusivo do método (`CREDIT_CARD`, `PIX`) e ciclo (`MONTHLY`), com rejeição total de números de cartão ou CCV.
- **Mensagens do Copiloto**: O payload registra somente `length: number` e `is_pro: boolean`, nunca o conteúdo da conversa.
- **Erros**: Restritos a categorias de alto nível (`rate_limit`, `network_or_api`) sem mensagens de erro com stack trace contendo credenciais ou URLs internas.

## 4. Auditoria de Acesso de Administrador
Todo acesso de admin a perfis de usuários ou currículos gera um registro compulsório e imutável na tabela `admin_access_logs`, acessível na aba de Infraestrutura/Auditoria.
