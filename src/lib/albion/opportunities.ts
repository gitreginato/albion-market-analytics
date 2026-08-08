// Opportunity scanner: fetches prices in batch and computes profit opportunities
// for arbitrage (cross-city), Black Market flipping, and refining.
//
// Incorporates game nuances:
// - City-specific refining bonuses (+40% return rate in bonus city)
// - Correct marketplace fees (2.5% setup + 4% sales tax with premium)
// - Black Market: no setup fee, only 4% sales tax
// - Transport costs between cities (10% of item value for fast travel)
// - Price freshness validation (filters stale data >24h old)
// - Outlier detection (filters unrealistic margins >500% or price ratios >10x)
// - Quality matching for Black Market (buy orders specify quality)

import { getPrices, getHistory } from "./client";
import { CITIES } from "./items";
import {
  BLACK_MARKET_SALES_TAX,
  CITY_CONFIGS,
  getSellOrderFees,
  getTransportCost,
  SELL_ORDER_SETUP_FEE,
  SALES_TAX_PREMIUM,
  SALES_TAX_NON_PREMIUM,
  type RefiningResource,
} from "./city-config";
import {
  checkPriceFreshness,
  detectTrollListing,
  filterValidBuyPrices,
  filterValidSellPrices,
  isOpportunityValid,
} from "./price-validation";
import {
  REFINING_RECIPES,
  calculateRefiningProfitForCity,
  type RefiningOpportunity,
  type RefiningRecipe,
} from "./refining";
import { getItemWeight, getUnitsPerLoad } from "./mounts";
import type { MarketPrice, ServerRegion } from "./types";

// Items to scan by default: all refining-related resources + refined materials.
export const DEFAULT_SCAN_ITEMS: string[] = (() => {
  const ids = new Set<string>();
  for (const recipe of REFINING_RECIPES) {
    ids.add(recipe.rawResourceId);
    ids.add(recipe.refinedId);
  }
  return Array.from(ids);
})();

export interface ArbitrageOpportunity {
  itemId: string;
  itemName: string;
  buyCity: string;
  sellCity: string;
  buyPrice: number;
  sellPrice: number;
  quality: number;
  transportCost: number;
  salesTax: number;
  setupFee: number;
  profit: number;
  margin: number;
  warnings: string[];
  itemWeight: number;
  unitsPerLoad: number;
  profitPerLoad: number;
}

export interface BlackMarketOpportunity {
  itemId: string;
  itemName: string;
  buyCity: string;
  buyPrice: number;
  blackMarketPrice: number;
  quality: number;
  transportCost: number;
  salesTax: number;
  profit: number;
  margin: number;
  warnings: string[];
  itemWeight: number;
  unitsPerLoad: number;
  profitPerLoad: number;
  // Enriched fields (populated by enrichBmOpportunitiesWithHistory)
  bmVolume7d?: number;        // avg items/day the BM buys (7d historical)
  bmVolume30d?: number;       // avg items/day the BM buys (30d historical)
  bmAvgPrice7d?: number;      // avg BM sell price over 7d
  bmAvgPrice30d?: number;     // avg BM sell price over 30d
  bmConsistency?: number;     // % of days in 30d where BM had profitable demand
  bmPriceTrend?: "up" | "down" | "stable"; // current vs 7d avg
  buyPriceAgeHours?: number;  // age of the buy price in hours
  bmPriceAgeHours?: number;   // age of the BM buy_max price in hours
}

// Fetch prices for a list of items across all cities in batched calls.
// Splits into chunks that fit within the 4096 char URL limit.
async function fetchBatchPrices(
  itemIds: string[],
  region: ServerRegion,
): Promise<MarketPrice[]> {
  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLength = 0;
  const suffix = `.json?locations=${CITIES.join(",")}`;

  for (const id of itemIds) {
    const addedLength = id.length + 1;
    if (currentLength + addedLength + suffix.length > 4000 && current.length > 0) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(id);
    currentLength += addedLength;
  }
  if (current.length > 0) chunks.push(current);

  const results: MarketPrice[] = [];
  for (const chunk of chunks) {
    const data = await getPrices({
      itemIds: chunk,
      locations: [...CITIES],
      region,
    }, 20_000); // 20s timeout for batch queries (Albion API can be slow with many items).
    results.push(...data);
  }
  return results;
}

