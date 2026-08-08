# Path of Exile 1 (PoE1) — Relatório de Mercado

## 1. Visão Geral do Jogo

| Atributo | Detalhe |
|---|---|
| **Gênero** | Action RPG (ARPG) isométrico, hack-and-slash |
| **Desenvolvedora** | Grinding Gear Games (GGG), Nova Zelândia |
| **Modelo** | Free-to-Play (microtransações cosméticas only, não P2W) |
| **Plataformas** | PC (Steam + standalone), Xbox, PlayStation |
| **Região** | Global (servidores: NA, EU, APAC) |
| **Lançamento** | 2013 (open beta), 2013 (release oficial) |

### Player Base (2025/2026)
- **Steam concurrent**: varia entre ~5.000 (entre ligas) e ~185.000 (pico de liga nova). Pico histórico Steam: ~228.000 (jul/2024).
- **Modelo sazonal**: picos enormes a cada nova liga (~3 meses), seguidos de queda acentuada. Ex: nov/2025 pico ~160k, meses seguintes caem para ~5-10k.
- **Estimativa total de contas**: milhões (raijin.gg estima ~7,1M cópias vendidas base game no Steam). Muitos jogadores usam o launcher standalone (não contabilizados no Steam).
- **MMO-Population** estima ~77k-280k jogadores mensais (modelo "post-seam", jun/2026).
- **Conclusão**: player base enorme e altamente engajada, com ciclos sazonais previsíveis.

## 2. Economia do Jogo

- **Marketplace**: trade via site oficial (pathofexile.com/trade) — **não há auction house in-game**. Compras são "whisper-and-wait": você envia mensagem ao vendedor in-game para completar a transação.
- **Moedas**: economia baseada em currency items (Chaos Orb, Divine Orb como padrão de valor). Não há moeda única — cada currency item tem função de crafting + valor de troca.
- **Taxas**: não há taxa de listagem; o trade é direto item-por-item ou item-por-currency.
- **Player-driven?** Sim, 100%. Preços definidos por listagens dos jogadores.
- **Arbitragem**: existe arbitragem entre currency items (currency exchange), entre ligas, e flippers de itens. O mercado de currency é o mais líquido.
- **Reset por liga**: a cada nova challenge league, a economia reseta do zero — criando janelas de oportunidade enormes para análise de mercado.
- **Friction intencional**: GGG mantém atrito no trade como "feature" (limita automação, combate RMT).

## 3. API Pública / Fonte de Dados

### API Oficial (GGG)
- **Developer Docs**: https://www.pathofexile.com/developer/docs/reference
- **Server endpoint**: `https://api.pathofexile.com`
- **Autenticação**: OAuth 2.1 (registro via email oauth@grindinggear.com — baixa prioridade, aprovação manual)
- **Scopes relevantes**:
  - `service:psapi` — Public Stash API (stream de stash tabs públicas)
  - `service:cxapi` — Currency Exchange API
  - `service:leagues`, `service:leagues:ladder`
- **Trade API** (não-OAuth, baseada em sessão/IP):
  - Search: `https://www.pathofexile.com/api/trade/search/{league}` (POST JSON)
  - Fetch: `https://www.pathofexile.com/api/trade/fetch/{item_ids}?query={id}`
  - Exchange: `https://www.pathofexile.com/api/trade/exchange/{league}`
  - **POESESSID** melhora rate limiting
- **Public Stash Tab API**: `https://www.pathofexile.com/api/public-stash-tabs?id={next_change_id}` — stream paginado de todas as stash tabs públicas listadas. Requer scope `service:psapi`.

### Rate Limits (Trade API)
- `trade-search-request-limit`: 5/12s, 15/62s, 30/302s
- `trade-exchange-request-limit`: 5/17s, 10/92s, 30/302s
- `trade-fetch-request-limit`: 12/6s, 16/14s
- Headers `X-Rate-Limit-*` informam estado. `Retry-After` em caso de bloqueio.
- **Importante**: rate limits são por IP (ou por sessão com POESESSID). Aplicações server-side precisam de proxy/rotação cuidadosa.

### API Comunitária — poe.ninja
- **Swagger**: https://poe.ninja/swagger/index.html
- **Endpoints principais** (formato: `https://poe.ninja/api/data/{type}?league={LEAGUE}`):
  - `currencyoverview?type=Currency` — preços de currency
  - `currencyoverview?type=Fragment` — fragments
  - `itemoverview?type=UniqueWeapon` / `UniqueArmour` / `UniqueAccessory` / `UniqueFlask` / `UniqueJewel` / `UniqueMap`
  - `itemoverview?type=SkillGem` — gems
  - `itemoverview?type=BaseType` — base types
  - `itemoverview?type=DivinationCard` — div cards
  - `itemoverview?type=Scarab`, `Essence`, `Fossil`, `Resonator`, `Oil`, `Incubator`, `Beast`, `Map`
- **Formato**: JSON. Retorna `lines` (preços médios calculados) e `currencyDetails`.
- **Rate limit**: não documentado oficialmente, mas tolerante. Recomenda-se cache agressivo.
- **Como poe.ninja obtém dados**: consome o Public Stash Tab API da GGG, aplica modelo estatístico para remover outliers/price-fixing, e publica preços médios.
- **Docs comunitárias**: https://github.com/ayberkgezer/poe.ninja-API-Document, https://github.com/5k-mirrors/misc-poe-tools/blob/master/doc/poe-ninja-api.md

