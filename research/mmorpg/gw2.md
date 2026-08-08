# Guild Wars 2 (GW2)

> Relatório de viabilidade para um site de análise de mercado/builds/dicas no modelo do "Albion Online Market Analyzer".

## 1. Visão geral do jogo

| Item | Detalhe |
|------|---------|
| Gênero | MMORPG fantasy action |
| Desenvolvedora | ArenaNet (NCSoft) |
| Modelo | B2P (buy-to-play base game gratuito) + expansões B2P + cash shop (Gem Store) |
| Plataformas | PC (Windows, Steam desde 2022), Mac (descontinuado) |
| Região | Ocidental (NA, EU); presença asiática limitada (servidor chinês separado) |
| Expansão atual | Janthir Wilds (2024); conteúdo contínuo |

### Player base estimada (2025/2026)
- Steam charts: **~3.6k–6k avg players** (Steam é fração — GW2 tem launcher próprio desde 2012).
- MMO-Population: **~44k monthly** (jun/2026), pico ~71k (nov/2025). Tendência estável/crescente (+30% em jun/2026).
- Tracker.gg (Steam): ~6k concurrent, +80.6% em 30 dias.
- Estimativa realista (launcher + Steam): **~300k–500k jogadores ativos mensais** (GW2 nunca publicou números; a base é estável há anos, sem grandes picos mas sem colapso).
- GW2 é frequentemente citado como o 2º maior MMORPG ocidental após WoW (em base estável de longo prazo).
- Janthir Wilds (2024) trouxe algum retorno de jogadores.

**Conclusão:** Base média e estável, sem o pico de WoW/FFXIV mas sem declínio dramático. Público leal de longo prazo.

## 2. Economia do jogo

- **Trading Post (TP)** — exchange centralizada, **two-sided** (buy orders + sell orders), acessível de qualquer lugar do mundo (não precisa estar em cidade).
- **Two-sided order book:** jogadores postam buy orders (preço máximo disposto a pagar) e sell orders (preço mínimo disposto a vender). Compra/venda instantânea contra o melhor order oposto — funciona como uma exchange real (similar a trading software financeiro).
- **Moeda:** Gold + Gems (cash shop currency, conversível com Gold via exchange).
- **Taxas:**
  - **5% listing fee** (upfront, não reembolsável se cancelar).
  - **10% exchange fee** na venda.
  - **Margem efetiva: 85%** do preço de venda chega ao vendedor (15% total de fees).
- **Player-driven:** sim, fortemente. O TP é o centro da economia.
- **Arbitragem possível:** SIM — e é a forma mais direta de todos os jogos analisados:
  - **Flip (spread buy/sell):** comprar via buy order barato, vender via sell order caro, lucrando o spread após 15% de fees. É a forma #1 de gold making em GW2.
  - **Crafting profit:** comprar materiais, craftar item, vender no TP.
  - **Gem exchange arbitrage:** flutuação Gold↔Gems.
  - **Vendor arbitrage:** comprar de NPC, vender no TP (raro mas existe).
- **Centralizada:** ao contrário de ESO (fragmentado) e FFXIV (per-world), o TP é **um único mercado global** — simplifica muito a análise (não há granularidade por cidade/realm).

## 3. API pública / fonte de dados

### API oficial ArenaNet (a melhor de todos os jogos analisados)
- **SIM, existe API pública oficial e robusta.** Documentação: https://wiki.guildwars2.com/wiki/API:Main
- Base URL: `https://api.guildwars2.com/v2`
- **Endpoints de mercado (commerce):**
  - `/v2/commerce/listings` — **TODOS os buy e sell listings** (order book completo, não só top-of-book). Retorna buys (descendente do maior buy order) e sells (ascendente do menor sell offer), com `listings` (número de ordens agrupadas), `unit_price`, `quantity`.
  - `/v2/commerce/prices` — top-of-book (menor sell, maior buy) com fees aplicados.
  - `/v2/commerce/exchange/coins` e `/v2/commerce/exchange/gems` — cotação Gold↔Gems.
  - `/v2/commerce/transactions` — transações do jogador (requer API key autenticada).
  - `/v2/commerce/delivery` — itens prontos para pickup.
- **Outros endpoints:** items, recipes (com search), item stats, materials, characters, account (autenticado), guild, achievements, maps, etc.
- **Rate limit:** per IP. **Max burst: 300 tokens. Refill: 5 tokens/segundo (300/min).** HTTP 429 se exceder. Com 300 burst + 5/s refill, stream confiável sem 429s.
- **Bulk expansion:** `?ids=all` ou paginação (`?page=0&page_size=200`).
- **Locale:** `?lang=en|es|de|fr|zh`.
- **Autenticação:** API key gratuita via https://account.arena.net/applications (para endpoints autenticados como account/transactions).

