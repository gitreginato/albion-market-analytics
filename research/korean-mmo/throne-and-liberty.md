# Throne and Liberty — Relatório de Análise de Mercado

> Análise de viabilidade para replicar o modelo "Albion Online Market Analyzer" em Throne and Liberty

---

## 1. Visão Geral do Jogo

| Atributo | Detalhe |
|---|---|
| **Gênero** | MMORPG de ação (open-world, PvP/RvR, PvE dungeons) |
| **Desenvolvedora** | NCSoft |
| **Publisher ocidental** | Amazon Games |
| **Modelo** | F2P (Free-to-Play) + Battle Pass + Lucent (premium currency) |
| **Plataformas** | PC (Steam), PS5, Xbox Series X/S |
| **Região** | Global (servidores regionais: NA, EU, SA, Asia) |
| **Lançamento ocidental** | 1 de outubro de 2024 |
| **Lançamento coreano** | dezembro de 2023 |

### Player Base (2025/2026)

- **Steam**: ~4.000–6.000 jogadores concurrent médios (junho 2026), pico de ~7.000–10.000
- **Pico histórico Steam**: 333.393 (outubro 2024, lançamento)
- **Declínio severíssimo**: de 155.000 avg (outubro 2024) para ~4.000 (junho 2026) — **queda de 97%**
- **Estimativa total (incl. console + launcher)**: ~52.000–56.000 jogadores ativos mensais (mmo-population.com)
- **Reviews Steam**: 67% positivas (68.148 reviews) — "Mixed"
- **Cross-platform**: PC + PS5 + Xbox — player base total é maior que só Steam

> **Nota crítica**: Throne and Liberty teve o **maior declínio populacional** dos 5 jogos analisados. Perdeu 97% da base Steam em ~20 meses. O jogo ainda é suportado pela Amazon/NCSoft mas a retenção é muito baixa.

---

## 2. Economia do Jogo

### Auction House

Throne and Liberty possui um **Auction House** que funciona como o hub da economia player-driven.

#### Como funciona

- **Acesso**: desbloqueado no **level 40** (feature endgame)
- **Moeda**: **Lucent** (moeda premium, NÃO Sollant/gold)
- **Lucent** pode ser:
  - Comprado com dinheiro real (cash shop)
  - **Ganhado vendendo itens no Auction House** — F2P players podem ganhar premium currency
- **Listagem**: gratuita — não há fee para listar itens
- **Taxa dupla**:
  1. **System tax**: porcentagem fixa removida de cada transação
  2. **Castle tax**: guild que controla o Castle define taxa adicional (dentro de um range)
- **Restrições de itens**:
  - Apenas **base level gear** pode ser listado (sem upgrades/traits unlocked)
  - Gear de instanced content (Co-op Dungeons, Guild Raids) **não pode** ser listado
  - Itens craftados têm 10% de chance de "Great Success" → se tornam tradeable
  - Traits e Litographs podem ser extraídos para venda

#### Moedas

| Moeda | Função |
|---|---|
| **Lucent** | Premium currency, usada no Auction House (comprável com real money OU ganha vendendo) |
| **Sollant** | Moeda de gameplay (gold equivalente) — NÃO usada no AH |
| **Crystals** | Event currency (Twitch drops, etc.) |

### Arbitragem

- **Arbitragem entre servidores**: ✅ **SIM** — Lucent é compartilhado entre servidores da conta. Você pode vender em um servidor e comprar em outro.
- **Cross-server price comparison**: significativo — preços podem variar entre servidores
- **Flipping**: limitado pela restrição de itens tradeable (só base level gear, sem upgrades)
- **Crafting arbitrage**: comprar materiais, craftar com Great Success (10% chance), vender

> **Comparação com Albion**: T&L tem arbitragem **entre servidores** (similar à arbitragem entre cidades do Albion), mas com restrições severas de quais itens podem ser tradeados.

---

## 3. API Pública ou Fonte de Dados

### ⚠️ API interna não-oficial (TLDB)

Não há API oficial da NCSoft/Amazon. Mas o site **TLDB.info** expõe endpoints internos que podem ser consumidos.

