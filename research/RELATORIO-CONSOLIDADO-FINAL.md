# RELATÓRIO CONSOLIDADO FINAL — Pesquisa de Mercado para Replicação do Albion Online Market Analyzer

> **Objetivo**: identificar jogos com economias player-driven + APIs públicas que permitam replicar o modelo do "Albion Online Market Analyzer" (Next.js + TypeScript + SQLite + scanner de oportunidades + monetização via ads).
>
> **Escopo**: 20 jogos em 4 categorias (MMORPG, ARPG, Steam Market, Korean MMO + RuneScape).
>
> **Data**: Julho 2025

---

## 1. Ranking Final dos 20 Jogos

Ordenado por viabilidade de replicar o modelo Albion (API + economia + player base + concorrência + receita potencial).

| # | Jogo | Categoria | API | Player base | Concorrência | Recomendação | Score |
|---|------|-----------|-----|-------------|--------------|--------------|-------|
| 🥇 1 | **Old School RuneScape** | RuneScape | ✅✅✅ 3 APIs (Jagex+Wiki+WeirdGloop) | ~148K cc, >1M membros (CRESCENDO) | Alta (GE Tracker) | **✅✅ GO forte** | 9.5/10 |
| 🥈 2 | **Guild Wars 2** | MMORPG | ✅✅ Oficial ArenaNet (melhor API) | ~300-500K ativos | Moderada (GW2Efficiency) | **✅✅ GO forte** | 9.0/10 |
| 🥉 3 | **Path of Exile 2** | ARPG | ✅ poe.ninja + GGG (limitada EA) | ~7-421K cc (CRESCENDO, F2P em 2026) | Baixa-moderada | **✅✅ GO forte** | 8.5/10 |
| 4 | **Path of Exile 1** | ARPG | ✅✅ GGG oficial + poe.ninja | ~5-185K cc (sazonal) | Alta (poe.ninja) | **✅ GO com ressalvas** | 7.5/10 |
| 5 | **Final Fantasy XIV** | MMORPG | ⚠️ Universalis (crowdsourced) | ~880K-1M active chars | Moderada (Universalis) | **✅ GO** | 7.5/10 |
| 6 | **EVE Online** | ARPG/Sandbox | ✅✅ ESI oficial (robusta) | ~25K cc (estável) | Moderada (Adam4EVE, UX ruim) | **✅ GO com ressalvas** | 7.0/10 |
| 7 | **Rust** | Steam Market | ⚠️ Steamwebapi (pago) + RustSkins.gg | ~13.8M MAU, ~95-125K cc | Baixa-moderada | **✅ GO** | 7.0/10 |
| 8 | **Dota 2** | Steam Market | ⚠️ Steamwebapi (pago) + OpenDota | ~7-10M MAU, ~615K cc | Baixa | **✅ GO** | 7.0/10 |
| 9 | **World of Warcraft** | MMORPG | ✅✅ Blizzard oficial + Undermine Exchange | ~7-9M subs | MUITO ALTA (Wowhead, Icy Veins, UE) | **⚠️ GO com ressalvas** | 6.5/10 |
| 10 | **Black Desert Online** | Korean MMO | ⚠️ Arsha.io (não-oficial, cache 30min) | ~200K total (estável) | Baixa (Garmoth) | **🟡 GO com ressalvas** | 6.0/10 |
| 11 | **RuneScape 3** | RuneScape | ✅✅ Mesma API do OSRS | ~17-21K cc (declínio lento) | Baixa | **⚠️ GO (complemento OSRS)** | 6.0/10 |
| 12 | **CS2** | Steam Market | ⚠️ CSFloat + pagas | ~30-40M MAU, ~1M cc | MUITO ALTA (CSFloat, Pricempire...) | **⚠️ GO com ressalvas (PT-BR)** | 5.5/10 |
| 13 | **TFT** | Steam Market | ✅ Riot TFT API (matches, não market) | ~33M MAU | Alta (tactics.tools, lolchess) | **⚠️ GO com ressalvas (stats, não market)** | 5.0/10 |
| 14 | **Elder Scrolls Online** | MMORPG | ❌ Sem API REST (só addon TTC) | ~500K-1M | Baixa (TTC) | **❌ NO-GO** | 3.0/10 |
| 15 | **New World** | MMORPG | ❌ Sem API | ~500 cc (SUNSET 31/01/2027) | Baixa | **❌ NO-GO (definitivo)** | 1.5/10 |
| 16 | **Lost Ark** | Korean MMO | ❌ Ocidental sem API (Coreia tem) | ~5-6K Steam (-95%) | Baixa | **❌ NO-GO** | 2.0/10 |
| 17 | **Throne and Liberty** | Korean MMO | ❌ TLDB interna sem suporte | ~4K Steam (-95%) | Baixa | **❌ NO-GO** | 1.5/10 |
| 18 | **Last Epoch** | ARPG | ❌ Sem API (Bazaar in-game only) | ~1-44K cc (sazonal) | Zero (impossível) | **❌ NO-GO** | 1.0/10 |
| 19 | **Diablo IV** | ARPG | ❌ Sem API + sem marketplace | ~3.2M MAU | Zero (impossível) | **❌ NO-GO** | 1.0/10 |
| 20 | **Team Fortress 2** | Steam Market | ✅ backpack.tf (gratuita) | ~47K cc | Baixa (backpack.tf domina) | **❌ NO-GO** | 3.5/10 |

