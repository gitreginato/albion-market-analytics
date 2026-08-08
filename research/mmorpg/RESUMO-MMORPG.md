# RESUMO COMPARATIVO — MMORPGs com Economia de Jogador

> Análise comparativa de 5 MMORPGs para replicação do modelo "Albion Online Market Analyzer" (site de análise estatística de compra/venda + builds + dicas, monetizado com ads).

## Tabela comparativa

| Jogo | API pública? | Tipo de API | Player base (est. 2025/26) | Economia | Concorrência (mercado) | Concorrência (builds) | Recomendação |
|------|--------------|-------------|----------------------------|----------|------------------------|-----------------------|--------------|
| **World of Warcraft** | ✅ Sim (oficial Blizzard + Undermine Exchange + TSM) | Oficial REST + comunitária REST | ~3–9M assinantes (2.25M DAU) | AH centralizado por realm + region-wide commodities; 5% cut; LIFO | ALTA (Undermine Exchange, Saddlebag, GoblinBid, Umbral) | MUITO ALTA (Wowhead, Icy Veins, Maxroll) | **GO com ressalvas** |
| **Final Fantasy XIV** | ⚠️ Parcial (Universalis crowdsourced + XIVAPI game data) | Comunitária REST (crowdsourced) | ~1–1.5M assinantes (~880k ativos) | Market Board per-world, sell-listing-only; tax 5% buyer + 0–5% seller; cross-world arbitrage | MODERADA (Universalis, Ultros, Saddlebag) | ALTA (The Balance, Teamcraft, Icy Veins) | **GO** |
| **Elder Scrolls Online** | ❌ Não (só addons crowdsourced, sem API REST) | Addon + cliente (TTC, ESO-Hub) | ~500k–1M (est.) | Guild Traders fragmentados (sem AH central); 1% listing + 7% sale | BAIXA-MODERADA (TTC, ESO-Hub) | MODERADA (Alcast, ESO-Hub, ESO Academy) | **NO-GO** |
| **New World** | ❌ Não (NWMarketPrices crowdsourced, limitado) | Comunitária mínima | ~500 avg (jun/2026) — **SUNSET 31/01/2027** | Trading Post por settlement; refinamento/crafting | BAIXA (NWDB, NWMarketPrices — em declínio) | BAIXA (NWDB, NewWorldBuilds) | **NO-GO (definitivo)** |
| **Guild Wars 2** | ✅ Sim (oficial ArenaNet — a melhor de todas) | Oficial REST completa | ~300k–500k ativos mensais | Trading Post centralizado global, two-sided order book; 15% fees (5% list + 10% sale) | MODERADA (GW2BLTC, gw2efficiency, AuricDB) | ALTA (Snow Crows, Hardstuck, Metabattle) | **GO (forte)** |

## Análise por critério

### Disponibilidade de API (ordenado, melhor → pior)
1. **GW2** — API oficial REST completa, order book two-sided, exchange rates, rate limit generoso (300 burst, 5/s). **Sem dependência de crowdsourcing.**
2. **WoW** — API oficial Blizzard REST + APIs comunitárias maduras (Undermine Exchange, TSM). Dados oficiais em tempo real.
3. **FFXIV** — API comunitária Universalis (crowdsourced via ACT plugin) + XIVAPI (game data). Funciona mas tem gaps de cobertura.
4. **ESO** — Sem API REST. Addons crowdsourced (TTC, ESO-Hub) sem endpoint público. Barreira alta.
5. **New World** — Sem API oficial. NWMarketPrices crowdsourced e em declínio (sunset).

### Player base (ordenado, maior → menor)
1. **WoW** — ~3–9M (dominante absoluto)
2. **FFXIV** — ~1–1.5M
3. **GW2** — ~300k–500k (estável)
4. **ESO** — ~500k–1M (estimativa)
5. **New World** — ~500 avg (morrendo)

### Concorrência em ferramentas de mercado (ordenado, menor → maior espaço)
1. **ESO** — Baixa-modera (TTC datado, sem API) — mas barreira de dados alta
2. **New World** — Baixa (mas mercado morrendo)
3. **GW2** — Moderada (GW2BLTC bom mas datado; espaço para UX moderna)
4. **FFXIV** — Moderada (Universalis domina dados, Ultros é moderno mas jovem)
5. **WoW** — Alta (Undermine Exchange + Saddlebag maduros)

### Mapeamento de features do Albion Analyzer → cada jogo

| Feature do Albion Analyzer | WoW | FFXIV | GW2 | ESO | New World |
|----------------------------|-----|-------|-----|-----|-----------|
| Preços atuais por cidade | ✅ (por realm/region) | ✅ (per World) | ✅ (global, 1 mercado) | ⚠️ (por guild trader, fragmentado) | ✅ (por settlement) |
| Histórico de preços | ✅ (Undermine Exchange) | ✅ (Universalis) | ⚠️ (snapshot só — armazenar próprio) | ⚠️ (TTC, sem API) | ⚠️ (limitado) |
| Arbitragem entre cidades | ✅ (cross-realm flipping) | ✅ (cross-world flipping) | ✅✅ (flip buy/sell spread — o mais direto) | ✅ (entre guild traders) | ✅ (entre settlements) |
| Black Market | ✅ (BMAH) | ❌ | ❌ | ❌ | ❌ |
| Lucro de refinamento/crafting | ✅ | ✅ (crafting profit) | ✅✅ (recipes via API) | ⚠️ (sem API de recipes) | ✅ |
| Scanner de oportunidades (SQLite) | ✅ | ✅ | ✅✅ | ❌ (sem dados) | ✅ (mas sunset) |
| Cotação de ouro/moeda premium | ✅ (WoW Token) | ❌ | ✅ (Gem exchange Gold↔Gems) | ❌ | ❌ |

