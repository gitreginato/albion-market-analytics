# Lost Ark — Relatório de Análise de Mercado

> Análise de viabilidade para replicar o modelo "Albion Online Market Analyzer" em Lost Ark

---

## 1. Visão Geral do Jogo

| Atributo | Detalhe |
|---|---|
| **Gênero** | MMORPG isométrico action-RPG (top-down, estilo Diablo) |
| **Desenvolvedora** | Smilegate RPG |
| **Publisher ocidental** | Amazon Games |
| **Modelo** | F2P (Free-to-Play) com cash shop (Royal Crystals) |
| **Plataformas** | PC (Steam, Windows) — versão ocidental; Coreia tem launcher próprio |
| **Região** | Global (ocidental via Amazon) + Coreia/Japão/Rússia via Smilegate |
| **Lançamento ocidental** | 11 de fevereiro de 2022 |
| **Lançamento coreano** | 4 de dezembro de 2019 |

### Player Base (2025/2026)

- **Steam (ocidental)**: ~5.000–6.000 jogadores concurrent médios (junho 2026), pico de ~12.000
- **Pico histórico Steam**: 1.324.761 (fevereiro 2022, lançamento)
- **Declínio severo**: de ~20.000 avg em 2024 para ~6.000 em 2026 (queda de ~70%)
- **Estimativa total (incl. launcher coreano)**: ~28.000–42.000 jogadores ativos mensais (mmo-population.com)
- **Reviews Steam**: 69% positivas (38.945 reviews) — "Mixed"
- **Avaliação**: comunidade ocidental frustrada com P2W, bots e falta de comunicação da Amazon

> **Nota crítica**: A versão ocidental (Steam/Amazon) NÃO tem API pública. A API oficial existe apenas para a versão coreana.

---

## 2. Economia do Jogo

### Market (Mercado) e Auction House (Leilão)

Lost Ark possui **dois sistemas de trading** distintos:

#### Market (Alt+Y)
- Marketplace para **materiais de crafting, honing, battle items, skins e consumíveis**
- Itens vendidos em stacks (10, 100 unidades)
- **Taxa de 5%** por transação (Transaction Fee Per Item)
- Deposit fee ao listar (devolvido se não vender)
- Período de listagem: 1–3 dias
- Preços definidos pelos jogadores (player-driven)

#### Auction House (Leilão)
- Para **equipamentos (armas, armaduras, acessórios, ability stones, gems)**
- Sistema de **Pheons**: moeda especial necessária para comprar gear no auction house
- Pheons são comprados com Blue Crystals (que podem ser comprados com gold ou real money)
- **Pheon tax** funciona como barreira anti-flipping/anti-bot
- Preços em **Gold** (moeda principal do jogo)

### Moedas

| Moeda | Função |
|---|---|
| **Gold** | Moeda principal de trading entre jogadores |
| **Silver** | Moeda para NPC transactions, honing, viagens |
| **Blue Crystals** | Premium, comprados com gold ou Royal Crystals |
| **Royal Crystals** | Cash shop (real money) |
| **Pheons** | Tax para gear trading no auction house |

### Arbitragem

- **Arbitragem limitada**: o sistema de Pheons torna flipping de gear inviável (custo de Pheon > margem)
- **Flipping de materiais** no Market é possível mas com tax de 5%
- **Currency exchange**: Gold ↔ Blue Crystals (taxa flutuante, player-driven) — há arbitragem aqui
- **Cross-region arbitrage**: NÃO existe (mercados regionais separados)

---

## 3. API Pública ou Fonte de Dados

### ❌ Versão Ocidental (Amazon/Steam): SEM API pública

- **Não existe API oficial** para a versão ocidental de Lost Ark
- Comunidade tenta scraping, mas é **instável e contra ToS**
- Projetos comunitários como **LAMAPI** (lamapi.vercel.app) fazem coleta automatizada de dados para servidores Central Europe, mas são não-oficiais e instáveis

### ✅ Versão Coreana: API oficial (Lostark OpenAPI)

- **URL**: `https://developer.lostark.game.onstove.com/`
- **Documentação**: `https://developer.lostark.co.kr/usage-guide`
- Requer **JWT token** (conta coreana necessária)
- Endpoints disponíveis:
  - `POST /markets/items` — buscar itens do mercado
  - `GET /markets/options` — opções de categorias
  - `POST /auctions/items` — buscar itens do auction
  - `GET /auctions/options` — opções do auction
  - `GET /news/events` — eventos
- **Limitação**: 100 requests por segundo, 10 itens por página
- **Problema**: requer conta coreana (CPF coreano ou conta Steam coreana)

### Projetos comunitários de dados

| Projeto | URL | Método | Status |
|---|---|---|---|
| **LostArk Market Online** | github.com/Lost-Ark-Market-Online | OCR de screenshots do jogo | Ativo (comunidade) |
| **LAMAPI** | lamapi.vercel.app | Coleta automatizada não-oficial | Ativo, limitado |
| **LoAuction** | augusstt-note.gitbook.io/loauction | App que usa API coreana | Coreano apenas |

