import { describe, expect, it } from "vitest";
import {
  checkPriceFreshness,
  filterValidBuyPrices,
  filterValidSellPrices,
  detectOutlier,
  isOpportunityValid,
} from "@/lib/albion/price-validation";
import { ZERO_DATE } from "@/lib/albion/city-config";
import type { MarketPrice } from "@/lib/albion/types";

function makePriceRow(
  sellMin: number,
  sellDate: string,
  buyMax: number = 0,
  buyDate: string = ZERO_DATE,
): MarketPrice {
  return {
    item_id: "T4_ORE",
    city: "Thetford",
    quality: 1,
    sell_price_min: sellMin,
    sell_price_min_date: sellDate,
    sell_price_max: sellMin,
    sell_price_max_date: sellDate,
    buy_price_min: buyMax > 0 ? 1 : 0,
    buy_price_min_date: buyMax > 0 ? buyDate : ZERO_DATE,
    buy_price_max: buyMax,
    buy_price_max_date: buyMax > 0 ? buyDate : ZERO_DATE,
  };
}

describe("checkPriceFreshness", () => {
  it("marks zero-date timestamps as invalid (no data)", () => {
    const result = checkPriceFreshness(ZERO_DATE);
    expect(result.isValid).toBe(false);
    expect(result.isStale).toBe(true);
    expect(result.ageHours).toBe(Infinity);
  });

  it("marks recent timestamps as valid", () => {
    const recent = new Date(Date.now() - 2 * 3600_000).toISOString(); // 2h ago
    const result = checkPriceFreshness(recent);
    expect(result.isValid).toBe(true);
    expect(result.isStale).toBe(false);
    expect(result.ageHours).toBeCloseTo(2, 0);
  });

  it("marks timestamps older than threshold as stale", () => {
    const old = new Date(Date.now() - 48 * 3600_000).toISOString(); // 48h ago
    const result = checkPriceFreshness(old);
    expect(result.isValid).toBe(false);
    expect(result.isStale).toBe(true);
    expect(result.ageHours).toBeGreaterThan(24);
  });

  it("respects custom stale threshold", () => {
    const sixHoursAgo = new Date(Date.now() - 6 * 3600_000).toISOString();
    expect(checkPriceFreshness(sixHoursAgo, new Date(), 24).isValid).toBe(true);
    expect(checkPriceFreshness(sixHoursAgo, new Date(), 3).isValid).toBe(false);
  });

  it("handles invalid timestamp strings", () => {
    const result = checkPriceFreshness("not-a-date");
    expect(result.isValid).toBe(false);
    expect(result.isStale).toBe(true);
  });
});

describe("filterValidSellPrices", () => {
  it("filters out zero sell prices", () => {
    const prices = [
      makePriceRow(0, ZERO_DATE),
      makePriceRow(1000, new Date().toISOString()),
    ];
    expect(filterValidSellPrices(prices)).toHaveLength(1);
  });

  it("filters out stale sell prices", () => {
    const prices = [
      makePriceRow(1000, new Date(Date.now() - 48 * 3600_000).toISOString()),
      makePriceRow(2000, new Date().toISOString()),
    ];
    expect(filterValidSellPrices(prices)).toHaveLength(1);
    expect(filterValidSellPrices(prices)[0].sell_price_min).toBe(2000);
  });
});

describe("filterValidBuyPrices", () => {
  it("filters out zero buy prices", () => {
    const prices = [
      makePriceRow(0, ZERO_DATE, 0),
      makePriceRow(0, ZERO_DATE, 5000, new Date().toISOString()),
    ];
    expect(filterValidBuyPrices(prices)).toHaveLength(1);
  });

  it("filters out stale buy prices", () => {
    const prices = [
      makePriceRow(0, ZERO_DATE, 5000, new Date(Date.now() - 48 * 3600_000).toISOString()),
      makePriceRow(0, ZERO_DATE, 3000, new Date().toISOString()),
    ];
    expect(filterValidBuyPrices(prices)).toHaveLength(1);
  });
});

describe("detectOutlier", () => {
  it("flags price ratios above 10x", () => {
    const result = detectOutlier(100, 2000, 1900);
    expect(result.isOutlier).toBe(true);
    expect(result.reason).toContain("ratio");
  });

  it("flags margins above 500%", () => {
    // buy 100, sell 700 -> 600% margin, ratio 7x (under 10x, but margin triggers)
    const result = detectOutlier(100, 700, 600);
    expect(result.isOutlier).toBe(true);
    expect(result.reason).toContain("Margin");
  });

  it("does not flag reasonable opportunities", () => {
    expect(detectOutlier(1000, 1500, 50).isOutlier).toBe(false);
    expect(detectOutlier(100, 500, 400).isOutlier).toBe(false);
  });

  it("flags zero or negative prices", () => {
    expect(detectOutlier(0, 1000, 100).isOutlier).toBe(true);
    expect(detectOutlier(1000, 0, -100).isOutlier).toBe(true);
  });
});

describe("isOpportunityValid", () => {
  it("returns valid when both prices are fresh and no outlier", () => {
    const now = new Date().toISOString();
    const result = isOpportunityValid(1000, 1500, 50, now, now);
    expect(result.valid).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("returns invalid with reasons when buy price is stale", () => {
    const now = new Date().toISOString();
    const stale = new Date(Date.now() - 48 * 3600_000).toISOString();
    const result = isOpportunityValid(1000, 1500, 50, stale, now);
    expect(result.valid).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons.some((r) => r.includes("Buy"))).toBe(true);
  });

  it("returns invalid when both stale and outlier", () => {
    const stale = new Date(Date.now() - 48 * 3600_000).toISOString();
    const result = isOpportunityValid(100, 5000, 4900, stale, stale);
    expect(result.valid).toBe(false);
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
  });
});
