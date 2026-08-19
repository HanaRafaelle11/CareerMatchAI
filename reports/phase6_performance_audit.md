# Relatório de Performance de Telemetria e Queries — Fase 6

## 1. Otimização de Queries Analíticas
- **Deduplicação no Backend/Memória**: Agrupamento por `Set<string>` em JavaScript sobre coleções indexadas por `created_at` e `user_id`.
- **Janelamento Estrito**: As consultas ao Supabase limitam o `created_at` aos últimos 30 dias (MAU), evitando downloads massivos de dados históricos desnecessários na tela administrativa.
- **Cache Local & Stale-While-Revalidate**: Uso de React Query com `staleTime: 60_000` (1 minuto) para evitar reexecução contínua de queries pesadas de agregação a cada render do React.

## 2. Métricas de Bundle e Carregamento
- Build de produção compilado em 9.77 segundos via Vite/Rolldown.
- `AdminDashboard.tsx` mantido como chunk assíncrono preguiçoso (`lazy loaded`), não pesando no First Contentful Paint (FCP) dos candidatos nas rotas públicas e de dashboard.