## Top 2 mais promissores

### 🥇 1º — Guild Wars 2 (GW2)

**Por que é o #1:**
- **API oficial é a melhor de todos os 5 jogos** — order book two-sided completo (buy + sell listings), exchange Gold/Gems, game data (items, recipes), rate limit generoso. Sem crowdsourcing, sem scraping, sem dependência de terceiros.
- **Mercado centralizado global** — um único dataset, sem granularidade por realm/cidade/World. Arquitetura mais simples que WoW (186 realms × 4 regiões) ou FFXIV (dezenas de Worlds × DCs).
- **Mapeamento 1:1 com o Albion Analyzer** — flip finder (spread buy/sell após 15% fees) = arbitragem entre cidades; crafting profit (recipes via API) = lucro de refinamento; gem exchange = cotação de ouro. Todas as features principais têm equivalente direto.
- **Base estável** (~300k–500k), sem risco de sunset.
- **Concorrência moderada** — GW2BLTC é bom mas datado; espaço claro para UX moderna + PT-BR + integração builds.
- **Viabilidade técnica: a mais fácil.** Next.js + SQLite (stack atual do projeto) funciona diretamente.

**Risco:** concorrência de GW2BLTC/gw2efficiency. Mitigação: UX + integração + PT-BR.

### 🥈 2º — Final Fantasy XIV (FFXIV)

**Por que é o #2:**
- **API comunitária madura (Universalis)** equivalente ao Albion Online Data Project — crowdsourced via ACT plugin, REST API bem documentada, wrappers em múltiplas linguagens.
- **Economia rica com arbitragem real** — cross-world flipping, vendor resale, crafting profit. Sell-listing-only (sem buy orders) muda um pouco o modelo, mas as features de arbitragem se aplicam.
- **Base grande** (~1M+), comunidade de crafters/gil-making muito ativa (Teamcraft é enorme).
- **Concorrência moderada** — Universalis domina dados (UX datada), Ultros é moderno mas jovem. Espaço para um site com UX superior + PT-BR.
- **XIVAPI** para game data (itens, receitas, ícones) é excelente e complementa Universalis.

**Risco:** dependência do Universalis (crowdsourced, gaps de cobertura). Mitigação: contribuir para o ecossistema ou considerar instância própria no longo prazo.

**Por que não #1:** A API é crowdsourced (não oficial) e o mercado é per-world (mais complexo que o global do GW2). Tecnicamente um pouco mais difícil que GW2, mas o público é maior.

---

## Resumo executivo

```
┌─────────────────────┬──────────────┬──────────────────────────────────┐
│ Jogo                │ Recomendação │ Justificativa resumida            │
├─────────────────────┼──────────────┼──────────────────────────────────┤
│ Guild Wars 2        │ GO (forte)   │ Melhor API oficial, mercado       │
│                     │              │ centralizado, mapeamento 1:1      │
│                     │              │ com Albion Analyzer. #1 pick.     │
├─────────────────────┼──────────────┼──────────────────────────────────┤
│ Final Fantasy XIV   │ GO           │ Universalis (API crowdsourced     │
│                     │              │ madura), base grande, arbitragem  │
│                     │              │ cross-world. #2 pick.             │
├─────────────────────┼──────────────┼──────────────────────────────────┤
│ World of Warcraft   │ GO c/        │ Maior base + APIs maduras, mas    │
│                     │ ressalvas    │ concorrência altíssima (Undermine │
│                     │              │ Exchange, Wowhead). Diferenciar   │
│                     │              │ em UX + PT-BR.                    │
├─────────────────────┼──────────────┼──────────────────────────────────┤
│ Elder Scrolls Online│ NO-GO        │ Sem API REST pública. Barreira de │
│                     │              │ dados alta (scraping ou uploader  │
│                     │              │ próprio). Esforço desproporcional.│
├─────────────────────┼──────────────┼──────────────────────────────────┤
│ New World           │ NO-GO        │ Sunset confirmado (31/01/2027).   │
│                     │ (definitivo) │ Sem público, sem futuro.          │
└─────────────────────┴──────────────┴──────────────────────────────────┘
```

## Plano de ação recomendado

### Fase 1 — MVP com GW2 (top pick)
1. Consumir API oficial GW2 (`/v2/commerce/listings`, `/v2/commerce/prices`, `/v2/commerce/exchange/*`, `/v2/items`, `/v2/recipes`).
2. Replicar o Albion Analyzer: preços atuais, histórico (snapshots próprios em SQLite), **Flip Finder** (spread buy/sell após 15% fees), **Crafting Profit** (recipes), **Gem Exchange tracker**.
3. Stack: Next.js + TypeScript + SQLite (mesma do projeto atual).
4. Adicionar builds/dicas em PT-BR (Snow Crows-style).

### Fase 2 — Expansão para FFXIV
1. Consumir Universalis API (mercado) + XIVAPI (game data).
2. Features: cross-world flipping, vendor resale, crafting profit.
3. Reaproveitar a stack e componentes do GW2.

### Fase 3 (opcional) — WoW com ressalvas
1. Consumir Undermine Exchange API (gratuita) + Blizzard API.
2. Diferenciar fortemente em UX + PT-BR + integração builds.
3. Só após validar o modelo com GW2 + FFXIV.

### Descartados
- **ESO:** reavaliar apenas se uma API REST emergir no futuro.
- **New World:** descartado permanentemente (sunset).
