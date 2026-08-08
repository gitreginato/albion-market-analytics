// Portfolio optimizer for Albion Online Black Market trading.
//
// SINGLE-SOURCE KNAPSACK PER CITY:
// For each city, solve the knapsack problem: maximize profit subject to
// mount carry weight (kg) and investment capital (silver) constraints.
//
// Algorithm: Greedy by profit density (profit per kg), O(N log N).
// Each item's quantity is limited by: weight, budget, and BM daily volume.
//
// Risk is INFORMATIVE (display only), not restrictive.
// Kelly Criterion and Markowitz are NOT used for position sizing —
// they are inappropriate for deterministic arbitrage. See REPORT.md.

export interface PortfolioItem {
  itemId: string;
  itemName: string;
  quality: number;
  buyCity: string;
  buyPrice: number;
  blackMarketPrice: number;
  profit: number;
  margin: number;          // percentage
  itemWeight: number;      // kg per unit
  bmVolume7d: number;      // avg items/day BM buys
  bmConsistency: number;   // % of profitable days (0-100)
  bmPriceTrend: "up" | "down" | "stable";
  buyPriceAgeHours?: number;
  bmPriceAgeHours?: number;
  // Computed by optimizer:
  quantity: number;        // units to buy
  totalCost: number;       // quantity * buyPrice
  totalWeight: number;     // quantity * itemWeight
  totalProfit: number;     // quantity * profit
  riskScore: number;       // 0-100, higher = riskier (INFORMATIVE only)
}

export interface CityPortfolio {
  city: string;
  items: PortfolioItem[];
  totalInvestment: number;
  totalProfit: number;
  totalWeight: number;
  expectedROI: number;         // totalProfit / totalInvestment * 100
  loadUtilization: number;     // % of mount capacity used
  budgetUtilization: number;   // % of investment used
  tripsToTarget: number;       // trips to reach target profit (based on EV)
  avgConsistency: number;      // weighted average consistency
  avgRiskScore: number;        // weighted average risk
  narrative: string;           // human-readable analysis
  // Risk-adjusted metrics (v2):
  survivalProb: number;        // probability of surviving the trip (0-1)
  expectedValue: number;       // EV = p * profit - q * investment
  kellyFraction: number;       // optimal Kelly fraction of bankroll (0 = don't play)
  kellyHalfFraction: number;   // half-Kelly (conservative)
  recommendedCapital: number;  // min(kellyHalf * bankroll, investment)
  ruinProb10Trips: number;     // probability of losing 10 trips in a row = q^10
  tripsToTargetEV: number;     // trips to target based on EV (not projected profit)
  valueDensity: number;        // silver/kg — high = ganker magnet
}

export interface PortfolioResult {
  cityPortfolios: CityPortfolio[];  // sorted by EV descending
  mountMaxLoad: number;
  mountName?: string;
  investment: number;
  bankroll: number;
  survivalProb: number;
  targetProfit: number;
  opportunitiesConsidered: number;
}

export interface PortfolioOptions {
  investment: number;       // silver available for this trip (knapsack budget)
  mountMaxLoadKg: number;  // mount carry capacity
  bankroll?: number;       // total player capital (default = investment)
  survivalProb?: number;   // base probability of surviving the trip (default 0.90)
  targetProfit?: number;   // target profit per trip (default 33M for premium)
  minConsistency?: number; // filter: minimum consistency % (default 50)
  maxAgeHours?: number;    // filter: maximum price age in hours (default 24)
  minVolume?: number;      // filter: minimum BM volume/day (default 1)
  minMargin?: number;      // filter: minimum margin % (default 0 = no filter)
  cityFilter?: string;     // only optimize for this city (optional)
  useFullBudget?: boolean; // if false, stop when ROI starts declining (default: false)
  maxUnitsPerItem?: number; // buy-side liquidity cap: max units of one item you can buy without pushing price up (default 20)
}

