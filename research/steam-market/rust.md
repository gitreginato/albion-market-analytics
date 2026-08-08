# Rust — Skins Market

> Relatório de viabilidade para um site de análise estatística de compra/venda de skins + dicas, modelo similar ao "Albion Online Market Analyzer".

---

## 1. Visão geral do jogo

| Item | Detalhe |
|---|---|
| Gênero | Survival sandbox PvP (open world, crafting, raiding) |
| Desenvolvedora | Facepunch Studios |
| Modelo | Pago (buy-to-play ~$40; wipes mensais em servidores oficiais) |
| Plataformas | PC (Windows, macOS, Linux), consoles (PS4/Xbox One — sem skins market) |
| Player base (2025/2026) | Avg concurrent ~95–125K; pico histórico 262K (jan/2025); ~13.8M MAU |
| Wipe cycle | Primeira quinta do mês — gera picos de player count |

Rust tem player base **consistente e grande**, com picos mensais por causa do wipe cycle. Público diferente de CS2/Dota — mais "casual/survival", mas com cultura de skins forte (skins de armas, roupas, ferramentas, móveis, construções).

Fontes: icon-era.com, steamcharts.com, cogconnected.com.

---

## 2. Economia do jogo

### Como funciona o trade de skins
- Skins cobrem **quase tudo**: armas, roupas, ferramentas (machado, picareta), móveis, portas, construction blocks, até storage boxes.
- Skins são **puramente cosméticas** (sem pay-to-win) — atributos visuais apenas, sem float/paint seed como CS2.
- Oferta: **Steam Market** (principal), **Facepunch store** (skins novas rotativas), **third-party marketplaces**.
- Items de alto valor: máscaras raras (ex: "Big Grin" vendida por $1.500+), skins de AK, skins de facas de combate.
- Volume: Rust consistentemente no **top 10 do Steam Market por volume de transação**, frequentemente >$1M/mês em skins.

### Steam Market vs Third-Party
| Aspecto | Steam Market | RustSkins.gg | Skinport | DMarket | Buff163 | Rust.tm |
|---|---|---|---|---|---|---|
| Taxa | 15% | — (tracker) | 12% | 5–7% | 2,5% | 7% |
| Cash-out | ❌ | N/A | ✅ SEPA | ✅ | ✅ (CNY) | ✅ |
| Liquidez Rust | **Enorme** | Crescente | Média | Média | Média | **Alta (CIS)** |
| Foco Rust | Primário | **Dedicado** | Secundário | Secundário | Secundário | **Dedicado** |

- **Rust.tm** (by Market.CSGO) — marketplace dedicado a Rust, forte em CIS/Rússia.
- **RustSkins.gg** — tracker/comparador dedicado a Rust (15+ marketplaces comparados).
- Spread Steam vs third-party similar ao CS2 (~15–30%).

### Arbitragem
- Possível entre Steam/Rust.tm/Skinport/DMarket/Buff. Volume menor que CS2 mas maior que Dota 2/TF2. Comunidade de traders ativa.

---

## 3. API pública / fonte de dados

### Steam Web API (oficial, Rust — app 252490)
- `IEconItems_252490/GetPlayerItems/v1` — inventário.
- Schema endpoints similares aos outros jogos Steam.
- **Não retorna preços do Steam Community Market.**

### Steam Community Market (não oficial)
- `priceoverview`/`pricehistory` com `app=252490`. Mesmos rate limits e bans de IP.

### RustSkins.gg API (dedicada a Rust)
- Base: `https://rustskins.gg/api/v1/`
- Docs: `https://rustskins.gg/api-docs`
- Endpoints:
  - `GET /v1/items` — $0.10/req
  - `GET /v1/items/detail` — $0.20/req
  - `GET /v1/items/price-history` — $0.20/req
  - `GET /v1/trending` — $0.10/req
  - `GET /v1/trending/losers` — $0.10/req
  - `GET /v1/trending/marketcap` — $0.10/req
  - `GET /v1/comparison` — $0.30/req
  - `GET /v1/deals` — $0.20/req
  - `GET /v1/inventory` — $1.00/req
  - `GET /v1/prices` (bulk) — $0.50/req
- **Pricing por request** — modelo pay-as-you-go. Custo pode escalar rápido.
- **Melhor API dedicada a Rust** — comparison, trending, marketcap, deals já prontos.

### Agregadores pagos (multi-jogo)
- **Steamwebapi.com** — `/steam/api/items?game=rust` (60 campos, janelas 24h/7d/30d/90d, buy orders, comparação third-party).
- **SteamApis.com** — `/v2/items` com Rust.

### Recomendação de stack
- **RustSkins.gg API** para features dedicadas (trending, deals, marketcap, comparison) — mas custo por request.
- **Steamwebapi.com** como fonte primária de preços (mais barato em volume).
- Combinação: Steamwebapi para bulk prices + RustSkins.gg para features de analytics/trending.

---