#### TLDB Internal API

- **URL base**: `https://tldb.info/api/`
- **Documentação**: `https://tldb.info/internal-docs`
- **Status**: não-oficial, "for personal projects, no official support"

| Endpoint | URL | Função |
|---|---|---|
| Auction House data | `tldb.info/auction-house/__data.json` | Dados do AH em formato SvelteKit (devalue.unflatten) |
| AH Prices | `tldb.info/api/ah/prices` | Preços do AH por servidor (JSON comprimido) |
| Items/Traits | (via __data.json) | Metadata de itens e traits |

**Formato**: os dados vêm comprimidos e no formato SvelteKit (`devalue.unflatten`). Requer parsing específico.

### Discord Bot (PriceHunter)

- **PriceHunter Bot** (top.gg): bot Discord que consulta `tldb.info` em tempo real
- Comandos: `/price`, `/compare` (entre servidores), `/top` (ranking), `/category`
- Dados em tempo real obtidos diretamente de tldb.info
- **Prova de conceito**: os dados do AH são acessíveis via TLDB

### GamesLantern Marketplace

- **URL**: `throneandliberty.gameslantern.com/marketplace`
- **Status**: "WORK IN PROGRESS"
- Tentativa de marketplace data tracker, mas incompleto

> **Conclusão técnica**: Há uma fonte de dados **não-oficial** (TLDB) que expõe preços do Auction House. É acessível mas: (1) não é API REST limpa — dados em formato SvelteKit comprimido, (2) não há documentação oficial, (3) pode mudar a qualquer momento. É viável mas frágil.

---

## 4. Sites Concorrentes (Análise de Mercado)

| Site | URL | O que oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **TLDB.info** | tldb.info | Database completo: itens, auction house, codex, crafting, contracts, skills | Ads + Discord | Referência #1, AH prices ao vivo, atualizado por patch | É database, não ferramenta de análise de mercado |
| **GamesLantern** | throneandliberty.gameslantern.com | Marketplace data, guides | Ads | Multi-jogo, tenta cobrir mercado | Marketplace "WORK IN PROGRESS", incompleto |
| **PriceHunter Bot** | Discord Bot | Preços AH em tempo real, compare entre servidores | Gratuito | Real-time, cross-server compare | Discord bot apenas, não é site |

### Análise competitiva

- **TLDB.info** é a referência #1 — tem database + AH prices, mas **não é ferramenta de análise** (sem flip finder, sem profit calculator, sem opportunity scanner)
- **GamesLantern** tenta mas é "work in progress"
- **Vácuo enorme**: nenhum site oferece análise estatística de mercado (margins, trends, opportunities, crafting profit)
- **PriceHunter Bot** prova que os dados são acessíveis e há demanda

---

## 5. Sites de Builds/Dicas Já Existentes

- **TLDB.info** — Database #1: itens, crafting recipes, contracts, skills, codex. Atualizado por patch.
- **Maxroll.gg/throne-and-liberty** — Tier lists, build guides, progression guides
- **GamesLantern** (throneandliberty.gameslantern.com) — Guias gerais, auction house guide, marketplace data
- **DotEsports** (dotesports.com) — Guias de dungeon, auction house, progression
- **Reddit r/ThroneAndLiberty** — Comunidade (~50k membros), em declínio

> **Nota**: O ecossistema de guides é **jovem e pouco consolidado** (jogo lançou em out/2024). Há espaço para conteúdo de qualidade.

---

## 6. Viabilidade Técnica

| Critério | Avaliação | Detalhe |
|---|---|---|
| **API pública oficial** | ❌ Não | NCSoft/Amazon não fornece API |
| **API comunitária** | 🟡 Frágil | TLDB expõe endpoints internos (formato SvelteKit) |
| **Dados suficientes para análise** | 🟡 Parcial | Preços do AH por servidor, mas parsing complexo |
| **Similaridade com Albion Data Project** | 🔴 Baixa | Dados em formato não-REST, não documentados |
| **Dificuldade de implementação** | 🟡 Média-Alta | Parsing de dados comprimidos SvelteKit |
| **Multi-servidor** | ✅ Sim | Preços por servidor, cross-server compare |

