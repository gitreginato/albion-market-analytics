import { describe, expect, it } from "vitest";
import {
  BASE_RETURN_RATE,
  BLACK_MARKET_SALES_TAX_RATE,
  REFINING_RECIPES,
  SALES_TAX_RATE,
  SETUP_FEE_RATE,
  calculateRefiningProfit,
  calculateRefiningProfitForCity,
} from "@/lib/albion/refining";
import {
  RETURN_RATE_NO_BONUS,
  RETURN_RATE_WITH_BONUS,
  SELL_ORDER_TOTAL_FEE_PREMIUM,
} from "@/lib/albion/city-config";

describe("refining recipes", () => {
  it("generates recipes for all 5 resource types", () => {
    const stations = new Set(REFINING_RECIPES.map((r) => r.station));
    expect(stations).toContain("Smelter");
    expect(stations).toContain("Lumbermill");
    expect(stations).toContain("Tannery");
    expect(stations).toContain("Weaver");
    expect(stations).toContain("Stonemason");
  });

  it("generates recipes for tiers 3 through 8", () => {
    const tiers = new Set(REFINING_RECIPES.map((r) => r.tier));
    expect(tiers).toEqual(new Set([3, 4, 5, 6, 7, 8]));
  });

  it("pairs raw and refined correctly for ore", () => {
    const oreRecipes = REFINING_RECIPES.filter((r) => r.station === "Smelter");
    for (const r of oreRecipes) {
      expect(r.rawResourceId).toBe(`T${r.tier}_ORE`);
      expect(r.refinedId).toBe(`T${r.tier}_METALBAR`);
      expect(r.resource).toBe("ORE");
    }
  });

  it("pairs raw and refined correctly for wood", () => {
    const woodRecipes = REFINING_RECIPES.filter((r) => r.station === "Lumbermill");
    for (const r of woodRecipes) {
      expect(r.rawResourceId).toBe(`T${r.tier}_WOOD`);
      expect(r.refinedId).toBe(`T${r.tier}_PLANKS`);
      expect(r.resource).toBe("WOOD");
    }
  });

  it("has 30 total recipes (5 resources x 6 tiers)", () => {
    expect(REFINING_RECIPES).toHaveLength(30);
  });
});

describe("calculateRefiningProfit", () => {
  it("computes profit for a profitable scenario with correct fees", () => {
    // Raw: 1000, Refined: 1500, return 15.3%, sell fees 6.5% (2.5% setup + 4% sales)
    const result = calculateRefiningProfit(1000, 1500);
    // effectiveCost = 1000 * (1 - 0.153) = 847
    expect(result.effectiveCost).toBeCloseTo(847, 0);
    // revenue = 1500 * (1 - 0.065) - 0 = 1500 * 0.935 = 1402.5
    expect(result.revenue).toBeCloseTo(1402.5, 0);
    // profit = 1402.5 - 847 = 555.5
    expect(result.profit).toBeCloseTo(555.5, 0);
    expect(result.margin).toBeGreaterThan(0);
  });

  it("returns negative profit when refined is cheaper than raw", () => {
    const result = calculateRefiningProfit(2000, 1000);
    expect(result.profit).toBeLessThan(0);
    expect(result.margin).toBeLessThan(0);
  });

  it("applies custom return rate", () => {
    const base = calculateRefiningProfit(1000, 1500, 0);
    const withReturn = calculateRefiningProfit(1000, 1500, 0.5);
    // With 50% return, effective cost should be half of raw.
    expect(withReturn.effectiveCost).toBeCloseTo(500, 0);
    expect(base.effectiveCost).toBeCloseTo(1000, 0);
  });

  it("deducts transport cost from revenue", () => {
    const noTransport = calculateRefiningProfit(1000, 1500, 0.153, 0.065, 0);
    const withTransport = calculateRefiningProfit(1000, 1500, 0.153, 0.065, 100);
    expect(withTransport.revenue).toBeCloseTo(noTransport.revenue - 100, 0);
    expect(withTransport.profit).toBeLessThan(noTransport.profit);
  });

  it("respects the correct tax rates (2.5% setup + 4% sales = 6.5% total)", () => {
    expect(SETUP_FEE_RATE).toBe(0.025);
    expect(SALES_TAX_RATE).toBe(0.04);
    expect(BLACK_MARKET_SALES_TAX_RATE).toBe(0.04);
    expect(SELL_ORDER_TOTAL_FEE_PREMIUM).toBe(0.065);
    expect(BASE_RETURN_RATE).toBeCloseTo(0.153, 3);
  });
});