// Group prices by item -> city -> quality -> {sell_min, buy_max, timestamps}.
interface QualityPrice {
  sellMin: number;
  sellMinDate: string;
  buyMax: number;
  buyMaxDate: string;
}

function groupByItemCityQuality(
  prices: MarketPrice[],
): Map<string, Map<string, Map<number, QualityPrice>>> {
  const byItem = new Map<string, Map<string, Map<number, QualityPrice>>>();
  for (const row of prices) {
    if (!byItem.has(row.item_id)) {
      byItem.set(row.item_id, new Map());
    }
    const byCity = byItem.get(row.item_id)!;
    if (!byCity.has(row.city)) {
      byCity.set(row.city, new Map());
    }
    const byQuality = byCity.get(row.city)!;
    byQuality.set(row.quality, {
      sellMin: row.sell_price_min,
      sellMinDate: row.sell_price_min_date,
      buyMax: row.buy_price_max,
      buyMaxDate: row.buy_price_max_date,
    });
  }
  return byItem;
}

// Get the best (lowest) fresh sell price for an item in a city across qualities.
function getBestSellPrice(
  byQuality: Map<number, QualityPrice>,
): { price: number; quality: number; date: string } | null {
  let best: { price: number; quality: number; date: string } | null = null;
  for (const [quality, qp] of byQuality) {
    if (qp.sellMin <= 0) continue;
    const freshness = filterValidSellPrices([{
      item_id: "",
      city: "",
      quality,
      sell_price_min: qp.sellMin,
      sell_price_min_date: qp.sellMinDate,
      sell_price_max: qp.sellMin,
      sell_price_max_date: qp.sellMinDate,
      buy_price_min: 0,
      buy_price_min_date: "",
      buy_price_max: 0,
      buy_price_max_date: "",
    }]);
    if (freshness.length === 0) continue;
    if (!best || qp.sellMin < best.price) {
      best = { price: qp.sellMin, quality, date: qp.sellMinDate };
    }
  }
  return best;
}

// Get the best (highest) fresh buy price for an item in a city at a specific quality.
function getBestBuyPriceAtQuality(
  byQuality: Map<number, QualityPrice>,
  quality: number,
): { price: number; date: string } | null {
  const qp = byQuality.get(quality);
  if (!qp || qp.buyMax <= 0) return null;
  const freshness = filterValidBuyPrices([{
    item_id: "",
    city: "",
    quality,
    sell_price_min: 0,
    sell_price_min_date: "",
    sell_price_max: 0,
    sell_price_max_date: "",
    buy_price_min: 0,
    buy_price_min_date: "",
    buy_price_max: qp.buyMax,
    buy_price_max_date: qp.buyMaxDate,
  }]);
  if (freshness.length === 0) return null;
  return { price: qp.buyMax, date: qp.buyMaxDate };
}

export interface ScanResult {
  arbitrage: ArbitrageOpportunity[];
  blackMarket: BlackMarketOpportunity[];
  refining: RefiningOpportunity[];
  // Count of opportunities filtered out as outliers or stale.
  filteredCount: number;
  filteredReasons: string[];
}

export interface ScanOptions {
  region: ServerRegion;
  itemIds?: string[];
  minProfit?: number;
  limit?: number;
  useFocus?: boolean;
  usePremium?: boolean;
  mountMaxLoadKg?: number;
}

export async function scanOpportunities(opts: ScanOptions): Promise<ScanResult> {
  const { region, minProfit = 0, limit = 50, useFocus = false, usePremium = true, mountMaxLoadKg } = opts;
  const itemIds = opts.itemIds ?? DEFAULT_SCAN_ITEMS;

  const prices = await fetchBatchPrices(itemIds, region);

  return scanOpportunitiesFromPrices(prices, {
    minProfit,
    limit,
    useFocus,
    usePremium,
    mountMaxLoadKg,
  });
}