### Equivalente ao Albion Online Data Project?
- **Sim**: o ecossistema poe.ninja + GGG Public Stash API é o equivalente direto. poe.ninja já faz o trabalho pesado de agregação. Você pode consumir a API do poe.ninja diretamente (mais fácil) ou o stream da GGG (mais difícil, mais dados brutos).

## 4. Sites Concorrentes (Análise de Mercado)

| Site | URL | O que oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **poe.ninja** | https://poe.ninja | Economy tracker (preços currency/itens), build database, ladder, currency calculator | Google AdSense (est. $2.5k/dia) | Padrão da indústria, dados confiáveis, API pública | UI densa, foco em traders avançados |
| **poe.trade** | https://poe.trade | Busca de itens/currency, price check | Ads | Histórico, marca forte | Largamente superseded pelo site oficial e poe.ninja |
| **pathofexile.com/trade** | https://www.pathofexile.com/trade | Trade oficial (search/fetch) | N/A (oficial) | Fonte primária de dados | Sem agregação estatística, sem histórico |
| **poedb.tw** | https://poedb.tw | Database de itens, skills, mechanics, API docs | Ads | Tráfego alto (~27.5k/dia), wiki-style | Mais database que market analysis |
| **wealthyexile.com** | https://wealthyexile.com | Guias de como fazer currency | Ads/afiliados | Nicho de "currency making" | Conteúdo, não ferramenta de dados |
| **craftofexile.com** | https://craftofexile.com | Simulador de crafting com probabilidades | Ads | Único no nicho | Não é market data |

## 5. Sites de Builds/Dicas

| Site | URL | Foco |
|---|---|---|
| **Maxroll.gg/poe** | https://maxroll.gg/poe | Builds, tier lists, guides, PoExchange trading tool |
| **PoE Vault** | https://www.poe-vault.com | Builds, guides, news |
| **poebuilds.cc** | https://www.poebuilds.cc | Coleção de builds |
| **poeplanner.com** | https://www.poeplanner.com | Planejador de passive tree |
| **pobb.in** | https://pobb.in | Compartilhamento de Path of Building builds |
| **poelab.com** | https://poelab.com | Lab layouts diários |
| **Filterblade.xyz** | https://filterblade.xyz | Loot filters (Neversink) |

## 6. Viabilidade Técnica

- **Possível construir site similar ao Albion?** **Sim, e é o caso mais favorável.**
- **Dados suficientes?** Abundantes. A API do poe.ninja já entrega preços médios prontos por categoria. A API oficial da GGG (Public Stash + Trade) dá acesso a dados brutos.
- **Stack compatível**: Next.js + TypeScript + SQLite funciona perfeitamente. A API do poe.ninja retorna JSON limpo.
- **Desafios**:
  - Rate limits da GGG Trade API são apertados (especialmente search). Para agregação, prefira o Public Stash API ou consuma poe.ninja.
  - OAuth registration com a GGG é manual e "low priority" — pode demorar.
  - Necessidade de atualizar a cada nova liga (nomes de liga mudam, novos itens entram).
  - O poe.ninja já é o "gold standard" — competir exige diferencial claro.
- **Oportunidade técnica**: poe.ninja é excelente em dados mas **fraco em UX para traders casuais** e em features de arbitragem/oportunidades. O modelo do Albion Analyzer (scanner de oportunidades persistido, alertas, arbitragem) é um diferencial real.

## 7. Viabilidade de Negócio (Ads)

- **Tamanho do público**: enorme. Picos de liga trazem centenas de milhares de jogadores ativos. Mesmo entre ligas, dezenas de milhares.
- **Concorrência**: alta (poe.ninja é dominante). Mas o nicho de "ferramenta de trading com UX simples + alertas de oportunidade" tem espaço.
- **Tráfego potencial**: poe.ninja tem rank global ~#5.600, est. $2.5k/dia em ads. Um site bem feito pode captar uma fatia.
- **Sazonalidade**: tráfego explode no lançamento de ligas (a cada ~3 meses) e cai depois. Modelo de ads se beneficia desses picos.
- **Palavras-chave SEO**: "poe currency prices", "poe trade", "poe item prices", "poe ninja alternative" — alto volume.

## 8. Recomendação Final

### **GO** (com ressalvas)

**Justificativa**: PoE1 é o melhor caso entre os 5 jogos para replicar o modelo do Albion Online Market Analyzer. A economia é 100% player-driven, existem APIs públicas robustas (oficial GGG + poe.ninja), a player base é enorme e engajada, e há monetização comprovada via ads (poe.ninja fatura ~$2.5k/dia).

**Ressalvas**:
1. poe.ninja é concorrente fortíssimo — é preciso um diferencial claro (UX simplificada, scanner de oportunidades estilo Albion, alertas, arbitragem de currency).
2. Rate limits da GGG exigem arquitetura cuidadosa (cache, proxy, respeitar headers).
3. Sazonalidade extrema: planeje conteúdo/features que funcionem entre ligas (Standard, build guides, dicas).
4. OAuth com a GGG pode ser gargalo — comece consumindo poe.ninja API (não requer auth).

**Estratégia sugerida**: Comece consumindo a API do poe.ninja (sem auth), construa features de arbitragem de currency + scanner de oportunidades + alertas. Diferencie-se do poe.ninja com UX focada em "trader casual" e não em "data scientist".
