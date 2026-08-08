# Path of Exile 2 (PoE2) — Relatório de Mercado

## 1. Visão Geral do Jogo

| Atributo | Detalhe |
|---|---|
| **Gênero** | Action RPG (ARPG) isométrico, hack-and-slash |
| **Desenvolvedora** | Grinding Gear Games (GGG), Nova Zelândia |
| **Modelo** | B2P durante Early Access (£25 / ~$30); **F2P no lançamento 1.0** (previsto 2026) |
| **Plataformas** | PC (Steam + standalone), Xbox, PlayStation |
| **Região** | Global |
| **Status** | Early Access desde 6 dez 2024; 1.0 alvo em 2026 |

### Player Base (2025/2026)
- **Pico histórico Early Access**: 578.562 concurrent (Steam, dez/2024). GGG reporta 800k-900k concurrent cross-platform no lançamento.
- **Pico recente**: 421.000 concurrent (Steam, jun/2026 — update "Return of the Ancients" + free weekend).
- **Média mensal Steam (2026)**: varia de ~6.800 (entre updates) a ~150.000 (pico de update). Sazonalidade similar a PoE1 mas mais volátil (EA).
- **Estimativa de cópias vendidas**: milhões (GGG chamou de "biggest release ever" da empresa).
- **Trajetória**: GGG prevê que 1.0 (F2P) será ainda maior que o Early Access. Padrão: pico no update → queda → recuperação a partir de 0.3+.
- **Conclusão**: player base massiva e em crescimento. Quando virar F2P, deve explodir.

## 2. Economia do Jogo

- **Marketplace**: mesmo modelo de PoE1 — trade via site oficial, **sem auction house in-game**, "whisper-and-wait".
- **Moedas**: Divine Orb e Chaos Orb como principais. Exalted Orb também relevante. Economia baseada em currency items.
- **Player-driven?** Sim, 100%.
- **Arbitragem**: existe currency exchange, arbitragem entre tipos de currency.
- **Volatilidade**: economia ainda em formação (Early Access). Valores mudam drasticamente entre patches (balance changes, novas classes, resets de liga).
- **Classes atuais (abr/2026)**: 8 classes (2 ascendancies cada). Meta 1.0: 12 classes.
- **Reset por liga/patch**: similar a PoE1, resets periódicos criam janelas de oportunidade.

## 3. API Pública / Fonte de Dados

### API Oficial (GGG)
- **Developer Docs**: https://www.pathofexile.com/developer/docs/reference
- **Nota importante**: "There are currently limited APIs that return PoE2 game information." — a GGG está expandindo gradualmente.
- **Server endpoint**: `https://api.pathofexile.com`
- **Autenticação**: OAuth 2.1 (mesmo sistema de PoE1, registro manual via oauth@grindinggear.com)
- **Scopes**: mesmos de PoE1 (`service:psapi`, `service:cxapi`, etc.)
- **Trade API PoE2**: `https://www.pathofexile.com/api/trade2/search/{league}` (endpoint PoE2)
- **Passive Skill Tree URLs PoE2**: `https://pathofexile2.com/game/passive-skill-tree/{base64}`

### API Comunitária — poe.ninja (PoE2)
- poe.ninja **suporta PoE2** com toggle de versão no topo do site.
- **Cobertura PoE2 (2026)**:
  - Currency Exchange (normalizado contra Chaos, Divine, Exalted)
  - Unique items em 8 categorias: Weapons, Armours, Accessories, Flasks, Charms, Jewels, Maps, Sanctum Relics
  - Skill Gems (vários níveis/qualidade)
  - Fragments e endgame access items
- **Endpoints**: mesmo padrão `https://poe.ninja/api/data/{type}?league={POE2_LEAGUE}`
- **Fonte de dados**: Currency Exchange + Official Trade API (não Public Stash API ainda — PoE2 usa abordagem diferente)

### Rate Limits
- Mesmos rate limits da PoE1 Trade API (5/12s, 15/62s, 30/302s para search).
- POESESSID melhora limits.

### Equivalente ao Albion Online Data Project?
- **Sim**: poe.ninja já cobre PoE2. O ecossistema está se desenvolvendo junto com o jogo.

## 4. Sites Concorrentes (Análise de Mercado)

