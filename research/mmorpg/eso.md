# Elder Scrolls Online (ESO) — Relatório de Mercado

> Categoria: MMORPG | Modelo: B2P (buy-to-play) + optional subscription (ESO Plus) + Crown Store
> Data da pesquisa: Julho 2025

## 1. Visão Geral

- **Desenvolvedora**: ZeniMax Online Studios (Bethesda/Microsoft)
- **Lançamento**: 2014
- **Plataformas**: PC (Windows/Mac), PS5/PS4, Xbox Series X|S
- **Região**: Global (NA + EU servers)
- **Player base estimada (2025)**:
  - Total acumulado: ~26M players (Statista, abr/2025)
  - Steam: ~10K avg, ~18K peak (mai/2026) — mas maioria joga pelo launcher próprio.
  - MMO-Population: ~140K monthly (jun/2026)
  - Daily: ~88K (MMO-Population, mai/2025)
- **Modelo**: B2P + ESO Plus (subscription, dá acesso a DLCs + crowns mensais) + Crown Store (cosméticos/conveniência).

## 2. Economia do Jogo

- **Guild Stores (não AH centralizada!)**: ESO NÃO tem auction house global. Players vendem via Guild Stores — cada guilda (máx 5 guildas por player) pode ter um store, e só membros da guilda podem listar. Para comprar, qualquer um pode acessar via Guild Traders (NPCs alugados por guildas em cidades).
- **Moeda**: Gold. Sem token RMT oficial.
- **Taxas**: 7% sales tax (3.5% fica com a guilda, 3.5% com o sistema).
- **Arbitragem**: SIM — entre Guild Traders de diferentes cidades (cada trader tem estoque diferente). É o "jogo" central de trading em ESO.
- **Player-driven**: SIM, mas fragmentado por guilda/trader. Mais similar ao modelo Albion (cidades) que ao WoW (AH regional).

## 3. API Pública / Fontes de Dados

### ⚠️ NÃO HÁ API oficial da ZeniMax para o mercado.

### Tamriel Trade Centre (TTC)
- **Site**: `https://us.tamrieltradecentre.com/` (também `eu.`)
- **Mecanismo**: addon in-game + client Windows (.NET Framework 4.5+).
  - Addon coleta listings das guild stores que o player visita.
  - Client sincroniza os dados com o site TTC.
  - Player precisa fazer `/reloadui` ou logout para o addon escrever os dados em disco (`SavedVariables\TamrielTradeCentre.lua`).
  - Há botão "Scan All Listings" na guild store para coleta ativa.
- **Cobertura**: depende de players com o addon+client rodando. NA e EU têm boa cobertura; console (Xbox/PS) não tem addon.
- **API**: o site TTC tem endpoints web (não documentados formalmente) — é possível scraping.

### Outras fontes
- **ESO Hub**, **TTC Price Table** (download diário de price table para o addon).
- **UESP Wiki** — database de itens, NÃO preços em tempo real.

## 4. Sites Concorrentes (Mercado)

| Site | URL | Oferece | Monetização | Pontos fortes | Pontos fracos |
|---|---|---|---|---|---|
| Tamriel Trade Centre | tamrieltradecentre.com | Listings, price table, browser | Ads + doações | Único agregador sério, addon integrado | UX datada, depende de client Windows .NET, sem API formal |
| ESO Hub | esohub.com | Database + some market | Ads | — | Menos focado em mercado |
| UESP Wiki | en.uesp.net | Database de itens | Ads | Wiki madura | Sem preços em tempo real |

## 5. Sites de Builds/Dicas

| Site | Notas |
|---|---|
| **Alcast HQ** (alcasthq.com) | Builds + guides, muito popular |
| **ESO-Hub** | Builds + database |
| **Skinny Cheeks** (YouTube) | DPS builds |
| **UESP Wiki** | Database |

## 6. Viabilidade Técnica

- **API**: NÃO oficial. TTC é a única fonte, via addon + client Windows .NET.
- **Desafios MAIORES**:
  - Coleta de dados requer addon + client Windows — não é trivial para um site consumir. Teria que fazer scraping do site TTC (frágil, contra ToS implícito).
  - Sem API REST limpa como Albion/Blizzard.
  - Dados desiguais entre regions (NA melhor coberta que EU).
  - Console não tem addon = sem dados.
- **Stack**: tecnicamente possível (Next.js + SQLite), mas a fonte de dados é o gargalo. Scraping do TTC é a única via realista.
- **Semelhante ao Albion**: SIM em conceito (Guild Traders ≈ cidades Albion, arbitragem entre traders), mas a coleta de dados é MUITO mais difícil.

## 7. Viabilidade de Negócio (Ads)

- **Público**: ~26M total, ~88K daily. Base leal mas envelhecida.
- **Concorrência**: BAIXA em mercado (TTC domina mas UX datada, sem concorrente moderno).
- **Espaço para novo site**: MODERADO em UX, mas **bloqueado pela fonte de dados**. Sem API própria, teria que depender de scraping TTC (frágil) ou construir addon+client próprio (esforço enorme, redefeito).
- **Potencial de tráfego**: médio. ESO tem base estável mas não cresce.
- **CPM**: nicho ESO é menor que WoW.

## 8. Recomendação Final

### ❌ NO-GO (para o modelo Albion)

**Justificativa**: Embora a economia de ESO seja conceitualmente similar ao Albion (arbitragem entre traders/cidades), a **fonte de dados é o bloqueio fatal**. Sem API oficial e dependendo de addon Windows + client .NET + scraping do TTC, o esforço técnico para manter dados frescos é desproporcional ao retorno. O TTC já tem monopólio funcional e a rede de contributors instalada — deslocá-lo é irrealista.

**Exceção**: GO apenas se houver disposição de construir addon próprio + comunidade de contributors (esforço de anos, não MVP). Não recomendado como primeiro projeto pós-Albion.

**Alternativa viável**: site de builds/dicas para ESO (Alcast HQ é forte mas há espaço para UX moderna), sem depender de dados de mercado.
