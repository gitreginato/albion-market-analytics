# RESUMO COMPARATIVO — ARPGs e Sandbox MMOs com Economia Player-Driven

> Análise de viabilidade para replicação do modelo "Albion Online Market Analyzer" (Next.js + TypeScript + SQLite + API pública de mercado + monetização via ads) em outros jogos.

## Tabela Comparativa

| Critério | PoE1 | PoE2 | Last Epoch | EVE Online | Diablo IV |
|---|---|---|---|---|---|
| **Gênero** | ARPG | ARPG (EA) | ARPG | Sandbox MMO | ARPG |
| **Modelo** | F2P | B2P→F2P (2026) | B2P | F2P+Sub | B2P+Expansões |
| **Player Base (concurrent)** | ~5k-185k (sazonal) | ~7k-421k (sazonal, crescendo) | ~1k-44k (sazonal) | ~25k (estável) | ~10k-64k Steam (sazonal) |
| **Player Base (total estimada)** | Centenas de milhares | Milhões (crescendo) | Dezenas de milhares | ~25k-30k ativos | Centenas de milhares (cross-plat) |
| **Economia player-driven?** | 100% | 100% | Parcial (MG only) | 100% (mais complexa) | Parcial/informal |
| **Marketplace digital?** | Sim (site oficial) | Sim (site oficial) | Sim (Bazaar in-game) | Sim (order book regional) | **NÃO** (manual in-game) |
| **Arbitragem possível?** | Sim (currency) | Sim (currency) | Limitada (mercado único) | **Sim, extensiva** (inter-regional) | **Não** |
| **API pública de mercado?** | **Sim** (GGG oficial + poe.ninja) | **Sim** (GGG limitada + poe.ninja) | **NÃO** | **Sim** (ESI oficial, robusta) | **NÃO** |
| **Equivalente Albion Data Project?** | poe.ninja | poe.ninja (PoE2) | Inexistente | ESI + Adam4EVE | Inexistente |
| **Dados suficientes para analyzer?** | **Sim** | **Sim** | **Não** | **Sim (melhor caso)** | **Não** |
| **Concorrência em market analysis** | Alta (poe.ninja) | **Baixa-moderada** | Zero (impossível) | Moderada (Adam4EVE, UX ruim) | Zero (impossível) |
| **Concorrência em builds/guides** | Alta | Moderada | Moderada | Baixa | Altíssima (Maxroll) |
| **UX gap explorável?** | Moderado | **Alto** | N/A | **Alto** (Adam4EVE é datado) | N/A |
| **Sazonalidade de tráfego** | Muito alta (ligas) | Muito alta (updates) | Alta (ciclos) | Baixa (estável) | Alta (seasons) |
| **Catalisador futuro** | Novas ligas perpéticas | **1.0 F2P em 2026** (explosão) | N/A | Expansões estáveis | N/A |
| **Stack Next.js+SQLite compatível?** | Sim | Sim | N/A | Sim | N/A |
| **Mapeamento de features Albion** | Bom (currency↔items) | Bom | N/A | **Excelente (1:1)** | N/A |
| **Viabilidade técnica** | Alta | Alta | **Bloqueada** | **Muito alta** | **Bloqueada** |
| **Viabilidade de negócio (ads)** | Alta | **Muito alta** | Baixa | Moderada | N/A (builds: saturado) |
| **Recomendação** | **GO** (ressalvas) | **GO** (forte) | **NO-GO** | **GO** (ressalvas) | **NO-GO** |

## Top 2 Mais Promissores

### 1º Lugar: Path of Exile 2 (PoE2) — **GO (forte)**

