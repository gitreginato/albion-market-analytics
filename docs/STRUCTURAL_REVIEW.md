# Revisão Estrutural — Albion Market Analyzer

## 1. Diagnóstico: por que o scan "para do nada"

### Causas raiz identificadas

1. **Scan é fire-and-forget em memória**
   - O endpoint `/api/scan?mode=start` inicia `scanItems()` e responde imediatamente.
   - O progresso fica em variáveis globais `currentProgress` / `lastScanResult` no módulo da route.
   - **Se o dev server restartar (HMR), o processo morre e o progresso some.**
   - O cliente continua pollando `status`, mas `isScanning` volta `false` porque o estado resetou.
   - Resultado aparente: "parou do nada".

2. **Sem retentativas (retries) com backoff**
   - `client.ts` faz `fetch` uma única vez com timeout de 8s (20s no scanner).
   - Se a API Albion responder 429, 503, timeout ou ECONNRESET, o lote falha e é logado como erro.
   - Não há retry exponencial; lotes com erro simplesmente são pulados.

3. **Sem persistência de progresso**
   - Não há tabela de `scan_job` com estado (`pending`, `running`, `done`, `failed`).
   - Não é possível retomar um scan interrompido.

4. **better-sqlite3 síncrono pode bloquear o event loop**
   - `upsertPrices` roda dentro de uma transação síncrona. Lotes de 20 itens × 8 cidades = 160 rows por vez, ainda OK, mas em full scan (`all`) com ~3000 itens, a escrita pode ser percebida como travamento.

5. **Polling do cliente a cada 1s sem circuit breaker**
   - Se o servidor estiver saturado, o cliente continua batendo a cada 1s.
   - Sem exponential backoff no polling.

## 2. Problemas de infraestrutura / API / DB

| Área | Problema | Risco |
|------|----------|-------|
| **API routes** | Não há validação de input (Zod/Joi) — apenas `params.get()` e casts. | Injeta valores inválidos no domínio. |
| **API routes** | Todos os endpoints fazem I/O externo síncrono dentro de `GET` sem cache durável. | Lenta, suscetível a falhas, não escalável. |
| **API routes** | `scan` roda background sem fila de trabalho. | Não há garantia de execução, conflitos, race conditions. |
| **Repository** | `getDb()` é singleton sem mutex para múltiplas escritas concorrentes. | Pode corromper DB em requisições paralelas (SQLite WAL ajuda, mas não resolve sem controle). |
| **Repository** | Sem índice composto para queries frequentes. | Performance piora com volume. |
| **Repository** | Sem rotação / limpeza de dados antigos. | DB cresce indefinidamente. |
| **Client** | Cache em memória (`Map`) por processo. | Não compartilha entre workers; Next.js pode rodar múltiplos processos. |
| **Client** | Sem rate-limit real: apenas `sleep(350)` entre lotes. | A API Albion pode bloquear IP se a carga aumentar. |
| **Client** | Sem logs estruturados de requisições. | Difícil diagnosticar falhas. |

## 3. Seções ainda em "modo Excel" (tabelas puras)

Identificadas em `src/components/dashboard.tsx`:

1. **Painel de Preços (PricesPanel)** — `table` simples com cabeçalho de cidades.
   - Linha: `src/components/dashboard.tsx:275-308`
   - Deve virar **cards de cidade** ou **data grid com sparkline mini**.

2. **Painel de Arbitragem / Historico / Item details** — `table` secundária.
   - Linha: `src/components/dashboard.tsx:480-514`
   - Deve virar **listas de oportunidades** com badges, variação e imagem do item.

3. **Histórico de scans (scan log)** — `table` de logs monoespaçada.
   - Linha: `src/components/dashboard.tsx:1259-1280`
   - Deve virar **timeline vertical** com status e duração.

4. **Outra tabela de dados** (provavelmente history ou gold list).
   - Linha: `src/components/dashboard.tsx:1720-1810`
   - Deve ser **chart-first + card summary**.

## 4. Template Corona React — o que falta aplicar

O template Corona Free é um **admin dashboard dark** com:
- Sidebar fixa com nav icons + labels
- Cards de KPI grandes com gradientes
- Widgets com sparklines/charts
- Tables estilizadas como "data grids" (não planilhas)
- Topbar minimalista
- Layout de 2 colunas: sidebar + content

O que foi feito até agora:
- Sidebar básica criada (bom começo)
- Header com gradiente
- Cards de KPI simples

