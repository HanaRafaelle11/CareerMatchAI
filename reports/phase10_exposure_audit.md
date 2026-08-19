# Auditoria Forense de Exposição vs Atribuição — Fase 10

## 1. Regra de Separação de Estados
- **Eligible**: Usuário que acessa o domínio ou rota base.
- **Assigned**: Usuário para quem a variante foi computada pelo hash.
- **Exposed**: Usuário cujo componente experimental foi efetivamente montado e visível na viewport.
- **Converted**: Usuário exposto que completou a ação primária subsequente.

## 2. Prevenção de Falsos Positivos
Eventos de conversão ocorridos antes do timestamp do primeiro evento `experiment_exposed` são automaticamente rejeitados e excluídos do cálculo de uplift.