## 4. Sites concorrentes já existentes

| Site | URL | O que oferece | Monetização | Pontos fortes | Fracos |
|---|---|---|---|---|---|
| **RustSkins.gg** | rustskins.gg | Comparador 15+ marketplaces, trending, marketcap, portfolio, **API paga** | API paga + ads | **Dedicado a Rust**, API robusta | Pago por request |
| **RustExplore** | rustexplore.com/skins/stats | Stats de market cap por marketplace | Ads | Visualizações macro | Pouco atualizado |
| **RustLabs** | rustlabs.com | Wiki de items + market trends | Ads | Tráfego alto (wiki) | Não é focado em market |
| **Marketplace.tf** | marketplace.tf | Marketplace (TF2-focused, Rust limitado) | Fees | Confiável | Rust limitado |
| **Skinport** | skinport.com | Marketplace multi-game (Rust incluso) | 12% | Seguro | Rust secundário |
| **DMarket** | dmarket.com | Marketplace cross-game | 5–7% | Multi-game | Rust secundário |
| **Rust.tm** | rust.tm | Marketplace dedicado Rust (CIS) | 7% | Liquidez CIS | Foco regional |
| **SteamAnalyst** | steamanalyst.com | Comparador | Ads + afiliados | Dados agregados | Rust menos coberto que CS2 |

### Concorrência em "Rust skins analytics"
- **MÉDIA-BAIXA.** RustSkins.gg é o único site dedicado sério de analytics/comparação. RustExplore é limitado. RustLabs é wiki, não market analytics.
- **Oportunidade real**: há espaço para um site de analytics de skins Rust, especialmente em PT-BR (Brasil tem player base grande de Rust).

---

## 5. Viabilidade técnica

| Fator | Avaliação |
|---|---|
| Disponibilidade de dados | ✅ Boa — RustSkins.gg API + Steamwebapi + Steam Web API |
| Custo de dados | ⚠️ Médio — RustSkins.gg cobra por request; Steamwebapi mais barato em volume |
| Rate limits Steam | ⚠️ Mesmo problema (proxy residencial se raspando) |
| ToS da Valve | ⚠️ Gray-area, similar aos outros |
| Schema de items | ✅ Simples (sem float/sticker) — como Dota 2 |
| Stack similar ao Albion | ✅ Direto |
| Features de trending/deals | ✅ RustSkins.gg já entrega modelo de dados |

**Veredito técnico**: **Viável**. RustSkins.gg API é um modelo de negócio interessante (vender dados), mas para construir um site consumidor, Steamwebapi + RustSkins.gg (seletivo) é o caminho.

---

## 6. Viabilidade de negócio (ads)

| Fator | Avaliação |
|---|---|
| Tamanho do público | ✅ Grande — ~13.8M MAU, ~95–125K concurrent |
| Intenção de busca | ✅ Média-alta — "Rust AK skin price", "best Rust skins", "Rust skin market" |
| CPM de ads | ✅ Médio-alto (gamer 18–34, survival niche) |
| Concorrência SEO | ✅ **Baixa-média** — poucos sites dedicados a Rust skins analytics |
| Espaço para novo site | ✅ **Real** — RustSkins.gg é o único sério; há espaço para concorrente |
| Monetização | Ads + afiliados Skinport/DMarket/Rust.tm + potencial premium |
| Saturação de conteúdo | ✅ Baixa — pouco conteúdo SEO sobre Rust skins |

**Realidade**: Rust é um **nicho sub-atendido** em skins analytics. Player base grande, cultura de skins ativa, mas poucos sites dedicados. O RustSkins.gg existe mas não domina como CSFloat domina CS2. **Janela real de oportunidade.**

---

## 7. Recomendação final

# ✅ GO

**Justificativa:**
- Player base grande e estável (~13.8M MAU), cultura de skins ativa, **baixa concorrência** em sites de analytics dedicados.
- Dados acessíveis (RustSkins.gg API + Steamwebapi).
- Schema simples (sem float/sticker) — mais leve que CS2.
- Wipe cycle mensal gera picos recorrentes de tráfego e interesse em skins.

**Estratégia:**
1. Foco em **Rust skins price tracker + trending + deals** (modelo similar ao RustSkins.gg mas com diferencial).
2. **Diferencial PT-BR**: Brasil tem player base grande de Rust e poucos sites em português.
3. Features: price history, alertas, "deals" (skins sub-avaliadas), market cap, comparador Steam vs third-party.
4. Conteúdo: "melhores skins Rust por categoria", "guia de investimento em skins Rust", "skins que valorizam após wipe".
5. Monetização: ads + afiliados Skinport/DMarket/Rust.tm.
6. Stack: Next.js + SQLite (similar ao Albion) + Steamwebapi como fonte primária.

**Risco principal**: RustSkins.gg já existe e tem API madura — precisa de diferencial claro (PT-BR, UX melhor, features sociais). Mas o nicho é grande o suficiente para 2 players.