// Pure function: computes opportunities from already-fetched prices.
// Used by both the real-time scanner and the DB-backed scanner.
export function scanOpportunitiesFromPrices(
  prices: MarketPrice[],
  options: {
    minProfit?: number;
    limit?: number;
    useFocus?: boolean;
    usePremium?: boolean;
    nameLookup?: Map<string, string>;
    mountMaxLoadKg?: number;
  } = {},
): ScanResult {
  const { minProfit = 0, limit = 50, useFocus = false, usePremium = true, mountMaxLoadKg } = options;
  const sellFees = getSellOrderFees(usePremium);

  const byItem = groupByItemCityQuality(prices);

  const nameLookup = options.nameLookup ?? new Map<string, string>();
  for (const price of prices) {
    if (!nameLookup.has(price.item_id)) {
      nameLookup.set(price.item_id, price.item_id);
    }
  }

  const arbitrage: ArbitrageOpportunity[] = [];
  const blackMarket: BlackMarketOpportunity[] = [];
  const refining: RefiningOpportunity[] = [];
  const filteredReasons: string[] = [];

  for (const [itemId, byCity] of byItem) {
    const itemName = nameLookup.get(itemId) ?? itemId;

    // ---- Arbitrage ----
    // Buy at sell_min in one city, place sell order in another city.
    // Must compare same quality — you can't buy Q1 and sell as Q5.
    const qualitiesSeen = new Set<number>();
    for (const byQuality of byCity.values()) {
      for (const q of byQuality.keys()) qualitiesSeen.add(q);
    }

    for (const quality of qualitiesSeen) {
      const cityEntries: { city: string; sellPrice: number; sellDate: string }[] = [];
      for (const [city, byQuality] of byCity) {
        if (city === "Black Market") continue;
        const qp = byQuality.get(quality);
        if (!qp || qp.sellMin <= 0) continue;
        const freshness = filterValidSellPrices([{
          item_id: "", city: "", quality,
          sell_price_min: qp.sellMin, sell_price_min_date: qp.sellMinDate,
          sell_price_max: qp.sellMin, sell_price_max_date: qp.sellMinDate,
          buy_price_min: 0, buy_price_min_date: "",
          buy_price_max: 0, buy_price_max_date: "",
        }]);
        if (freshness.length === 0) continue;
        cityEntries.push({ city, sellPrice: qp.sellMin, sellDate: qp.sellMinDate });
      }

      if (cityEntries.length >= 2) {
        const sorted = cityEntries.sort((a, b) => a.sellPrice - b.sellPrice);
        const cheapest = sorted[0];
        const mostExpensive = sorted[sorted.length - 1];
        if (cheapest.city !== mostExpensive.city && mostExpensive.sellPrice > cheapest.sellPrice) {
          const transportCost = getTransportCost(cheapest.sellPrice, cheapest.city, mostExpensive.city);
          const setupFee = Math.round(mostExpensive.sellPrice * SELL_ORDER_SETUP_FEE);
          const salesTaxRate = usePremium ? SALES_TAX_PREMIUM : SALES_TAX_NON_PREMIUM;
          const salesTax = Math.round(mostExpensive.sellPrice * salesTaxRate);
          const revenue = mostExpensive.sellPrice * (1 - sellFees) - transportCost;
          const profit = revenue - cheapest.sellPrice;
          const margin = cheapest.sellPrice > 0 ? (profit / cheapest.sellPrice) * 100 : 0;

          const validation = isOpportunityValid(
            cheapest.sellPrice,
            mostExpensive.sellPrice,
            margin,
            cheapest.sellDate,
            mostExpensive.sellDate,
          );

          // Troll listing check: sell price > 3x median of all sell prices.
          const allSellPrices = cityEntries.map((e) => e.sellPrice);
          const trollCheck = detectTrollListing(mostExpensive.sellPrice, allSellPrices);

          if (profit > minProfit && validation.valid && !trollCheck.isOutlier) {
            const itemWeight = getItemWeight(itemId);
            const unitsPerLoad = mountMaxLoadKg ? getUnitsPerLoad(itemId, mountMaxLoadKg) : 0;
            arbitrage.push({
              itemId,
              itemName,
              buyCity: cheapest.city,
              sellCity: mostExpensive.city,
              buyPrice: cheapest.sellPrice,
              sellPrice: mostExpensive.sellPrice,
              quality,
              transportCost,
              salesTax,
              setupFee,
              profit: Math.round(profit),
              margin: Math.round(margin * 100) / 100,
              warnings: [],
              itemWeight,
              unitsPerLoad,
              profitPerLoad: unitsPerLoad * Math.round(profit),
            });
          } else if (!validation.valid) {
            filteredReasons.push(`${itemId} Q${quality} arbitrage: ${validation.reasons.join(", ")}`);
          } else if (trollCheck.isOutlier) {
            filteredReasons.push(`${itemId} Q${quality} arbitrage: ${trollCheck.reason}`);
          }
        }
      }
    }

    // ---- Black Market ----
    // Buy at sell_min in a city, sell instantly at BM buy_max at matching quality.
    const bmByQuality = byCity.get("Black Market");
    if (bmByQuality) {
      for (const [city, byQuality] of byCity) {
        if (city === "Black Market") continue;
        const bestSell = getBestSellPrice(byQuality);
        if (!bestSell) {
          // Check if there was a sell price but it was stale.
          for (const [, qp] of byQuality) {
            if (qp.sellMin > 0) {
              const freshness = checkPriceFreshness(qp.sellMinDate);
              if (!freshness.isValid) {
                filteredReasons.push(`${itemId} BM: sell price in ${city} ${freshness.reason}`);
                break;
              }
            }
          }
          continue;
        }

        // Match quality: BM buy order must be at the same quality.
        const bmBuy = getBestBuyPriceAtQuality(bmByQuality, bestSell.quality);
        if (!bmBuy) {
          // Check if there was a buy price at that quality but it was stale.
          const rawBm = bmByQuality.get(bestSell.quality);
          if (rawBm && rawBm.buyMax > 0) {
            const freshness = checkPriceFreshness(rawBm.buyMaxDate);
            if (!freshness.isValid) {
              filteredReasons.push(`${itemId} BM: buy price ${freshness.reason}`);
            }
          }
          continue;
        }

        const transportCost = getTransportCost(bestSell.price, city, "Black Market");
        const salesTax = Math.round(bmBuy.price * BLACK_MARKET_SALES_TAX);
        const revenue = bmBuy.price * (1 - BLACK_MARKET_SALES_TAX) - transportCost;
        const profit = revenue - bestSell.price;
        const margin = bestSell.price > 0 ? (profit / bestSell.price) * 100 : 0;

        const validation = isOpportunityValid(
          bestSell.price,
          bmBuy.price,
          margin,
          bestSell.date,
          bmBuy.date,
        );

        if (profit > minProfit && validation.valid) {
          const itemWeight = getItemWeight(itemId);
          const unitsPerLoad = mountMaxLoadKg ? getUnitsPerLoad(itemId, mountMaxLoadKg) : 0;
          blackMarket.push({
            itemId,
            itemName,
            buyCity: city,
            buyPrice: bestSell.price,
            blackMarketPrice: bmBuy.price,
            quality: bestSell.quality,
            transportCost,
            salesTax,
            profit: Math.round(profit),
            margin: Math.round(margin * 100) / 100,
            warnings: [],
            itemWeight,
            unitsPerLoad,
            profitPerLoad: unitsPerLoad * Math.round(profit),
          });
        } else if (!validation.valid) {
          filteredReasons.push(`${itemId} BM: ${validation.reasons.join(", ")}`);
        }
      }
    }
  }

  // ---- Refining ----
  for (const recipe of REFINING_RECIPES) {
    const rawByCity = byItem.get(recipe.rawResourceId);
    const refinedByCity = byItem.get(recipe.refinedId);
    if (!rawByCity || !refinedByCity) continue;

    // Cheapest fresh raw resource.
    let cheapestRaw: { city: string; price: number; date: string } | null = null;
    for (const [city, byQuality] of rawByCity) {
      const best = getBestSellPrice(byQuality);
      if (best && (!cheapestRaw || best.price < cheapestRaw.price)) {
        cheapestRaw = { city, price: best.price, date: best.date };
      }
    }
    if (!cheapestRaw) continue;

    // For each city where we could sell refined, find the best refine city (bonus city).
    for (const [sellCity, refinedQuality] of refinedByCity) {
      const bestRefined = getBestSellPrice(refinedQuality);
      if (!bestRefined) continue;

      // Try refining in the bonus city for this resource (best return rate).
      const bonusCity = getBonusCityForResource(recipe.resource);
      // Also try refining in the sell city itself (no transport needed).
      const candidateRefineCities = new Set<string>();
      if (bonusCity) candidateRefineCities.add(bonusCity);
      candidateRefineCities.add(sellCity);
      candidateRefineCities.add(cheapestRaw.city);

      for (const refineCity of candidateRefineCities) {
        const result = calculateRefiningProfitForCity(
          cheapestRaw.price,
          bestRefined.price,
          recipe.resource,
          refineCity,
          sellCity,
          useFocus,
          usePremium,
        );

        if (result.profit <= minProfit) continue;

        const validation = isOpportunityValid(
          cheapestRaw.price,
          bestRefined.price,
          result.margin,
          cheapestRaw.date,
          bestRefined.date,
        );

        if (!validation.valid) {
          filteredReasons.push(`${recipe.refinedId} refining: ${validation.reasons.join(", ")}`);
          continue;
        }

        refining.push({
          recipe,
          rawCity: cheapestRaw.city,
          refinedCity: sellCity,
          refineCity,
          rawPrice: cheapestRaw.price,
          refinedPrice: bestRefined.price,
          returnRate: result.returnRate,
          transportCost: result.transportCost,
          effectiveCost: Math.round(result.effectiveCost),
          revenue: Math.round(result.revenue),
          profit: Math.round(result.profit),
          margin: Math.round(result.margin * 100) / 100,
        });
      }
    }
  }

  // Deduplicate refining: keep only the best (highest profit) per recipe.
  const bestRefining = new Map<string, RefiningOpportunity>();
  for (const opp of refining) {
    const key = opp.recipe.refinedId;
    const existing = bestRefining.get(key);
    if (!existing || opp.profit > existing.profit) {
      bestRefining.set(key, opp);
    }
  }

  // Sort by profitPerLoad when mount is specified, otherwise by per-unit profit.
  const sortComparator = mountMaxLoadKg
    ? (a: { profitPerLoad: number; profit: number }, b: { profitPerLoad: number; profit: number }) =>
        b.profitPerLoad - a.profitPerLoad
    : (a: { profitPerLoad: number; profit: number }, b: { profitPerLoad: number; profit: number }) =>
        b.profit - a.profit;
  const sortedArbitrage = arbitrage.sort(sortComparator).slice(0, limit);
  const sortedBlackMarket = blackMarket.sort(sortComparator).slice(0, limit);
  const sortedRefining = Array.from(bestRefining.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);

  return {
    arbitrage: sortedArbitrage,
    blackMarket: sortedBlackMarket,
    refining: sortedRefining,
    filteredCount: filteredReasons.length,
    filteredReasons: filteredReasons.slice(0, 20),
  };
}

