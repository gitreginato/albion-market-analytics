# Black Desert Online (BDO) — Relatório de Análise de Mercado

> Análise de viabilidade para replicar o modelo "Albion Online Market Analyzer" em BDO

---

## 1. Visão Geral do Jogo

| Atributo | Detalhe |
|---|---|
| **Gênero** | MMORPG sandbox de ação (combate action-combat, life skills, PvP) |
| **Desenvolvedora** | Pearl Abyss |
| **Publisher** | Pearl Abyss (auto-publicado) |
| **Modelo** | B2P (Buy-to-Play) no ocidente + cash shop (Pearl Shop) |
| **Plataformas** | PC (Steam + launcher próprio), PS5/PS4, Xbox One |
| **Região** | Global (múltiplas regiões: NA, EU, SEA, KR, JP, RU, TH, TW, MENA, SA) |
| **Lançamento coreano** | dezembro de 2014 |
| **Lançamento ocidental** | março de 2016 |

### Player Base (2025/2026)

- **Steam**: ~16.000–20.000 jogadores concurrent médios (junho 2026), pico de ~25.000
- **Pico histórico Steam**: ~64.000 (2017)
- **Tendência**: relativamente estável, com picos sazonais (janeiro/julho — updates grandes)
- **Estimativa total (incl. launcher próprio + console)**: ~200.000 daily active players (activeplayer.io)
- **Total registrados**: 12+ milhões (playerauctions.com)
- **Avaliação**: comunidade dedicada, life skill/economy players são nicho fiel

> **Nota importante**: BDO tem player base significativa **fora do Steam** (launcher próprio da Pearl Abyss). Os números de Steam subestimam o total real.

---

## 2. Economia do Jogo

### Central Market (Mercado Central)

BDO possui **um único sistema de trading entre jogadores**: o Central Market, introduzido em fevereiro de 2019 (substituindo o antigo Marketplace).

#### Como funciona

- **Acesso global**: pode ser acessado de qualquer lugar do mundo do jogo (ESC menu ou Transaction Maids/Butlers)
- **Warehouse**: sistema de armazém exclusivo do Central Market — silver e itens devem ser depositados via Marketplace Director NPC
- **Preços dinâmicos**: o mercado ajusta preços dentro de uma faixa (min/max/base price) baseado em oferta e demanda
- **Pre-order system**: se um item não está em estoque, você pode fazer pre-order até 10% acima do preço padrão
- **Marketplace Director (NPC)**: compra itens sem estoque para estabilizar mercado; quando preço estabiliza, aumenta quantidade comprada

#### Taxas

- **Taxa base**: **35%** (vendedor recebe 65% do preço de venda)
- **Family Fame bonus**: até +1,5% adicional dependendo do fame level
- **Value Pack (subscription)**: reduz impacto da taxa indiretamente

#### Moedas

| Moeda | Função |
|---|---|
| **Silver** | Moeda principal, usada no Central Market |
| **Pearls** | Cash shop (real money) |
| **Loyalties** | Moeda de login diário |

### Arbitragem

- **Arbitragem entre regiões**: ❌ NÃO existe — cada região (NA, EU, SEA, etc.) tem mercado separado
- **Arbitragem dentro do mercado**: limitada — preços têm faixas min/max controladas pelo sistema
- **Flipping**: possível mas dificultado pela taxa de 35% e pelas faixas de preço
- **Crafting profit (life skills)**: ✅ Principal forma de "arbitragem" — comprar materiais, processar/cozinhar/alchemy, vender produtos
- **Processing arbitrage**: comprar raw materials baratos, processar em produtos de maior valor

> **Diferença vs Albion**: BDO tem economia mais controlada (price bands) e menos player-driven puro que Albion. A taxa de 35% é muito maior que a de Albion (~4-8%).

---

## 3. API Pública ou Fonte de Dados

### ✅ API comunitária: Arsha.io (BDO Market API)

BDO tem uma situação **intermediária** — não há API oficial documentada pela Pearl Abyss, mas a comunidade documentou os endpoints internos do mercado web e construiu wrappers.

#### Arsha.io API (cached wrapper)

- **URL base**: `https://api.arsha.io`
- **Documentação**: `https://www.postman.com/bdomarket/arsha-io-bdo-market-api/documentation/e2ymqql/bdo-market-api`
- **Cache**: 30 minutos
- **Versões**: V1 (formato raw da PA) e V2 (JSON parseado e limpo)

#### Endpoints principais

