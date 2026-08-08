// Black Market projections: uses historical BM data + current city prices
// to project consistent profit margins and trading volume.
//
// Flow: buy instantly (sell_min in city) → transport → sell instantly (buy_max in BM)
// No setup fee (2.5%) on instant sell to buy order.
// Sales tax: 8% non-premium, 4% premium.

import { getHistory } from "./client";
import { getAllPrices } from "@/lib/db/repository";
import { getItemWeight, getUnitsPerLoad } from "./mounts";
import { getItemCategory, getFullCatalog, type ItemCategory } from "./catalog";
import { getTransportCost, SALES_TAX_PREMIUM, SALES_TAX_NON_PREMIUM } from "./city-config";
import { checkPriceFreshness } from "./price-validation";
import type { HistoryLocation, MarketPrice, ServerRegion } from "./types";

export interface BmProjection {
  itemId: string;
  itemName: string;
  quality: number;
  category: ItemCategory;
  tier: number;
  // Current buy price (sell_min in city = buy instantly)
  buyCity: string;
  buyPrice: number;
  // Current BM sell price (buy_max = sell instantly)
  bmPriceNow: number;
  // Historical BM averages
  bmAvg1d: number;
  bmAvg7d: number;
  bmAvg30d: number;
  // Historical volume (items sold per day on average)
  volume1d: number;
  volume7d: number;
  volume30d: number;
  // Projected margins (using historical avg as sell price)
  marginNow: number;
  margin7d: number;
  margin30d: number;
  // Projected margin using trend regression (7 days ahead)
  projectedMargin7d: number;
  // Daily price trend (silver/day) over 7d and 30d windows
  trend7d: number;
  trend30d: number;
  // Consistency: % of days in 30d where projected profit was positive
  consistency: number;
  // Profit per unit (using 7d projection)
  profitPerUnit: number;
  // Mount-based calculations
  itemWeight: number;
  unitsPerLoad: number;
  profitPerLoad: number;
  // Transport mode
  transportCost: number;
  transportMode: "fast" | "manual";
}

export interface ProjectionOptions {
  region?: ServerRegion;
  tier?: number;
  tiers?: number[];
  category?: ItemCategory;
  categories?: ItemCategory[];
  usePremium?: boolean;
  mountMaxLoadKg?: number;
  transportMode?: "fast" | "manual";
  minMargin?: number;
  minVolume?: number;
  minConsistency?: number;
  qualities?: number[];
  limit?: number;
}

// Fetch BM history for a batch of items (time-scale=24 = daily aggregates).
async function fetchBmHistoryBatch(
  itemIds: string[],
  region: ServerRegion,
): Promise<Map<string, HistoryLocation[]>> {
  const result = new Map<string, HistoryLocation[]>();
  // URL limit ~4096 chars. Each item ID ~15 chars + comma.
  const BATCH_SIZE = 200;
  for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
    const batch = itemIds.slice(i, i + BATCH_SIZE);
    try {
      const data = await getHistory({
        itemIds: batch,
        locations: ["Black Market"],
        timeScale: 24,
        region,
      });
      for (const loc of data) {
        const key = `${loc.item_id}|${loc.quality}`;
        result.set(key, [loc]);
      }
    } catch {
      // Skip failed batches.
    }
  }
  return result;
}

// Calculate average and volume from history data for a given period.
function calcHistoryStats(
  data: { item_count: number; avg_price: number; timestamp: string }[] | undefined,
  days: number,
): { avgPrice: number; volume: number } {
  if (!data || data.length === 0) return { avgPrice: 0, volume: 0 };
  const sorted = [...data].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const recent = sorted.slice(-days);
  if (recent.length === 0) return { avgPrice: 0, volume: 0 };
  const avgPrice = Math.round(
    recent.reduce((sum, e) => sum + e.avg_price, 0) / recent.length,
  );
  // Volume = total items sold in period / days = daily average
  const totalItems = recent.reduce((sum, e) => sum + e.item_count, 0);
  const volume = Math.round(totalItems / recent.length);
  return { avgPrice, volume };
}

// Calculate consistency: % of days where projected profit was positive.
function calcConsistency(
  data: { item_count: number; avg_price: number; timestamp: string }[] | undefined,
  buyPrice: number,
  salesTaxRate: number,
  transportCost: number,
): number {
  if (!data || data.length === 0) return 0;
  const profitable = data.filter((e) => {
    const revenue = e.avg_price * (1 - salesTaxRate) - transportCost;
    return revenue > buyPrice;
  });
  return Math.round((profitable.length / data.length) * 100);
}

