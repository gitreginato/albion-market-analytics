// Portfolio optimizer endpoint: computes optimal mixed-item investment portfolio
// for Black Market trading.
//
// Query params:
// - region: west | east | europe (default: west)
// - investment: total silver to invest (default: 10M)
// - mount: mount ID for carry weight (default: T5_OX_TRANSPORT)
// - max_concentration: max % of budget per item (default: 25)
// - kelly_fraction: fractional Kelly (default: 0.5 = half Kelly)
// - target_profit: target profit per trip (default: 33M for premium)
// - tiers: comma-separated tier filter
// - category: raw, refined, gear or comma combination
// - min_profit: minimum profit per unit (default: 0)
// - limit: max items to consider (default: 200)

import { NextRequest, NextResponse } from "next/server";
import { scanOpportunitiesFromDb } from "@/lib/albion/scanner";
import { getAllPrices, getDistinctItemCount, getPriceCount } from "@/lib/db/repository";
import { getFullCatalog, getItemCategory } from "@/lib/albion/catalog";
import { optimizePortfolio } from "@/lib/albion/portfolio";
import { enrichBmOpportunitiesWithHistory } from "@/lib/albion/opportunities";
import { parseRegion, parseTierFilter, parseCategoryFilter, parseMount, buildPriceDateMaps } from "@/lib/api/params";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const region = parseRegion(params);
  const investment = Number(params.get("investment") ?? "10000000");
  const bankroll = Number(params.get("bankroll") ?? String(investment));
  const survivalProb = Math.max(0.01, Math.min(0.99, Number(params.get("survival_prob") ?? "0.90")));
  const { mount, maxLoadKg: mountMaxLoadKg } = parseMount(params.get("mount"));
  const targetProfit = Number(params.get("target_profit") ?? "33000000");
  const minProfit = Number(params.get("min_profit") ?? "0");
  const limit = Math.min(Number(params.get("limit") ?? "200"), 500);
  const minConsistency = Number(params.get("min_consistency") ?? "50");
  const maxAgeHours = Number(params.get("max_age_hours") ?? "24");
  const minVolume = Number(params.get("min_volume") ?? "1");
  const minMargin = Number(params.get("min_margin") ?? "0");
  const cityFilter = params.get("city") ?? undefined;
  const useFullBudget = params.get("use_full_budget") === "true";
  const maxUnitsPerItem = Math.max(1, Number(params.get("max_units_per_item") ?? "20"));

  const tierFilter = parseTierFilter(params.get("tiers"));
  const categoryFilter = parseCategoryFilter(params.get("category"));

  if (getDistinctItemCount() === 0) {
    return NextResponse.json(
      { error: "No data in database. Run a scan first." },
      { status: 200 },
    );
  }

  try {
    // Get all item IDs from DB.
    let itemIds = Array.from(new Set(getAllPrices().map((r) => r.item_id)));

    // Apply filters.
    if (tierFilter && tierFilter.size > 0) {
      itemIds = itemIds.filter((id) => {
        const m = id.match(/^T(\d)/);
        return m && tierFilter.has(parseInt(m[1], 10));
      });
    }
    if (categoryFilter && categoryFilter.size > 0) {
      itemIds = itemIds.filter((id) => categoryFilter.has(getItemCategory(id)));
    }

    // Build name lookup.
    let nameLookup: Map<string, string> | undefined;
    try {
      const catalog = await getFullCatalog();
      nameLookup = new Map(catalog.map((item) => [item.id, item.name]));
    } catch {
      // Fall back to item IDs.
    }

    // Calculate opportunities from DB.
    const result = scanOpportunitiesFromDb(itemIds, {
      minProfit,
      limit,
      usePremium: true,
      nameLookup,
      mountMaxLoadKg,
    });

    // Enrich BM opportunities with historical data.
    const allPrices = getAllPrices();
    const { buyPriceDates, bmPriceDates } = buildPriceDateMaps(allPrices);

    const enrichedBm = await enrichBmOpportunitiesWithHistory(
      result.blackMarket,
      region,
      buyPriceDates,
      bmPriceDates,
    );

    // Filter to only items with enriched data (volume + consistency).
    const viableOps = enrichedBm.filter(
      (opp) => opp.bmVolume7d !== undefined && opp.bmConsistency !== undefined && opp.bmConsistency > 0,
    );

    // Run portfolio optimizer — one portfolio per city, sorted by ROI.
    const portfolio = optimizePortfolio(
      viableOps.map((opp) => ({
        itemId: opp.itemId,
        itemName: opp.itemName,
        quality: opp.quality,
        buyCity: opp.buyCity,
        buyPrice: opp.buyPrice,
        blackMarketPrice: opp.blackMarketPrice,
        profit: opp.profit,
        margin: opp.margin,
        itemWeight: opp.itemWeight,
        bmVolume7d: opp.bmVolume7d ?? 0,
        bmConsistency: opp.bmConsistency ?? 0,
        bmPriceTrend: opp.bmPriceTrend ?? "stable",
        buyPriceAgeHours: opp.buyPriceAgeHours,
        bmPriceAgeHours: opp.bmPriceAgeHours,
      })),
      {
        investment,
        mountMaxLoadKg,
        bankroll,
        survivalProb,
        targetProfit,
        minConsistency,
        maxAgeHours,
        minVolume,
        minMargin,
        cityFilter,
        useFullBudget,
        maxUnitsPerItem,
      },
    );

    return NextResponse.json({
      ...portfolio,
      mountName: mount?.name ?? "Unknown",
      dbStats: {
        totalRows: getPriceCount(),
        distinctItems: getDistinctItemCount(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
