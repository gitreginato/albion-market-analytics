# Dota 2 — Items / Skins Market

> Relatório de viabilidade para um site de análise estatística de compra/venda de items/skins + dicas, modelo similar ao "Albion Online Market Analyzer".

---

## 1. Visão geral do jogo

| Item | Detalhe |
|---|---|
| Gênero | MOBA 5v5 (lanes, creeps, heroes) |
| Desenvolvedora | Valve Corporation |
| Modelo | Free-to-play (desde 2013) |
| Plataformas | PC (Windows, Linux, macOS) |
| Player base (2025/2026) | Avg concurrent ~615K; pico ~870K–960K (2025/2026); pico histórico ~1.29M (2022) |
| Contas registradas | 91,6M+ (nov/2025, Statista) |
| MAU estimado | ~7–10M (estimativa; Valve escondeu o contador) |

Dota 2 é o **segundo jogo mais jogado no Steam** atrás do CS2. Player base estável/crescente em 2025–2026 após The International. Público global com peso de China, Sudeste Asiático, Europa e América do Sul.

Fontes: vpesports.com, statista.com.

---

## 2. Economia do jogo

### Como funciona o trade de items
- Cosméticos: **sets** (conjuntos de hero), **Immortals**, **Arcanas** (items premium ~$30–40), **Personas**, **Couriers**, **Wards**, **Treasures** (caixas), **Gems/Sockets**, **Effigies**.
- Diferente do CS2: **não há float value nem paint seed** — items são fungíveis por nome/qualidade (menos atributos únicos). Isso **simplifica** o tracking (menos variantes por item).
- Oferta: Treasures comprados/dropados, Battle Pass (descontinuado em 2023), Steam Market, trades P2P, third-party.
- Mercado mais "plano" que CS2: menos hype especulativo, menos itens de altíssimo valor (Arcanas são o teto comum).

### Steam Market vs Third-Party
| Aspecto | Steam Market | Skinport | DMarket | Buff163 | BitSkins | Avan.market |
|---|---|---|---|---|---|---|
| Taxa | 15% | 12% | 5–7% | 2,5% | 5% | 2–5% |
| Cash-out | ❌ | ✅ SEPA | ✅ | ✅ (CNY) | ✅ crypto | ✅ |
| Liquidez Dota | Alta | Média | Média | Média | Baixa | Crescente |
| Foco Dota | Primário | Secundário | Multi-game | Secundário | Multi-game | Especializado |

- Dota 2 tem **menos third-party dedicado** que CS2 — a maioria dos marketplaces trata Dota como jogo secundário. Exceção: **Avan.market** (especializado em Dota, fees 2–5%).
- Spread Steam vs third-party similar ao CS2 (~15–30%), mas com menos volume.

### Arbitragem
- Possível entre Steam/Skinport/DMarket/Buff, mas **liquidez menor** que CS2 torna gaps mais lentos de fechar. Menos traders profissionais focados em Dota.

---

## 3. API pública / fonte de dados

### Steam Web API (oficial, Dota 2 — app 570)
- `IEconItems_570/GetPlayerItems/v1` — inventário de um SteamID (cosméticos possuídos).
- `GetGameItems/v1` — schema de items (nome, defindex, preço).
- `GetStoreMetaData/v1` — featured items da store Dota.
- `GetAssetPrices/v1` — preços de assets.
- Auth: **Steam Web API key** (gratuita). Rate limits não documentados explicitamente (~100k req/dia por key em prática).
- **Não retorna preços do Steam Community Market** — apenas store/inventário.

### Steam Community Market (não oficial)
- Mesmos endpoints `priceoverview`/`pricehistory` do CS2, com `app=570`. Mesmos rate limits e bans de IP. Requer proxy residencial em escala.

### Agregadores pagos
- **Steamwebapi.com** — `/steam/api/items?game=dota2` (mesma API do CS2, 60 campos, janelas 24h/7d/30d/90d, buy orders, comparação third-party). SLA 99,9%.
- **SteamApis.com** — `/v2/items` com preços multi-moeda por marketplace.
- **Pricempire** — agrega Dota 2 também (menor cobertura que CS2).

### Dota 2-specific
- **Dota 2 WebAPI community wrappers** (ex: github.com/EthanWadsworth/valve-steam-web-api) — wrappers Python/Node para os endpoints oficiais.
- **OpenDota API** (opendota.com) — **stats de partidas/heroes**, NÃO market. Útil para conteúdo de "builds/dicas" complementar.

### Recomendação de stack
- Dados de mercado: **Steamwebapi.com ou SteamApis.com** (proxy Steam + third-party).
- Dados de gameplay (builds/heroes meta): **OpenDota API** (gratuita, REST, rate limit 60 req/min, 50k req/mês free tier).
- Combinação permite site "market + meta" — diferencial vs. sites puramente de skins.

---

## 4. Sites concorrentes já existentes

