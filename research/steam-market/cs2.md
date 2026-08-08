# Counter-Strike 2 (CS2) — Skins Market

> Relatório de viabilidade para um site de análise estatística de compra/venda de skins + dicas, modelo similar ao "Albion Online Market Analyzer".

---

## 1. Visão geral do jogo

| Item | Detalhe |
|---|---|
| Gênero | Tactical FPS 5v5 (competitive shooter) |
| Desenvolvedora | Valve Corporation |
| Modelo | Free-to-play (desde 2018) |
| Plataformas | PC (Windows, Linux via Proton) — sem console/mobile |
| Engine | Source 2 (lançado set/2023, substituiu CS:GO) |
| Player base (2025/2026) | ~1,0–1,1 milhão de concurrent players médios; pico histórico 1,86M (abr/2025); ~504K online no momento da pesquisa (jun/2026) |
| MAU estimado | Dezenas de milhões (Valve não publica; estimativas 30–40M MAU) |

CS2 é **o jogo de PC mais jogado do mundo no Steam** por concorrência quase ininterrupta há uma década. A player base é global, com peso enorme da China, Europa e América do Sul (Brasil é um dos maiores mercados regionais).

Fontes: steambase.io, steamcharts.com, cs.money/blog.

---

## 2. Economia do jogo

### Como funciona o trade de skins
- Skins são cosméticos de armas (rifles, pistolas, facas, luvas) com atributos únicos: **float value** (desgaste 0–1), **paint seed** (pattern), **stickers** aplicados.
- Skins são **durable**: nunca se consomem no gameplay. O suprimento total só cresce (ratchet de oferta) — exceto confisco de contas banidas.
- Fontes de oferta: **cases dropados** (precisam de chave comprada), **Souvenir Packages** (Majors), **trade-up contracts**, marketplace secundário.

### Steam Community Market (SCM) vs Third-Party
| Aspecto | Steam Market | Buff163 | CSFloat | Skinport | DMarket |
|---|---|---|---|---|---|
| Taxa total | **15%** (10% Valve + 5% jogo) | ~2,5% | 2% seller | 12% all-in | 5–7% |
| Moeda | Steam Wallet (não sacável) | CNY (yuan) | USD/crypto | EUR/SEPA | USD/crypto |
| Liquidez | Enorme | Maior do mundo (2M+ listings) | Crescendo | Forte EU | Média |
| Cash-out | ❌ Não | ✅ (Alipay/WeChat) | ✅ (bank/crypto) | ✅ (SEPA) | ✅ |
| Acesso global | ✅ | VPN/conta chinesa útil | ✅ | ✅ | ✅ |

**Spread típico**: preços third-party rodam **20–35% abaixo** do Steam para a mesma skin, porque o Steam Wallet é "store credit" não-sacável. Esse desconto é o **cash-out premium**.

### Arbitragem entre plataformas
- **Sim, é o core business de traders profissionais.** Ferramentas como Pricempire, SIH.App e CSMarketCap monitoram 28–40+ marketplaces simultaneamente.
- Gaps fecham em horas para skins comuns; itens raros podem manter spread por dias/semanas.
- Risco: trade hold de 7 dias da Valve (escrow), taxas de saque, risco de contra-parte, volatilidade de CNY/USD.

---

## 3. API pública / fonte de dados

### Steam Community Market API (NÃO oficial/documentado)
- Endpoint `https://steamcommunity.com/market/priceoverview/` — retorna `lowest_price`, `median_price`, `volume`. **Sem API key**, mas **não documentado**.
- Endpoint `pricehistory/` — série temporal `[date, median, volume]`, **requer cookies de sessão Steam logada**. Moeda travada no locale da conta.
- **Rate limits**: `priceoverview` ~dezenas req/min; `pricehistory` derruba **HTTP 429 em ~20–24 req/min**, IP ban de horas se abusado. IPs de datacenter são banidos mais rápido — **proxy residencial é obrigatório** para scraping em escala.
- **Não há API Steam oficial suportada para market data de skins.**

### CSFloat API (docs.csfloat.com)
- Base: `https://csfloat.com/api/`
- Auth: API key (gratuita, perfil → developer tab).
- `GET /api/v1/listings` — listings ativos com float, paint seed, stickers, preço em cents. **Max 50 por request**. Sem price history (snapshot do book atual).
- Rate limit: **5 req/min** em `/v1/listings` (não autenticado); com auth um pouco mais alto.
- Cobertura: **apenas mercado CSFloat**, não Steam nem Buff.

### Skinport API
- `GET /v1/items` e `/v1/sales` — listings e histórico de vendas do Skinport. Apenas mercado próprio.

### DMarket API
- Requer **HMAC signing** por request. `SalesHistory` retorna histórico por item.

### Buff163
- **Sem API pública oficial.** Dados em CNY. Agregadores (Pricempire, Steamwebapi) raspam ou compram via parceiros.

### Agregadores pagos (recomendados para um produto novo)
- **Steamwebapi.com** — `/steam/api/items?game=cs2` retorna até 60 campos por item (preço atual, janelas 24h/7d/30d/90d, buy orders, volume, comparação third-party). Absorve rate limits da Steam. SLA 99,9%.
- **SteamApis.com** — `/v2/items` com preços USD/EUR/CNY/RUB + offers + buy orders por marketplace.
- **Pricempire API** — agrega 30+ marketplaces, pricing em USD normalizado. Pago, mas é o padrão da indústria.
- **RustSkins.gg API** (modelo de pricing por request: $0.10–$1.00 por endpoint) — exemplo de monetização de dados.

### Recomendação de stack de dados
Para um site de análise (não de execução de trades), o caminho mais barato é: **Steamwebapi.com ou SteamApis.com** como fonte primária (proxy de Steam + third-party) + **CSFloat API** para float/sticker metadata. Evita infra de proxy residencial e bans de IP.

