# EVE Online — Relatório de Mercado

## 1. Visão Geral do Jogo

| Atributo | Detalhe |
|---|---|
| **Gênero** | Sandbox MMO sci-fi, espaço, PvP/PvE aberto |
| **Desenvolvedora** | CCP Games, Islândia |
| **Modelo** | Free-to-Play (Alpha clones, limitados) + subscrição (Omega clones, acesso total) |
| **Plataformas** | PC (Windows, macOS, Linux) |
| **Região** | Global (servidor único: Tranquility) |
| **Lançamento** | 2003 (22+ anos no mercado) |

### Player Base (2025/2026)
- **Steam concurrent**: ~3.400-4.400 (2026). Pico Steam histórico: ~6.360.
- **Contas logadas simultaneamente (Tranquility, não só Steam)**: ~25.000-27.000 média (2025/2026). Pico histórico: ~65k (2014).
- **Tendência 2025**: CCP reportou "maior influxo de novos e returning players em anos" — mais de 1 milhão de jogadores em 2025.
- **ACU 2026**: 25.014 média (jan-mai 2026), acima do ritmo de 2014 (pico histórico de ACU).
- **Conclusão**: player base **pequena mas altamente engajada e estável**. EVE tem retenção excepcional (jogadores jogam por décadas). Economia é o coração do jogo.

## 2. Economia do Jogo

- **Economia 100% player-driven**: a economia de EVE é amplamente considerada a mais complexa e realista de qualquer MMO. Quase tudo é produzido por jogadores (navios, módulos, munição, estruturas).
- **Moedas**:
  - **ISK** (InterStellar Kredits): moeda principal do jogo.
  - **PLEX** (Pilot License Extension): item tradável que equivale a tempo de subscrição. Comprável com dinheiro real e vendido in-game por ISK. Cotação flutuante (~4.7-4.8M ISK por PLEX em dez/2025).
  - **Aurum**: moeda de microtransação (menos relevante para mercado).
- **Marketplace**: sistema de **market orders** (buy/sell orders) regional. Não é auction house — é order book estilo exchange financeira.
  - **Orders são regionais**: cada região tem seu próprio mercado. Jita (The Forge, region 10000002) é o maior hub comercial.
  - **Buy orders** têm range (station, system, 1 jump, 5 jumps, region).
  - **Taxas**: broker fee (listagem) + sales tax (venda). Variam com skills e standings.
- **Arbitragem**: **extensiva e fundamental**. Arbitragem entre regiões (Jita vs Amarr vs Dodixie vs Rens), entre buy/sell (market making), e temporal (buy low, hold, sell high). É uma das principais atividades econômicas do jogo.
- **Jita**: o "hub" central. Maior volume de trade do universo. A maioria dos traders opera em Jita. Equivalente ao "Black Market" de Albion em centralidade.
- **Mercado regional**: Amarr (Domain), Dodixie (Sinq Laison), Rens (Heimatar), Hek (Metropolis) — hubs secundários com spreads vs Jita.
- **Manufacturing/Industry**: cadeia de produção completa (mineração → refinamento → componentes → manufatura). Lucro de refinamento e manufatura é calculável (equivalente ao "refinement profit" do Albion).
- **PLEX como cotação**: equivalente ao "gold quote" do Albion. PLEX é o termômetro da economia.
- **Monthly Economic Report (MER)**: CCP publica dados econômicos mensais agregados (money supply, ISK faucets/sinks, produção, destruição). Único entre MMOs.

## 3. API Pública / Fonte de Dados

### EVE ESI (EVE Swagger Interface)
- **Base URL**: `https://esi.evetech.net/latest/`
- **Docs**: https://developers.eveonline.com/docs/
- **API Explorer**: https://developers.eveonline.com/api-explorer
- **Versão atual**: 1.36 (195 endpoints, 76 públicos sem auth, 119 autenticados)
- **Formato**: JSON
- **Autenticação**: EVE SSO (OAuth 2.0) para endpoints autenticados. Endpoints de mercado público **não requerem auth**.

