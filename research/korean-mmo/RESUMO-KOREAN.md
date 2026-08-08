# RESUMO COMPARATIVO — Korean MMO & RuneScape

> Análise comparativa de 5 MMOs coreanos + RuneScape para replicação do modelo "Albion Online Market Analyzer".

## Tabela comparativa

| Jogo | API pública? | Player base (2025/26) | Economia | Concorrência (mercado) | Recomendação |
|------|--------------|----------------------|----------|------------------------|--------------|
| **Old School RuneScape** | ✅✅ Oficial Jagex + Wiki/RuneLite + WeirdGloop (3 APIs) | ~148K concurrent, >1M membros (CRESCENDO) | Grand Exchange global, flipping, Bonds | ALTA (GE Tracker 747K+ users, GE Margin) | **✅✅ GO (Top 1)** |
| **Black Desert Online** | ⚠️ Comunitária (Arsha.io, não-oficial) | ~20K Steam, ~200K total (estável) | Central Market com price bands, 35% tax | BAIXA (Garmoth foca em gear, não market) | **🟡 GO com ressalvas** |
| **RuneScape 3** | ✅ Mesmo ecossistema OSRS (Jagex + Wiki + WeirdGloop) | ~17-21K concurrent (DECLÍNIO LENTO) | Grand Exchange global, Bonds | BAIXA (sites focam em OSRS) | **⚠️ GO (complemento ao OSRS)** |
| **Lost Ark** | ❌ Não (ocidental); ✅ Coreia (developer-lostark) | ~5-6K Steam (declínio severo -95%) | Market + Auction, P2W | BAIXA | **🔴 NO-GO** |
| **Throne and Liberty** | ❌ Não (só TLDB interna sem suporte) | ~4K Steam (declínio severo -95%) | Auction House por servidor | BAIXA | **🔴 NO-GO** |

## Análise por critério

### Disponibilidade de API (melhor → pior)
1. **OSRS** — 3 APIs complementares (Jagex oficial + Wiki/RuneLite real-time 60s + WeirdGloop histórico). O melhor ecossistema de todos os 5 jogos. Documentação excelente.
2. **RS3** — Mesmas 3 APIs do OSRS (só trocar `/osrs` por `/rs`), mas cobertura real-time menor (sem RuneLite).
3. **BDO** — Arsha.io (comunitária, cache 30min, JSON limpo). Funciona mas não-oficial, pode descontinuar.
4. **Lost Ark** — API oficial só na Coreia (`developer-lostark.game.onstove.com`). Versão ocidental (Steam/Amazon) NÃO tem API.
5. **Throne and Liberty** — TLDB tem API interna sem suporte oficial. Frágil.

### Player base (maior → menor)
1. **OSRS** — ~148K concurrent, >1M membros pagos, "fastest-growing MMO" (2025). Pico histórico 240K.
2. **BDO** — ~200K total (multi-região), ~20K Steam. Estável.
3. **RS3** — ~17-21K concurrent. Declínio lento, 8x menor que OSRS.
4. **Lost Ark** — ~5-6K Steam (ocidental). -95% desde lançamento.
5. **Throne and Liberty** — ~4K Steam. -95% desde lançamento.

### Concorrência em ferramentas de mercado (menor → maior espaço)
1. **Throne and Liberty** — Baixa (TLDB é o único, mas mercado pequeno)
2. **Lost Ark** — Baixa (mas versão ocidental sem API)
3. **RS3** — Baixa (sites focam em OSRS; RS3 é secundário)
4. **BDO** — Baixa (Garmoth foca em gear companion, não pure market analysis)
5. **OSRS** — Alta (GE Tracker 747K+ users, GE Margin, GrandExchange.com)

## Top 2 mais promissores

### 🥇 1º — Old School RuneScape (OSRS)

**Por que é o #1:**
- **Melhor ecossistema de APIs de TODOS os 20 jogos pesquisados** — 3 APIs complementares, públicas, gratuitas, documentadas. API real-time atualiza a cada 60s (vs Albion ~5min, GW2 sem histórico).
- **Player base massiva e CRESCENDO** — ~148K concurrent, >1M membros, "fastest-growing MMO in the world" (Jagex/BBC, 2025). Pico histórico 240K. Maior público dos 5 jogos.
- **Economia puramente player-driven** — Grand Exchange é um order book real. Flipping/merchanting é uma profissão reconhecida. Margin trading (high/low) é exatamente o que o Albion Analyzer faz.
- **Modelo de monetização provado** — GE Tracker tem 747K+ usuários e cobra Premium ($4-8/mês). O mercado suporta múltiplos players (GE Margin é alternativa gratuita crescendo).
- **Implementação mais straightforward** — APIs REST bem documentadas, wrappers em Python/TS, dados JSON limpos. Arquitetura do Albion Analyzer pode ser quase diretamente reutilizada.

