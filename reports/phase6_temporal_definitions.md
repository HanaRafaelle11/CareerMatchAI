# Relatório de Definições Temporais e Janelas Canônicas — Fase 6

## 1. Contexto e Problema Original
Anteriormente, o sistema misturava definições pontuais de data (ex: `date.getDate() === today.getDate()`), gerando quebras graves na fronteira de meia-noite (UTC vs UTC-3 Brasília) e anomalias onde o WAU aparecia artificialmente menor que o DAU.

## 2. Padrão Unificado: Rolling Windows
Todas as métricas analíticas e de engajamento do VoCentro agora adotam **Rolling Windows** estritas de milissegundos a partir da data de referência (`refDate`, default `new Date()`):

| Métrica | Janela Temporal Canônica | Milissegundos | Inclusão de Subconjunto |
| :--- | :--- | :--- | :--- |
| **DAU** | Rolling 24 Horas (`now - 24h`) | $24 \times 60 \times 60 \times 1000$ | $E_{24h} \subseteq E_{7d} \subseteq E_{30d}$ |
| **WAU** | Rolling 7 Dias (`now - 7d`) | $7 \times 24 \times 60 \times 60 \times 1000$ | $E_{7d} \subseteq E_{30d}$ |
| **MAU** | Rolling 30 Dias (`now - 30d`) | $30 \times 24 \times 60 \times 60 \times 1000$ | Conjunto Universo Ativo |

## 3. Prova Matemática do Invariante $DAU \le WAU \le MAU$
Seja $U(t_0, t_1)$ o conjunto de `user_id` únicos que emitiram eventos no intervalo $[t_0, t_1]$.
Dado que:
$$[now - 24h, now] \subset [now - 7d, now] \subset [now - 30d, now]$$
Temos que:
$$U(now - 24h, now) \subseteq U(now - 7d, now) \subseteq U(now - 30d, now)$$
Logo, por cardinalidade de conjuntos finitos:
$$|U_{24h}| \le |U_{7d}| \le |U_{30d}| \iff \mathbf{DAU \le WAU \le MAU}$$

Não é necessário e é proibido o uso de `Math.max()` compensatório. Qualquer desvio é capturado como inconsistência de dados ou erro de query.

## 4. Indicador de Freshness de Dados
Os dashboards passam a computar a frescura do dado com base no timestamp da consulta:
- **`fresh` (Verde)**: Dados atualizados há menos de 5 minutos.
- **`aging` (Amarelo)**: Dados entre 5 e 30 minutos.
- **`stale` (Cinza/Alerta)**: Dados com mais de 30 minutos sem sincronização.