### Projetos comunitários
- **gw2spidy** (https://github.com/rubensayshi/gw2spidy) — histórico de preços do TP, gráficos. Usa `/v2/commerce/listings` (max 250 itens/request). Projeto antigo mas referência.
- **GW2TP** (https://www.gw2tp.com / https://github.com/tylerhslee/gw2tp) — site de TP com profit margin, filtros por volume (≥1000 buy/sell orders). Consome API oficial.
- **GW2BLTC** (https://www.gw2bltc.com/en/tp/search) — ferramenta de flipping com sell/buy history, supply/demand, crafting breakdowns, profit calculations. ~28k itens rastreáveis.
- **gw2efficiency** — account manager, crafting lists, stats.
- **AuricDB** (https://auricdb.com/game/gw2) — price tracker com Flip Finder, top movers, dashboard de Gold. Atualiza a cada 5 min da API oficial.

**Conclusão técnica:** Dados EXCELENTES — a melhor API oficial de mercado de todos os 5 jogos. Order book completo (buy + sell listings), rate limit generoso, endpoints de exchange (Gold/Gems), game data (items, recipes). Não há necessidade de crowdsourcing — tudo é oficial e em tempo real.

## 4. Sites concorrentes (análise de mercado)

| Site | URL | O que oferece | Monetização | Pontos fortes / fracos |
|------|-----|---------------|-------------|------------------------|
| **GW2BLTC** | gw2bltc.com/en/tp/search | Flipping (sell/buy, profit, ROI, supply/demand), crafting breakdowns, history | Ads + doações | **Forte:** líder de flipping, dados completos. **Fraco:** UI funcional mas não moderna |
| **GW2TP** | gw2tp.com | History de preços, best selling recipes, profit calculator | Ads | **Forte:** histórico longo, recipes. **Fraco:** menos ferramental que GW2BLTC |
| **gw2efficiency** | gw2efficiency.com | Account manager, crafting lists, stats, TP | Ads + premium | **Forte:** ecossistema completo. **Fraco:** foco em account management, não flipping |
| **AuricDB** | auricdb.com/game/gw2 | Price tracker, Flip Finder, top movers, Gold dashboard | Ads | **Forte:** UI moderna, flip finder. **Fraco:** mais novo, menos histórico |
| **gw2spidy** | (github) | Gráficos de histórico | — | Referência histórica, projeto antigo |
| **Saddlebag Exchange** | saddlebagexchange.com | Multi-jogo, GW2 TP tools | Ads + Patreon | Genérico |

**Concorrência:** MODERADA. GW2BLTC domina flipping, gw2efficiency domina account management. Há espaço para um site com UX moderna + integração de builds + PT-BR.

## 5. Sites de builds/dicas

| Site | URL | Foco |
|------|-----|------|
| **Snow Crows** | snowcrows.com | Builds endgame (raids, fractals, strikes) — o referência |
| **Hardstuck** | hardstuck.com | Builds por content/role, guides |
| **Metabattle** | metabattle.com | Builds wiki-style (PvE, PvP, WvW) |
| **Guild Wars 2 Wiki** | wiki.guildwars2.com | Wiki oficial/comunitária (excelente) |
| **Discretize** | discretize.eu | Builds/guides para fractals |
| **Mukluk Guides** | (YouTube) | Video guides "get to the point" |
| **GW2 Efficiency** | gw2efficiency.com | Crafting, gear optimizer |

**Concorrência de builds:** ALTA. Snow Crows + Hardstuck + Metabattle cobrem bem o endgame.

## 6. Viabilidade técnica

- **É possível construir um site similar ao do Albion?** SIM, e é o MAIS FÁCIL de todos os 5.
- **Dados suficientes?** Sim, em abundância — API oficial fornece order book completo (buy + sell listings), exchange rates, game data (items, recipes). Tudo em tempo real, sem crowdsourcing.
- **Por que é o mais fácil:**
  - **Mercado centralizado global** — não há granularidade por realm/cidade (como WoW) ou por World (como FFXIV). Um único mercado = um único dataset.
  - **API oficial completa** — não depende de crowdsourced (como FFXIV/Universalis) nem de scraping (como ESO/TTC).
  - **Two-sided order book** — permite calcular flip profit diretamente (spread buy/sell após 15% fees), exatamente como o Albion Analyzer faz arbitragem.
  - **Rate limit generoso** (300 burst, 5/s refill) — suficiente para polling frequente de ~28k itens.
- **Desafios:**
  - **Volume de itens:** ~28k itens negociáveis. Polling completo do `/v2/commerce/listings` (max 250/request) = ~112 requests por ciclo. Com rate limit de 300 burst + 5/s, dá para atualizar a cada ~1-2 min. Viável.
  - **Histórico:** a API oficial não fornece histórico (só snapshot atual). Para histórico, é necessário armazenar snapshots próprios (como gw2spidy faz). SQLite/Postgres para time series.
  - **Concorrência estabelecida** (GW2BLTC, gw2efficiency) — diferencial precisa ser UX + features.
- **Stack aplicável:** Next.js + SQLite é perfeitamente viável para MVP. Para histórico longo de 28k itens, considerar Postgres ou SQLite com WAL + índices bem feitos (o projeto Albion já usa SQLite com sucesso).

## 7. Viabilidade de negócio (ads)

- **Tamanho do público:** Médio (~300k–500k ativos mensais), estável e leal. Comunidade de "gold making"/flipping é ativa (GW2BLTC, AuricDB têm tráfego consistente).
- **Concorrência:** Moderada em dados de mercado (GW2BLTC, gw2efficiency), alta em builds (Snow Crows, Hardstuck, Metabattle).
- **Espaço para novo site:** Moderado-alto. Diferenciação em: (a) UX moderna vs. GW2BLTC funcional-mas-datado; (b) integração mercado + builds + dicas; (c) PT-BR (comunidade brasileira de GW2 existe e é sub-servida); (d) flip finder visual com alertas; (e) crafting profit calculator integrado (análogo ao "lucro de refinamento" do Albion).
- **Potencial de tráfego:** Bom — GW2 tem comunidade engajada que usa ferramentas externas rotineiramente. O TP é central à economia e todo mundo usa sites de flipping.
- **Risco:** Baixo técnico (API oficial robusta), moderado de negócio (concorrência estabelecida mas não dominante como Wowhead no WoW).

## 8. Recomendação final

### **GO (forte)**

**Justificativa:** GW2 é o jogo com a **melhor relação viabilidade técnica / viabilidade de negócio** de todos os 5 analisados, pelas seguintes razões:

1. **API oficial é a melhor de todos** — order book completo (buy + sell listings), exchange Gold/Gems, game data, rate limit generoso, sem crowdsourcing, sem scraping. É mais direta até que a do Albion Online Data Project.
2. **Mercado centralizado global** — simplifica a arquitetura (um único dataset, sem granularidade por realm/cidade/World). O modelo do Albion Analyzer (preços atuais, histórico, arbitragem, crafting profit) mapeia **diretamente** para GW2.
3. **Two-sided order book** — permite flip profit calculation exatamente como arbitragem do Albion (spread buy/sell após 15% fees).
4. **Base de jogadores estável** (~300k–500k), sem risco de sunset (ao contrário de New World).
5. **Concorrência moderada** — GW2BLTC é bom mas datado; há espaço claro para UX moderna + integração de builds + PT-BR.

**Estratégia recomendada:**
1. **Consumir API oficial GW2** (`/v2/commerce/listings`, `/v2/commerce/prices`, `/v2/commerce/exchange/*`, `/v2/items`, `/v2/recipes`) — direto, sem intermediários.
2. **Replicar o modelo do Albion Analyzer 1:1:**
   - Preços atuais (top-of-book + order book depth) → análogo a "preços atuais por cidade".
   - Histórico de preços (snapshots próprios armazenados) → análogo a "histórico de preços".
   - **Flip Finder** (spread buy/sell após 15% fees, ordenado por ROI) → análogo a "arbitragem entre cidades" — este é o killer feature.
   - **Crafting Profit** (materiais → item craftado via `/v2/recipes`) → análogo a "lucro de refinamento".
   - **Gem Exchange tracker** (cotação Gold↔Gems) → análogo a "cotação de ouro" do Albion.
   - Scanner de oportunidades persistido em SQLite → direto.
3. **Adicionar builds/dicas** (Snow Crows-style, mas em PT-BR) para completar o hub.
4. **Diferenciar em PT-BR** — comunidade brasileira de GW2 é ativa e mal servida.
5. **Monetização ads** + freemium (alerts ilimitados, listas salvas, notificações Discord).

**Risco principal:** concorrência de GW2BLTC/gw2efficiency. Mitigação: UX superior + integração mercado+builds+PT-BR que nenhum concorrente oferece hoje.

**Ranking:** GW2 é o **top 1 mais promissor** junto com FFXIV — e tecnicamente o mais fácil de implementar devido à API oficial superior.
