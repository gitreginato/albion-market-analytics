import { describe, it, expect } from "vitest";
import { calculateRiskScore, optimizePortfolio } from "./portfolio";

describe("calculateRiskScore", () => {
  it("returns low risk for high consistency, high volume, fresh price, up trend", () => {
    const score = calculateRiskScore(100, 50, 30, "up", 1);
    // 100 - 35 (consistency) - 20 (volume) - 0 (fresh) - 0 (up trend) - 0 (margin) = 45
    expect(score).toBe(45);
  });

  it("returns high risk for low consistency, low volume, stale price, down trend", () => {
    const score = calculateRiskScore(10, 1, 50, "down", 48);
    // 100 - 3.5 (consistency) - 0.4 (volume) + 15 (stale) + 10 (down) + 0 (margin) = 121.1 -> capped at 100
    expect(score).toBe(100);
  });

  it("adds risk for abnormally high margin", () => {
    const low = calculateRiskScore(80, 30, 100, "stable", 6);
    const high = calculateRiskScore(80, 30, 600, "stable", 6);
    expect(high).toBeGreaterThan(low);
  });

  it("clamps to 0-100 range", () => {
    const minScore = calculateRiskScore(100, 100, 0, "up", 0);
    expect(minScore).toBeGreaterThanOrEqual(0);
    expect(minScore).toBeLessThanOrEqual(100);
  });
});

describe("optimizePortfolio", () => {
  const baseOpp = {
    itemId: "T4_WEAPON",
    itemName: "Test Weapon",
    quality: 1,
    buyCity: "Martlock",
    buyPrice: 10000,
    blackMarketPrice: 15000,
    profit: 5000,
    margin: 50,
    itemWeight: 1.5,
    bmVolume7d: 100,
    bmConsistency: 90,
    bmPriceTrend: "up" as const,
    buyPriceAgeHours: 2,
    bmPriceAgeHours: 2,
  };

  it("returns empty result when no opportunities", () => {
    const result = optimizePortfolio([], { investment: 10_000_000, mountMaxLoadKg: 1000 });
    expect(result.cityPortfolios).toHaveLength(0);
    expect(result.opportunitiesConsidered).toBe(0);
  });

  it("respects weight constraint", () => {
    const result = optimizePortfolio([baseOpp], {
      investment: 10_000_000,
      mountMaxLoadKg: 10, // only 6 items fit by weight (6 * 1.5 = 9 kg)
      maxUnitsPerItem: 100,
    });
    expect(result.cityPortfolios).toHaveLength(1);
    const cp = result.cityPortfolios[0];
    expect(cp.totalWeight).toBeLessThanOrEqual(10);
  });

  it("respects budget constraint", () => {
    const result = optimizePortfolio([baseOpp], {
      investment: 50_000, // only 5 items fit by budget (5 * 10000 = 50000)
      mountMaxLoadKg: 1000,
      maxUnitsPerItem: 100,
    });
    const cp = result.cityPortfolios[0];
    expect(cp.totalInvestment).toBeLessThanOrEqual(50_000);
  });

  it("respects maxUnitsPerItem constraint", () => {
    const result = optimizePortfolio([baseOpp], {
      investment: 10_000_000,
      mountMaxLoadKg: 10000,
      maxUnitsPerItem: 20,
    });
    const cp = result.cityPortfolios[0];
    const maxQty = Math.max(...cp.items.map((i) => i.quantity));
    expect(maxQty).toBeLessThanOrEqual(20);
  });

  it("calculates EV with survival probability", () => {
    const result = optimizePortfolio([baseOpp], {
      investment: 10_000_000,
      mountMaxLoadKg: 1000,
      survivalProb: 0.90,
      maxUnitsPerItem: 100,
    });
    const cp = result.cityPortfolios[0];
    // EV = p * profit - q * investment
    const expectedEV = 0.90 * cp.totalProfit - 0.10 * cp.totalInvestment;
    expect(cp.expectedValue).toBeCloseTo(expectedEV, 0);
  });

  it("returns negative EV when survival prob is too low", () => {
    const result = optimizePortfolio([baseOpp], {
      investment: 10_000_000,
      mountMaxLoadKg: 1000,
      survivalProb: 0.10, // 10% survival = 90% chance of losing everything
      maxUnitsPerItem: 100,
    });
    const cp = result.cityPortfolios[0];
    expect(cp.expectedValue).toBeLessThan(0);
    expect(cp.kellyFraction).toBeLessThanOrEqual(0);
    expect(cp.recommendedCapital).toBe(0);
  });

  it("calculates ruin probability as q^10", () => {
    const result = optimizePortfolio([baseOpp], {
      investment: 10_000_000,
      mountMaxLoadKg: 1000,
      survivalProb: 0.50,
      maxUnitsPerItem: 100,
    });
    const cp = result.cityPortfolios[0];
    // q = 0.50, ruin = 0.50^10
    expect(cp.ruinProb10Trips).toBeCloseTo(Math.pow(0.50, 10), 10);
  });

  it("filters by minConsistency", () => {
    const lowConsistency = { ...baseOpp, bmConsistency: 30 };
    const result = optimizePortfolio([lowConsistency], {
      investment: 10_000_000,
      mountMaxLoadKg: 1000,
      minConsistency: 50,
    });
    expect(result.cityPortfolios).toHaveLength(0);
  });

  it("filters by minMargin", () => {
    const lowMargin = { ...baseOpp, margin: 10 };
    const result = optimizePortfolio([lowMargin], {
      investment: 10_000_000,
      mountMaxLoadKg: 1000,
      minMargin: 20,
    });
    expect(result.cityPortfolios).toHaveLength(0);
  });

  it("sorts cities by EV descending", () => {
    const opps = [
      { ...baseOpp, buyCity: "CityA", profit: 1000, margin: 10 },
      { ...baseOpp, buyCity: "CityB", profit: 5000, margin: 50 },
      { ...baseOpp, buyCity: "CityC", profit: 3000, margin: 30 },
    ].map((o) => ({ ...o, buyPriceAgeHours: 2, bmPriceAgeHours: 2 }));
    const result = optimizePortfolio(opps, {
      investment: 10_000_000,
      mountMaxLoadKg: 1000,
      maxUnitsPerItem: 100,
    });
    expect(result.cityPortfolios.length).toBeGreaterThan(0);
    for (let i = 1; i < result.cityPortfolios.length; i++) {
      expect(result.cityPortfolios[i].expectedValue).toBeLessThanOrEqual(
        result.cityPortfolios[i - 1].expectedValue,
      );
    }
  });
});