> **Score** considera: qualidade da API (peso 30%), player base + tendência (25%), espaço vs concorrência (25%), mapeamento com features do Albion (10%), receita potencial (10%).

---

## 2. Os 3 Finalistas — Top Picks

### 🥇 #1 — Old School RuneScape (OSRS)

**Por que é o #1 absoluto:**

1. **Melhor ecossistema de APIs de TODOS os 20 jogos**:
   - Jagex Official GE API (diária, gráficos 180 dias)
   - OSRS Wiki/RuneLite Real-Time API (atualiza a cada **60 segundos** — mais fresco que Albion)
   - WeirdGloop Exchange API (histórico completo)
   - Tudo público, gratuito, documentado, com wrappers em Python/TS.

2. **Player base massiva e CRESCENDO** (único MMO em crescimento):
   - ~148K concurrent, >1M membros pagos
   - "Fastest-growing MMO in the world" (Jagex/BBC, 2025)
   - Pico histórico 240K (2025)
   - Maior público de todos os 20 jogos pesquisados (junto com CS2/Dota 2/TFT em MAU, mas muito mais engajado em economia)

3. **Economia puramente player-driven**:
   - Grand Exchange = order book real com buy/sell offers
   - Flipping/merchanting é uma **profissão reconhecida** dentro do jogo
   - Margin trading (high/low) é EXATAMENTE o que o Albion Analyzer faz
   - Bonds = equivalente ao WoW Token (GP ↔ membership)

4. **Modelo de monetização provado**:
   - GE Tracker tem **747K+ usuários** e cobra Premium ($4-8/mês)
   - GE Margin é alternativa gratuita crescendo
   - Mercado suporta múltiplos players

5. **Implementação mais straightforward**:
   - APIs REST bem documentadas, JSON limpo
   - Arquitetura do Albion Analyzer pode ser quase diretamente reutilizada
   - Stack: Next.js + TypeScript + SQLite (idêntica)

**Trade-off**: GE é global (sem arbitragem entre cidades como Albion). Foco em **flipping (margin trading)** + money making calculators + Bond tracker.

**Risco**: concorrência madura (GE Tracker 10+ anos). **Mitigação**: ser 100% gratuito + UX moderna + PT-BR + scanner de oportunidades automatizado.

**Bônus**: RS3 sai de graça (mesma API, só trocar endpoint `/osrs` → `/rs`). Fazer OSRS + RS3 no mesmo site.

---

### 🥈 #2 — Guild Wars 2 (GW2)

**Por que é o #2:**

1. **API oficial ArenaNet é a melhor de todos os MMORPGs**:
   - `/v2/commerce/prices` — preços agregados (highest buy, lowest sell, quantity) de TODOS os itens, **sem auth**
   - `/v2/commerce/listings` — order book completo (buy + sell listings)
   - `/v2/commerce/exchange/coins` e `/gems` — cotação Gold ↔ Gems
   - `/v2/items` + `/v2/recipes` — metadata + recipes de crafting
   - Rate limit generoso, HTTPS, sem crowdsourcing

2. **Mercado centralizado global** — um único dataset, sem granularidade por realm/cidade. Arquitetura mais simples que WoW (186 realms × 4 regiões) ou FFXIV (dezenas de Worlds).

3. **Mapeamento 1:1 com o Albion Analyzer**:
   - Flip Finder (spread buy/sell após 15% fees) = arbitragem entre cidades
   - Crafting Profit (recipes via API) = lucro de refinamento
   - Gem Exchange = cotação de ouro
   - Todas as features principais têm equivalente direto

4. **Base estável** (~300-500K), sem risco de sunset.

5. **Concorrência moderada** — GW2Efficiency é forte mas UX complexa/datada. Espaço claro para UX moderna + PT-BR + scanner automatizado.

**Trade-off**: TP é global (sem arbitragem geográfica). Foco em flipping spread + crafting profit + gem exchange.

**Risco**: GW2Efficiency é concorrente estabelecido. **Mitigação**: UX + scanner automatizado + PT-BR.

---

### 🥉 #3 — Path of Exile 2 (PoE2)

