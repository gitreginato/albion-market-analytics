# Teamfight Tactics (TFT) — Stats / Builds / Composições

> Relatório de viabilidade para um site de análise estatística de builds/composições + dicas, modelo similar ao "Albion Online Market Analyzer" (adaptado: TFT não tem trade de items/skins direto).

---

## 1. Visão geral do jogo

| Item | Detalhe |
|---|---|
| Gênero | Auto-battler (round-based strategy, composições de unidades) |
| Desenvolvedora | Riot Games |
| Modelo | Free-to-play |
| Plataformas | PC (cliente League of Legends), Mobile (iOS/Android — standalone) |
| Player base (2025) | **~33–35M MAU** (Riot oficial); pico concurrent ~1.2M (Set 10) |
| Sets | Ciclos de ~6 meses por Set (Set 12 em 2025); meta muda a cada patch (2 semanas) |
| Esports | TFT Golden Spatula / Esports World Cup; prize pool $2M (2025) |

TFT é **um dos auto-battlers mais jogados do mundo**. Player base enorme e engajada, com ciclo de retenção baseado em "reengagement" (jogadores saem e voltam a cada Set). Público overlap com League of Legends mas também público mobile casual.

Fontes: riotgames.com, invenglobal.com, zipdo.co, fandomwire.com.

---

## 2. Economia do jogo (NÃO há trade de items/skins)

### Modelo de monetização do TFT
- **Battle Pass (Pass+)** — cosméticos (arena skins, booms, tactician skins), ~$10/Set.
- **Cosméticos**: arenas, little legends (tacticians), booms (animação de eliminação). **Não são tradeáveis nem vendíveis** — comprados direto da Riot ou via gacha (Treasures).
- **NÃO há Steam Market, NÃO há third-party marketplace, NÃO há trade entre jogadores.**

### Implicação para o projeto
- O modelo "Albion Market Analyzer" (compra/venda de items com preço de mercado) **não se aplica diretamente** ao TFT.
- O equivalente em TFT é **análise estatística de builds/composições (comps)**: win rates, pick rates, melhores items por unidade, tier lists, meta tracking por patch.
- É um produto de **stats/analytics**, não de market/economia.

---

## 3. API pública / fonte de dados

### Riot Games API — TFT (oficial, documentada)
- **Portal**: `https://developer.riotgames.com/docs/tft`
- **Endpoints TFT**:
  - `tft-summoner-v1` — dados de invocador (RSO required para produção).
  - `tft-league-v1` — ranked league info (tier, LP, wins/losses).
  - `tft-match-v1` — **match history** (composições, placement, items, units, traits, augments). **Core para stats de comps.**
  - `tft-status-v1` — status do servidor.
  - `spectator-tft-v5` — spectator data.
- **Routing**: `tft-match-v1` usa **regional routing** (AMERICAS, EUROPE, ASIA, SEA); summoner/league usam **platform routing** (na1, euw1, kr, etc.).
- **Match data fields** (por participante): `placement`, `level`, `last_round`, `units[]` (character_id, items[], tier), `traits[]` (name, num_units, style), `augments[]`, `gold_left`, `damage_to_players`.

### Rate limits
- **Development key** (default): 20 req/s, 100 req/120s por região.
- **Production key**: limites maiores, requer aprovação da Riot + RSO (Riot Sign On) integration.
- Rate limits **per region** (não global). Headers `X-Rate-Limit-Count` mostram uso.
- **429** com `Retry-After` se excedido. Backoff obrigatório.
- **Bug conhecido**: platform routes compartilham rate limit com regional (ex: euw1/eun1/ru compartilham EUROPE) — cuidado ao agregar.

### Static data — Data Dragon
- TFT static data (units, items, traits, augments icons/nomes) vem do **League of Legends Data Dragon** — tarball `.tgz` por patch.
- URL: `https://developer.riotgames.com/docs/lol#data-dragon` → TFT data incluído.

### Community APIs
- **CommunityDragon** (communitydragon.org) — dados não-oficiais mais detalhados por patch.
- **lolchess API** (lolchess.gg) — não pública oficialmente; lolchess raspam via Riot API.

### Recomendação de stack
- **Riot TFT API** (match-v1) como fonte primária — gratuita com dev key, production key para escala.
- **Data Dragon** para static data (ícones, nomes de units/items).
- Pipeline: coletar match IDs de high-elo players → fetch match details → agregar stats por comp/unit/item → calcular win rates.
- **Custo principal**: rate limits exigem coleta incremental e caching agressivo. Para stats representativas (Diamond+), precisa de milhares de matches por patch.

---

## 4. Sites concorrentes já existentes

| Site | URL | O que oferece | Monetização | Pontos fortes | Fracos |
|---|---|---|---|---|---|
| **tactics.tools** | tactics.tools | **Stats explorer**, top comps, tier list, match history, team builder, unit builder | **Patreon** (advanced explorer, ad-free) + ads | **Dominante**, UX excelente, dados profundos | Advanced features pagas |
| **lolchess.gg** | lolchess.gg | Comps, tier list, match history, leaderboards, guides | Ads + app (iOS/Android) | Tráfego alto, brand forte | UI mais básica que tactics.tools |
| **Mobalytics** | mobalytics.gg | Multi-game (TFT + LoL + Valorant), comps, tier list | Subscription (Plus) | Ecossistema multi-jogo | TFT é parte, não foco |
| **MetaTFT** | metatft.com | Stats, comps, augment stats | Ads | Dados granulares de augments | Menor tráfego |
| **TFTAcademy** | tftacademy.gg | Comps guides, tier list | Ads | Guias didáticos | Menos dados |
| **Orianna** | oriannalytics.com | Stats avançadas | — | Analytics profundo | Niche |