### Marketplaces / price trackers
| Site | URL | O que oferece | Monetização | Pontos fortes | Fracos |
|---|---|---|---|---|---|
| **Skinport** | skinport.com/dota2 | Marketplace P2P Dota | 12% seller | Seguro, multi-game | Dota é secundário |
| **DMarket** | dmarket.com | Marketplace cross-game | 5–7% | Multi-game | Dota secundário |
| **Avan.market** | avan.market | Marketplace especializado Dota | 2–5% | Fees baixos, foco Dota | Menor liquidez |
| **Buff163** | buff.163.com | Marketplace chinês | 2,5% | Liquidez Asia | CNY, VPN |
| **BitSkins** | bitskins.com | Marketplace veterano (2015) | 5% | Crypto, API para bots | UI datada |
| **Marketplace.tf** | marketplace.tf | Marketplace (mais focado TF2) | — | Confiável | Dota limitado |
| **SteamAnalyst** | steamanalyst.com | Comparador + relatórios | Ads + afiliados | Dados agregados | Dota menos coberto que CS2 |

### Sites de stats/builds (complementar)
| Site | URL | O que oferece | Monetização |
|---|---|---|---|
| **OpenDota** | opendota.com | Stats de partidas, hero winrates, builds | Open source + donations |
| **Dotabuff** | dotabuff.com | Stats, hero guides, meta | Ads + premium |
| **Stratz** | stratz.com | Stats avançadas, replay analysis | Ads + premium |
| **Dota2ProTracker** | dota2protracker.com | Builds de pros | Ads |

### Concorrência em "Dota 2 skins analytics"
- **BAIXA comparada a CS2.** Há poucos sites dedicados a price tracking de Dota 2 items. A maioria dos marketplaces trata Dota como secundário.
- **Oportunidade real**: um site focado em Dota 2 items (preços, histórico, "vale a pena comprar essa Arcana?") tem menos concorrência direta que CS2.

---

## 5. Viabilidade técnica

| Fator | Avaliação |
|---|---|
| Disponibilidade de dados | ✅ Boa — Steam Web API oficial + agregadores pagos |
| Custo de dados | ⚠️ Médio — agregadores pagos (~$50–150/mês) |
| Rate limits Steam | ⚠️ Mesmo problema do CS2 (proxy residencial se raspando) |
| ToS da Valve | ⚠️ Mesmo gray-area do CS2 |
| Items mais simples (sem float) | ✅ Schema mais simples que CS2 — menos variantes |
| Stack similar ao Albion | ✅ Direto |
| Combinar market + meta (OpenDota) | ✅ Diferencial técnico viável |

**Veredito técnico**: **Viável**, similar ao CS2 mas com schema mais simples.

---

## 6. Viabilidade de negócio (ads)

| Fator | Avaliação |
|---|---|
| Tamanho do público | ✅ Grande — 7–10M MAU, ~600K concurrent |
| Intenção de busca | ⚠️ Média — menos "trader culture" que CS2; público mais focado em gameplay que em cosméticos |
| CPM de ads | ✅ Alto (mesmo demo gamer masculino) |
| Concorrência SEO skins | ✅ **BAIXA** — poucos sites dedicados a Dota 2 items analytics |
| Concorrência SEO builds/meta | ❌ Alta (Dotabuff, Stratz, OpenDota dominam) |
| Espaço para novo site | ✅ **Real em "Dota 2 items/skins"** — nicho sub-atendido |
| Monetização | Ads + afiliados Skinport/DMarket/Avan + potencial premium |

**Realidade**: Dota 2 tem player base enorme mas **cultura de skins/trade muito menor** que CS2. O público gasta menos com cosméticos (Arcanas são o teto, sem equivalente de facas de $10k). Porém, a **baixa concorrência em sites de items analytics** é uma janela real.

---

## 7. Recomendação final

# ✅ GO (com foco em items/skins, não em meta)

**Justificativa:**
- Player base grande e estável, dados acessíveis, **baixa concorrência direta** em price tracking de Dota 2 items.
- Dota 2 items são mais simples de modelar (sem float/sticker variants) — schema mais leve que CS2.
- Combinação "market de items + guias de hero/builds" via OpenDota cria produto diferenciado.

**Estratégia:**
1. Foco em **Dota 2 items price tracker** (Steam + Skinport + DMarket + Avan + Buff).
2. Seção de "meta/heroes" via OpenDota API (winrates, builds populares) — complementa sem competir head-on com Dotabuff.
3. Conteúdo PT-BR (Brasil tem player base grande de Dota 2, poucos sites em português).
4. Monetização: ads + afiliados Skinport/DMarket/Avan.
5. Diferencial: "vale a pena comprar essa Arcana agora?" — análise de preço histórico + tendência.

**Risco principal**: volume de buscas menor que CS2 (menos trader culture). Compensado por menor concorrência.
