# World of Warcraft (WoW) — Relatório de Mercado

> Categoria: MMORPG | Modelo: P2P (subscription + expansion B2P) + WoW Token
> Data da pesquisa: Julho 2025

## 1. Visão Geral

- **Desenvolvedora**: Blizzard Entertainment
- **Lançamento**: 2004 (Retail) + 2019 (WoW Classic)
- **Plataformas**: PC (Windows/Mac)
- **Região**: Global (US, EU, KR, TW, CN — retomou na China em 2024)
- **Player base estimada (2025)**: ~7.25M–9M subscribers ativos (estimativa Bellular GDC 2024 + leak de vídeo de concerto FR "9 millions de joueurs" em jul/2025). Pico histórico: 12M (2010, WotLK). ~1.3M daily players (mmo-population).
- **Modelo de negócio**: assinatura mensal (~USD 15) + compra de expansão + WoW Token (conversível gold↔game time) + shop cosmético.

## 2. Economia do Jogo

- **Auction House (AH)** regional para commodities (gems, herbs, ore, etc.) e por connected-realm para itens não-commodity (gear, pets, boes).
- **Moeda**: Gold. WoW Token flutua contra USD (preço determinado por mercado regional).
- **Taxas**: 5% deposit (capped) + 5% cut na venda (AH padrão).
- **Arbitragem**: SIM — entre realms conectados, entre buy/sell, flipping de commodities regionais, cross-faction (desde 9.2.1).
- **Player-driven**: SIM, fortemente. Economia madura com 20+ anos.

## 3. API Pública / Fontes de Dados

### API Oficial Blizzard (Game Data API)
- **Base**: `https://us.api.blizzard.com/data/wow/` (regional: us/eu/kr/tw)
- **Auth**: OAuth2 client credentials (registro no Blizzard Developer Portal)
- **Auction House**: `GET /data/wow/connected-realm/{id}/auctions` — namespace `dynamic-{region}`, atualiza a cada ~1h, resposta pode exceder 10MB
- **Item metadata**: `GET /data/wow/item/{id}` (namespace `static-{region}`)
- **Suporte**: `If-Modified-Since` / `Last-Modified` / `ETag` para cache
- **Rate limit**: não documentado explicitamente, mas com headers de rate limit dinâmicos
- **Documentação**: `https://develop.battle.net/documentation/world-of-warcraft`

### Projetos Comunitários
- **The Undermine Journal** (`theunderminejournal.com`) — backend open-source `erorus/newsstand` (GitHub), MySQL, coleta snapshots do AH via API Blizzard.
- **Undermine Exchange** (`undermine.exchange`) — sucessor, backend `erorus/shatari` (Node.js), 58M+ arquivos no filesystem, API REST pública em `https://api.undermine.exchange/` com chave vinculada a Patreon (maioria das chamadas gratuita, só precisa logar via Patreon).
  - Oferece: preços atuais region/realm, histórico 14 dias (hourly) + diário, dados por item-level e pet-breed.
- **WoW Token Info** (`wowtoken.info`) — preço histórico do Token.
- **Oribos Exchange addon** (CurseForge) — addon in-game derivado do Undermine Exchange.

## 4. Sites Concorrentes (Mercado)

| Site | URL | Oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| Undermine Exchange | undermine.exchange | AH stats, histórico, API | Patreon (tier para API) | API pública, dados granulares | UX datada, foco em traders avançados |
| The Undermine Journal | theunderminejournal.com | AH stats, gráficos | Ads | Histórico longo | Lentidão, menos atualizado |
| WoW Token Info | wowtoken.info | Token price history | Ads | Simples, focado | Nichado |
| Oribos Exchange | (addon) | In-game price check | Gratuito | Conveniência in-game | Só addon, não site |

## 5. Sites de Builds/Dicas

| Site | Tráfego (estimado) | Monetização |
|---|---|---|
| **Wowhead** | ~50M visits/mês (SEMrush mai/2026) | Ads pesado + premium |
| **Icy Veins** | ~13M visits/mês, 4M readers/mês, ~$5.5K/day revenue | Ads + premium (remove ads) |
| **Method.gg** | — | Ads + patrocínios |
| **Archon** | — | — |

> Wowhead é o "Wikipedia do WoW" — database de itens, quests, NPCs. Icy Veins é o rei de build guides. Ambos pertencem a grandes redes (Fanbyte/Enthusiast Gaming).

## 6. Viabilidade Técnica

- **API oficial excelente** (Blizzard Game Data) — OAuth2, AH snapshots por connected-realm, ETag/Last-Modified para cache.
- **Dados suficientes**: SIM. AH regional + per-realm + histórico via Undermine Exchange.
- **Desafios**:
  - AH API atualiza só a cada ~1h (vs Albion que é mais frequente).
  - Respostas grandes (>10MB) exigem parsing eficiente.
  - OAuth2 adiciona complexidade vs API keyless do Albion.
  - Necessário registrar app no Blizzard Developer Portal.
- **Stack compatível**: Next.js + SQLite + proxy server-side resolve CORS e centraliza OAuth. Mesma arquitetura do Albion funciona.

## 7. Viabilidade de Negócio (Ads)

- **Público**: ~7-9M subs + audiência casual muito maior (Wowhead tem 50M visits/mês).
- **Concorrência**: EXTREMAMENTE ALTA. Wowhead + Icy Veins + Undermine Exchange já cobrem mercado + builds.
- **Espaço para novo site**: PEQUENO em mercado puro. Possível em nichos:
  - Arbitragem cross-realm automatizada com UX moderna (Undermine Exchange é técnico/datado).
  - Dashboard de "oportunidades de flip" similar ao scanner do Albion.
  - Integração mercado + builds em um só site (gap entre Wowhead e Undermine Exchange).
- **Potencial de tráfego**: alto se bem executado, mas CTR/CPM em nicho WoW é competitivo.
- **Receita estimada**: sites de nicho WoW com ~500K visits/mês podem gerar USD 2-5K/mês em ads (referência: Icy Veins faz ~$5.5K/dia com 13M visits).

## 8. Recomendação Final

### ⚠️ GO com ressalvas

**Justificativa**: API oficial Blizzard é excelente (melhor que Albion em maturidade), player base massiva e economia madura. PORÉM, concorrência é a mais forte de qualquer jogo pesquisado — Wowhead (50M visits) e Icy Veins dominam builds, Undermine Exchange domina mercado. Diferenciação precisa ser em UX moderna + scanner de oportunidades automatizado (gap que o projeto Albion já resolveu). Não tentar competir em database de itens (Wowhead é imbatível). Foco em **análise estatística de arbitragem/flipping** é o caminho.

**Risco principal**: custo de infra para coletar AH de 186+ realms a cada hora (Undermine Exchange tem 58M arquivos). MVP deve começar com 1-2 realms grandes ou só commodities regionais.