### Endpoints de Mercado (públicos, sem auth)
| Endpoint | Função | Cache |
|---|---|---|
| `GET /markets/{region_id}/orders/` | Lista todas as orders (buy/sell) ativas numa região | 300s (5 min) |
| `GET /markets/{region_id}/types/` | Lista type_ids com orders ativas numa região | 600s (10 min) |
| `GET /markets/{region_id}/history/` | Histórico diário (avg, high, low, volume, order_count) por type_id | Expira diariamente 11:05 |
| `GET /markets/prices/` | Preços ajustados médios de todos os itens | 3600s (1h) |
| `GET /markets/groups/` | Lista de market groups (categorias) | - |
| `GET /markets/groups/{group_id}/` | Detalhes de um market group | - |
| `GET /markets/structures/{structure_id}/` | Orders em structures privadas (requer auth) | - |

### Endpoints autenticados (market)
| Endpoint | Função |
|---|---|
| `GET /characters/{character_id}/orders/` | Orders do personagem |
| `GET /characters/{character_id}/orders/history/` | Histórico de orders do personagem |
| `GET /corporations/{corporation_id}/orders/` | Orders da corp |
| `GET /characters/{character_id}/assets/` | Assets do personagem |

### Rate Limits
- ESI usa rate limiting dinâmico. Headers `X-ESI-Error-Limit-Remain` e `X-ESI-Error-Limit-Reset`.
- Endpoints públicos de mercado são cacheados server-side (300s-3600s), então o servidor tolera volume alto.
- Error budget: 100 erros/60s → ban temporário se excedido.
- **Boa prática**: respeitar cache timers, usar ETags (If-None-Match → 304), paginar corretamente.

### Static Data Export (SDE)
- CCP publica o **SDE** (Static Data Export): database completa de itens, regiões, sistemas, blueprints, etc.
- **URL**: https://developers.eveonline.com/resource/resources
- Formato: YAML/SQL. Essencial para mapear type_ids → nomes de itens, blueprints → materiais.

### Equivalente ao Albion Online Data Project?
- **Sim, e superior**: o ESI é uma API oficial muito mais robusta que o Albion Data Project. Dados de mercado em tempo real (orders), histórico diário, preços ajustados — tudo público e bem documentado.
- **Projetos comunitários de agregação**: Adam4EVE, EVE Marketer, etc. (ver seção 4) já agregam dados do ESI.

## 4. Sites Concorrentes (Análise de Mercado)

| Site | URL | O que oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **Adam4EVE** | https://www.adam4eve.eu | Market orders viewer, margin finder, manufacturing calculator, PI profitability, price history, cost index history | Referral links (EVE signup) | **Mais completo** para market/industry, dados ricos | UI datada (PHP/tables), visual "spreadsheet", UX de 2010 |
| **EVE Marketer** | https://evemarketer.com | Market data, price check, region comparison | Ads | Rápido, bom para price check | Menos features que Adam4EVE |
| **EVE-Cost** | https://eve-cost.com | Manufacturing cost calculator, blueprint calculator, profitability | Ads | Foco em industry/manufacturing | Nichado em manufatura |
| **EVE Tycoon** | https://evetycoon.com | Market data, price history, profit calculator | Ads | UI moderna | Menos dados que Adam4EVE |
| **Fuzzwork** | https://www.fuzzwork.co.uk | Market data, blueprint calculator, PI tools, data exports | Ads/doações | Ferramentas técnicas, SDE tools | Visual técnico, não focado em UX casual |
| **EVE-Online.com market** | https://market.eve-online.com | (Descontinuado/limitado) | - | - | - |

### Observação crítica
Adam4EVE é o "gold standard" mas tem **UX terrível** (tabelas PHP, visual de 2010). Há espaço real para um site com **UX moderna** (Next.js, React) que ofereça as mesmas features com melhor experiência. O modelo do Albion Analyzer (scanner de oportunidades, arbitragem visual, alertas) é um diferencial forte.

## 5. Sites de Builds/Dicas

| Site | URL | Foco |
|---|---|---|
| **EVE University Wiki** | https://wiki.eveuniversity.org | Wiki mais completa, tutoriais, guias para iniciantes |
| **EVE Workbench** | https://www.eveworkbench.com | Fitting (ship builds), market data |
| **Osmium** | https://o.smium.org | Fitting tool, character loadouts |
| **EVE-Online forums** | https://forums.eveonline.com | Comunidade, guides |
| **EVE Uni** | https://www.eveuniversity.org | Corporação de ensino, guias |
| **ZKillboard** | https://zkillboard.com | Killboard (PvP stats), fittings a partir de kills |

