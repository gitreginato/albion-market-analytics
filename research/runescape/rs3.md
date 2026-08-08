# RuneScape 3 (RS3) — Relatório de Mercado

> Categoria: Korean MMO & RuneScape | Modelo: F2P (limitado) + P2P (membership subscription)
> Data da pesquisa: Julho 2025

## 1. Visão Geral

- **Desenvolvedora**: Jagex
- **Lançamento**: 2013 (versão HTML5/ NXT client) — franquia original de 2001
- **Plataformas**: PC (cliente próprio NXT + Steam), Mobile (em beta)
- **Região**: Global (UK-based, comunidade majoritariamente anglófona)
- **Player base estimada (2025)**:
  - Concurrent: ~17-21K (aggrgtr.com, jun/2026 — RS3 vs OSRS ~148K)
  - Steam: ~1.2-2.7K avg (fração pequena — maioria usa cliente NXT)
  - Tendência: 📉 **DECLÍNIO LENTO** — RS3 perde para OSRS consistentemente (8:1 ratio). Aggrgtr: "RS3 player counts have not hit bottom yet".
- **Modelo**: F2P (limitado) + membership (~$11/mês) + Treasure Hunter (microtransações controversas) + Bonds (membership tradeable, similar ao WoW Token).

## 2. Economia do Jogo

- **Grand Exchange (GE)**: mesma estrutura do OSRS — marketplace centralizado global, buy/sell offers, matching automático.
- **Moeda**: GP (Gold Pieces). **Bonds** = item tradeable resgatável por membership (RMT oficial, similar WoW Token).
- **Taxas**: GE Tax 1-5% (introduzida em 2021, mesma do OSRS).
- **Arbitragem**: SIM — flipping (margin trading), mas GE é global (sem arbitragem entre mundos). Mesma mecânica do OSRS.
- **Player-driven**: SIM, mas economia menor que OSRS (menos players, menos volume).
- **Diferença vs OSRS**: RS3 tem mais itens (skills adicionais: Invention, Archaeology, Summoning, Divination, Dungeoneering), mais gear tiers (até T92), mas menos jogadores ativos = menos liquidez.

## 3. API Pública / Fonte de Dados

### ✅ Mesmo ecossistema do OSRS — APIs excelentes

#### 1. Jagex Official GE API (RS3)
- **URL base**: `https://services.runescape.com/m=itemdb_rs/api/catalogue/`
- Endpoints análogos ao OSRS: `info.json`, `category.json`, `items.json`, `detail.json?item=X`, `graph/X.json` (180 dias)
- Limitação: atualização diária, preços arredondados.

#### 2. RuneScape Wiki Real-Time Prices API (RS3)
- **URL base**: `https://prices.runescape.wiki/api/v1/rs`
- **Documentação**: `https://runescape.wiki/w/RuneScape:Grand_Exchange_Market_Watch/Usage_and_APIs`
- Endpoints: `/latest`, `/5m`, `/1h`, `/timeseries?id=X&timestep=5m`, `/mapping`
- **Diferença vs OSRS**: a API real-time do OSRS é via RuneLite (parceria). RS3 NÃO usa RuneLite — usa cliente NXT próprio. A cobertura de dados real-time para RS3 é **MENOR** que OSRS (menos fontes crowdsourced).
- Suporta `lang=pt` (português brasileiro) para nomes de itens.

#### 3. WeirdGloop Exchange API (histórico)
- **URL base**: `https://api.weirdgloop.org/exchange/history/rs/`
- Endpoints: `/all?id=X`, `/last90d?id=X`, `/latest?id=X`
- Mesma estrutura do OSRS, mas para RS3.

> **Conclusão técnica**: RS3 tem as mesmas 3 APIs do OSRS (Jagex + Wiki + WeirdGloop). Tecnicamente viável. PORÉM, a cobertura real-time pode ser menor (menos contributors que OSRS/RuneLite).

