# Old School RuneScape (OSRS) — Relatório de Análise de Mercado

> Análise de viabilidade para replicar o modelo "Albion Online Market Analyzer" em OSRS

---

## 1. Visão Geral do Jogo

| Atributo | Detalhe |
|---|---|
| **Gênero** | MMORPG clássico (point-and-click, sandbox, skills-based) |
| **Desenvolvedora** | Jagex |
| **Publisher** | Jagex |
| **Modelo** | F2P (free-to-play limitado) + P2P (membership subscription ~$11/mês) |
| **Plataformas** | PC (cliente próprio + Steam), Mobile (iOS/Android), RuneLite (cliente terceiro) |
| **Região** | Global (servidores em múltiplas regiões, comunidade majoritariamente anglófona) |
| **Lançamento** | 22 de fevereiro de 2013 (baseado na build de agosto de 2007) |

### Player Base (2025/2026)

- **Concurrent players**: ~140.000–175.000 jogadores online simultâneos (média diária 2026)
- **Pico histórico 2025**: 240.000 simultaneous players — **recorde de 25 anos da franquia** (BBC News)
- **Média mensal**: ~155.000–200.000 (mmo-population.com, aggrgtr.com)
- **Membros pagos**: "well over a million" (>1 milhão) — aumento de 30% em 2025 (Jagex/BBC)
- **Total contas**: 38+ milhões (playerauctions.com)
- **Tendência**: 🟢 **CRESCENDO** — Jagex chama OSRS de "fastest-growing MMO in the world" (2025)
- **Steam**: ~1.400 concurrent (subestima — maioria usa cliente próprio/RuneLite)

> **Destaque**: OSRS é o MMO que **mais cresce** entre os analisados. Player base massiva e em expansão, com pico histórico em 2025.

---

## 2. Economia do Jogo

### Grand Exchange (GE)

O Grand Exchange é o **coração da economia** de OSRS — um marketplace centralizado onde jogadores compram e vendem praticamente qualquer item tradeable.

#### Como funciona

- **Sistema de ofertas**: você coloca buy offers ou sell offers a um preço definido
- **Matching automático**: o GE casa buy orders ≥ sell orders automaticamente
- **Preço de mercado (guide price)**: derivado de transações recentes, atualizado periodicamente
- **Buy limit**: cada item tem um limite de compra por 4 horas (anti-flipping)
- **Sem taxas de listing**: não há fee para colocar uma offer
- **GE Tax**: 1-5% sobre vendas acima de 50 GP (introduzida em 2021,上限 ~5%)
- **Instant buy / Instant sell**: o preço "high" é o instant buy (compra imediata), o "low" é o instant sell (venda imediata)

#### Moedas

| Moeda | Função |
|---|---|
| **GP (Gold Pieces / Coins)** | Moeda única, usada no GE e em todo o jogo |
| **Bonds** | Item tradeable que pode ser resgatado por membership — funciona como "premium currency" player-driven |

### Arbitragem e Flipping

- **Flipping**: ✅✅ **A atividade econômica #1 em OSRS** — comprar baixo, vender alto
- **Arbitragem entre mundos**: ❌ NÃO existe (GE é global, mesmo mercado em todos os mundos)
- **Margin trading**: a diferença entre instant buy (high) e instant sell (low) é o "margin" — base do flipping
- **GE limits flipping**: buy limits por item a cada 4h limitam escala mas criam oportunidades
- **Overnight flipping**: comprar antes de dormir, vender quando acorda (preços mudam com volume noturno)
- **Bot dump detection**: itens caem de preço quando bots dumpam inventário — oportunidade de compra

> **Comparação com Albion**: OSRS tem economia **mais puramente player-driven** que Albion. O GE é um order book real com buy/sell orders visíveis. Flipping é uma profissão reconhecida dentro do jogo.

---

## 3. API Pública ou Fonte de Dados

### ✅✅ API OFICIAL + API comunitária excelente — O MELHOR CENÁRIO dos 5 jogos

#### 1. Jagex Official GE API (API oficial, pública)

- **URL base**: `https://services.runescape.com/m=itemdb_oldschool/api/catalogue/`
- **Documentação**: OSRS Wiki (não há docs oficiais da Jagex, mas endpoints são conhecidos)

