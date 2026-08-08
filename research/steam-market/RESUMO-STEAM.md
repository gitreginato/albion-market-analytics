# RESUMO — Steam Market & Games Items Economy

> Comparativo dos 5 jogos pesquisados para replicação do modelo "Albion Online Market Analyzer" (site de análise estatística de compra/venda de items + builds + dicas, monetizado com ads).

---

## Tabela comparativa

| Critério | CS2 | Dota 2 | TF2 | Rust | TFT |
|---|---|---|---|---|---|
| **Gênero** | Tactical FPS | MOBA | Class shooter | Survival sandbox | Auto-battler |
| **Player base (MAU)** | ~30–40M | ~7–10M | ~1–2M | ~13.8M | ~33–35M |
| **Concurrent avg** | ~1.0M | ~615K | ~47K | ~95–125K | ~1.2M (peak) |
| **Economia de items/skins** | ✅ Gigante ($4.2B/ano) | ✅ Média | ⚠️ Pequena/estagnada | ✅ Média-grande | ❌ Nenhuma (só cosméticos não-tradeáveis) |
| **Trade entre jogadores** | ✅ Steam + third-party | ✅ Steam + third-party | ✅ Steam + third-party | ✅ Steam + third-party | ❌ Não |
| **API pública de mercado** | ⚠️ Não-oficial + pagas | ⚠️ Não-oficial + pagas | ✅ **backpack.tf (gratuita, robusta)** | ⚠️ RustSkins.gg (paga por req) + pagas | ✅ **Riot TFT API (oficial, gratuita)** — mas é de matches, não market |
| **Custo de dados** | Médio ($50–200/mês) | Médio ($50–150/mês) | **Baixo** (gratuito) | Médio ($50–150/mês) | **Baixo** (gratuito) |
| **Concorrência em analytics** | ❌ **MUITO alta** | ✅ **Baixa** | ⚠️ Baixa mas backpack.tf domina | ✅ **Baixa-média** | ❌ Alta (tactics.tools, lolchess) |
| **Schema de items** | Complexo (float, stickers) | Simples | Complexo (qualities, effects) | Simples | N/A (stats de comps) |
| **Modelo aplicável** | Market analyzer | Market analyzer | Market analyzer | Market analyzer | **Stats/builds analyzer** (diferente) |
| **Potencial de tráfego (ads)** | ✅ Gigantesco | ✅ Grande | ❌ Pequeno | ✅ Grande | ✅ Gigantesco |
| **Espaço para novo site** | ⚠️ Pequeno (saturado) | ✅ **Real** | ❌ Pequeno (teto baixo) | ✅ **Real** | ⚠️ Pequeno (dominado) |
| **Monetização realista** | Ads + afiliados marketplaces | Ads + afiliados | Premium + ads (teto baixo) | Ads + afiliados | Ads + Patreon/subscription |
| **Recomendação** | ⚠️ GO com ressalvas | ✅ **GO** | ❌ NO-GO | ✅ **GO** | ⚠️ GO com ressalvas |

---

## Top 2 mais promissores

### 🥇 1. Rust — Skins Market

**Por que é o #1:**
- **Concorrência baixa** em sites de analytics dedicados (apenas RustSkins.gg é sério).
- Player base grande e estável (~13.8M MAU, ~95–125K concurrent) com cultura de skins ativa.
- Schema de items simples (sem float/sticker) — mais leve de modelar que CS2.
- Wipe cycle mensal gera picos recorrentes de tráfego.
- Dados acessíveis (Steamwebapi + RustSkins.gg API).
- **Espaço real para um segundo player** no nicho.
- Diferencial PT-BR viável (Brasil tem player base grande de Rust).

**Risco**: RustSkins.gg já existe — precisa de diferencial claro (UX, PT-BR, features sociais, alertas).

---

### 🥈 2. Dota 2 — Items Market

**Por que é #2:**
- **Concorrência muito baixa** em sites de price tracking de Dota 2 items (a maioria dos marketplaces trata Dota como secundário).
- Player base grande e estável (~7–10M MAU, ~615K concurrent).
- Schema simples (sem float/sticker).
- Combinação "market de items + meta/heroes" via OpenDota API cria produto diferenciado.
- Dados acessíveis (Steamwebapi + OpenDota gratuita).
- Dota 2 items têm menos hype especulativo que CS2, mas o nicho de analytics é **sub-atendido**.

**Risco**: cultura de skins/trade menor que CS2 — volume de buscas menor. Compensado por menor concorrência.

---

## Por que não CS2?

CS2 tem a maior economia e player base, mas é **o nicho mais saturado** do mercado de games items. CSFloat, SteamAnalyst, Pricempire, SteamLedger, cs2.sh, cs2ref.com — dezenas de sites consolidados com anos de domínio e backlinks. Entrar genérico é NO-GO. Só faz sentido com **ângulo regional PT-BR forte** — e mesmo assim, o esforço vs. retorno é questionável vs. Rust/Dota 2 onde há menos competição.

## Por que não TFT?

TFT tem público gigantesco (33M MAU) e API oficial gratuita, mas **não tem economia de items tradeáveis** — o modelo "Albion Market Analyzer" não se aplica. É um produto diferente (stats/builds). Além disso, tactics.tools e lolchess.gg dominam. Só faz sentido se o objetivo for pivotar para "stats analyzer" com diferencial PT-BR/mobile.

## Por que não TF2?

Viabilidade técnica excelente (backpack.tf API gratuita), mas player base pequena (~47K concurrent) e envelhecida. Teto de tráfego/receita muito baixo. NO-GO como negócio ads-driven.

---

## Recomendação estratégica final

**Construir 2 sites** (ou começar por 1):

1. **Rust Skins Analyzer** (prioridade 1) — replicar o modelo Albion (preços, histórico, arbitragem, deals, trending) com foco em Rust skins. Stack: Next.js + SQLite + Steamwebapi. Diferencial: PT-BR + UX moderna + alertas Telegram/Discord.

2. **Dota 2 Items Analyzer** (prioridade 2) — price tracker de Dota 2 items + seção de meta/heroes via OpenDota. Stack: Next.js + SQLite + Steamwebapi + OpenDota. Diferencial: único site dedicado a Dota 2 items analytics + PT-BR.

**Monetização para ambos**: ads (AdSense/Media.net) + afiliados de marketplaces (Skinport, DMarket, Rust.tm/Avan — programas de referral pagam 2–5% de comissão) + potencial premium (alertas ilimitados, portfolio tracker avançado).

**Não construir**: CS2 genérico, TF2, TFT (a menos que pivotando para stats com diferencial claro).