---

## 4. Sites concorrentes já existentes

### Marketplaces / price trackers
| Site | URL | O que oferece | Monetização | Pontos fortes | Fracos |
|---|---|---|---|---|---|
| **CSFloat** | csfloat.com | Marketplace P2P + DB de 1B+ skins com float, histórico de vendas, ferramentas | 2% seller fee + withdraw fees | DB mais completa, float search, UI moderna | Apenas mercado próprio |
| **Buff163** | buff.163.com | Maior marketplace do mundo por volume | 2,5% fee | Liquidez, preços mais baixos | CNY, VPN, UI chinesa |
| **Skinport** | skinport.com | Marketplace P2P com escrow | 12% seller | Seguro, SEPA, multi-game | Taxa alta |
| **SteamAnalyst** | steamanalyst.com | Comparador de preços + relatórios de mercado | Ads + afiliados | Relatórios anuais, dados agregados | UI datada |
| **Pricempire** | pricempire.com | Agregador 30+ marketplaces, portfolio tracker, API | Subscription + API paga | Melhor agregador, API robusta | Pago para features |
| **SIH.App** | sih.app | Extensão browser + agregador | Subscription | Ferramenta de trader pro | Nicho |
| **CSMarketCap** | — | Índices de mercado (blue-chip, cases) | Ads | Analytics macro | Pouca atualização |
| **SteamLedger** | steamledger.com | Comparador cross-market | Ads + afiliados | Comparação rápida | Concorrente direto do nicho |
| **DMarket** | dmarket.com | Marketplace cross-game (CS2, Dota2, Rust, TF2) | 5–7% fee | Multi-game, blockchain | UI pesada |

### Concorrência em "site de análise estatística + dicas"
- **MUITO alta.** O nicho de "skin price tracker/analyzer" é um dos mais saturados do gaming. Há dezenas de sites (CSFloat, SteamAnalyst, Pricempire, SteamLedger, cs2.sh, cs2ref.com, cs2-inventory.com) já entregando price history, arbitragem, índices.
- Diferenciação difícil: a maioria já tem API, portfolio tracker, alertas, gráficos.

---

## 5. Viabilidade técnica

| Fator | Avaliação |
|---|---|
| Disponibilidade de dados | ✅ Excelente — múltiplas APIs (CSFloat, Steamwebapi, SteamApis, Pricempire) |
| Custo de dados | ⚠️ Médio — APIs pagas (~$50–200/mês para volume decente) ou scraping arriscado |
| Rate limits Steam | ⚠️ Crítico — sem proxy residencial, ban rápido. Melhor usar agregador pago |
| ToS da Valve | ⚠️ Steam Market scraping é gray-area; Valve tolera mas pode mudar. Third-party trade é "discouraged" mas raramente banido |
| Dados Buff em CNY | ⚠️ Precisa conversão; agregadores já normalizam em USD |
| Stack similar ao Albion | ✅ Next.js + SQLite funciona; schema de items + price history + arbitragem é direto |
| Float/sticker metadata | ✅ CSFloat API entrega |

**Veredito técnico**: **Viável**. Mais fácil que Albion em termos de dados (APIs pagas prontas), mas requer orçamento de API ou infra de proxy.

---

## 6. Viabilidade de negócio (ads)

| Fator | Avaliação |
|---|---|
| Tamanho do público | ✅ Gigantesco — 30–40M MAU, milhões de traders |
| Intenção de busca | ✅ Altíssima — "AK Redline price", "karambit float", "best case to invest" |
| CPM de ads | ✅ Alto — público masculino 18–34, gamer, comprador |
| Concorrência SEO | ❌ **MUITO alta** — CSFloat, SteamAnalyst, Pricempire dominam SERPs há anos |
| Espaço para novo site | ⚠️ Pequeno — precisa de nicho (ex: foco PT-BR/Brasil, foco em trade-ups, foco em stickers) |
| Monetização real do nicho | ⚠️ Sites de skins vivem de **afiliados/referral de marketplaces** (Buff, Skinport, CSFloat pagam 2–5% de comissão), não só ads. Ads sozinhos rendem pouco vs. afiliados |
| Saturação de conteúdo | ❌ Centenas de "best CS2 skins under $10" já publicados |

**Realidade**: o nicho CS2 skins é **o mais maduro e competitivo** do mercado de games items. Entrar genérico ("CS2 price tracker") é NO-GO. Entrar com ângulo (PT-BR, mobile-first, foco em um sub-nicho) é possível mas difícil.

---

## 7. Recomendação final

# ⚠️ GO com ressalvas (fortes)

**Justificativa:**
- Economia massiva ($4.2B/ano volume, 10M traders) e dados acessíveis via APIs pagas.
- **Porém**: concorrência SEO é brutal, o nicho já tem 5–10 players consolidados com anos de domínio e backlinks. Um site genérico de "CS2 price tracker" não ganha tração.
- Monetização real é **afiliados de marketplaces**, não ads puros — exige parcerias com Buff/CSFloat/Skinport (programas de referral existem).

**Condições para GO:**
1. **Foco regional PT-BR/Brasil** — há poucos sites de skins em português; o público brasileiro de CS2 é gigante (top 3 mundial).
2. **Diferencial de produto**: portfolio tracker social, alertas via Telegram/Discord, guias de trade-up em PT-BR, calculadora de float/sticker.
3. **Monetização híbrida**: ads + afiliados de marketplaces (não depender só de AdSense).
4. **Não tentar ser o "Pricempire brasileiro"** — ser o "guia + analytics leve" para o jogador casual BR, não para o trader pro.

**Se não houver ângulo claro → NO-GO.** O mercado é grande demais para mais um clone genérico.