O que ainda falta para "incorporar o template de verdade":
- **Dashboard overview page**: cards com sparklines, gráfico de volume, resumo de mercado
- **Layout consistente**: as tabelas precisam virar cards ou data grid
- **Paleta de cores mais próxima do Corona**: cinzas escuros, azul como cor primária, cards com bordas suaves
- **Topbar**: notificações, search global, profile avatar (dummy)
- **Footer**: informações de status e links

## 5. Arquitetura alvo proposta (macro)

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  UI Layer   │  │  API Routes │  │  Background Jobs    │  │
│  │  (components)│  │  (controllers)│  │  (queue/scheduler) │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                      │           │
│         └────────────────┬──────────────────────┘           │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────┐           │
│  │              Service Layer (domain)            │           │
│  │  scanner | opportunities | projections | ...   │           │
│  └───────────────────────┬───────────────────────┘           │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────┐           │
│  │              Repository Layer (SQLite)         │           │
│  │  prices | scan_jobs | scan_logs | snapshots    │           │
│  └───────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 6. Roadmap de melhorias (priorizado)

### Fase A — Robustez crítica (sem template ainda)
1. **Persistir scan em tabela `scan_jobs`**
   - Colunas: `id`, `status`, `region`, `items_total`, `items_done`, `errors_json`, `started_at`, `finished_at`, `updated_at`.
   - Endpoint `status` lê da tabela, não da memória.
   - Scanner atualiza `scan_jobs` a cada lote.
2. **Adicionar retries com backoff no `client.ts`**
   - Máximo 3 tentativas: 1s, 2s, 4s.
   - Não retry em 400/404, retry em 429/5xx/timeout.
3. **Circuit breaker / rate-limit melhor**
   - Janela deslizante de requisições (max 3 req/s, 180 req/min).
4. **Limpar dados antigos automaticamente**
   - Job: apagar preços com `scanned_at < now - 7 dias`.
5. **Validação de input nas API routes**
   - Introduzir Zod para query params.

### Fase B — UX Corona + data grids
6. **Refatorar tabelas para cards/data grids**
   - PricesPanel: grid de cards por cidade com sparkline.
   - HistoryPanel: chart-first + resumo em cards.
   - Scan log: timeline vertical.
7. **Dashboard overview page**
   - Resumo geral: itens no DB, último scan, melhor oportunidade, variação de gold.
8. **Topbar no estilo Corona**
   - Search global, notificações, status do servidor.
9. **Melhorar a sidebar**
   - Adicionar submenus, badges de count, collapsed state em desktop.

### Fase C — Escalabilidade e observabilidade
10. **Separar scan worker em job queue**
    - Opcional: usar `bullmq` + Redis ou simples `better-queue` + SQLite.
11. **Cache Redis para dados agregados**
    - Cachear projections, opportunities por 5 min.
12. **Logs estruturados e métricas**
    - Logar cada requisição externa com correlation ID.
13. **Testes de integração para scan jobs**
    - Simular falha e retomada.

## 7. Trade-offs das abordagens principais

### Scan persistente vs. fire-and-forget
- **Opção 1 (recomendada): tabela `scan_jobs` no SQLite**
  - Prós: simples, sem infra extra, recupera de restart, permite retomada.
  - Contras: escritas mais frequentes no DB, precisa de schema migration.
- **Opção 2: Redis + bullmq**
  - Prós: robusto, escalável, ideal para produção multi-instance.
  - Contras: adiciona infra (Redis), complexidade, overkill para app local.

### Retry de requisições externas
- **Opção 1 (recomendada): retry simples com backoff no `client.ts`**
  - Prós: resolve 90% dos casos de "parou do nada" com pouco código.
  - Contras: ainda pode falhar em indisponibilidade prolongada.
- **Opção 2: circuit breaker + fila**
  - Prós: mais resiliente.
  - Contras: mais complexo, precisa de estado compartilhado.

### Tabelas para cards vs. data grid
- **Opção 1 (recomendada): cards para listas pequenas, data grid mantido para tabelas grandes**
  - Prós: mobile-friendly, visualmente mais próximo do Corona.
  - Contras: perde ordenação rápida de colunas (a menos que implementemos headers sortables).
- **Opção 2: manter tabelas, apenas estilizar como TailAdmin/Corona**
  - Prós: menor esforço, mantém funcionalidade.
  - Contras: continua parecendo Excel, não atende ao pedido.

## 8. Recomendação imediata

Executar **Fase A** primeiro: persistir scan e adicionar retries. Isso resolve o problema "parou do nada" e dá base sólida para as melhorias de UI. Depois aplicar **Fase B** para transformar as tabelas em cards e deixar o app visualmente próximo do Corona.