describe("calculateRefiningProfitForCity", () => {
  it("uses bonus return rate when refining in bonus city", () => {
    // Ore bonus city is Thetford (+40% → 36.7% return rate)
    const inBonusCity = calculateRefiningProfitForCity(1000, 1500, "ORE", "Thetford", "Caerleon");
    // No bonus city (Caerleon has no refining bonus → 15.3%)
    const inNonBonusCity = calculateRefiningProfitForCity(1000, 1500, "ORE", "Caerleon", "Caerleon");

    expect(inBonusCity.returnRate).toBeCloseTo(RETURN_RATE_WITH_BONUS, 3);
    expect(inNonBonusCity.returnRate).toBeCloseTo(RETURN_RATE_NO_BONUS, 3);
    // Bonus city should have lower effective cost (more material returned)
    expect(inBonusCity.effectiveCost).toBeLessThan(inNonBonusCity.effectiveCost);
    expect(inBonusCity.profit).toBeGreaterThan(inNonBonusCity.profit);
  });

  it("uses focus return rates when useFocus=true", () => {
    const noFocus = calculateRefiningProfitForCity(1000, 1500, "ORE", "Thetford", "Caerleon", false);
    const withFocus = calculateRefiningProfitForCity(1000, 1500, "ORE", "Thetford", "Caerleon", true);
    expect(withFocus.returnRate).toBeGreaterThan(noFocus.returnRate);
    expect(withFocus.effectiveCost).toBeLessThan(noFocus.effectiveCost);
  });

  it("calculates transport cost between different cities", () => {
    const sameCity = calculateRefiningProfitForCity(1000, 1500, "ORE", "Thetford", "Thetford");
    const differentCity = calculateRefiningProfitForCity(1000, 1500, "ORE", "Thetford", "Caerleon");
    expect(sameCity.transportCost).toBe(0);
    expect(differentCity.transportCost).toBeGreaterThan(0);
  });

  it("correctly maps each resource to its bonus city", () => {
    // ORE → Thetford, WOOD → Fort Sterling, HIDE → Martlock, FIBER → Lymhurst, ROCK → Bridgewatch
    const ore = calculateRefiningProfitForCity(1000, 1500, "ORE", "Thetford", "Thetford");
    const wood = calculateRefiningProfitForCity(1000, 1500, "WOOD", "Fort Sterling", "Fort Sterling");
    const hide = calculateRefiningProfitForCity(1000, 1500, "HIDE", "Martlock", "Martlock");
    const fiber = calculateRefiningProfitForCity(1000, 1500, "FIBER", "Lymhurst", "Lymhurst");
    const rock = calculateRefiningProfitForCity(1000, 1500, "ROCK", "Bridgewatch", "Bridgewatch");

    expect(ore.returnRate).toBeCloseTo(RETURN_RATE_WITH_BONUS, 3);
    expect(wood.returnRate).toBeCloseTo(RETURN_RATE_WITH_BONUS, 3);
    expect(hide.returnRate).toBeCloseTo(RETURN_RATE_WITH_BONUS, 3);
    expect(fiber.returnRate).toBeCloseTo(RETURN_RATE_WITH_BONUS, 3);
    expect(rock.returnRate).toBeCloseTo(RETURN_RATE_WITH_BONUS, 3);
  });
});