| Site | URL | O que oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **poe.ninja** (PoE2) | https://poe.ninja | Economy tracker PoE2, builds, currency | AdSense | Primeiro a cobrir PoE2, dados em tempo real | Cobertura ainda limitada vs PoE1 (EA) |
| **pathofexile2.com/trade** | https://www.pathofexile2.com/trade | Trade oficial PoE2 | N/A (oficial) | Fonte primária | Sem agregação, sem histórico |
| **poedb.tw** (PoE2) | https://poedb.tw | Database PoE2 (itens, skills) | Ads | Tráfego alto | Database, não market analysis |
| **Maxroll.gg/poe2** | https://maxroll.gg/poe2 | Builds, guides PoE2 | Ads | Marca forte, conteúdo cedo | Foco em builds, não em market data |

### Observação crítica
O mercado de ferramentas PoE2 está **menos saturado** que PoE1. Há espaço real para novos sites, especialmente em análise de mercado — poe.ninja cobre o básico mas o nicho de "trading com UX simples + oportunidades" está aberto.

## 5. Sites de Builds/Dicas

| Site | URL | Foco |
|---|---|---|
| **Maxroll.gg/poe2** | https://maxroll.gg/poe2 | Builds, tier lists, guides |
| **PoE Vault** | https://www.poe-vault.com | Builds e guides (cobrindo PoE2) |
| **poedb.tw** | https://poedb.tw | Database técnico |
| **pobb.in** | https://pobb.in | Compartilhamento de builds (PoB2 em desenvolvimento) |
| **YouTube/Reddit** | r/PathOfExile2 | Comunidade ativa, builds compartilhados |

## 6. Viabilidade Técnica

- **Possível construir site similar ao Albion?** **Sim, e com vantagem competitiva maior que PoE1.**
- **Dados suficientes?** Sim, via poe.ninja API (PoE2) e Trade API oficial. Menos categorias que PoE1 (EA), mas crescendo.
- **Stack compatível**: Next.js + TypeScript + SQLite — perfeito.
- **Desafios**:
  - API oficial PoE2 ainda "limited" — algumas endpoints podem não existir ainda.
  - Economia volátil (EA) — preços mudam rápido entre patches.
  - Nomes de liga e categorias de itens mudam com cada update.
  - OAuth com GGG mesmo gargalo de PoE1.
- **Oportunidade técnica**: **menor concorrência que PoE1**. Ser "o primeiro site de análise de mercado PoE2 com UX moderna" é uma posição defendível. Janela de oportunidade aberta enquanto o jogo está em EA.

## 7. Viabilidade de Negócio (Ads)

- **Tamanho do público**: enorme e crescendo. 421k concurrent no pico. Quando virar F2P, deve multiplicar.
- **Concorrência**: **baixa-moderada**. poe.ninja domina mas o nicho de market analysis avançada está aberto.
- **Tráfego potencial**: altíssimo. PoE2 é um dos jogos mais jogados do Steam. Keywords SEO: "poe 2 currency", "poe 2 trade", "poe 2 prices".
- **Sazonalidade**: picos em cada update/patch. Quando 1.0 F2P lançar, tráfego deve explodir.
- **Timing**: **agora é o momento ideal** — construir durante EA, estar pronto para o lançamento 1.0 F2P.

## 8. Recomendação Final

### **GO** (forte)

**Justificativa**: PoE2 é a **melhor oportunidade** entre os 5 jogos analisados. Combina: player base massiva e em crescimento, economia player-driven, APIs disponíveis (poe.ninja + oficial), **baixa concorrência em market analysis** (vs PoE1), e um catalisador futuro (lançamento F2P 1.0 em 2026 que deve multiplicar o público).

**Ressalvas**:
1. API oficial PoE2 ainda limitada — comece com poe.ninja API.
2. Economia volátil (EA) — precisa de atualizações frequentes e arquitetura flexível.
3. Janela de oportunidade é agora — quanto mais esperar, mais concorrentes surgem.

**Estratégia sugerida**: Construir durante o Early Access consumindo poe.ninja API. Foco em: currency arbitrage, scanner de oportunidades, price history, build guides. Estar plenamente operacional e com SEO estabelecido antes do lançamento 1.0 F2P. O "first-mover advantage" em market analysis PoE2 é real e valioso.