// Calculate risk score (0-100) for an item. INFORMATIVE only.
// Higher consistency, volume, freshness = lower risk.
// Abnormally high margin = higher risk (possible troll listing).
export function calculateRiskScore(
  consistency: number,
  volume: number,
  margin: number,
  trend: "up" | "down" | "stable",
  ageHours?: number,
): number {
  let risk = 100;
  // Consistency reduces risk (weight: 35%)
  risk -= (consistency / 100) * 35;
  // Volume reduces risk (weight: 20%), capped at 50/day
  risk -= Math.min(1, volume / 50) * 20;
  // Price age increases risk (weight: 15%)
  if (ageHours !== undefined) {
    risk += Math.min(1, ageHours / 48) * 15;
  }
  // Trend (weight: 10%)
  if (trend === "down") risk += 10;
  else if (trend === "stable") risk += 5;
  // Abnormally high margin increases risk (weight: 20%)
  if (margin > 500) risk += 20;
  else if (margin > 200) risk += 10;
  return Math.max(0, Math.min(100, Math.round(risk)));
}

// Greedy knapsack solver for a single city.
// Sort by profit density (profit per kg) descending.
// For each item, allocate max quantity subject to:
//   - weight constraint (remaining mount capacity)
//   - budget constraint (remaining capital)
//   - liquidity constraint (50% of BM daily volume)
function optimizeCity(
  city: string,
  opportunities: Array<{
    itemId: string;
    itemName: string;
    quality: number;
    buyCity: string;
    buyPrice: number;
    blackMarketPrice: number;
    profit: number;
    margin: number;
    itemWeight: number;
    bmVolume7d: number;
    bmConsistency: number;
    bmPriceTrend: "up" | "down" | "stable";
    buyPriceAgeHours?: number;
    bmPriceAgeHours?: number;
  }>,
  investment: number,
  mountMaxLoadKg: number,
  targetProfit: number,
  useFullBudget: boolean,
  survivalProb: number,
  bankroll: number,
  maxUnitsPerItem: number,
): CityPortfolio {
  const emptyRiskFields = {
    survivalProb,
    expectedValue: 0,
    kellyFraction: 0,
    kellyHalfFraction: 0,
    recommendedCapital: 0,
    ruinProb10Trips: Math.pow(1 - survivalProb, 10),
    tripsToTargetEV: 0,
    valueDensity: 0,
  };

  if (opportunities.length === 0 || investment <= 0 || mountMaxLoadKg <= 0) {
    return {
      city,
      items: [],
      totalInvestment: 0,
      totalProfit: 0,
      totalWeight: 0,
      expectedROI: 0,
      loadUtilization: 0,
      budgetUtilization: 0,
      tripsToTarget: 0,
      avgConsistency: 0,
      avgRiskScore: 0,
      narrative: `Sem oportunidades viáveis em ${city}.`,
      ...emptyRiskFields,
    };
  }

  // Calculate risk score and profit density for each item.
  const enriched = opportunities.map((opp) => {
    const riskScore = calculateRiskScore(
      opp.bmConsistency,
      opp.bmVolume7d,
      opp.margin,
      opp.bmPriceTrend,
      opp.buyPriceAgeHours,
    );
    // Profit density: profit per kg. Higher = better use of cargo space.
    const profitDensity = opp.itemWeight > 0
      ? opp.profit / opp.itemWeight
      : opp.profit;
    return { ...opp, riskScore, profitDensity };
  });

  // Sort by profit density descending (greedy knapsack).
  enriched.sort((a, b) => b.profitDensity - a.profitDensity);

  let remainingBudget = investment;
  let remainingWeight = mountMaxLoadKg;
  const selected: PortfolioItem[] = [];
  let currentROI = Infinity; // ROI starts high (no items = infinite ROI conceptually)

  for (const opp of enriched) {
    if (remainingBudget <= 0 || remainingWeight <= 0) break;
    if (opp.buyPrice <= 0 || opp.itemWeight <= 0 || opp.profit <= 0) continue;

    // Max units by budget.
    const maxByBudget = Math.floor(remainingBudget / opp.buyPrice);
    // Max units by weight.
    const maxByWeight = Math.floor(remainingWeight / opp.itemWeight);
    // Max units by BM sell-side liquidity (use 50% of daily volume for safety).
    const maxByVolume = Math.max(1, Math.floor(opp.bmVolume7d * 0.5));
    // Max units by buy-side liquidity: realistic market depth at listed price.
    // Buying more than this will exhaust cheap listings and push price up.
    const maxByBuyLiquidity = maxUnitsPerItem;

    const quantity = Math.max(0, Math.min(maxByBudget, maxByWeight, maxByVolume, maxByBuyLiquidity));
    if (quantity === 0) continue;

    const totalCost = quantity * opp.buyPrice;
    const totalWeight = quantity * opp.itemWeight;
    const totalProfit = quantity * opp.profit;

    // ROI stopping criterion: if not useFullBudget, stop when adding this item
    // would lower the overall ROI. This maximizes ROI instead of total profit.
    if (!useFullBudget && selected.length > 0) {
      const itemROI = (totalProfit / totalCost) * 100;
      if (itemROI < currentROI) {
        // This item's ROI is worse than current portfolio ROI — stop here.
        break;
      }
    }

    selected.push({
      itemId: opp.itemId,
      itemName: opp.itemName,
      quality: opp.quality,
      buyCity: opp.buyCity,
      buyPrice: opp.buyPrice,
      blackMarketPrice: opp.blackMarketPrice,
      profit: opp.profit,
      margin: opp.margin,
      itemWeight: opp.itemWeight,
      bmVolume7d: opp.bmVolume7d,
      bmConsistency: opp.bmConsistency,
      bmPriceTrend: opp.bmPriceTrend,
      buyPriceAgeHours: opp.buyPriceAgeHours,
      bmPriceAgeHours: opp.bmPriceAgeHours,
      quantity,
      totalCost,
      totalWeight,
      totalProfit,
      riskScore: opp.riskScore,
    });

    remainingBudget -= totalCost;
    remainingWeight -= totalWeight;

    // Update current ROI.
    const totalCostSoFar = selected.reduce((s, i) => s + i.totalCost, 0);
    const totalProfitSoFar = selected.reduce((s, i) => s + i.totalProfit, 0);
    currentROI = totalCostSoFar > 0 ? (totalProfitSoFar / totalCostSoFar) * 100 : 0;
  }

  // Aggregate metrics.
  const totalInvestmentUsed = selected.reduce((s, i) => s + i.totalCost, 0);
  const totalProfit = selected.reduce((s, i) => s + i.totalProfit, 0);
  const totalWeight = selected.reduce((s, i) => s + i.totalWeight, 0);
  const loadUtilization = mountMaxLoadKg > 0 ? (totalWeight / mountMaxLoadKg) * 100 : 0;
  const budgetUtilization = investment > 0 ? (totalInvestmentUsed / investment) * 100 : 0;
  const expectedROI = totalInvestmentUsed > 0 ? (totalProfit / totalInvestmentUsed) * 100 : 0;
  const tripsToTarget = totalProfit > 0 ? Math.ceil(targetProfit / totalProfit) : 0;

  // Weighted averages (by profit).
  const avgConsistency = totalProfit > 0
    ? Math.round(selected.reduce((s, i) => s + i.bmConsistency * i.totalProfit, 0) / totalProfit)
    : 0;
  const avgRiskScore = totalProfit > 0
    ? Math.round(selected.reduce((s, i) => s + i.riskScore * i.totalProfit, 0) / totalProfit)
    : 0;

  // === Risk-adjusted metrics (v2) ===
  const p = survivalProb;
  const q = 1 - p;
  // EV = p * profit - q * investment (expected value per trip)
  const expectedValue = p * totalProfit - q * totalInvestmentUsed;
  // Kelly: f* = (p * b - q) / b, where b = profit/investment (odds = ROI as decimal)
  const b = totalInvestmentUsed > 0 ? totalProfit / totalInvestmentUsed : 0;
  const kellyFraction = b > 0 ? (p * b - q) / b : 0;
  const kellyHalfFraction = kellyFraction / 2;
  // Recommended capital: half-Kelly fraction of bankroll, capped at investment.
  const recommendedCapital = Math.max(0, Math.min(kellyHalfFraction * bankroll, totalInvestmentUsed));
  // Risk of ruin: probability of losing 10 trips in a row.
  const ruinProb10Trips = Math.pow(q, 10);
  // Trips to target based on EV (not projected profit).
  const tripsToTargetEV = expectedValue > 0 ? Math.ceil(targetProfit / expectedValue) : 0;
  // Value density: silver per kg — high = ganker magnet.
  const valueDensity = totalWeight > 0 ? totalInvestmentUsed / totalWeight : 0;

  const narrative = generateNarrative({
    city,
    selected,
    totalInvestmentUsed,
    totalProfit,
    loadUtilization,
    budgetUtilization,
    expectedROI,
    avgConsistency,
    avgRiskScore,
    tripsToTarget,
    targetProfit,
    // v2 risk params:
    survivalProb: p,
    expectedValue,
    kellyFraction,
    kellyHalfFraction,
    recommendedCapital,
    ruinProb10Trips,
    tripsToTargetEV,
    valueDensity,
  });

  return {
    city,
    items: selected,
    totalInvestment: totalInvestmentUsed,
    totalProfit,
    totalWeight,
    expectedROI,
    loadUtilization,
    budgetUtilization,
    tripsToTarget,
    avgConsistency,
    avgRiskScore,
    narrative,
    // v2 risk fields:
    survivalProb: p,
    expectedValue,
    kellyFraction,
    kellyHalfFraction,
    recommendedCapital,
    ruinProb10Trips,
    tripsToTargetEV,
    valueDensity,
  };
}

