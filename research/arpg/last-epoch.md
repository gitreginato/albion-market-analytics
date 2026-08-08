# Last Epoch — Relatório de Mercado

## 1. Visão Geral do Jogo

| Atributo | Detalhe |
|---|---|
| **Gênero** | Action RPG (ARPG) isométrico, hack-and-slash |
| **Desenvolvedora** | Eleventh Hour Games (EHG), EUA |
| **Modelo** | B2P ($34.99 base game); expansões pagas (ex: Harvest of Souls) |
| **Plataformas** | PC (Steam + standalone), macOS, Linux, PS5, Xbox Series X\|S |
| **Região** | Global |
| **Lançamento** | Early Access 2019; 1.0 em 21 fev 2024 |

### Player Base (2025/2026)
- **Pico histórico Steam**: 258.503 (fev/2024, lançamento 1.0).
- **Média 2026**: ~900-2.000 concurrent (entre ciclos), picos de ~27k-44k em novos ciclos (mar/abr 2026).
- **Sazonalidade**: picos a cada novo ciclo/season (ex: Season 4 "Shattered Omens" em mar/2026 → pico 44k), seguido de queda acentuada para ~1k.
- **Estimativa de receita**: $34.9M no primeiro ano (2024). Expansões adicionam receita.
- **Steam reviews**: 77% positivas (118k reviews).
- **Conclusão**: player base **modesta** comparada a PoE/Diablo. Picos sazonais fortes mas base entre ciclos é baixa (~1k concurrent).

## 2. Economia do Jogo

- **Sistema de Factions**: cada personagem escolhe **uma** facção de itens:
  - **Merchant's Guild (MG)**: permite trading via **Bazaar** (auction house assíncrono, sem interação direta). Compra/venda por **gold** + **Favor**. Rank determina quais qualidades de item podem ser tradeadas.
  - **Circle of Fortune (CoF)**: **sem trading** — boosts de drop rates, Prophecies para target farming. Itens CoF são faction-locked (não tradáveis).
- **Bazaar**: auction house in-game assíncrono. Busca avançada, filtros, sem delay de compra, **sem taxa** sobre gold. Apenas jogadores MG podem usar.
- **Moeda**: Gold (única moeda de trade). Favor é currency secundária para listagem.
- **Player-driven?** Sim, mas **limitado** — apenas jogadores MG participam do mercado. CoF players são auto-suficientes (não compram/vendem).
- **Arbitragem**: limitada. O Bazaar é um mercado único (não há múltiplas cidades/regiões como Albion). Arbitragem existe entre tipos de item e ao longo do tempo (flipping).
- **Sem item-to-item trades**: tudo via gold. Não há currency items como PoE.
- **Reset por ciclo**: ciclos (Cycles) resetam economia periodicamente, similar a ligas PoE.

## 3. API Pública / Fonte de Dados