**Por que é o #3:**

1. **Player base massiva e crescendo** — 421K concurrent no pico, milhões de cópias vendidas. **Catalisador futuro: 1.0 F2P em 2026** = explosão de público.

2. **Economia 100% player-driven** com currency items (mesmo modelo de PoE1).

3. **APIs disponíveis**: poe.ninja já cobre PoE2 (currency, uniques, gems, fragments) + GGG Trade API.

4. **Baixa concorrência em market analysis** — poe.ninja cobre o básico, mas o nicho de "trading com UX moderna + scanner de oportunidades + arbitragem" está **aberto**. Menos saturado que PoE1.

5. **First-mover advantage** — construir durante o Early Access e estar pronto para o lançamento 1.0 F2P é uma janela de oportunidade real e temporal.

**Risco**: economia volátil (EA), API oficial ainda limitada. **Mitigação**: usar poe.ninja API (estável).

**Estratégia**: construir para PoE2 e expandir para PoE1 depois (mesma API, mesma stack).

---

## 3. Os 6 "GO com ressalvas" (2º escalão)

| Jogo | Por que é 2º escalão | Quando fazer |
|------|---------------------|--------------|
| **PoE1** | Mesma API/stack do PoE2, mas concorrência mais alta (poe.ninja consolidado 9+ anos) | Após PoE2 (esforço marginal, dobra o público) |
| **FFXIV** | Universalis (API crowdsourced madura) + base grande (~1M), mas mercado per-world + gaps de cobertura | Após GW2/OSRS (2º produto MMORPG) |
| **EVE Online** | ESI API oficial robusta + mapeamento 1:1 com Albion, mas player base pequena (~25K cc) limita receita | 2º produto, UX moderna vs Adam4EVE (datado) |
| **Rust** | Concorrência baixa + player base grande (~13.8M MAU), mas Steamwebapi é pago | Produto Steam Market #1 |
| **Dota 2** | Concorrência muito baixa + player base grande (~7-10M MAU), mas cultura de skins menor que CS2 | Produto Steam Market #2 |
| **WoW** | Maior base (~7-9M) + APIs maduras, mas concorrência EXTREMAMENTE ALTA (Wowhead 50M visits, Icy Veins, Undermine Exchange) | Só com diferenciação forte em UX + PT-BR |

---

## 4. Os 7 "NO-GO" (descartados)

| Jogo | Motivo do descarte |
|------|-------------------|
| **New World** | Sunset confirmado (31/01/2027) + sem API + player base colapsou (913K → 500) |
| **Lost Ark** | Versão ocidental sem API + player base em colapso (-95%) |
| **Throne and Liberty** | Sem API oficial + player base em colapso (-95%) |
| **Last Epoch** | Sem API de mercado (Bazaar é in-game only, EHG não expõe dados) — tecnicamente impossível |
| **Diablo IV** | Sem marketplace digital (trading manual in-game) + sem API — modelo Albion não se aplica |
| **Elder Scrolls Online** | Sem API REST pública (só addon TTC + client Windows .NET) — barreira de dados alta |
| **Team Fortress 2** | Player base pequena (~47K cc) + backpack.tf domina — teto de receita baixo |

**CS2 e TFT** são "GO com ressalvas" mas não recomendados como primeiro projeto: CS2 é o nicho mais saturado do mercado; TFT não tem economia de items tradeáveis (é stats/builds, modelo diferente).

---

## 5. Padrões Observados (insights transversais)

### 5.1. API oficial > API comunitária > Sem API

A **disponibilidade e qualidade da API** é o fator #1 de viabilidade. Os 3 finalistas (OSRS, GW2, PoE2) têm APIs excelentes. Todos os NO-GOs têm API ausente ou bloqueada.

- **APIs oficiais robustas**: GW2 (ArenaNet), EVE (ESI), WoW (Blizzard), OSRS (Jagex + Wiki), PoE (GGG)
- **APIs comunitárias maduras**: FFXIV (Universalis), BDO (Arsha.io), TF2 (backpack.tf)
- **APIs pagas/fragments**: Steam Market games (Steamwebapi, CSFloat, RustSkins.gg)
- **Sem API**: ESO, New World, Lost Ark (ocidental), T&L, Last Epoch, D4

### 5.2. Player base em crescimento > estável > declínio

Apenas **OSRS** e **PoE2** estão em crescimento claro. GW2 e EVE são estáveis. A maioria dos MMOs coreanos (Lost Ark, T&L) e New World estão em declínio severo.

### 5.3. Concorrência é o fator #2

Jogos com APIs excelentes mas concorrência altíssima (WoW, PoE1, CS2) são menos atraentes que jogos com APIs boas + concorrência moderada (GW2, OSRS, PoE2, EVE).