function getBonusCityForResource(resource: RefiningResource): string | null {
  for (const [cityName, config] of Object.entries(CITY_CONFIGS)) {
    if (config.refiningBonus === resource) {
      return cityName;
    }
  }
  return null;
}

// Re-export recipe types for convenience.
export type { RefiningRecipe, RefiningOpportunity };

// Enrich Black Market opportunities with historical data:
// - BM volume/day (7d, 30d)
// - BM avg price (7d, 30d)
// - Consistency (% of profitable days in 30d)
// - Price trend (current vs 7d avg)
// - Price age (hours since price was last updated)
export async function enrichBmOpportunitiesWithHistory(
  opportunities: BlackMarketOpportunity[],
  region: ServerRegion,
  buyPriceDates?: Map<string, string>,  // key: "itemId|quality|city" -> date
  bmPriceDates?: Map<string, string>,   // key: "itemId|quality" -> date
): Promise<BlackMarketOpportunity[]> {
  if (opportunities.length === 0) return opportunities;

  // Collect unique item IDs from BM opportunities.
  const itemIds = Array.from(new Set(opportunities.map((o) => o.itemId)));

  // Fetch BM history in batches.
  const historyMap = new Map<string, { item_count: number; avg_price: number; timestamp: string }[]>();
  const BATCH_SIZE = 100;
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
        historyMap.set(key, loc.data);
      }
    } catch (err) {
      console.warn("[opportunities] Failed to fetch history batch:", err);
    }
  }

  const now = Date.now();

  return opportunities.map((opp) => {
    const historyKey = `${opp.itemId}|${opp.quality}`;
    const historyData = historyMap.get(historyKey);

    // Calculate volume and avg price.
    let bmVolume7d = 0, bmVolume30d = 0, bmAvgPrice7d = 0, bmAvgPrice30d = 0;
    let bmConsistency = 0;

    if (historyData && historyData.length > 0) {
      const sorted = [...historyData].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const last7 = sorted.slice(-7);
      const last30 = sorted.slice(-30);

      if (last7.length > 0) {
        bmAvgPrice7d = Math.round(last7.reduce((s, e) => s + e.avg_price, 0) / last7.length);
        bmVolume7d = Math.round(last7.reduce((s, e) => s + e.item_count, 0) / last7.length);
      }
      if (last30.length > 0) {
        bmAvgPrice30d = Math.round(last30.reduce((s, e) => s + e.avg_price, 0) / last30.length);
        bmVolume30d = Math.round(last30.reduce((s, e) => s + e.item_count, 0) / last30.length);
        // Consistency: % of days where selling at BM avg price would have been profitable.
        const profitable = last30.filter((e) => {
          const revenue = e.avg_price * 0.92; // 8% tax (non-premium worst case)
          return revenue > opp.buyPrice;
        });
        bmConsistency = Math.round((profitable.length / last30.length) * 100);
      }
    }

    // Price trend: current BM price vs 7d avg.
    let bmPriceTrend: "up" | "down" | "stable" = "stable";
    if (bmAvgPrice7d > 0) {
      const diff = (opp.blackMarketPrice - bmAvgPrice7d) / bmAvgPrice7d;
      if (diff > 0.05) bmPriceTrend = "up";
      else if (diff < -0.05) bmPriceTrend = "down";
    }

    // Price age in hours.
    let buyPriceAgeHours: number | undefined;
    let bmPriceAgeHours: number | undefined;
    if (buyPriceDates) {
      const dateKey = `${opp.itemId}|${opp.quality}|${opp.buyCity}`;
      const dateStr = buyPriceDates.get(dateKey);
      if (dateStr) {
        const ageMs = now - new Date(dateStr).getTime();
        buyPriceAgeHours = Math.round(ageMs / (1000 * 60 * 60));
      }
    }
    if (bmPriceDates) {
      const dateKey = `${opp.itemId}|${opp.quality}`;
      const dateStr = bmPriceDates.get(dateKey);
      if (dateStr) {
        const ageMs = now - new Date(dateStr).getTime();
        bmPriceAgeHours = Math.round(ageMs / (1000 * 60 * 60));
      }
    }

    return {
      ...opp,
      bmVolume7d,
      bmVolume30d,
      bmAvgPrice7d,
      bmAvgPrice30d,
      bmConsistency,
      bmPriceTrend,
      buyPriceAgeHours,
      bmPriceAgeHours,
    };
  });
}