| Endpoint | Método | Função |
|---|---|---|
| `/v1/:region/item?id=X` | GET | Preço atual de um item |
| `/v1/:region/history?id=X&sid=Y` | GET | Histórico de preços |
| `/v2/:region/item?id=X` | GET | Item parseado em JSON limpo |
| `/v2/:region/search?q=text` | GET | Buscar itens por nome |
| `/v2/:region/hot` | GET | Itens populares (hotlist) |
| `/v2/:region/waitlist` | GET | Lista de espera (pre-orders) |
| `/v2/:region/bidding?id=X&sid=Y` | GET | Order book (buy/sell orders) |
| `/v2/:region/price?id=X&sid=Y` | GET | Preço + histórico |

#### Regiões suportadas

`na`, `eu`, `sea`, `mena`, `kr`, `ru`, `jp`, `th`, `tw`, `sa`, `na_console`, `eu_console`, `asia_console`

#### Endpoints raw da Pearl Abyss (não-oficial)

- `https://marketweb-na.blackdesertonline.com` (NA)
- `https://na-trade.naeu.playblackdesert.com` (NA alternativo)
- `https://eu-trade.naeu.playblackdesert.com` (EU)
- `https://trade.sea.playblackdesert.com` (SEA)
- Requer `__RequestVerificationToken` (cookie + form token)
- **Não documentado oficialmente** — descoberto pela comunidade (Veliainn)

### Bibliotecas comunitárias

| Biblioteca | Linguagem | URL |
|---|---|---|
| **pyLoa** (não, é BDO) | — | — |
| **bdo-marketplace** (kookehs) | Python | github.com/kookehs/bdo-marketplace |
| **auciel** (jpegzilla) | Ruby | github.com/jpegzilla/auciel |
| **bdomarket** (Fizzor96) | Python | github.com/Fizzor96/bdomarket |

> **Conclusão técnica**: Há uma API comunitária funcional (Arsha.io) com cache de 30 min. Não é oficial, mas é estável o suficiente para um site de análise. Os endpoints raw da PA também são acessíveis com tokens de sessão.

---

## 4. Sites Concorrentes (Análise de Mercado)

| Site | URL | O que oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **Garmoth.com** | garmoth.com/market | Market overview, live prices, histórico, trending items, biggest gainers/drops | Ads + Patreon | Interface moderna, dados EU/NA, histórico | Foco em gear companion, não pure market analysis |
| **BDO Codex** | bdocodex.com | Database completo: itens, receitas, NPCs, quests, skill builder | Ads | Referência #1 de database, multi-idioma, atualizado | Não tem preços de mercado ao vivo |
| **BDO Crafter / BDO Crafting Lab** | bdocraftinglab.com | Calculadora de receitas (cooking/alchemy), scan de inventário | Ads | Ferramenta única de crafting profit | Só cooking/alchemy, sem market prices |
| **BDO Tracker** | bdotracker.netlify.app | Tracker de life skill profitability, pearl market sales | Não claro | Niche tool | Pouco mantido, interface simples |
| **BDO Foundry** | blackdesertfoundry.com | Guias gerais, incluindo Central Market guide | Ads | Guias detalhados | Não é ferramenta de mercado |

### Análise competitiva

- **Garmoth.com** é o mais próximo do modelo Albion Analyzer — tem market overview, trending, price history
- **BDO Codex** domina o database de itens mas **não tem preços ao vivo**
- **BDO Crafter** foca em crafting profit mas **não integra com market prices**
- **Há espaço** para um site que combine: market prices + crafting profit calculator + arbitragem/opportunities scanner (como o Albion Analyzer)

---

## 5. Sites de Builds/Dicas Já Existentes

- **BDO Codex** (bdocodex.com) — Database #1: itens, receitas, NPCs, quests, skill builder, gear calculator
- **Garmoth.com** — Companion app: gear planner, market, boss timer
- **BDO Foundry** (blackdesertfoundry.com) — Guias para iniciantes e avançados, life skills, PvP
- **GrumpyG** (grumpygreen.cricket) — Guias detalhados de progression, life skills
- **BDO Crafter** (bdocraftinglab.com) — Crafting recipe calculator
- **Maxroll.gg/bdo** — Tier lists e builds (menos ativo que outras seções)

---

## 6. Viabilidade Técnica