### 5.4. Economia player-driven é pré-requisito

Jogos sem economia player-driven (D4, TFT) são incompatíveis com o modelo, independentemente do tamanho da player base.

### 5.5. Diferencial PT-BR é oportunidade real

Todos os concorrentes dominantes (Wowhead, Icy Veins, poe.ninja, GE Tracker, GW2Efficiency, tactics.tools) são em inglês. Um site em PT-BR tem diferencial imediato para o mercado lusófono (Brasil tem player bases grandes em OSRS, GW2, Rust, CS2, PoE).

---

## 6. Plano de Ação Recomendado

### Fase 1 — MVP com OSRS (top pick, 0-3 meses)

1. **Consumir 3 APIs**: Jagex (daily) + Wiki/RuneLite (real-time 60s) + WeirdGloop (histórico).
2. **Features**:
   - **Flip Finder** (margin = high - low, com GE tax 1-5% + buy limits por item)
   - **Price History** (time-series 5m/1h/6h via API Wiki)
   - **Money Making Calculators** (high alch, cooking, herblore, fletching, plank making)
   - **Bond Price Tracker** (GP ↔ membership, como cotação de ouro do Albion)
   - **Market Indexes** (food, runes, metals, herbs — saúde da economia)
   - **Price Alerts** (Discord webhook gratuito)
3. **Stack**: Next.js + TypeScript + SQLite (mesma do Albion Analyzer).
4. **Diferencial**: 100% gratuito (vs GE Tracker Premium $4-8/mês) + UX moderna + PT-BR.
5. **Adicionar RS3** como segunda aba (esforço marginal — mesma API, trocar endpoint).

### Fase 2 — GW2 (3-6 meses)

1. **Consumir API oficial ArenaNet**: `/v2/commerce/prices`, `/v2/commerce/listings`, `/v2/commerce/exchange/*`, `/v2/items`, `/v2/recipes`.
2. **Features**:
   - **Flip Finder** (spread buy/sell após 15% fees)
   - **Crafting Profit** (recipes via API)
   - **Gem Exchange Tracker** (Gold ↔ Gems, como cotação de ouro)
   - **Price History** (snapshots próprios em SQLite — API não dá histórico)
3. **Reaproveitar** stack e componentes do OSRS.

### Fase 3 — PoE2 (6-9 meses)

1. **Consumir poe.ninja API** (currency, uniques, gems, fragments) + GGG Trade API.
2. **Features**: currency arbitrage, price history, scanner de oportunidades.
3. **Timing**: estar pronto antes do 1.0 F2P (2026) para capturar a explosão de público.
4. **Expandir para PoE1** depois (mesma API, mesma stack).

### Fase 4 (opcional) — Steam Market: Rust + Dota 2 (9-12 meses)

1. **Rust Skins Analyzer** — Steamwebapi + RustSkins.gg. Diferencial: PT-BR + UX + alertas.
2. **Dota 2 Items Analyzer** — Steamwebapi + OpenDota. Único site dedicado a Dota 2 items analytics.

### Fase 5 (opcional, longo prazo) — EVE Online + FFXIV

1. **EVE Market Analyzer** — ESI API oficial, UX moderna vs Adam4EVE (datado).
2. **FFXIV Market Analyzer** — Universalis API, cross-world flipping, UX moderna vs Mogboard.

### Descartados permanentemente
- New World (sunset), Lost Ark (sem API ocidental), T&L (sem API), Last Epoch (sem API), D4 (sem marketplace), ESO (sem API REST), TF2 (teto baixo).
- CS2 genérico (saturado) — só com ângulo regional PT-BR forte.
- TFT (modelo diferente — stats/builds, não market).

---

## 7. Conclusão Executiva

O modelo do Albion Online Market Analyzer é **replicável em 8 dos 20 jogos pesquisados** (OSRS, GW2, PoE2, PoE1, FFXIV, EVE, Rust, Dota 2), com **3 finalistas de destaque** (OSRS, GW2, PoE2) que combinam API excelente + economia player-driven + player base suficiente + espaço vs concorrência.

**Recomendação final**: começar pelo **OSRS** (melhor API + maior player base em crescimento + modelo de monetização provado pelo GE Tracker), depois **GW2** (API oficial superior + mapeamento 1:1 com Albion), depois **PoE2** (first-mover advantage antes do F2P 2026).

A stack Next.js + TypeScript + SQLite do projeto Albion pode ser **quase diretamente reutilizada** — o esforço principal é adaptar os endpoints de API e as features específicas de cada economia (flipping para OSRS/GW2, currency arbitrage para PoE, crafting profit para todos).

**Diferencial transversal**: PT-BR + UX moderna + 100% gratuito + scanner de oportunidades automatizado (o gap que todos os concorrentes deixam aberto).
