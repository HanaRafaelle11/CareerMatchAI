# Confiabilidade e Resiliência da Persistência de Eventos — Fase 7.1

## 1. Fluxo de Execução da Telemetria

```text
Ação do Usuário (Click/Submit/Navigation)
      ↓
AnalyticsEventValidator.validate(event)  [Bloqueio Preventivo de PII e Segredos]
      ↓
AnalyticsTracker.track(eventName, category, metadata)
      ↓
Captura de Contexto (Session ID, Dispositivo, OS, Browser, Geometadados BR)
      ↓
Gravação no Supabase (await supabase.from('analytics_events').insert(payload))
      ├── Se Sucesso: Persistido no PostgreSQL em tempo real
      └── Se Erro/Offline: console.warn + Fallback para localDB.saveAnalyticsEvent(payload)
```

## 2. Auditoria de Falhas Silenciosas e Blocos Catch
- **`tracker.track`**: Implementa `try / catch` global que nunca interrompe a experiência do usuário se a rede oscilar. Quando o Supabase falha, emite aviso em console e persiste no `localDB`.
- **Prevenção de Perda de Eventos Críticos de Negócio**: Eventos transacionais (`resumes`, `matches`, `applications`, `billing_transactions`, `ai_usage_logs`) são gravados primariamente em suas próprias tabelas de domínio através de chamadas assíncronas do backend, tornando a telemetria em `analytics_events` uma camada complementar não-bloqueante.
