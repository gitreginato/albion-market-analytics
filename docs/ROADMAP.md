# Roadmap — Albion Market Analyzer

## Sprint 1: Robustez do Scan (crítico — resolve "parou do nada")
- [ ] Criar tabela `scan_jobs` no SQLite
- [ ] Refatorar `/api/scan` para usar `scan_jobs` ao invés de variáveis em memória
- [ ] Atualizar scanner para salvar progresso a cada lote na tabela
- [ ] Implementar retomada de scan interrompido
- [ ] Adicionar retries com exponential backoff no `client.ts`
- [ ] Adicionar rate-limiting por janela deslizante (3 req/s, 180 req/min)
- [ ] Adicionar Zod para validação de query params nas API routes
- [ ] Testes: scan retomado após falha, retry em 429, validação de input

## Sprint 2: Higienização de Dados e Performance
- [ ] Adicionar índice composto `(item_id, city, quality, scanned_at)`
- [ ] Job de limpeza automática de preços antigos (> 7 dias)
- [ ] Cache TTL em Redis para projections/opportunities (ou no mínimo memoização em memória com chave estável)
- [ ] Separar writes do scan em batches menores para não bloquear event loop
- [ ] Logs estruturados para todas as chamadas externas

## Sprint 3: UX Corona — Dashboard Overview
- [ ] Criar página `/dashboard` com overview cards
- [ ] Cards KPI com gradientes, sparklines e variação percentual
- [ ] Topbar no estilo Corona: search global, notificações, status
- [ ] Sidebar melhorada: collapsed state, badges, submenus
- [ ] Footer com status e links

## Sprint 4: Converter Seções "Modo Excel"
- [ ] PricesPanel: grid de cards por cidade com mini-sparkline
- [ ] HistoryPanel: chart-first + cards de resumo
- [ ] ArbitragePanel: lista de cards com badge de lucro e variação
- [ ] Scan log: timeline vertical com ícones de status
- [ ] GoldPanel: card de cotação + gráfico de tendência

## Sprint 5: Escalabilidade e Produção
- [ ] Queue de scan workers (better-queue ou bullmq)
- [ ] Cache distribuído (Redis)
- [ ] Métricas e observabilidade (tempo de resposta, taxa de erro, cache hit)
- [ ] Testes E2E para fluxo completo: scan → analisar → projeções

## Status Atual
- ✅ Sprint 0: Refactor inicial, FilterBar, Sidebar básica, multi-tier projections
- 🔄 Próximo: Sprint 1 (robustez do scan)