| Critério | Avaliação | Detalhe |
|---|---|---|
| **API pública oficial** | ❌ Não | Pearl Abyss não documenta API |
| **API comunitária confiável** | ✅ Sim | Arsha.io (cache 30min, V2 JSON limpo) |
| **Endpoints raw da PA** | ✅ Acessíveis | Requer tokens de sessão, não documentados |
| **Dados suficientes para análise** | ✅ Sim | Preços atuais, histórico, hotlist, waitlist, bidding |
| **Similaridade com Albion Data Project** | 🟡 Moderada | Arsha.io é análogo, mas cache de 30min (vs real-time) |
| **Dificuldade de implementação** | 🟢 Baixa-Média | API REST simples, JSON parseado |
| **Multi-região** | ✅ Sim | 13 regiões suportadas |

### Arquitetura proposta (similar ao Albion Analyzer)

```
Arsha.io API (30min cache)
    ↓
Next.js API Routes (fetch + normalize)
    ↓
SQLite (persistir snapshots de preço + histórico)
    ↓
Frontend (Next.js + TypeScript)
  - Market overview por região
  - Price history charts
  - Crafting profit calculator (comprar mats → craft → vender)
  - Opportunity scanner (itens com price drops, trending)
  - Life skill profitability tracker
```

### Desafios técnicos

1. **Cache de 30 minutos**: Arsha.io atualiza a cada 30min, menos granular que Albion (real-time). Suficiente para análise estatística mas não para flipping rápido.
2. **Tokens de sessão para endpoints raw**: se quiser dados mais frescos que 30min, precisaria dos endpoints raw da PA, que requerem `__RequestVerificationToken` — frágil e pode quebrar.
3. **Price bands**: BDO tem min/max price controlados pelo sistema, o que limita a volatilidade e torna análise de arbitragem menos interessante que Albion.
4. **Multi-região**: 13 regiões = 13x os dados para armazenar e processar.

---

## 7. Viabilidade de Negócio (Ads)

| Fator | Avaliação |
|---|---|
| **Tamanho do público** | 🟡 Médio (~20k Steam + ~200k total estimado) |
| **Tendência** | 🟢 Estável (sem declínio severo, picos sazonais) |
| **Concorrência** | 🟡 Garmoth + BDO Codex são fortes, mas com gaps |
| **Espaço para novo site** | 🟢 Sim — falta um "Albion Analyzer" equivalente |
| **Potencial de tráfego** | 🟡 Médio — nicho de economy players é fiel |
| **Engajamento da comunidade** | 🟢 Alto — life skill/economy é subcomunidade ativa |

### Análise

- Player base estável (~20k Steam, ~200k total) — **suficiente** para tráfego de ads
- Garmoth é o concorrente mais próximo mas foca em **gear companion**, não pure market analysis
- **Gap identificado**: nenhum site combina market prices + crafting profit + opportunity scanner em um só lugar (como o Albion Analyzer faz)
- Subcomunidade de life skillers/economy players é **fiel e engajada** — público que consome ferramentas de análise
- BDO tem 13 regiões — potencial de tráfego global (não só pt-BR)

---

## 8. Recomendação Final

# 🟡 GO com Ressalvas

### Justificativa

**Prós:**
1. **API comunitária funcional** (Arsha.io) — não é oficial mas é estável, com cache de 30min e JSON limpo
2. **Player base estável** (~200k total) — suficiente para monetização com ads
3. **Gap de mercado claro** — nenhum site combina market analysis + crafting profit + opportunity scanner
4. **Economia rica** — life skills, processing, cooking, alchemy criam múltiplas oportunidades de análise
5. **Multi-região** — 13 regiões ampliam potencial de tráfego

**Contras (ressalvas):**
1. **API não-oficial** — Arsha.io pode descontinuar ou a PA pode bloquear endpoints raw a qualquer momento
2. **Cache de 30 minutos** — menos granular que Albion (real-time), limita análise de flipping
3. **Price bands controlados** — economia menos player-driven que Albion, arbitragem limitada
4. **Taxa de 35%** — reduz margens de flipping significativamente
5. **Garmoth já existe** — embora com foco diferente, é concorrente estabelecido

### Estratégia recomendada

Se for avançar com BDO, o diferencial deve ser:
1. **Crafting profit calculator** integrado com market prices (comprar mats → processar → vender) — o BDO Crafter faz isso mas sem preços ao vivo
2. **Opportunity scanner persistido em SQLite** — igual ao Albion Analyzer, mas para BDO
3. **Multi-região** — mostrar mesma oportunidade em todas as 13 regiões
4. **Foco em life skills** — nicho fiel e subexplorado por ferramentas existentes

> **Resumo**: BDO é viável com ressalvas. A API comunitária (Arsha.io) é o ponto crítico — se ela continuar estável, o projeto é factível. O gap de mercado (falta de um "Albion Analyzer equivalente") é real e o público é suficiente para ads.