function generateNarrative(ctx: {
  city: string;
  selected: PortfolioItem[];
  totalInvestmentUsed: number;
  totalProfit: number;
  loadUtilization: number;
  budgetUtilization: number;
  expectedROI: number;
  avgConsistency: number;
  avgRiskScore: number;
  tripsToTarget: number;
  targetProfit: number;
  // v2 risk params:
  survivalProb: number;
  expectedValue: number;
  kellyFraction: number;
  kellyHalfFraction: number;
  recommendedCapital: number;
  ruinProb10Trips: number;
  tripsToTargetEV: number;
  valueDensity: number;
}): string {
  const {
    city,
    selected,
    totalInvestmentUsed,
    totalProfit,
    loadUtilization,
    budgetUtilization,
    expectedROI,
    avgConsistency,
    avgRiskScore,
    tripsToTarget,
    targetProfit,
    survivalProb,
    expectedValue,
    kellyFraction,
    kellyHalfFraction,
    recommendedCapital,
    ruinProb10Trips,
    tripsToTargetEV,
    valueDensity,
  } = ctx;

  if (selected.length === 0) {
    return `Sem oportunidades viáveis em ${city} com os filtros atuais.`;
  }

  const lines: string[] = [];
  const pPct = (survivalProb * 100).toFixed(0);
  const qPct = ((1 - survivalProb) * 100).toFixed(0);

  // Header with EV (primary metric).
  lines.push(
    `${city}: ${selected.length} itens · EV ${expectedValue >= 0 ? "+" : ""}${fmtSilver(expectedValue)} (p=${pPct}% sobreviver, q=${qPct}% ganked)`,
  );

  // Risk-adjusted summary.
  if (kellyFraction <= 0) {
    lines.push(
      `⚠️ EV NEGATIVO: com ${qPct}% de chance de perder ${fmtSilver(totalInvestmentUsed)}, o valor esperado é negativo. NÃO RECOMENDADO.`,
    );
  } else {
    lines.push(
      `Lucro se sobreviver: +${fmtSilver(totalProfit)} (${expectedROI.toFixed(0)}% ROI) · Perda se ganked: -${fmtSilver(totalInvestmentUsed)}`,
    );
    lines.push(
      `Kelly: f*=${(kellyFraction * 100).toFixed(1)}% do bankroll · Half-Kelly: ${(kellyHalfFraction * 100).toFixed(1)}% · Capital recomendado: ${fmtSilver(recommendedCapital)}`,
    );
  }

  // Item breakdown — the actual "shopping list".
  const itemSummary = selected
    .map((i) => `${i.quantity}x ${i.itemName} Q${i.quality} (${fmtSilver(i.totalCost)}, +${fmtSilver(i.totalProfit)}, ${i.totalWeight.toFixed(1)} kg)`)
    .join("\n");
  lines.push(itemSummary);

  // Logistics.
  lines.push(
    `Carga: ${loadUtilization.toFixed(0)}% lotada · Capital: ${budgetUtilization.toFixed(0)}% usado · Densidade: ${fmtSilver(valueDensity)}/kg`,
  );

  // Quality metrics.
  lines.push(
    `Consistência média: ${avgConsistency}% · Risco médio: ${avgRiskScore}/100`,
  );

  // Target based on EV (not projected profit).
  if (expectedValue > 0 && tripsToTargetEV > 0) {
    lines.push(
      `Meta ${fmtSilver(targetProfit)}: ${tripsToTargetEV} viagem(s) baseado em EV (vs ${tripsToTarget} se lucro garantido).`,
    );
  }

  // Risk of ruin.
  const ruinPct = (ruinProb10Trips * 100).toFixed(2);
  if (ruinProb10Trips > 0.001) {
    lines.push(
      `Risco de ruína (10 perdas seguidas): ${ruinPct}% · Probabilidade de gank por viagem: ${qPct}%`,
    );
  }

  // Value density warning (ganker magnet).
  if (valueDensity > 50000) {
    lines.push(
      `⚠️ ALTA DENSIDADE DE VALOR: ${fmtSilver(valueDensity)}/kg torna este transporte um alvo prioritário para gankers. Considere rotas mais seguras ou horário off-peak.`,
    );
  }

  // Warnings (informative, not restrictive).
  const highRisk = selected.filter((i) => i.riskScore >= 70);
  if (highRisk.length > 0) {
    lines.push(
      `ATENÇÃO: ${highRisk.length} item(s) com risco ≥ 70 — verificar idade do preço e consistência antes de comprar.`,
    );
  }

  const lowVolume = selected.filter((i) => i.bmVolume7d < 5);
  if (lowVolume.length > 0) {
    lines.push(
      `CUIDADO: ${lowVolume.length} item(s) com volume BM < 5/dia — liquidez baixa no BM.`,
    );
  }

  return lines.join("\n");
}