**Por que é o #1:**
- **Player base massiva e em crescimento**: 421k concurrent no pico, milhões de cópias vendidas. Quando virar F2P em 2026, deve explodir ainda mais.
- **Economia 100% player-driven** com currency items (mesmo modelo de PoE1).
- **APIs disponíveis**: poe.ninja já cobre PoE2 (currency, uniques, gems, fragments) + GGG Trade API.
- **Baixa concorrência em market analysis**: poe.ninja cobre o básico, mas o nicho de "trading com UX moderna + scanner de oportunidades + arbitragem" está **aberto**. Menos saturado que PoE1.
- **First-mover advantage**: construir durante o Early Access e estar pronto para o lançamento 1.0 F2P é uma janela de oportunidade real e temporal.
- **Catalisador futuro**: 1.0 F2P em 2026 = multiplicação do público + tráfego SEO já estabelecido.
- **Risco principal**: economia volátil (EA), API oficial ainda limitada (mitigável com poe.ninja).

### 2º Lugar: EVE Online — **GO com ressalvas**

**Por que é o #2:**
- **Economia mais complexa e realista de qualquer MMO** — 100% player-driven, order book regional, manufacturing chain completa.
- **API oficial (ESI) é a mais robusta** entre todos os jogos analisados: orders em tempo real, histórico diário, preços ajustados, tudo público e bem documentado.
- **Mapeamento de features quase 1:1 com Albion Analyzer**: preços por região ↔ preços por cidade, arbitragem inter-regional ↔ arbitragem inter-cidade, manufacturing profit ↔ refinement profit, PLEX quote ↔ gold quote.
- **UX gap enorme**: Adam4EVE (concorrente principal) tem visual de 2010 (PHP/tables). Um site Next.js moderno com as mesmas features + scanner de oportunidades é diferencial real.
- **Risco principal**: player base pequena (~25k concurrent) limita o teto de receita com ads. EVE não tem picos sazonais como PoE. Considerar como segundo projeto, não o primeiro.

### 3º Lugar (honra): Path of Exile 1 (PoE1) — **GO com ressalvas**

- Tecnicamente tão viável quanto PoE2, mesma API, mesma economia.
- Mas concorrência é **mais alta** (poe.ninja é gold standard consolidado há 9+ anos).
- Recomendado se quiser começar com um mercado "seguro" e estabelecido, mas o diferencial precisa ser muito claro.
- **Estratégia alternativa**: construir para PoE2 e expandir para PoE1 depois (mesma API, mesma stack).

## Não-Go: Last Epoch e Diablo IV

- **Last Epoch**: excelente ARPG, mas **não há API de mercado** (Bazaar é in-game only, EHG não expõe dados). Tecnicamente impossível construir market analyzer. Se EHG lançar API no futuro, reavaliar.
- **Diablo IV**: player base grande, mas **não há marketplace digital** (trading é manual, in-game, sem order book). Sem API de mercado, sem dados coletáveis. Economia cronicamente instável (dupes). Modelo do Albion Analyzer não se aplica.

## Roadmap Sugerido

| Fase | Jogo | Ação | Prazo |
|---|---|---|---|
| **Fase 1** | PoE2 | Construir MVP consumindo poe.ninja API: currency arbitrage, price history, scanner de oportunidades | Imediato |
| **Fase 2** | PoE2 | Adicionar build guides, dicas, SEO content. Estabelecer domínio antes do 1.0 F2P | 3-6 meses |
| **Fase 3** | PoE1 | Expandir para PoE1 (mesma stack, mesma API) — dobra o público sem reescrever código | 6-9 meses |
| **Fase 4** | EVE Online | Construir "EVE Market Analyzer" com ESI — segundo produto, UX moderna vs Adam4EVE | 9-12 meses |

## Conclusão Executiva

O modelo do Albion Online Market Analyzer é **replicável** em 3 dos 5 jogos analisados (PoE1, PoE2, EVE Online). **PoE2 é a melhor oportunidade** pela combinação de player base massiva, economia player-driven, APIs disponíveis, baixa concorrência em market analysis, e um catalisador futuro (1.0 F2P). **EVE Online é tecnicamente o caso mais favorável** (API superior, mapeamento 1:1 de features) mas com teto de receita limitado pela player base menor. Last Epoch e Diablo IV são **tecnicamente inviáveis** para market analyzer por ausência de dados de mercado acessíveis.