### Tráfego estimado (tactics.tools)
- **~200K visitors/day**, **~6M monthly visits** (hypestat.com).
- Receita ads estimada: **~$2.4K/day** (~$72K/mês) + Patreon.
- **Rank global: ~#33,887** — tráfego muito alto para um site de nicho.

### Concorrência em "TFT stats/builds"
- **ALTA.** tactics.tools e lolchess.gg são dominantes e consolidados. Mobalytics tem ecossistema. MetaTFT, TFTAcademy preenchem nichos.
- **Porém**: o público é enorme (33M MAU) e o meta muda a cada 2 semanas — sempre há demanda por conteúdo/stats atualizados.

---

## 5. Viabilidade técnica

| Fator | Avaliação |
|---|---|
| Disponibilidade de dados | ✅ **Excelente** — Riot TFT API oficial, documentada, gratuita |
| Custo de dados | ✅ **Baixo** — API gratuita (dev key); production key requer aprovação mas é grátis |
| Rate limits | ⚠️ Médio — 20 req/s, 100/120s (dev); precisa coleta incremental + caching |
| Aprovação production key | ⚠️ Riot avalia o produto; requer RSO integration — barreira moderada |
| Coleta de matches em escala | ⚠️ Precisa de pipeline de coleta (match IDs → details → agregação) — mais complexo que price tracker |
| Static data (Data Dragon) | ✅ Gratuito, atualizado por patch |
| Stack similar ao Albion | ✅ Next.js + SQLite funciona; schema: matches → participants → units/items/traits |
| Atualização por patch | ⚠️ Meta muda a cada 2 semanas — precisa de pipeline de refresh constante |

**Veredito técnico**: **Viável mas mais complexo** que um price tracker. A coleta e agregação de match data exige pipeline mais elaborado (job queue, caching, agregação estatística). A API é gratuita e oficial (vantagem vs. Steam games que dependem de APIs pagas/não-oficiais).

---

## 6. Viabilidade de negócio (ads)

| Fator | Avaliação |
|---|---|
| Tamanho do público | ✅ **Gigantesco** — 33M MAU, 1.2M concurrent peak |
| Intenção de busca | ✅ **Altíssima** — "TFT best comps Set 12", "TFT tier list patch 17.6", "TFT [unit] build" |
| CPM de ads | ✅ Médio (gamer, mobile+PC) — demo um pouco mais jovem que CS2 |
| Concorrência SEO | ❌ **Alta** — tactics.tools, lolchess, mobalytics dominam |
| Espaço para novo site | ⚠️ Pequeno a médio — precisa de diferencial forte |
| Monetização | Ads + Patreon/subscription (modelo tactics.tools) + afiliados (Riot não tem afiliados de skins) |
| Saturação de conteúdo | ❌ Alta — muito conteúdo de comps/tier list sendo produzido a cada patch |
| Frequência de atualização | ❌ Exige atualização a cada patch (2 semanas) — custo operacional alto |

**Realidade**: TFT tem público enorme e demanda contínua por stats, mas o espaço é **dominado por tactics.tools e lolchess.gg**, ambos consolidados há anos. O custo operacional é alto (refresh de dados a cada patch). Diferenciação é difícil — tactics.tools já tem stats explorer avançado.

---

## 7. Recomendação final

# ⚠️ GO com ressalvas

**Justificativa:**
- Público gigantesco (33M MAU) e API oficial gratuita são atrativos fortes.
- **Porém**: o modelo de negócio é **diferente do Albion Market Analyzer** — não há trade/economia de items, é puramente stats de gameplay. O "Albion model" (preços, arbitragem, market) não se traduz.
- Concorrência consolidada (tactics.tools com 6M visits/mês) torna entrada difícil.
- Custo operacional alto: refresh de dados a cada patch (2 semanas), agregação de milhares de matches.

**Condições para GO:**
1. **Diferencial de produto claro**: ex: foco em **PT-BR** (Brasil tem player base grande de TFT/LoL, poucos sites de stats em português), ou foco em **mobile UX** (TFT tem 50%+ de players mobile), ou **overlay/in-game tool**.
2. **Não competir head-on com tactics.tools** em stats explorer — focar em guias didáticos + tier list simples + match history pessoal.
3. **Monetização**: ads + Patreon/subscription para features avançadas (modelo tactics.tools validado).
4. **Aceitar que é um produto diferente** do Albion — não é "market analyzer", é "stats/builds analyzer".

**Se a ideia é replicar o modelo de "compra/venda de items com preço" → NO-GO** (TFT não tem economia de items tradeáveis). Se a ideia é **stats de comps/builds → GO com ressalvas** e diferencial claro.

**Risco principal**: tactics.tools e lolchess são muito fortes. Sem ângulo (PT-BR, mobile, overlay), é difícil ganhar tração.
