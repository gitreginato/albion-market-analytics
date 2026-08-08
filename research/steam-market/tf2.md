# Team Fortress 2 (TF2) — Items Market

> Relatório de viabilidade para um site de análise estatística de compra/venda de items + dicas, modelo similar ao "Albion Online Market Analyzer".

---

## 1. Visão geral do jogo

| Item | Detalhe |
|---|---|
| Gênero | Class-based shooter (PvP 6v6 / 12v12 casual) |
| Desenvolvedora | Valve Corporation |
| Modelo | Free-to-play (desde 2011; pago antes) |
| Plataformas | PC (Windows, Linux, macOS) |
| Engine | Source (não recebeu port Source 2) |
| Player base (2025/2026) | Avg concurrent ~46–50K; pico 24h ~56–69K; pico histórico 253K (jul/2023, bot wave) |
| MAU estimado | ~1–2M (estimativa; muitos bots/idle) |

TF2 é um jogo **legado** (lançado em 2007). A player base é pequena e envelhecida, com histórico de problemas de bots idle (o pico de 253K em 2023 foi majoritariamente bots). Após a "bot purge" da Valve, os números cairam para ~40–50K concurrent — o nível "real" de jogadores humanos.

Fontes: steamcharts.com, statista.com, playercount.gg.

---

## 2. Economia do jogo

