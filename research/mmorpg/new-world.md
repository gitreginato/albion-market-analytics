# New World — Relatório de Mercado

> Categoria: MMORPG | Modelo: B2P (buy-to-play, sem subscription)
> Data da pesquisa: Julho 2025

## 1. Visão Geral

- **Desenvolvedora**: Amazon Game Studios
- **Lançamento**: Setembro 2021 (relançamento como "New World: Aeternum" em out/2024 — versão multiplataforma)
- **Plataformas**: PC (Steam), PS5, Xbox Series X|S
- **Região**: Global (regiões NA East/West, EU, SA, AP Southeast)
- **Player base estimada (2025-2026)**:
  - Steam: ~500-1K avg, ~1K peak (jun/2026) — **declínio severo**.
  - Pico histórico: 913K concurrent (out/2021, lançamento).
  - Out/2025 teve pico de 51K (expansão), mas caiu para ~5K em 2 meses.
  - PlayerAuctions estima ~15K daily (Google Trends), mas Steam mostra bem menos.
- **Modelo**: B2P + cosmetic shop. Sem subscription.

## 2. Economia do Jogo

- **Trading Post**: por settlement (cidade). Cada cidade tem seu próprio market — não há AH global.
- **Moeda**: Gold. Sem token RMT oficial.
- **Taxas**: taxas da cidade (definidas pela guilda dona da cidade) + listing fee.
- **Arbitragem**: SIM — entre cidades/settlements. É o core do trading em NW.
- **Player-driven**: SIM, fortemente localizado por cidade. **Conceitualmente IDÊNTICO ao Albion** (cidades com mercados separados, arbitragem entre elas).

## 3. API Pública / Fontes de Dados

### ⚠️ NÃO HÁ API oficial da Amazon para o mercado.

### Projetos Comunitários
- **NWMarketPrices** (`nwmarketprices.com`) — crowdsourced, comunidade envia dados.
- **NW Market Prices** (`nwmp.gaming.tools/`) — site que mostra preços por servidor.
- **NW_Market_OCR** (GitHub `kirchner-trevor/NW_Market_OCR`) — extrai listings via **screenshots + OCR (Tesseract)**. Frágil, requer screenshots manuais.
- **NWPriceTracker** (GitHub `NotCoffee418/NWPriceTracker`) — self-hosted, web platform para trackear preços em todas as trading zones. Discord login, live updates entre usuários online.
- **New-World-Profit-Calculator** (GitHub `millelog/new-world-profit-calculator`) — análise de profitability de crafting, buy/sell recommendations.
- **NWDB** (`nwdb.info`) — database de itens, tem API (`NwdbInfoApi` library, requer User-Agent correto).

### Desafio fundamental
A Amazon **não expõe o mercado via API**. Todos os projetos dependem de:
1. OCR de screenshots (frágil, manual).
2. Input manual de preços pela comunidade.
3. Self-hosted trackers onde usuários digitam/atualizam preços.

Não há equivalente ao Albion Online Data Project (que tem cliente dedicado enviando dados automaticamente).

## 4. Sites Concorrentes (Mercado)

| Site | URL | Oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| NWMarketPrices | nwmarketprices.com | Preços por servidor | — | Comunidade ativa | Dados crowdsourced manuais |
| NW Market Prices | nwmp.gaming.tools | Preços por servidor | — | UI simples | — |
| NWDB | nwdb.info | Database de itens | — | Itens/recipes | Não é focado em preços live |
| MinMaxed | minmaxed.games/newworld | Calculators | — | Crafting calc | — |

## 5. Sites de Builds/Dicas

| Site | Notas |
|---|---|
| **NWDB** | Database + builds |
| **Aeternum Map** | Mapa interativo |
| **New World Database** | Itens/recipes |
| **YouTube creators** | Dominam builds (Pve/PvP) |

> NW tem ecossistema de sites MUITO menor que WoW/FFXIV. Comunidade depende muito de YouTube + Discord.

## 6. Viabilidade Técnica

- **API**: NÃO oficial. Projetos comunitários usam OCR ou input manual.
- **Desafios FATAIS**:
  - Sem API = sem dados confiáveis em escala.
  - OCR de screenshots é frágil e não escala.
  - Input manual não compete com coleta automática.
  - Player base em declínio severo (913K → ~500 em 4 anos).
- **Stack**: tecnicamente possível, mas sem fonte de dados viável.

## 7. Viabilidade de Negócio (Ads)

- **Público**: ~500-1K concurrent no Steam (2026). Mesmo considerando console, público é PEQUENO e encolhendo.
- **Concorrência**: BAIXA, mas porque o mercado é pequeno demais para atrair concorrentes.
- **Espaço para novo site**: tecnicamente sim, mas **sem audiência para monetizar**.
- **Potencial de tráfego**: MUITO BAIXO. Não sustenta site com ads.

## 8. Recomendação Final

### ❌ NO-GO

**Justificativa**: Dois problemas fatais:
1. **Sem fonte de dados viável** — Amazon não oferece API, projetos comunitários dependem de OCR/input manual. Não há como construir scanner de oportunidades confiável como no Albion.
2. **Player base em colapso** — de 913K concurrent (2021) para ~500-1K (2026). Mesmo com relançamento Aeternum, o jogo não reteve players. Audiência insuficiente para monetização com ads.

Embora o modelo de economia (Trading Post por cidade) seja conceitualmente idêntico ao Albion, a execução é inviável sem dados. **Não recomendado**.
