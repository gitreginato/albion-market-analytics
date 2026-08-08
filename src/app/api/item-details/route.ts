// Item details endpoint: returns all market data for a single item.
//
// Query params:
// - item_id: item ID (e.g., T4_BAG)
// - quality: quality level 1-5 (default: 1)
// - region: west | east | europe (default: west)
//
// Returns:
// - Prices across all cities (from DB)
// - Black Market history (from Albion Data Project API)
// - Computed metrics (best buy city, best sell city, arbitrage opportunities)

import { NextRequest, NextResponse } from "next/server";
import { getPricesForItem } from "@/lib/db/repository";
import { getHistory } from "@/lib/albion/client";
import { getFullCatalog } from "@/lib/albion/catalog";
import type { ServerRegion } from "@/lib/albion/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const itemId = params.get("item_id");
  const quality = parseInt(params.get("quality") ?? "1", 10);
  const region = (params.get("region") as ServerRegion | null) ?? "west";

  if (!itemId) {
    return NextResponse.json({ error: "item_id is required" }, { status: 400 });
  }

  try {
    // Get all prices for this item from DB.
    const allPrices = getPricesForItem(itemId);
    const qualityPrices = allPrices.filter((p) => p.quality === quality);

    // Get item name from catalog.
    let itemName: string | null = null;
    try {
      const catalog = await getFullCatalog();
      const item = catalog.find((i) => i.id === itemId);
      itemName = item?.name ?? null;
    } catch {
      // Catalog fetch failed — use item ID.
    }

    // Build city price map.
    const cityPrices = qualityPrices.map((p) => ({
      city: p.city,
      quality: p.quality,
      sellPriceMin: p.sell_price_min,
      sellPriceMinDate: p.sell_price_min_date,
      buyPriceMax: p.buy_price_max,
      buyPriceMaxDate: p.buy_price_max_date,
      sellPriceMax: p.sell_price_max,
      buyPriceMin: p.buy_price_min,
      ageHours: p.sell_price_min_date
        ? Math.round((Date.now() - new Date(p.sell_price_min_date).getTime()) / (1000 * 60 * 60))
        : null,
    }));

    // Find best buy (lowest sell_price_min = cheapest to buy instantly) and best sell.
    const validBuyCities = cityPrices.filter((p) => p.sellPriceMin > 0);
    const validSellCities = cityPrices.filter((p) => p.city !== "Black Market" && p.buyPriceMax > 0);
    const bmPrice = cityPrices.find((p) => p.city === "Black Market");

    const bestBuy = validBuyCities.length > 0
      ? validBuyCities.reduce((min, p) => (p.sellPriceMin < min.sellPriceMin ? p : min))
      : null;
    const bestSell = validSellCities.length > 0
      ? validSellCities.reduce((max, p) => (p.buyPriceMax > max.buyPriceMax ? p : max))
      : null;

    // Fetch BM history for this item+quality.
    let bmHistory: { item_count: number; avg_price: number; timestamp: string }[] = [];
    try {
      const historyData = await getHistory({
        itemIds: [itemId],
        locations: ["Black Market"],
        qualities: [quality],
        timeScale: 24,
        region,
      });
      const loc = historyData.find((l) => l.item_id === itemId && l.quality === quality);
      if (loc) bmHistory = loc.data;
    } catch {
      // History fetch failed — return empty.
    }

    // Compute BM stats from history.
    let bmVolume7d = 0, bmAvgPrice7d = 0, bmVolume30d = 0, bmAvgPrice30d = 0;
    let bmConsistency = 0;
    if (bmHistory.length > 0) {
      const sorted = [...bmHistory].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const last7 = sorted.slice(-7);
      const last30 = sorted.slice(-30);
      if (last7.length > 0) {
        bmAvgPrice7d = Math.round(last7.reduce((s, e) => s + e.avg_price, 0) / last7.length);
        bmVolume7d = Math.round(last7.reduce((s, e) => s + e.item_count, 0) / last7.length);
      }
      if (last30.length > 0) {
        bmAvgPrice30d = Math.round(last30.reduce((s, e) => s + e.avg_price, 0) / last30.length);
        bmVolume30d = Math.round(last30.reduce((s, e) => s + e.item_count, 0) / last30.length);
        const active = last30.filter((e) => e.item_count > 0);
        bmConsistency = Math.round((active.length / last30.length) * 100);
      }
    }

    // Compute arbitrage opportunities (buy at bestBuy, sell at each other city).
    const arbitrageOps = validBuyCities.length > 0
      ? cityPrices
          .filter((p) => p.city !== "Black Market" && p.buyPriceMax > 0 && p.city !== bestBuy?.city)
          .map((p) => {
            const profit = p.buyPriceMax * 0.96 - bestBuy!.sellPriceMin * 1.04;
            const margin = bestBuy!.sellPriceMin > 0 ? (profit / bestBuy!.sellPriceMin) * 100 : 0;
            return {
              sellCity: p.city,
              sellPrice: p.buyPriceMax,
              buyPrice: bestBuy!.sellPriceMin,
              profit: Math.round(profit),
              margin: Math.round(margin),
            };
          })
          .filter((op) => op.profit > 0)
          .sort((a, b) => b.profit - a.profit)
      : [];

    // BM opportunity (if BM buy order exists).
    const bmOpportunity = bmPrice && bmPrice.buyPriceMax > 0 && bestBuy
      ? {
          buyCity: bestBuy.city,
          buyPrice: bestBuy.sellPriceMin,
          bmPrice: bmPrice.buyPriceMax,
          profit: Math.round(bmPrice.buyPriceMax * 0.96 - bestBuy.sellPriceMin * 1.04),
          margin: bestBuy.sellPriceMin > 0
            ? Math.round(((bmPrice.buyPriceMax * 0.96 - bestBuy.sellPriceMin * 1.04) / bestBuy.sellPriceMin) * 100)
            : 0,
        }
      : null;

    return NextResponse.json({
      itemId,
      itemName,
      quality,
      cityPrices,
      bestBuy,
      bestSell,
      bmPrice: bmPrice ? { price: bmPrice.buyPriceMax, date: bmPrice.buyPriceMaxDate } : null,
      bmHistory: bmHistory.slice(-30),
      bmStats: { bmVolume7d, bmAvgPrice7d, bmVolume30d, bmAvgPrice30d, bmConsistency },
      arbitrageOps,
      bmOpportunity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