**Risco:** concorrência madura (GE Tracker 10+ anos). Mitigação: ser 100% gratuito (como GE Margin) + UX moderna + PT-BR.

### 🥈 2º — Black Desert Online (BDO)

**Por que é o #2:**
- **API comunitária funcional** (Arsha.io) — não-oficial mas estável, cache 30min, JSON limpo, multi-região (13 regiões).
- **Player base estável** (~200K total) — suficiente para ads.
- **Gap de mercado claro** — nenhum site combina market analysis + crafting profit + opportunity scanner (Garmoth foca em gear companion).
- **Economia rica** — life skills, processing, cooking, alchemy criam múltiplas oportunidades de análise.
- **Multi-região** — 13 regiões ampliam potencial de tráfego global.

**Risco:** API não-oficial (Arsha.io pode descontinuar); price bands controlados limitam arbitragem; taxa 35% reduz margens.

### ⚠️ Complemento — RuneScape 3 (RS3)

**Não é standalone, mas sai de graça com OSRS:**
- Mesmas 3 APIs do OSRS (só trocar endpoint `/osrs` → `/rs`).
- Mesma economia de Grand Exchange com flipping.
- Menor concorrência (sites focam em OSRS).
- **Estratégia**: fazer OSRS + RS3 no mesmo site (como GrandExchange.com). Esforço marginal, RS3 é diferencial.

## Resumo executivo

```
┌─────────────────────┬──────────────────┬──────────────────────────────┐
│ Jogo                │ Recomendação     │ Justificativa resumida        │
├─────────────────────┼──────────────────┼──────────────────────────────┤
│ Old School RuneScape│ ✅✅ GO (Top 1)   │ 3 APIs excelentes, player     │
│                     │                  │ base massiva e crescendo,     │
│                     │                  │ economia puramente player-    │
│                     │                  │ driven. Melhor candidato.     │
├─────────────────────┼──────────────────┼──────────────────────────────┤
│ Black Desert Online │ 🟡 GO c/ ressalvas│ API Arsha.io funcional, gap  │
│                     │                  │ de mercado, player base      │
│                     │                  │ estável. Risco: API não-     │
│                     │                  │ oficial + price bands.       │
├─────────────────────┼──────────────────┼──────────────────────────────┤
│ RuneScape 3         │ ⚠️ GO (complem.)  │ Mesma API do OSRS, menor     │
│                     │                  │ player base. Fazer junto com  │
│                     │                  │ OSRS (esforço marginal).     │
├─────────────────────┼──────────────────┼──────────────────────────────┤
│ Lost Ark            │ 🔴 NO-GO         │ Versão ocidental sem API,     │
│                     │                  │ player base em colapso.       │
├─────────────────────┼──────────────────┼──────────────────────────────┤
│ Throne and Liberty  │ 🔴 NO-GO         │ Sem API oficial, player base  │
│                     │                  │ em colapso (-95%).            │
└─────────────────────┴──────────────────┴──────────────────────────────┘
```

## Plano de ação recomendado

### Fase 1 — MVP com OSRS (top pick)
1. Consumir 3 APIs: Jagex (daily) + Wiki/RuneLite (real-time 60s) + WeirdGloop (histórico).
2. Features: **Flip Finder** (margin = high - low, com GE tax + buy limits), **Price History** (time-series 5m/1h/6h), **Money Making Calculators** (high alch, cooking, herblore), **Bond Price Tracker** (GP ↔ membership).
3. Stack: Next.js + TypeScript + SQLite (mesma do Albion Analyzer).
4. 100% gratuito (diferencial vs GE Tracker Premium) + PT-BR.

### Fase 2 — Adicionar RS3 (esforço marginal)
1. Mesma API, trocar endpoint `/osrs` → `/rs`.
2. Adicionar aba RS3 no mesmo site.

### Fase 3 (opcional) — BDO
1. Consumir Arsha.io API.
2. Features: crafting profit calculator, opportunity scanner, multi-região.
3. Só após validar modelo com OSRS.

### Descartados
- **Lost Ark**: sem API na versão ocidental.
- **Throne and Liberty**: sem API oficial, player base em colapso.