| Endpoint | URL | Função |
|---|---|---|
| Info | `services.runescape.com/m=itemdb_oldschool/api/info.json` | Última atualização (runedate) |
| Category | `services.runescape.com/m=itemdb_oldschool/api/catalogue/category.json?category=X` | Itens por categoria/letra |
| Items | `services.runescape.com/m=itemdb_oldschool/api/catalogue/items.json?category=X&alpha=Y&page=Z` | Lista de itens |
| Detail | `services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item=X` | Preço atual + trend de um item |
| Graph | `services.runescape.com/m=itemdb_oldschool/api/graph/X.json` | Histórico de preços (180 dias) |

**Limitações**: dados atualizados ~1x por dia, não real-time. Preços arredondados (>10k → "10k", >1M → "1.0m").

#### 2. OSRS Wiki Real-Time Prices API (comunitária, via RuneLite) — ⭐ A MELHOR

- **URL base**: `https://prices.runescape.wiki/api/v1/osrs`
- **Documentação**: `https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices`
- **Parceria**: OSRS Wiki + RuneLite (cliente terceiro mais popular)
- **Dados**: transações reais completadas via RuneLite, atualizado a cada **60 segundos**

| Endpoint | URL | Função |
|---|---|---|
| Latest | `prices.runescape.wiki/api/v1/osrs/latest` | Preços high/low atuais de TODOS os itens |
| Latest (item) | `prices.runescape.wiki/api/v1/osrs/latest?id=X` | Preço de um item específico |
| 5-minute | `prices.runescape.wiki/api/v1/osrs/5m` | Média de 5min + volume |
| 1-hour | `prices.runescape.wiki/api/v1/osrs/1h` | Média de 1h + volume |
| Time-series | `prices.runescape.wiki/api/v1/osrs/timeseries?id=X&timestep=5m` | Série histórica (5m, 1h, 6h) |
| Mapping | `prices.runescape.wiki/api/v1/osrs/mapping` | Metadata de todos os itens (ID, nome, examine, alch values, buy limit) |

**Formato de resposta (latest)**:
```json
{
  "data": {
    "4151": {
      "high": 120000,
      "highTime": 1700000000,
      "low": 118000,
      "lowTime": 1700000050
    }
  }
}
```

#### 3. WeirdGloop Exchange API (histórico longo)

- **URL base**: `https://api.weirdgloop.org/exchange/`
- **Documentação**: `https://runescape.wiki/w/RuneScape:Grand_Exchange_Market_Watch/Usage_and_APIs`

| Endpoint | Função |
|---|---|
| `api.weirdgloop.org/exchange/history/osrs/all?id=X` | Todo o histórico de preços |
| `api.weirdgloop.org/exchange/history/osrs/last90d?id=X` | Últimos 90 dias |
| `api.weirdgloop.org/exchange/history/osrs/latest?id=X` | Último preço |

> **Conclusão técnica**: OSRS tem o **melhor ecossistema de APIs** de todos os 5 jogos. API oficial (Jagex) + API real-time (Wiki/RuneLite) + API histórico (WeirdGloop). Tudo público, gratuito, documentado e com comunidade ativa.

---

## 4. Sites Concorrentes (Análise de Mercado)

| Site | URL | O que oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **GE Tracker** | ge-tracker.com | Flip finder, profit tracker, price alerts, money making calculators, graphs 5min | Freemium ($4-8/mês Premium) + ads | #1 do nicho, 747k+ usuários, dados RuneLite real-time, SMS alerts | Muitas features atrás de paywall |
| **GE Margin** | gemargin.com | Flip finder, price alerts (Discord), profit tracker, market watch | 100% gratuito (sem paywall) | Tudo gratuito, interface limpa | Mais novo, menos features que GE Tracker |
| **GrandExchange.com** | grandexchange.com | Live prices OSRS+RS3, price history, candlestick charts, flip calculator | Gratuito | Suporta OSRS e RS3, charts interativos | Sem flip finder avançado |
| **RuneTrader.gg** | runetrader.gg | Live GE slot tracking (RuneLite), AI flip advisor, margin engine, alerts | Gratuito | AI advisor, real-time slot sync | Foco em integração RuneLite, não web analysis |
| **PriceCheck.gg** | pricecheck.gg | Community street prices, GE data, portfolio tracker, price API | Freemium | API própria, community-driven | Street prices menos confiáveis que GE |
| **07.gg** | 07.gg/ge | Market overview, market reports, Death's Coffer tracker | Freemium (Exchange Pro) | Market reports únicos | Menos features de flipping |
| **OSRS Wiki** | oldschool.runescape.wiki | Real-time prices em cada item, Grand Exchange Market Watch | Sem ads (funded by community) | Fonte de dados, autoridade | Não é ferramenta de flipping |