export async function calculateBmProjections(
  options: ProjectionOptions = {},
): Promise<{ projections: BmProjection[]; filteredCount: number }> {
  const {
    region = "west",
    tier = 6,
    tiers,
    category,
    categories,
    usePremium = false,
    mountMaxLoadKg,
    transportMode = "fast",
    minMargin = 0,
    minVolume = 0,
    minConsistency = 0,
    qualities,
    limit = 100,
  } = options;

  // Build tier set: if tiers[] provided, use it; otherwise use single tier.
  const tierSet = new Set<number>(tiers && tiers.length > 0 ? tiers : [tier]);

  // Build category set: if categories[] provided, use it; otherwise use single category.
  const categorySet = new Set<ItemCategory | undefined>();
  if (categories && categories.length > 0) {
    categories.forEach((c) => categorySet.add(c));
  } else if (category) {
    categorySet.add(category);
  }

  const qualitySet = qualities && qualities.length > 0 ? new Set(qualities) : null;

  const salesTaxRate = usePremium ? SALES_TAX_PREMIUM : SALES_TAX_NON_PREMIUM;

  // 1. Get all item IDs from DB that match the tier/category filter.
  const allPrices = getAllPricesForProjections();
  let itemIds = Array.from(new Set(allPrices.map((p) => p.item_id)));

  // Filter by tiers (multi-select).
  itemIds = itemIds.filter((id) => {
    const m = id.match(/^T(\d)/);
    return m && tierSet.has(parseInt(m[1], 10));
  });

  // Filter by categories (multi-select) if specified.
  if (categorySet.size > 0) {
    itemIds = itemIds.filter((id) => categorySet.has(getItemCategory(id)));
  }

  if (itemIds.length === 0) {
    return { projections: [], filteredCount: 0 };
  }

  // 2. Fetch BM history for all items.
  const bmHistory = await fetchBmHistoryBatch(itemIds, region);

  // 3. Build name lookup.
  let nameLookup = new Map<string, string>();
  try {
    const catalog = await getFullCatalog();
    nameLookup = new Map(catalog.map((c) => [c.id, c.name]));
  } catch {
    // Fallback to item IDs.
  }

  // 4. Group current prices by item+city+quality.
  const byItem = new Map<string, MarketPrice[]>();
  for (const p of allPrices) {
    if (!itemIds.includes(p.item_id)) continue;
    const arr = byItem.get(p.item_id) ?? [];
    arr.push(p);
    byItem.set(p.item_id, arr);
  }

  const projections: BmProjection[] = [];
  let filteredCount = 0;

  for (const itemId of itemIds) {
    const prices = byItem.get(itemId);
    if (!prices) continue;

    const itemName = nameLookup.get(itemId) ?? itemId;
    const itemCat = getItemCategory(itemId);
    const itemWeight = getItemWeight(itemId);

    // Group by quality.
    const byQuality = new Map<number, MarketPrice[]>();
    for (const p of prices) {
      const arr = byQuality.get(p.quality) ?? [];
      arr.push(p);
      byQuality.set(p.quality, arr);
    }

    for (const [quality, qPrices] of byQuality) {
      // Filter by quality if specified.
      if (qualitySet && !qualitySet.has(quality)) continue;

      // Find cheapest fresh sell_min in a non-BM city (buy instantly).
      let bestCity: string | null = null;
      let bestSellMin = Infinity;
      for (const p of qPrices) {
        if (p.city === "Black Market") continue;
        if (p.sell_price_min <= 0) continue;
        const freshness = checkPriceFreshness(p.sell_price_min_date);
        if (!freshness.isValid) continue;
        if (p.sell_price_min < bestSellMin) {
          bestSellMin = p.sell_price_min;
          bestCity = p.city;
        }
      }
      if (!bestCity || bestSellMin === Infinity) continue;

      // Find BM buy_max for this quality (sell instantly).
      const bmPrice = qPrices.find((p) => p.city === "Black Market");
      if (!bmPrice || bmPrice.buy_price_max <= 0) continue;
      const bmFreshness = checkPriceFreshness(bmPrice.buy_price_max_date);
      if (!bmFreshness.isValid) continue;

      // Get BM history for this item+quality.
      const historyKey = `${itemId}|${quality}`;
      const historyLoc = bmHistory.get(historyKey);
      const historyData = historyLoc?.[0]?.data;

      const stats1d = calcHistoryStats(historyData, 1);
      const stats7d = calcHistoryStats(historyData, 7);
      const stats30d = calcHistoryStats(historyData, 30);

      // Transport cost.
      const transportCost =
        transportMode === "fast"
          ? getTransportCost(bestSellMin, bestCity, "Black Market")
          : 0;

      // Calculate margins.
      // Margin = (sellPrice * (1 - tax) - transport - buyPrice) / buyPrice * 100
      const calcMargin = (sellPrice: number): number => {
        if (bestSellMin <= 0) return 0;
        const revenue = sellPrice * (1 - salesTaxRate) - transportCost;
        const profit = revenue - bestSellMin;
        return (profit / bestSellMin) * 100;
      };

      const marginNow = calcMargin(bmPrice.buy_price_max);
      const margin7d = calcMargin(stats7d.avgPrice);
      const margin30d = calcMargin(stats30d.avgPrice);

      // Consistency: % of days in 30d where profit was positive.
      const consistency = calcConsistency(
        historyData,
        bestSellMin,
        salesTaxRate,
        transportCost,
      );

      // Profit per unit (using 7d projection as the realistic estimate).
      const profitPerUnit = Math.round(
        stats7d.avgPrice * (1 - salesTaxRate) - transportCost - bestSellMin,
      );

      // Trend analysis via simple linear regression on 7d and 30d history.
      const trend7d = linearRegressionSlope(historyData?.slice(-7) ?? []);
      const trend30d = linearRegressionSlope(historyData?.slice(-30) ?? []);
      const projectedPrice7d = Math.round(stats7d.avgPrice + trend7d * 7);
      const projectedMargin7d = calcMargin(projectedPrice7d);

      // Filter by min margin and min volume.
      if (margin7d < minMargin) {
        filteredCount++;
        continue;
      }
      if (stats7d.volume < minVolume) {
        filteredCount++;
        continue;
      }
      if (minConsistency > 0 && consistency < minConsistency) {
        filteredCount++;
        continue;
      }

      const unitsPerLoad = mountMaxLoadKg ? getUnitsPerLoad(itemId, mountMaxLoadKg) : 0;

      // Extract actual tier from item ID.
      const tierMatch = itemId.match(/^T(\d)/);
      const actualTier = tierMatch ? parseInt(tierMatch[1], 10) : tier;

      projections.push({
        itemId,
        itemName,
        quality,
        category: itemCat,
        tier: actualTier,
        buyCity: bestCity,
        buyPrice: bestSellMin,
        bmPriceNow: bmPrice.buy_price_max,
        bmAvg1d: stats1d.avgPrice,
        bmAvg7d: stats7d.avgPrice,
        bmAvg30d: stats30d.avgPrice,
        volume1d: stats1d.volume,
        volume7d: stats7d.volume,
        volume30d: stats30d.volume,
        marginNow: Math.round(marginNow * 10) / 10,
        margin7d: Math.round(margin7d * 10) / 10,
        margin30d: Math.round(margin30d * 10) / 10,
        projectedMargin7d: Math.round(projectedMargin7d * 10) / 10,
        trend7d: Math.round(trend7d),
        trend30d: Math.round(trend30d),
        consistency,
        profitPerUnit,
        itemWeight,
        unitsPerLoad,
        profitPerLoad: unitsPerLoad * profitPerUnit,
        transportCost,
        transportMode,
      });
    }
  }

  // Sort by 7d margin descending (most consistent profit first).
  projections.sort((a, b) => b.margin7d - a.margin7d);

  return {
    projections: projections.slice(0, limit),
    filteredCount,
  };
}

// Simple linear regression slope (price change per day) on historical data points.
function linearRegressionSlope(
  data: { item_count: number; avg_price: number; timestamp: string }[],
): number {
  if (data.length < 2) return 0;
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i].avg_price;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

// Helper to get all prices from DB.
function getAllPricesForProjections(): MarketPrice[] {
  const rows = getAllPrices();
  return rows.map((r) => ({
    item_id: r.item_id,
    city: r.city,
    quality: r.quality,
    sell_price_min: r.sell_price_min,
    sell_price_min_date: r.sell_price_min_date,
    sell_price_max: r.sell_price_max,
    sell_price_max_date: r.sell_price_max_date,
    buy_price_min: r.buy_price_min,
    buy_price_min_date: r.buy_price_min_date,
    buy_price_max: r.buy_price_max,
    buy_price_max_date: r.buy_price_max_date,
  }));
}
