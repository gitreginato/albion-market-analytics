import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetCacheForTests } from "./client";
import {
  DEFAULT_SCAN_ITEMS,
  scanOpportunities,
  type ArbitrageOpportunity,
  type BlackMarketOpportunity,
} from "./opportunities";
import type { MarketPrice } from "./types";

function makePrice(
  itemId: string,
  city: string,
  sellMin: number,
  buyMax: number,
  quality = 1,
  ageHours = 0,
): MarketPrice {
  const date = ageHours === Infinity ? "0001-01-01T00:00:00" : new Date(Date.now() - ageHours * 3600_000).toISOString();
  return {
    item_id: itemId,
    city,
    quality,
    sell_price_min: sellMin,
    sell_price_min_date: sellMin > 0 ? date : "0001-01-01T00:00:00",
    sell_price_max: sellMin,
    sell_price_max_date: sellMin > 0 ? date : "0001-01-01T00:00:00",
    buy_price_min: buyMax > 0 ? 1 : 0,
    buy_price_min_date: buyMax > 0 ? date : "0001-01-01T00:00:00",
    buy_price_max: buyMax,
    buy_price_max_date: buyMax > 0 ? date : "0001-01-01T00:00:00",
  };
}

describe("opportunities scanner", () => {
  beforeEach(() => {
    __resetCacheForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  it("DEFAULT_SCAN_ITEMS includes all refining raw and refined resources", () => {
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_ORE");
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_METALBAR");
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_WOOD");
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_PLANKS");
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_HIDE");
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_LEATHER");
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_FIBER");
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_CLOTH");
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_ROCK");
    expect(DEFAULT_SCAN_ITEMS).toContain("T4_STONEBLOCK");
  });

  it("detects Black Market opportunities with quality matching and transport cost", async () => {
    const prices: MarketPrice[] = [
      // T4_BAG cheap in Bridgewatch (quality 1), BM buys at quality 1.
      makePrice("T4_BAG", "Bridgewatch", 1000, 0, 1),
      makePrice("T4_BAG", "Black Market", 0, 2000, 1),
    ];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => prices,
    } as Response);

    const result = await scanOpportunities({
      region: "west",
      itemIds: ["T4_BAG"],
    });

    expect(result.blackMarket.length).toBeGreaterThan(0);
    const bm = result.blackMarket[0] as BlackMarketOpportunity;
    expect(bm.itemId).toBe("T4_BAG");
    expect(bm.buyCity).toBe("Bridgewatch");
    expect(bm.buyPrice).toBe(1000);
    expect(bm.blackMarketPrice).toBe(2000);
    expect(bm.quality).toBe(1);
    // Transport from Bridgewatch to BM (Caerleon) = 10% of 1000 = 100
    expect(bm.transportCost).toBe(100);
    // Profit = 2000 * (1 - 0.04) - 100 - 1000 = 1920 - 100 - 1000 = 820
    expect(bm.profit).toBe(820);
    expect(bm.profit).toBeGreaterThan(0);
  });

  it("does NOT match BM buy order when quality differs", async () => {
    const prices: MarketPrice[] = [
      // City sells at quality 2, BM only buys at quality 1.
      makePrice("T4_BAG", "Bridgewatch", 1000, 0, 2),
      makePrice("T4_BAG", "Black Market", 0, 2000, 1),
    ];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => prices,
    } as Response);

    const result = await scanOpportunities({
      region: "west",
      itemIds: ["T4_BAG"],
    });

    // No match because quality 2 sell vs quality 1 BM buy.
    expect(result.blackMarket).toHaveLength(0);
  });

  it("detects arbitrage opportunities with transport cost", async () => {
    const prices: MarketPrice[] = [
      makePrice("T4_ORE", "Bridgewatch", 500, 0),
      makePrice("T4_ORE", "Caerleon", 1500, 0),
    ];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => prices,
    } as Response);

    const result = await scanOpportunities({
      region: "west",
      itemIds: ["T4_ORE"],
    });

    expect(result.arbitrage.length).toBeGreaterThan(0);
    const arb = result.arbitrage[0] as ArbitrageOpportunity;
    expect(arb.itemId).toBe("T4_ORE");
    expect(arb.buyCity).toBe("Bridgewatch");
    expect(arb.sellCity).toBe("Caerleon");
    expect(arb.buyPrice).toBe(500);
    expect(arb.sellPrice).toBe(1500);
    // Transport = 10% of 500 = 50
    expect(arb.transportCost).toBe(50);
    // Profit = 1500 * (1 - 0.065) - 50 - 500 = 1402.5 - 50 - 500 = 852.5
    expect(arb.profit).toBeGreaterThan(0);
  });

  it("detects refining opportunities using bonus city return rate", async () => {
    const prices: MarketPrice[] = [
      // T4_ORE cheap, T4_METALBAR expensive -> profitable refining.
      makePrice("T4_ORE", "Bridgewatch", 500, 0),
      makePrice("T4_METALBAR", "Lymhurst", 1200, 0),
    ];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => prices,
    } as Response);

    const result = await scanOpportunities({
      region: "west",
      itemIds: ["T4_ORE", "T4_METALBAR"],
    });

    expect(result.refining.length).toBeGreaterThan(0);
    const ref = result.refining[0];
    expect(ref.recipe.rawResourceId).toBe("T4_ORE");
    expect(ref.recipe.refinedId).toBe("T4_METALBAR");
    expect(ref.rawPrice).toBe(500);
    expect(ref.refinedPrice).toBe(1200);
    // Should use Thetford (bonus city for ORE) for best return rate.
    expect(ref.returnRate).toBeGreaterThan(0.15); // 36.7% with bonus
    expect(ref.profit).toBeGreaterThan(0);
  });

  it("filters out opportunities with stale price data (>24h old)", async () => {
    const prices: MarketPrice[] = [
      // Buy price is fresh, sell price is 48h old (stale).
      makePrice("T4_BAG", "Bridgewatch", 1000, 0, 1, 0),
      makePrice("T4_BAG", "Black Market", 0, 2000, 1, 48),
    ];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => prices,
    } as Response);

    const result = await scanOpportunities({
      region: "west",
      itemIds: ["T4_BAG"],
    });

    expect(result.blackMarket).toHaveLength(0);
    expect(result.filteredCount).toBeGreaterThan(0);
  });

  it("filters out outlier opportunities (unrealistic margins)", async () => {
    // Buy at 1000, sell at 50000 -> 50x ratio, 4900% margin -> outlier.
    const prices: MarketPrice[] = [
      makePrice("T4_BAG", "Bridgewatch", 1000, 0),
      makePrice("T4_BAG", "Caerleon", 50000, 0),
    ];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => prices,
    } as Response);

    const result = await scanOpportunities({
      region: "west",
      itemIds: ["T4_BAG"],
    });

    expect(result.arbitrage).toHaveLength(0);
    expect(result.filteredCount).toBeGreaterThan(0);
  });

  it("returns empty arrays and filteredCount=0 when no prices exist", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    const result = await scanOpportunities({
      region: "west",
      itemIds: ["T4_BAG"],
    });

    expect(result.arbitrage).toEqual([]);
    expect(result.blackMarket).toEqual([]);
    expect(result.refining).toEqual([]);
    expect(result.filteredCount).toBe(0);
  });

  it("sorts opportunities by profit descending", async () => {
    const prices: MarketPrice[] = [
      makePrice("T4_BAG", "Bridgewatch", 1000, 0),
      makePrice("T4_BAG", "Black Market", 0, 1200, 1),
      makePrice("T5_BAG", "Bridgewatch", 1000, 0),
      makePrice("T5_BAG", "Black Market", 0, 5000, 1),
    ];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => prices,
    } as Response);

    const result = await scanOpportunities({
      region: "west",
      itemIds: ["T4_BAG", "T5_BAG"],
    });

    expect(result.blackMarket.length).toBeGreaterThanOrEqual(2);
    expect(result.blackMarket[0].profit).toBeGreaterThanOrEqual(
      result.blackMarket[1].profit,
    );
  });

  it("includes filteredReasons in the result when opportunities are filtered", async () => {
    const prices: MarketPrice[] = [
      makePrice("T4_BAG", "Bridgewatch", 1000, 0, 1, 48),
      makePrice("T4_BAG", "Black Market", 0, 2000, 1),
    ];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => prices,
    } as Response);

    const result = await scanOpportunities({
      region: "west",
      itemIds: ["T4_BAG"],
    });

    expect(result.filteredReasons.length).toBeGreaterThan(0);
    expect(result.filteredReasons[0]).toContain("T4_BAG");
  });
});