### Análise competitiva

- **GE Tracker** é o líder estabelecido (747k+ usuários) mas **muitas features são pagas**
- **GE Margin** é a alternativa gratuita que está ganhando tração
- **GrandExchange.com** cobre OSRS + RS3 mas é mais básico
- **OSRS Wiki** fornece os dados mas não é ferramenta de análise
- **Concorrência é alta** mas o mercado é **grande o suficiente** para múltiplos players (175k+ concurrent players)

---

## 5. Sites de Builds/Dicas Já Existentes

- **OSRS Wiki** (oldschool.runescape.wiki) — A referência absoluta. Guias, database de itens, bestiary, calculadoras. Comunidade mantém tudo.
- **Maxroll.gg/osrs** — Tier lists, boss guides, build guides (menos ativo que outras seções)
- **OSRS Best in Slot** (osrsbestinslot.com) — Gear progression, BiS calculators, DPS calculator, guides por combat style
- **RuneLite** (runelite.net) — Cliente terceiro com plugins (GE prices, item stats, boss timers) — não é site mas é ferramenta essencial
- **Old School RuneScape Official** (oldschool.runescape.com) — Site oficial, GE database, hiscores

---

## 6. Viabilidade Técnica

| Critério | Avaliação | Detalhe |
|---|---|---|
| **API pública oficial** | ✅✅ Sim | Jagex GE API (oficial, pública, gratuita) |
| **API real-time comunitária** | ✅✅ Sim | OSRS Wiki/RuneLite API (60s update, high/low prices) |
| **API histórico** | ✅✅ Sim | WeirdGloop (histórico completo + últimos 90 dias) |
| **Dados suficientes para análise** | ✅✅ Sim | Preços, volume, histórico, buy limits, item metadata |
| **Similaridade com Albion Data Project** | ✅✅ Alta | API REST, JSON, real-time, item mapping |
| **Dificuldade de implementação** | 🟢 Baixa | APIs bem documentadas, wrappers em múltiplas linguagens |
| **Documentação** | ✅✅ Excelente | OSRS Wiki documenta tudo, wrappers em Python/JS/TS |

### Arquitetura proposta (mapeamento direto do Albion Analyzer)

```
OSRS Wiki API (real-time, 60s) + Jagex API (daily) + WeirdGloop (histórico)
    ↓
Next.js API Routes (fetch + normalize + persist)
    ↓
SQLite (snapshots de preço, histórico, opportunities)
    ↓
Frontend (Next.js + TypeScript)
  - Flip Finder (margins = high - low, filtrar por profit/volume/limit)
  - Price history charts (time-series 5m/1h/6h)
  - Money making calculators (high alch, cooking, herblore, fletching, etc.)
  - Opportunity scanner (price drops, volume surges, bot dumps)
  - GE limits tracker
  - Market indexes (food, runes, metals, herbs)
  - Bond price tracker (membership arbitrage)
```

### Mapeamento Albion → OSRS

| Feature do Albion Analyzer | Equivalente em OSRS |
|---|---|
| Preços por cidade | Preços high/low no GE (global, sem cidades) |
| Histórico de preços | Time-series API (5m, 1h, 6h) |
| Arbitragem entre cidades | ❌ Sem arbitragem geográfica (GE é global) |
| Black Market | ❌ Não existe equivalente |
| Lucro de refinamento | Money making calculators (high alch, cooking, herblore, etc.) |
| Scanner de oportunidades | Flip Finder + price drop alerts |
| Cotação de ouro | Bond price (GP ↔ membership) |