> **Conclusão técnica**: Para a versão ocidental, **não há fonte de dados confiável e sustentável**. A única API oficial é coreana e inacessível sem conta coreana.

---

## 4. Sites Concorrentes (Análise de Mercado)

### Sites de Mercado

| Site | URL | O que oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **LAMAPI** | lamapi.vercel.app | Live charts de preços CE, histórico | Não claro (gratuito) | Único com dados live ocidentais | Não-oficial, instável, só CE |
| **LostArk Market Online** | lostarkmarket.online | Preços de mercado via OCR comunitário | Não claro | Dados ocidentais | Depende de contribuição manual, dados incompletos |

### Sites de Builds/Dicas

| Site | URL | O que oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **Maxroll.gg (Lost Ark)** | maxroll.gg/lost-ark | Builds, tier lists, guides de progression, resources | Ads + patrocínios | Referência #1 da comunidade, atualizado | Não tem análise de mercado |
| **Lost Ark Codex** | lostarkcodex.com | Database de itens, skill builder, craft recipes | Ads | Multi-idioma, atualizado frequentemente | Sem dados de preços de mercado |
| **Lost Ark HQ** | lostarkhq.com | Database, calculadoras | Ads | Interface limpa | Comunidade menor |

---

## 5. Sites de Builds/Dicas Já Existentes

- **Maxroll.gg/lost-ark** — O principal. Builds por classe, tier lists PvE/PvP, guides de progression, honing calculator. Atualizado por jogadores de alto nível.
- **Lost Ark Codex** (lostarkcodex.com) — Database completo de itens, skill builder interativo, craft recipes. Multi-idioma (EN, DE, FR, ES, RU, KR).
- **Lost Ark HQ** — Database alternativo com calculadoras.
- **Reddit r/lostark** — Comunidade ativa (~300k membros), mas em declínio.

---

## 6. Viabilidade Técnica

| Critério | Avaliação | Detalhe |
|---|---|---|
| **API pública oficial (ocidental)** | ❌ Não existe | Amazon não fornece API |
| **API comunitária confiável** | ❌ Instável | LAMAPI e OCR são frágeis |
| **API coreana** | ✅ Existe | Mas requer conta coreana, inacessível |
| **Dados suficientes para análise** | ❌ Insuficiente | Sem feed confiável de preços |
| **Similaridade com Albion Data Project** | ❌ Baixa | Albion tem API pública robusta; Lost Ark não |
| **Dificuldade de scraping** | 🔴 Alta | Cliente de jogo, não web; OCR necessário |

### Veredito técnico

**INVÁVELL tecnicamente** para a versão ocidental. O modelo do Albion Market Analyzer depende fundamentalmente de uma API pública confiável (Albion Online Data Project). Lost Ark ocidental **não oferece isso**. As alternativas (OCR de screenshots, scraping não-oficial) são:

1. Instáveis (quebram a cada update)
2. Incompletas (dependem de contribuição manual)
3. Potencialmente contra ToS (risco de banimento/C&D)

A API coreana é funcional, mas o público-alvo para um site em pt-BR seria o jogador ocidental, que usa servidores diferentes com economia diferente.

---

## 7. Viabilidade de Negócio (Ads)

| Fator | Avaliação |
|---|---|
| **Tamanho do público** | 🔴 Pequeno e em declínio (~6k concurrent Steam) |
| **Tendência** | 🔴 Queda contínua (-70% em 2 anos) |
| **Concorrência** | 🟡 Maxroll domina guides; LAMAPI é único em mercado |
| **Espaço para novo site** | 🟡 Há espaço em análise de mercado, mas sem dados... |
| **Potencial de tráfego** | 🔴 Baixo — player base encolhendo |
| **Engajamento da comunidade** | 🟡 Reddit ativo mas frustrado com jogo |

### Análise

- Player base caiu de ~20k (2024) para ~6k (2026) — **público insuficiente** para monetização significativa com ads
- Mesmo que houvesse API, o tráfego seria limitado
- Maxroll já captura o público de guides/builds eficientemente
- O espaço de "análise de mercado" existe mas é **intransponível sem dados**

---

## 8. Recomendação Final

# 🔴 NO-GO

### Justificativa

1. **Bloqueio técnico fatal**: Não existe API pública para a versão ocidental. O modelo do Albion Analyzer é 100% dependente de feed de dados público. Sem isso, não há produto.

2. **Player base em colapso**: ~6k concurrent players é insuficiente para gerar tráfego significativo. O jogo perdeu 70% da base em 2 anos e continua caindo.

3. **API coreana inacessível**: Existe uma API oficial, mas é restrita à versão coreana (requer conta coreana com CPF). Não serve para público ocidental/lusófono.

4. **Concorrência consolidada**: Maxroll domina o espaço de guides/builds. O único espaço livre (análise de mercado) é exatamente o que não é viável sem dados.

5. **Risco de ToS**: Scraping/OCR não-oficial pode violar termos de serviço, com risco de cease & desist.

> **Resumo**: Lost Ark é o **pior candidato** dos 5 jogos analisados para replicar o modelo Albion. Falta o elemento mais fundamental — uma fonte de dados pública e confiável.