### API Oficial (EHG)
- **NÃO EXISTE API pública oficial** para dados de mercado do Bazaar.
- **Pedido da comunidade**: usuário "gerbesh" (abr/2026) pediu formalmente no fórum uma API read-only do Bazaar (https://forum.lastepoch.com/t/item-value-estimation-tool-bazaar-data-api-request/81025). EHG **não respondeu positivamente** até o momento.
- **Sem equivalente ao Albion Online Data Project**: não há projeto comunitário que colete dados de mercado do Bazaar. O Bazaar é in-game only — não expõe dados externos.

### O que existe (dados estáticos)
- **Last Epoch Tools** (lastepochtools.com): database de itens, skills, build planner. Dados **estáticos** (não de mercado).
- **Tunk / Last Epoch Info** (lastepoch.tunklab.com): database de crafting, uniques, skills. Estático.
- **Sem price data**: não há fonte pública de preços do Bazaar. Jogadores fazem price check manual in-game.

### Implicação técnica
- **Não é possível construir um "market analyzer" como o do Albion** sem dados de mercado. A menos que:
  1. EHG lance uma API (não há sinal disso).
  2. Você faça scraping somehow (não há interface web do Bazaar — é in-game only).
  3. Você construa uma extensão/client mod que capture dados (viola ToS, inviável).

## 4. Sites Concorrentes (Análise de Mercado)

| Site | URL | O que oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| **Last Epoch Tools** | https://www.lastepochtools.com | Database, build planner, loot filters, ladders, character profiles | Ads/doações | Site mais completo da comunidade, atualizado para Season 4 | **Sem dados de mercado/preços** |
| **Tunk / Last Epoch Info** | https://lastepoch.tunklab.com | Database de itens, crafting, uniques | Sem ads aparente | Referência técnica | Visual datado, sem market data |
| **Maxroll.gg/last-epoch** | https://maxroll.gg/last-epoch | Builds, guides, tier lists, faction overview | Ads | Marca forte, conteúdo de qualidade | Foco em builds, não em market |

### Observação crítica
**Nenhum site oferece análise de mercado/preços** para Last Epoch — simplesmente porque **não há dados disponíveis**. O nicho existe mas é tecnicamente bloqueado pela ausência de API.

## 5. Sites de Builds/Dicas

| Site | URL | Foco |
|---|---|---|
| **Maxroll.gg/last-epoch** | https://maxroll.gg/last-epoch | Builds, guides, getting started |
| **Last Epoch Tools** | https://www.lastepochtools.com/build-guides | Build guides, build planner |
| **Tunk** | https://lastepoch.tunklab.com | Database técnico |
| **Last Epoch Wiki** | https://lastepoch.fandom.com | Wiki comunitária |
| **Reddit r/LastEpoch** | https://reddit.com/r/LastEpoch | Comunidade, builds |

## 6. Viabilidade Técnica

- **Possível construir site similar ao Albion?** **NÃO, para análise de mercado.**
- **Motivo**: não há API pública de dados do Bazaar. O mercado é in-game only, sem interface web ou endpoint exposto.
- **O que é possível**: site de builds/dicas/database (já bem servido por Last Epoch Tools e Maxroll).
- **Desafios intransponíveis (market data)**:
  - Sem API oficial de mercado.
  - Sem projeto comunitário de coleta de dados (como poe.ninja ou Albion Data Project).
  - Bazaar é in-game only — não há como fazer scraping web.
  - Captura de dados via client mod viola ToS.
- **Se EHG lançar API no futuro**: viabilidade muda. Mas não há sinal disso em 2026.

## 7. Viabilidade de Negócio (Ads)

- **Tamanho do público**: **modesto**. ~1k-2k concurrent entre ciclos, picos de ~44k em novos ciclos. Significativamente menor que PoE/Diablo.
- **Concorrência em builds/database**: moderada (Last Epoch Tools + Maxroll).
- **Concorrência em market analysis**: **zero** (porque é tecnicamente impossível hoje).
- **Tráfego potencial**: limitado pela player base. Mesmo um site de builds teria tráfego modesto vs PoE.
- **Sazonalidade**: picos em novos ciclos, vales profundos entre eles.

## 8. Recomendação Final

### **NO-GO** (para market analyzer)

**Justificativa**: Last Epoch é um excelente ARPG, mas **não oferece dados de mercado acessíveis externamente**. Não há API oficial do Bazaar, não há projeto comunitário de coleta de dados, e o mercado é in-game only. É tecnicamente impossível replicar o modelo do Albion Online Market Analyzer sem dados.

**Exceção**: se no futuro EHG lançar uma API pública do Bazaar (pedido da comunidade existe), a viabilidade deve ser reavaliada. O nicho estaria completamente aberto (zero concorrentes em market analysis).

**Alternativa viável**: um site de builds/dicas para Last Epoch é possível, mas o mercado já é bem servido por Last Epoch Tools e Maxroll, e a player base é modesta. ROI inferior a PoE/Diablo.
