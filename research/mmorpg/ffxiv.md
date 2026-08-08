# Final Fantasy XIV (FFXIV) — Relatório de Mercado

> Categoria: MMORPG | Modelo: B2P (compra box) + subscription + expansion
> Data da pesquisa: Julho 2025

## 1. Visão Geral

- **Desenvolvedora**: Square Enix
- **Lançamento**: 2010 (1.0) / 2013 (A Realm Reborn) — expansão atual: Dawntrail (7.0, jul/2024)
- **Plataformas**: PC, PS5, PS4, Xbox Series X|S, Mac
- **Região**: Global (JP, NA, EU, OC datacenters)
- **Player base estimada (2025)**:
  - Steam: ~20K avg, ~34K peak (jun/2026) — mas Steam é fração minoritária (maioria joga pelo launcher próprio).
  - Active characters (Lucky Bancho census): ~880K-990K (mar/2025, abaixo de 1M pela 1ª vez em 4 anos). Pico Endwalker: ~1.5M+.
  - Tendência: declínio pós-Dawntrail (expansão mal recebida), mas recuperando (+110K em 3 meses conforme GamesRadar).
- **Modelo**: assinatura mensal + compra base + expansão a cada ~2 anos.

## 2. Economia do Jogo

- **Market Board (MB)**: por servidor (world), não regional. Cada world tem seu próprio MB.
- **Moeda**: Gil. Sem token conversível (não há RMT oficial como WoW Token).
- **Taxas**: 5% sales tax (reduzida com Retainer Ventures/benefícios).
- **Arbitragem**: SIM — entre worlds (cross-world travel habilitado desde 5.0), entre datacenters, buy/sell flipping.
- **Player-driven**: SIM, mas mais fragmentado que WoW (sem AH regional unificada).
- **Retainers**: cada jogador tem NPCs (retainers) que vendem itens no MB — limite de slots.

## 3. API Pública / Fontes de Dados

### ⚠️ NÃO HÁ API OFICIAL da Square Enix para o Market Board.

### Universalis (crowdsourced)
- **Site**: `https://universalis.app/`
- **API**: `https://universalis.app/api/v2/...` (docs em `/docs`)
- **GitHub**: `Universalis-FFXIV/Universalis` (C#, 208 stars) + `mogboard-next` (frontend)
- **Mecanismo**: dados crowdsourced via **ACT plugin** (`goaaats/universalis_act_plugin`) — players instalam o plugin do Advanced Combat Tracker que escuta o tráfego de rede quando o jogador abre o Market Board e envia os dados para o Universalis.
- **Cobertura**: depende de players ativos com o plugin em cada world. Worlds menos populosos têm dados esparços.
- **Frontend**: Mogboard (`universalis.app`) — rewrite do mogboard original de Vekien.

### Outras fontes
- **XIVAPI** (`xivapi.com`) — API de dados estáticos (itens, recipes, icons), NÃO de preços.
- **Teamcraft** (`ffxivteamcraft.com`) — crafting/gathering, usa XIVAPI + Universalis.
- **Lodestone API** (não oficial) — character profiles.

## 4. Sites Concorrentes (Mercado)

| Site | URL | Oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| Universalis | universalis.app | MB prices, histórico, alerts, lists | Discord login + membership | Único agregador sério, open-source | UX datada, dados esparços em worlds pequenos |
| Mogboard | (integrado ao Universalis) | Frontend do Universalis | — | — | — |
| Teamcraft | ffxivteamcraft.com | Crafting, recipes, listas | Patreon | Excelente para crafters | Não é focado em flipping |

## 5. Sites de Builds/Dicas

| Site | Notas |
|---|---|
| **The Balance** (thebalanceffxiv.com) | Discord + guides, comunidade de endgame |
| **Icy Veins** (icy-veins.com/ffxiv) | Build guides |
| **FFXIV Wiki** | Database |
| **Teamcraft** | Crafting/gathering |
| **MTQ Capture** | Quest guides |

> FFXIV tem menos cultura de "build guides" que WoW (jobs são mais fixos), mas tem forte cultura de crafting/gathering (Teamcraft domina).

## 6. Viabilidade Técnica

- **API**: NÃO oficial. Universalis é a única fonte, dependente de crowdsourcing via ACT plugin.
- **Desafios**:
  - Sem API oficial = dependência de terceiros (Universalis). Se Universalis sair do ar, sem alternativa.
  - Dados desiguais entre worlds (plugin precisa de players ativos).
  - ACT plugin é Windows-centric e tecnicamente contra ToS da SE (tolerado mas não endossado).
  - Não há como garantir frescor de dados em worlds pequenos.
- **Stack**: mesma do Albion funciona (proxy + SQLite), mas consumindo Universalis em vez de API oficial.
- **Diferenciação possível**: melhor UX que Mogboard, alertas, scanner de arbitragem cross-world (gap não explorado pelo Universalis).

## 7. Viabilidade de Negócio (Ads)

- **Público**: ~880K-990K active chars + audiência casual maior. Steam ~20K mas launcher próprio domina.
- **Concorrência**: BAIXA-MODERADA em mercado (Universalis é o único player sério, open-source, UX datada).
- **Espaço para novo site**: MODERADO. Universalis é funcional mas não tem UX moderna nem features de arbitragem automatizada. Mogboard é minimalista.
- **Potencial de tráfego**: médio. FFXIV tem base leal mas menor que WoW.
- **Risco**: dependência do Universalis como fonte. Se construir em cima dele e ele sair do ar, perde tudo. Alternativa: contribuir para o Universalis (open-source) e construir frontend próprio.

## 8. Recomendação Final

### ⚠️ GO com ressalvas

**Justificativa**: FFXIV tem economia player-driven real com arbitragem cross-world, e a concorrência em sites de mercado é BAIXA (Universalis é o único, open-source, UX datada). Há espaço claro para um site com UX moderna + scanner de oportunidades (exatamente o que o projeto Albion faz). PORÉM, dependência do Universalis (crowdsourced, sem API oficial) é risco significativo — dados podem ser esparços e o projeto pode ser descontinuado.

**Estratégia recomendada**: em vez de competir com Universalis, consumir a API dele e focar em UX + análise de arbitragem. Ou contribuir para o ecossistema Universalis. Não tentar recriar a coleta de dados (impossível sem ACT plugin próprio).

**Risco principal**: SE tolerar a dependência do Universalis, é um dos melhores jogos para replicar o modelo Albion. Se não, NO-GO.
