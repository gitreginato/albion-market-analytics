# Diablo IV (D4) — Relatório de Mercado

> Categoria: ARPG | Modelo: B2P (buy-to-play) + expansão + cosmetic shop
> Data da pesquisa: Julho 2025

## 1. Visão Geral

- **Desenvolvedora**: Blizzard Entertainment (Team 3)
- **Lançamento**: Junho 2023 (base) / Outubro 2024 (expansão Vessel of Hatred)
- **Plataformas**: PC (Battle.net + Steam), PS5/PS4, Xbox Series X|S
- **Região**: Global
- **Player base estimada (2025)**:
  - ~3.2M monthly active players (todas plataformas, Activeplayer.io)
  - Steam: ~7-21K avg, picos de ~55K (out/2024) e ~64K (mai/2026, nova temporada)
  - Pico histórico Steam: 55.5K (out/2024, Vessel of Hatred)
  - Receita lifetime: >$1 bilhão (set/2024)
- **Modelo**: B2P + seasonal content (gratuito) + cosmetic shop + expansões pagas. Sem subscription. Sem RMT oficial (não há token como WoW).

## 2. Economia do Jogo

- **Trade**: ⚠️ **MUITO LIMITADO**. D4 NÃO tem auction house/marketplace público. Trade é restrrito:
  - Itens podem ser trocados apenas entre jogadores, em pessoa, por um limite de tempo após drop.
  - **Não há trade de gear endgame** (Legendaries/Uniques sacross são account-bound).
  - Trade limitado a consumíveis, gemas, materiais de crafting.
- **Moeda**: Gold. Sem token RMT oficial.
- **Arbitragem**: ❌ **NÃO existe** em escala. Sem marketplace centralizado.
- **Player-driven**: ❌ Quase não existe economia player-driven. É essencialmente single-player com coop.

## 3. API Pública / Fontes de Dados

### ⚠️ NÃO HÁ API OFICIAL da Blizzard para D4.

- **D4Armory** (`d4armory.io` / `d4armory.fly.dev`) — site NÃO oficial que mostra character profiles (equipment, stats, time played). Obtém dados via scraping do armory não-documentado da Battle.net (requer `account_id` extraído de `FenrisDebug.txt` no diretório do jogo). **NÃO mostra preços de mercado** (porque não há mercado).
- **diablo.trade** — marketplace player-to-player COMUNITÁRIO (não do jogo). Players listam itens manualmente no site para combinar trades in-game. Não é dados do jogo, é classificado.
- **D4 Trade Market** (app Android, `d4trade.sefir.dev`) — similar, marketplace comunitário.
- **Blizzard Developer Portal**: cobre WoW, D3, Hearthstone — **NÃO D4**. Fórum oficial confirma: "there is no d4 api yet".

## 4. Sites Concorrentes (Mercado)

| Site | URL | Oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| diablo.trade | diablo.trade | P2P marketplace comunitário | — | Comunidade ativa | Não é dados do jogo, é classificado |
| D4Armory | d4armory.io | Character profiles | — | Único armory | Sem dados de mercado |
| D4 Trade Market | d4trade.sefir.dev | App Android de trade | — | Mobile | iOS bloqueado pela Apple |

## 5. Sites de Builds/Dicas

| Site | Notas |
|---|---|
| **Maxroll.gg/d4** | Dominante em builds + tier lists + planners |
| **Icy Veins** | Build guides |
| **D4Builds.gg** | Builds |
| **Wowhead D4** | Database |

## 6. Viabilidade Técnica

- **API**: NÃO oficial. Sem dados de mercado porque o jogo NÃO TEM mercado.
- **Bloqueio fundamental**: D4 não tem economia player-driven. Não há preços de marketplace para analisar. O "trade" é P2P manual via whisper, sem order book, sem histórico.
- **Stack**: Next.js funciona, mas **não há o que analisar** em termos de mercado.

## 7. Viabilidade de Negócio (Ads)

- **Público**: ~3.2M monthly — grande, mas...
- **Concorrência em builds**: EXTREMAMENTE ALTA (Maxroll domina).
- **Concorrência em mercado**: N/A (não há mercado).
- **Espaço para site de análise de mercado**: ❌ **ZERO**. O jogo não tem economia para analisar.
- **Potencial de tráfego para mercado**: N/A.

## 8. Recomendação Final

### ❌ NO-GO (para o modelo Albion)

**Justificativa**: D4 é fundamentalmente incompatível com o modelo do Albion Market Analyzer. O jogo **não tem marketplace/auction house** — o trade é P2P restrito, gear endgame é account-bound, e não há preços de mercado para analisar. Não há o que "scanner de oportunidades" possa escanear. A economia não é player-driven.

**Único caminho viável em D4**: site de builds/dicas (mas Maxroll já domina). Não recomendado para o modelo de análise de mercado.

**Contraste com PoE**: PoE tem trade site oficial + economia rica + poe.ninja. D4 não tem nada disso. A diferença é estrutural, não de execução.