### Arquitetura proposta

```
TLDB API (tldb.info/api/ah/prices) — não-oficial
    ↓
Next.js API Routes (fetch + decompress + parse SvelteKit format)
    ↓
SQLite (snapshots por servidor, histórico, opportunities)
    ↓
Frontend (Next.js + TypeScript)
  - Cross-server price comparison (arbitragem entre servidores)
  - Price history charts
  - Crafting profit calculator (comprar mats → craft → Great Success → vender)
  - Opportunity scanner (price drops, trending)
  - Trait extraction profit calculator
```

### Desafios técnicos

1. **API não-oficial e frágil**: TLDB pode mudar formato, bloquear acesso, ou descontinuar a qualquer momento. Sem SLA.
2. **Formato SvelteKit comprimido**: os dados vêm em `devalue.unflatten` + compressão — não é JSON REST limpo. Requer parsing específico.
3. **Sem documentação oficial**: "we do not provide official support" — qualquer mudança quebra o scraper.
4. **Restrições de itens tradeable**: só base level gear, sem upgrades — limita o escopo de análise.
5. **Jogo jovem em declínio**: patches frequentes podem mudar economia drasticamente.

---

## 7. Viabilidade de Negócio (Ads)

| Fator | Avaliação |
|---|---|
| **Tamanho do público** | 🔴 Pequeno e encolhendo (~4-6k Steam, ~52k total) |
| **Tendência** | 🔴🔴 Declínio severo (-97% desde lançamento) |
| **Concorrência** | 🟢 Baixa (TLDB é database, não ferramenta de análise) |
| **Espaço para novo site** | ✅ Grande — vácuo em análise de mercado |
| **Potencial de tráfego** | 🔴 Baixo — player base encolhendo rapidamente |
| **Engajamento da comunidade** | 🟡 Médio — comunidade jovem mas frustrada |

### Análise

- Player base caiu **97%** desde o lançamento (out/2024 → jun/2026)
- ~4-6k concurrent Steam é **insuficiente** para monetização significativa com ads
- Cross-platform (PS5/Xbox) amplia o total para ~52k, mas ainda é pequeno
- **Vácuo competitivo é real** — nenhum site faz análise de mercado estatística
- Mas o **risco de o jogo "morrer"** é alto — investir tempo em um jogo em declínio de 97% é arriscado
- A economia é interessante (arbitragem entre servidores, Lucent premium) mas o público é pequeno demais

---

## 8. Recomendação Final

# 🔴 NO-GO (reavaliar se o jogo se estabilizar)

### Justificativa

1. **Declínio populacional de 97%**: de 155k para 4k concurrent em 20 meses. O jogo pode não ter futuro suficiente para justificar o investimento de tempo.

2. **API frágil e não-oficial**: TLDB expõe dados mas em formato complexo (SvelteKit comprimido), sem documentação oficial, sem SLA. Pode quebrar a qualquer momento. É mais frágil que Arsha.io (BDO).

3. **Player base insuficiente para ads**: ~4-6k concurrent Steam, ~52k total. Mesmo com cross-platform, é o segundo menor público dos 5 jogos (acima apenas de Lost Ark ocidental).

4. **Jogo jovem em risco**: lançado em out/2024, já perdeu 97% da base. NCSoft/Amazon podem reduzir suporte se a tendência continuar.

5. **Restrições de trading**: só base level gear tradeable, sem upgrades — limita severamente o escopo de análise de mercado.

### Quando reavaliar

- Se o jogo se estabilizar em >15-20k concurrent (após um major update/expansion)
- Se NCSoft/Amazon lançar uma API oficial
- Se a comunidade crescer e se estabelecer (não apenas pico de lançamento)

> **Resumo**: Throne and Liberty tem o segundo pior cenário dos 5 jogos (à frente apenas de Lost Ark). O vácuo competitivo é real, mas o risco de o jogo "morrer" combinado com a API frágil torna o investimento arriscado. Melhor esperar e reavaliar.