### Desafios técnicos

1. **Sem arbitragem geográfica**: o GE é global — não há equivalente à arbitragem entre cidades do Albion. O foco seria **flipping** (margin trading) em vez de arbitragem.
2. **Buy limits**: cada item tem um limite de compra por 4h — precisa ser considerado no flip finder.
3. **GE Tax**: 1-5% sobre vendas acima de 50 GP — precisa ser subtraído do margin.
4. **Concorrência madura**: GE Tracker tem 747k+ usuários e 10+ anos de mercado.

---

## 7. Viabilidade de Negócio (Ads)

| Fator | Avaliação |
|---|---|
| **Tamanho do público** | ✅✅ Massivo (~175k concurrent, >1M membros pagos) |
| **Tendência** | ✅✅ Crescendo (fastest-growing MMO, pico histórico 2025) |
| **Concorrência** | 🟡 Alta (GE Tracker, GE Margin, GrandExchange.com) |
| **Espaço para novo site** | 🟡 Médio — concorrência forte mas mercado grande |
| **Potencial de tráfego** | ✅✅ Muito alto — maior player base dos 5 jogos |
| **Engajamento da comunidade** | ✅✅ Altíssimo — flipping é subcultura própria |
| **Monetização alternativa** | ✅ Freemium (GE Tracker cobra $4-8/mês) |

### Análise

- **Maior player base** dos 5 jogos analisados (~175k concurrent vs ~20k BDO, ~6k Lost Ark)
- Flipping/merchanting é uma **profissão reconhecida** em OSRS — comunidade dedicada
- GE Tracker prova que **monetização funciona** (747k+ usuários, modelo freemium)
- Mercado é grande o suficiente para **múltiplos players** — GE Margin surgiu como alternativa gratuita
- **Estratégia de diferencial**: site 100% gratuito (como GE Margin) com foco em UX moderna + features que GE Tracker coloca atrás de paywall

---

## 8. Recomendação Final

# ✅✅ GO (Top 1 — Melhor candidato)

### Justificativa

1. **API pública excelente**: 3 APIs complementares (Jagex oficial + Wiki/RuneLite real-time + WeirdGloop histórico). O melhor ecossistema de dados dos 5 jogos. Mapeamento quase direto com o Albion Data Project.

2. **Player base massiva e crescendo**: ~175k concurrent, >1M membros pagos, "fastest-growing MMO in the world" (2025). Maior público dos 5 jogos = maior potencial de tráfego/ads.

3. **Economia puramente player-driven**: Grand Exchange é um order book real. Flipping é atividade central. Margin trading (high/low) é exatamente o tipo de análise que o Albion Analyzer faz.

4. **Modelo de monetização provado**: GE Tracker tem 747k+ usuários e cobra Premium. O mercado suporta múltiplos players (GE Margin é alternativa gratuita crescendo).

5. **Implementação mais straightforward**: APIs REST bem documentadas, wrappers em Python/TS, dados JSON limpos. A arquitetura do Albion Analyzer pode ser quase diretamente reutilizada.

### Estratégia recomendada

1. **Diferencial vs GE Tracker**: ser 100% gratuito (como GE Margin) — capturar usuários que não querem pagar Premium
2. **Foco em UX moderna**: Next.js 16 + TypeScript (stack já dominada pelo Albion Analyzer)
3. **Features de flip finder**: margin = high - low, com filtros por volume, buy limit, GE tax, ROI
4. **Money making calculators**: high alch, cooking, herblore, fletching, plank making — integrar com preços ao vivo
5. **Price alerts**: via Discord webhook (gratuito, como GE Margin faz)
6. **Market indexes**: acompanhar saúde geral da economia (food, runes, metals, herbs)
7. **Conteúdo pt-BR**: diferencial — GE Tracker e concorrentes são todos em inglês. Mercado lusófono de OSRS existe (Wiki tem versão pt-BR)

> **Resumo**: OSRS é o **melhor candidato** dos 5 jogos. API pública excelente + player base massiva e crescendo + economia player-driven pura + modelo de monetização provado. A arquitetura do Albion Analyzer pode ser quase diretamente reutilizada, trocando arbitragem entre cidades por flip finding (margin trading).