// Main entry point: optimize portfolio for each city independently.
export function optimizePortfolio(
  opportunities: Array<{
    itemId: string;
    itemName: string;
    quality: number;
    buyCity: string;
    buyPrice: number;
    blackMarketPrice: number;
    profit: number;
    margin: number;
    itemWeight: number;
    bmVolume7d: number;
    bmConsistency: number;
    bmPriceTrend: "up" | "down" | "stable";
    buyPriceAgeHours?: number;
    bmPriceAgeHours?: number;
  }>,
  opts: PortfolioOptions,
): PortfolioResult {
  const {
    investment,
    mountMaxLoadKg,
    bankroll = investment,
    survivalProb = 0.90,
    targetProfit = 33_000_000,
    minConsistency = 50,
    maxAgeHours = 24,
    minVolume = 1,
    minMargin = 0,
    cityFilter,
    useFullBudget = false,
    maxUnitsPerItem = 20,
  } = opts;

  // Filter opportunities by quality criteria.
  const filtered = opportunities.filter((opp) => {
    if (opp.bmConsistency < minConsistency) return false;
    if (opp.bmVolume7d < minVolume) return false;
    if (opp.margin < minMargin) return false;
    if (maxAgeHours > 0) {
      const maxAge = opp.buyPriceAgeHours ?? Infinity;
      const bmAge = opp.bmPriceAgeHours ?? Infinity;
      // At least one price must be fresh enough.
      if (maxAge > maxAgeHours && bmAge > maxAgeHours) return false;
    }
    return true;
  });

  // Group by city.
  const byCity = new Map<string, typeof filtered>();
  for (const opp of filtered) {
    const arr = byCity.get(opp.buyCity) ?? [];
    arr.push(opp);
    byCity.set(opp.buyCity, arr);
  }

  // If cityFilter is specified, only optimize that city.
  const cities = cityFilter
    ? [cityFilter].filter((c) => byCity.has(c))
    : Array.from(byCity.keys()).sort();

  // Optimize each city independently.
  const cityPortfolios = cities
    .map((city) =>
      optimizeCity(
        city,
        byCity.get(city) ?? [],
        investment,
        mountMaxLoadKg,
        targetProfit,
        useFullBudget,
        survivalProb,
        bankroll,
        maxUnitsPerItem,
      ),
    )
    .filter((cp) => cp.items.length > 0)
    .sort((a, b) => b.expectedValue - a.expectedValue);

  return {
    cityPortfolios,
    mountMaxLoad: mountMaxLoadKg,
    investment,
    bankroll,
    survivalProb,
    targetProfit,
    opportunitiesConsidered: filtered.length,
  };
}

function fmtSilver(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}
