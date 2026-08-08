// Opportunities endpoint: reads from SQLite DB (no real-time fetch).
// The scan endpoint must have been run first to populate the DB.
//
// Query params:
// - region: west | east | europe (default: west, for DB stats only)
// - items: comma-separated item IDs (default: all refining-related items)
// - min_profit: minimum profit threshold (default: 0)
// - limit: max results per category (default: 50, max: 200)
// - use_focus: use refining focus for higher return rates (default: false)
// - use_premium: use premium tax rates 4% vs non-premium 8% (default: true)

import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_SCAN_ITEMS, enrichBmOpportunitiesWithHistory } from "@/lib/albion/opportunities";
import { scanOpportunitiesFromDb } from "@/lib/albion/scanner";
import { getDistinctItemCount, getPriceCount, getAllPrices } from "@/lib/db/repository";
import { getFullCatalog, getItemCategory } from "@/lib/albion/catalog";
import { parseRegion, parseTierFilter, parseCategoryFilter, parseMount, buildPriceDateMaps } from "@/lib/api/params";
import { withRequestLog } from "@/lib/api/observability";

export async function GET(request: NextRequest) {
  return withRequestLog(request, async () => {
    const params = request.nextUrl.searchParams;
    const region = parseRegion(params);
    const minProfitParam = params.get("min_profit");
    const minProfit = minProfitParam ? Number(minProfitParam) : 0;
    const limitParam = params.get("limit");
    const limit = limitParam ? Math.min(Number(limitParam), 200) : 50;
    const useFocus = params.get("use_focus") === "true";
    const usePremium = params.get("use_premium") !== "false";
    // Mount filter: specifies the mount for carry weight calculations.
    const { maxLoadKg: mountMaxLoadKg } = parseMount(params.get("mount"));

    const itemsParam = params.get("items");
    // "all" = use every item in the DB; otherwise use specified items or defaults.
    const useAllItems = itemsParam === "all";
    const tierFilter = parseTierFilter(params.get("tiers"));
    // City route filter: buy_city and/or sell_city to restrict opportunities.
    const buyCityFilter = params.get("buy_city");
    const sellCityFilter = params.get("sell_city");
    // Quality filter: comma-separated qualities like "1,2,3" (1=Normal, 5=Masterpiece).
    const qualityParam = params.get("qualities");
    const qualityFilter = qualityParam
      ? new Set(qualityParam.split(",").map((q) => parseInt(q.trim(), 10)).filter((q) => q >= 1 && q <= 5))
      : null;
    const categoryFilter = parseCategoryFilter(params.get("category"));
    const itemIds = useAllItems
      ? [] // will be populated from DB
      : itemsParam
        ? itemsParam.split(",").map((s) => s.trim()).filter(Boolean)
        : DEFAULT_SCAN_ITEMS;

    // Enrich BM opportunities with historical data (volume, consistency, trend, age).
    const enrichBm = params.get("enrich_bm") === "true";

    // Check if DB has data.
    const itemCount = getDistinctItemCount();
    if (itemCount === 0) {
      return NextResponse.json(
        {
          error: "No data in database. Run a scan first via /api/scan.",
          arbitrage: [],
          blackMarket: [],
          refining: [],
          filteredCount: 0,
          filteredReasons: [],
          dbStats: { totalRows: 0, distinctItems: 0 },
        },
        { status: 200 },
      );
    }

    try {
      // When useAllItems, extract all distinct item IDs from the DB.
      let effectiveItemIds = useAllItems
        ? Array.from(new Set(getAllPrices().map((r) => r.item_id)))
        : itemIds;

      // Apply tier filter if specified.
      if (tierFilter && tierFilter.size > 0) {
        effectiveItemIds = effectiveItemIds.filter((id) => {
          const m = id.match(/^T(\d)/);
          return m && tierFilter.has(parseInt(m[1], 10));
        });
      }
      // Apply category filter if specified.
      if (categoryFilter && categoryFilter.size > 0) {
        effectiveItemIds = effectiveItemIds.filter((id) => categoryFilter.has(getItemCategory(id)));
      }

      // Build name lookup from catalog (PT-BR names).
      let nameLookup: Map<string, string> | undefined;
      try {
        const catalog = await getFullCatalog();
        nameLookup = new Map(catalog.map((item) => [item.id, item.name]));
      } catch {
        // Catalog fetch failed — fall back to item IDs.
      }

      const result = scanOpportunitiesFromDb(effectiveItemIds, {
        minProfit,
        limit,
        useFocus,
        usePremium,
        nameLookup,
        mountMaxLoadKg,
      });

      // Apply city route and quality filters post-calculation.
      let filteredArbitrage = result.arbitrage;
      let filteredBlackMarket = result.blackMarket;
      let filteredRefining = result.refining;

      if (buyCityFilter) {
        filteredArbitrage = filteredArbitrage.filter((o) => o.buyCity === buyCityFilter);
        filteredBlackMarket = filteredBlackMarket.filter((o) => o.buyCity === buyCityFilter);
        filteredRefining = filteredRefining.filter((o) => o.rawCity === buyCityFilter);
      }
      if (sellCityFilter) {
        // For BM, "sell city" is always Black Market — filter by buyCity instead if sell_city=Black Market.
        if (sellCityFilter === "Black Market") {
          // Already filtered by buyCity above; BM sell is always BM.
        } else {
          filteredArbitrage = filteredArbitrage.filter((o) => o.sellCity === sellCityFilter);
          filteredRefining = filteredRefining.filter((o) => o.refinedCity === sellCityFilter);
          filteredBlackMarket = []; // BM sells to Black Market, not to a city.
        }
      }
      if (qualityFilter && qualityFilter.size > 0) {
        filteredArbitrage = filteredArbitrage.filter((o) => qualityFilter.has(o.quality));
        filteredBlackMarket = filteredBlackMarket.filter((o) => qualityFilter.has(o.quality));
      }

      // Enrich BM opportunities with historical data if requested.
      if (enrichBm && filteredBlackMarket.length > 0) {
        const allPrices = getAllPrices();
        const { buyPriceDates, bmPriceDates } = buildPriceDateMaps(allPrices);
        filteredBlackMarket = await enrichBmOpportunitiesWithHistory(
          filteredBlackMarket,
          region,
          buyPriceDates,
          bmPriceDates,
        );
      }

      return NextResponse.json(
        {
          arbitrage: filteredArbitrage,
          blackMarket: filteredBlackMarket,
          refining: filteredRefining,
          filteredCount: result.filteredCount,
          filteredReasons: result.filteredReasons,
          dbStats: {
            totalRows: getPriceCount(),
            distinctItems: itemCount,
          },
        },
        {
          headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