## 6. Viabilidade Técnica

- **Possível construir site similar ao Albion?** **Sim, e tecnicamente o caso mais favorável.**
- **Dados suficientes?** Abundantes e oficiais. ESI oferece tudo: orders em tempo real, histórico, preços ajustados, market groups. SDE dá dados estáticos completos.
- **Stack compatível**: Next.js + TypeScript + SQLite — perfeito. ESI retorna JSON limpo, endpoints bem documentados.
- **Paralelos diretos com Albion Analyzer**:
  - Preços atuais por cidade → **Preços atuais por região** (ESI `/markets/{region_id}/orders/`)
  - Histórico de preços → **ESI `/markets/{region_id}/history/`**
  - Arbitragem entre cidades → **Arbitragem entre regiões** (comparar orders em Jita vs Amarr vs Dodixie)
  - Black Market → **Jita como hub central**
  - Lucro de refinamento → **Lucro de manufatura/refinamento** (SDE blueprints + market prices)
  - Scanner de oportunidades → **Margin finder** (buy low region A, sell high region B)
  - Cotação de ouro → **Cotação de PLEX**
- **Desafios**:
  - Volume de dados: EVE tem ~8.000+ itens tradáveis. Scanning todas as regiões requer paginação cuidadosa.
  - ESI rate limits dinâmicos — respeitar error budget.
  - SDE precisa ser baixado e processado (YAML → SQLite/DB).
  - Estruturas privadas (Citadels) requerem auth para ver orders — limitação vs stations NPC.
- **Oportunidade técnica**: Adam4EVE tem dados mas UX horrível. Um site Next.js moderno com as mesmas features + melhor UX + scanner de oportunidades estilo Albion é um diferencial real.

## 7. Viabilidade de Negócio (Ads)

- **Tamanho do público**: **pequeno mas altamente engajado**. ~25k concurrent, mas jogadores gastam horas/dia em market analysis. EVE traders são "power users" que vivem de spreadsheets.
- **Concorrência**: moderada (Adam4EVE, EVE Marketer, Fuzzwork). Mas nenhuma com UX moderna.
- **Espaço para novo site**: **sim, em UX/feature gap**. EVE players são técnicos e adoram ferramentas. Um site que combine market data + arbitragem visual + manufacturing profit + alertas, com UX 2026, tem espaço.
- **Tráfego potencial**: modesto em volume absoluto, mas **alta retenção** (EVE players usam ferramentas diariamente por anos). CTR de ads pode ser bom em nicho técnico.
- **Risco**: player base pequena limita teto de receita. EVE não tem picos sazonais como PoE/Diablo (expansões trazem algum fluxo mas não explosivo).

## 8. Recomendação Final

### **GO com ressalvas**

**Justificativa**: EVE Online é tecnicamente o **melhor caso** para replicar o Albion Analyzer — a economia é 100% player-driven, a API (ESI) é oficial e robusta, e o mapeamento de features é quase 1:1 (preços por região, arbitragem, manufacturing profit, PLEX quote). O diferencial de UX vs Adam4EVE é real e defendível.

**Ressalvas**:
1. **Player base pequena** (~25k concurrent) limita o teto de receita com ads. Não espere volume de PoE/Diablo.
2. EVE players são técnicos e leais — ótimo para retenção, mas exigem precisão nos dados.
3. Adam4EVE é concorrente estabelecido (mesmo com UX ruim, tem base de usuários fiel).
4. Necessidade de processar o SDE (dados estáticos) — trabalho extra de infra.
5. Estruturas privadas (Citadels) não são acessíveis sem auth — limita cobertura de mercado.

**Estratégia sugerida**: Construir um "EVE Market Analyzer" com Next.js + SQLite consumindo ESI. Foco em: arbitragem inter-regional visual, margin finder, manufacturing/refining profit calculator, PLEX tracker, price history charts. Diferencial: UX moderna + scanner de oportunidades persistido (exato modelo do Albion). Monetização: ads + potencial affiliate (EVE signup referral links, como Adam4EVE faz).

**Prioridade**: viável e tecnicamente sólido, mas o teto de receita é menor que PoE2/PoE1 devido à player base. Considerar como **segundo projeto** após PoE2.