## 4. Sites Concorrentes (Mercado)

| Site | URL | Oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **GrandExchange.com** | grandexchange.com | Live prices OSRS+RS3, charts, flip calc | Gratuito | Suporta OSRS E RS3 | Básico |
| **GE Tracker** | ge-tracker.com | Flip finder, alerts | Freemium ($4-8/mês) | Líder | Foco em OSRS, RS3 secundário |
| **RS3 Wiki GE** | runescape.wiki | Real-time prices | Sem ads | Fonte de dados | Não é ferramenta de análise |
| **PvM Encyclopedia** | pvme.io | Boss guides, gear setups | — | Foco PvM | Não é mercado |

### Análise competitiva
- **Concorrência MENOR que OSRS** em ferramentas de mercado — a maioria dos sites foca em OSRS (maior player base). RS3 é tratado como secundário.
- **Espaço para site RS3-específico**: MAIOR que OSRS, mas com público menor.

## 5. Sites de Builds/Dicas

- **RS3 Wiki** (runescape.wiki) — referência absoluta, database, calculadoras
- **PvM Encyclopedia** (pvme.io) — boss guides, gear setups, DPS calc
- **Maxroll** — não cobre RS3 (foco em OSRS)
- **Reddit r/runescape** — comunidade ativa

## 6. Viabilidade Técnica

| Critério | Avaliação |
|---|---|
| API pública oficial | ✅ Jagex GE API |
| API real-time comunitária | ✅ Wiki API (mas cobertura menor que OSRS) |
| API histórico | ✅ WeirdGloop |
| Dados suficientes | ✅ Sim |
| Dificuldade | 🟢 Baixa (mesma arquitetura do OSRS) |

### Mapeamento Albion → RS3
Mesmo do OSRS: preços GE (global, sem cidades), flipping (margin trading), money making calculators, Bond price tracker. Sem arbitragem geográfica, sem Black Market.

## 7. Viabilidade de Negócio (Ads)

| Fator | Avaliação |
|---|---|
| Tamanho do público | 🟡 Pequeno (~17-21K concurrent vs ~148K OSRS) |
| Tendência | 📉 Declínio lento |
| Concorrência | 🟢 Baixa (sites focam em OSRS) |
| Espaço para novo site | 🟢 Médio-alto (gap de ferramenta RS3-específica) |
| Potencial de tráfego | 🟡 Baixo-médio |

### Análise
- **Problema fundamental**: player base de RS3 é ~8x menor que OSRS. Mesmo com menos concorrência, o teto de tráfego é baixo.
- **Oportunidade**: sites existentes tratam RS3 como cidadão de segunda classe. Um site RS3-first poderia capturar a comunidade leal.
- **Risco**: audiência pequena = receita de ads limitada. Dificilmente sustenta projeto sozinho.

## 8. Recomendação Final

### ⚠️ GO com ressalvas (apenas como complemento ao OSRS)

**Justificativa**: RS3 tem o mesmo ecossistema de APIs excelente do OSRS (Jagex + Wiki + WeirdGloop), mesma economia de Grand Exchange com flipping, e MENOR concorrência (sites focam em OSRS). Tecnicamente trivial de implementar se já fizer o OSRS — pode ser uma "segunda aba" do mesmo site.

**Ressalvas**:
1. Player base ~8x menor que OSRS (~17-21K vs ~148K concurrent) — não sustenta projeto standalone.
2. Cobertura de dados real-time pode ser menor (menos contributors que RuneLite/OSRS).
3. Tendência de declínio lento.

**Estratégia recomendada**: NÃO fazer RS3 como projeto standalone. Fazer **OSRS + RS3 no mesmo site** (como GrandExchange.com faz) — OSRS traz o tráfego, RS3 é diferencial. A API é a mesma (só trocar `/osrs` por `/rs` nos endpoints), esforço marginal.

**Se fizer OSRS, RS3 sai de graça** — adicione como segunda aba.
