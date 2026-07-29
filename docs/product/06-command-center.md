# 06 — Command Center / Admin Dashboard (Vocentro Product KB)

## Estrutura das 11 Abas do Painel Administrativo (`AdminDashboard.tsx`)

1. **Executive Overview (Aba 1)**: Métricas consolidadas da empresa (Usuários Ativos, Conversão, Retenção, Volume de Matches e Taxa de Sucesso de IA).
2. **Produto em Risco (Aba 2 - Módulo 2.1)**: Central de alertas proativos com monitoramento de usuários estagnados no onboarding, falhas de parsing e travamentos no pipeline.
3. **Insights do Copiloto (Aba 3 - Módulo 2.2)**: Monitoramento da eficiência do Copiloto IA (tempo médio de resposta, índice de satisfação STAR, chamadas realizadas e custo por usuário).
4. **Feature Adoption (Aba 4 - Módulo 2.3)**: Taxa de adoção por ferramenta (Otimização de CV, Simulação de Entrevista, Match de Vagas, Carta de Apresentação).
5. **Churn Intelligence (Aba 5 - Módulo 2.4)**: Diagnóstico preditivo de cancelamento agrupando usuários em risco com ação imediata via `ContactActionModal`.
6. **Saúde do Negócio (Aba 6 - Módulo 2.5)**: KPIs financeiros (MRR Estimado, ARR Projetado, LTV/CAC, Taxa de Conversão Free→Premium e status de integração Asaas/Stripe).
7. **Saúde do Produto (Aba 7 - Módulo 2.6)**: Funil completo do produto e análise de drop-off etapa por etapa da jornada do candidato.
8. **Inteligência Comercial (Aba 8 - Módulo 2.7)**: Scoring de propensão a upgrade, ofertas de desconto, indicação de embaixadores e NPS.
9. **Executive Copilot (Aba 9 - Módulo 2.8)**: Síntese preditiva cruzada que consolida os insights dos Módulos 2.1 a 2.7 em recomendações estratégicas para a liderança.
10. **Usuários & RBAC (Aba 10)**: Gestão de permissões de acesso (`administrador`, `suporte`, `financeiro`, `somente_leitura`) e tabela de candidatos com botão "📄 Ver CV".
11. **Event Stream & Erros (Aba 11)**: Feed em tempo real de logs de auditoria com nomes reais de usuários e títulos de vagas em vez de UUIDs.