### Como funciona o trade de items
- Cosméticos: **Hats** (chapéus — item icônico do jogo), **Weapons** com atributos (Strange, Festive, Australium, Killstreak), **Cosmetics**, **Taunts**, **MvM tickets**, **Mann Co. Keys**.
- Economia interna baseada em **metal (Refined Metal)** e **Mann Co. Keys** como moedas de troca. 1 Key ≈ 50–60 Refined (flutua).
- Items têm **qualidades** (Unique, Strange, Unusual, Genuine, Vintage, Collector's, Haunted, Community, Self-Made) — múltiplas variantes por item.
- **Unusual hats** com efeitos (particle effects) são os items de maior valor — alguns chegam a centenas/thousands de dólares.
- Oferta: drops semanais, Mann Up Mode (MvM), crates (descontinuados em sua maioria), Steam Market, trades P2P.

### Steam Market vs Third-Party
| Aspecto | Steam Market | Marketplace.tf | DMarket | BitSkins | Skinport |
|---|---|---|---|---|---|
| Taxa | 15% | ~5–10% | 5–7% | 5% | 12% |
| Cash-out | ❌ | ✅ | ✅ | ✅ | ✅ |
| Liquidez TF2 | Média | **Alta (dedicada)** | Baixa | Baixa | Baixa |
| Foco TF2 | Primário | **Primário** | Secundário | Secundário | Secundário |

- **Marketplace.tf** é o player dominante em TF2 third-party — dedicado ao jogo, com sistema de bots e reputação.
- **backpack.tf** é o **price guide** de facto da comunidade TF2 (equivalente ao que o SteamAnalyst é para CS2, mas mais centralizado).

### Arbitragem
- Possível entre Steam Market / Marketplace.tf / DMarket, mas **volume muito menor** que CS2/Dota. Spreads podem persistir mais tempo. Comunidade de traders pequena e concentrada.

---

## 3. API pública / fonte de dados

### Steam Web API (oficial, TF2 — app 440)
- `IEconItems_440/GetPlayerItems/v1` — inventário (items, quality, attributes).
- `GetSchema/v2` — schema completo de items (defindex, name, item_slot, capabilities).
- `GetSchemaURL/v2` / `GetStoreMetaData/v1` — metadata da store.
- Auth: Steam Web API key (gratuita). Rate limits não documentados.
- **Não retorna preços do Steam Community Market.**

### backpack.tf API (oficial, documentada)
- Base: `https://backpack.tf/api/`
- **Swagger/UI**: `https://backpack.tf/api/index.html`
- Endpoints de economia:
  - `GET /IGetCurrencies/v1` — dados de moeda interna (Refined, Keys, Earbuds).
  - `GET /IGetPrices/v4` — price schema completo (preços community-sourced).
  - `GET /IGetPriceHistory/v1` — histórico de preço por item.
  - `GET /IGetSpecialItems/v1` — items internos especiais.
- **Classifieds Search API**: `GET /api/classifieds/search/v1` — busca listings (buy/sell). **Sem cooldown oficial**, mas abuso não é tolerado. `page_size` max 30.
- **Create Listings API**: `POST /api/classifieds/list/v1` — criar listings (requer token).
- Auth: API key (WebAPI) para endpoints de economia; token de usuário para classifieds.
- **Esta é a melhor API pública de economia de items entre todos os jogos Steam** — documentada, gratuita, com price history.

### Steam Community Market (não oficial)
- Mesmos endpoints `priceoverview`/`pricehistory` com `app=440`. Mesmos rate limits e bans.

### Agregadores pagos
- **Steamwebapi.com** — `/steam/api/items?game=tf2` (mesma API multi-jogo).
- **SteamApis.com** — `/v2/items` com TF2.

### Recomendação de stack
- **backpack.tf API** como fonte primária (price history + currencies + classifieds) — gratuita e robusta.
- Steam Web API para inventários/schema.
- Agregador pago (Steamwebapi) como complemento para Steam Market prices.
- **Stack mais barata e acessível** entre todos os jogos Steam analisados.

---

## 4. Sites concorrentes já existentes

| Site | URL | O que oferece | Monetização | Pontos fortes | Fracos |
|---|---|---|---|---|---|
| **backpack.tf** | backpack.tf | Price guide, classifieds, inventories, stats, premium search | Premium ($6.99/mês) + ads | **Dominante**, API pública, comunidade ativa | UI datada, foco TF2 limita expansão |
| **Marketplace.tf** | marketplace.tf | Marketplace de TF2 items com bots | Fees de transação | Liquidez, confiável | Só marketplace, não analytics |
| **DMarket** | dmarket.com | Marketplace cross-game (TF2 incluso) | 5–7% | Multi-game | TF2 secundário |
| **SteamAnalyst** | steamanalyst.com | Comparador TF2 | Ads + afiliados | Dados agregados | TF2 menos coberto |
| **TF2Finance** | tf2finance.com | Stats de supply (Refined, Keys, Earbuds) | — | Dados macro únicos | Atualização esporádica |
| **scrap.tf** | scrap.tf | Trading bots (banking) | Fees | Conveniente | Não é analytics |

### Concorrência em "TF2 items analytics"
- **MUITO BAIXA além do backpack.tf.** O backpack.tf é o único player sério de price guide/analytics. Não há dezenas de competidores como em CS2.
- **Porém**: o backpack.tf é tão estabelecido (desde 2012) que deslocá-lo é difícil. A comunidade TF2 o trata como referência absoluta.

---

## 5. Viabilidade técnica

| Fator | Avaliação |
|---|---|
| Disponibilidade de dados | ✅ **Excelente** — backpack.tf API é a melhor API pública de economia de items Steam |
| Custo de dados | ✅ **Baixo** — backpack.tf API é gratuita; Steam Web API gratuita |
| Rate limits | ✅ Leves — backpack.tf "sem cooldown" (uso razoável); Steam Web API ok |
| ToS da Valve | ⚠️ Mesmo gray-area, mas menos pressão que CS2 |
| Schema de items | ⚠️ Complexo (qualidades, atributos, Killstreak tiers, Unusual effects) — mais variantes que Dota 2 |
| Stack similar ao Albion | ✅ Direto |

**Veredito técnico**: **Muito viável** — a API do backpack.tf torna o custo de dados quase zero. Mais fácil tecnicamente que CS2/Dota 2.

---

## 6. Viabilidade de negócio (ads)

| Fator | Avaliação |
|---|---|
| Tamanho do público | ❌ **Pequeno** — ~46K concurrent, ~1–2M MAU (muito menor que CS2/Dota) |
| Intenção de busca | ⚠️ Média — comunidade de traders existe mas é pequena e envelhecida |
| CPM de ads | ⚠️ Médio — público mais velho, nicho |
| Concorrência SEO | ✅ Baixa (além do backpack.tf) |
| Espaço para novo site | ⚠️ Existe, mas o teto é baixo |
| Monetização | Premium (modelo backpack.tf) + ads + afiliados Marketplace.tf |
| Saturação de conteúdo | ✅ Baixa — pouco conteúdo novo sendo produzido |

**Realidade**: TF2 é um jogo **legado com comunidade pequena e fiel**. O mercado de items existe e tem valor (Unusuals podem valer muito), mas o **volume de tráfego é insuficiente** para um negócio sustentável em escala. O backpack.tf já atende a comunidade de forma dominante.

---

## 7. Recomendação final

# ❌ NO-GO

**Justificativa:**
- Viabilidade técnica é **excelente** (backpack.tf API gratuita e robusta), mas a **viabilidade de negócio é fraca**.
- Player base pequena (~46K concurrent) e envelhecida — teto de tráfego muito baixo para monetização com ads em escala.
- backpack.tf é dominante e gratuito ($6.99 premium) — barreira de adoção alta para um novo site.
- O jogo não recebe atualizações significativas há anos — a economia está estagnada/declinante.
- ROI provável baixo: esforço de build vs. tráfego/receita limitados.

**Exceção**: só faria sentido como **projeto hobby/portfolio** ou se já houver audiência TF2 existente (ex: comunidade Discord/YouTube). Como negócio ads-driven, não se sustenta.
