import { describe, expect, it } from "vitest";
import {
  CITY_CONFIGS,
  BLACK_MARKET_SALES_TAX,
  SELL_ORDER_TOTAL_FEE_PREMIUM,
  SELL_ORDER_TOTAL_FEE_NON_PREMIUM,
  RETURN_RATE_NO_BONUS,
  RETURN_RATE_WITH_BONUS,
  RETURN_RATE_WITH_FOCUS_NO_BONUS,
  RETURN_RATE_WITH_FOCUS_BONUS,
  FAST_TRAVEL_RATE,
  STALE_THRESHOLD_HOURS,
  MAX_REALISTIC_MARGIN_PERCENT,
  MAX_REALISTIC_PRICE_RATIO,
  getRefiningBonusCity,
  getReturnRateForCity,
  getSellOrderFees,
  getTransportCost,
} from "@/lib/albion/city-config";

describe("CITY_CONFIGS", () => {
  it("maps each resource to its correct bonus city", () => {
    expect(getRefiningBonusCity("ORE")).toBe("Thetford");
    expect(getRefiningBonusCity("WOOD")).toBe("Fort Sterling");
    expect(getRefiningBonusCity("HIDE")).toBe("Martlock");
    expect(getRefiningBonusCity("FIBER")).toBe("Lymhurst");
    expect(getRefiningBonusCity("ROCK")).toBe("Bridgewatch");
  });

  it("returns null for cities with no refining bonus", () => {
    expect(CITY_CONFIGS["Caerleon"].refiningBonus).toBeNull();
    expect(CITY_CONFIGS["Brecilien"].refiningBonus).toBeNull();
    expect(CITY_CONFIGS["Black Market"].refiningBonus).toBeNull();
  });

  it("marks Black Market as isBlackMarket=true", () => {
    expect(CITY_CONFIGS["Black Market"].isBlackMarket).toBe(true);
    expect(CITY_CONFIGS["Caerleon"].isBlackMarket).toBe(false);
  });
});

describe("getReturnRateForCity", () => {
  it("returns bonus rate when refining in the bonus city", () => {
    expect(getReturnRateForCity("ORE", "Thetford")).toBe(RETURN_RATE_WITH_BONUS);
    expect(getReturnRateForCity("WOOD", "Fort Sterling")).toBe(RETURN_RATE_WITH_BONUS);
  });

  it("returns base rate when refining in a non-bonus city", () => {
    expect(getReturnRateForCity("ORE", "Caerleon")).toBe(RETURN_RATE_NO_BONUS);
    expect(getReturnRateForCity("WOOD", "Thetford")).toBe(RETURN_RATE_NO_BONUS);
  });

  it("returns focus rates when useFocus=true", () => {
    expect(getReturnRateForCity("ORE", "Thetford", true)).toBe(RETURN_RATE_WITH_FOCUS_BONUS);
    expect(getReturnRateForCity("ORE", "Caerleon", true)).toBe(RETURN_RATE_WITH_FOCUS_NO_BONUS);
  });

  it("returns base rate for unknown city", () => {
    expect(getReturnRateForCity("ORE", "UnknownCity")).toBe(RETURN_RATE_NO_BONUS);
  });
});

describe("getSellOrderFees", () => {
  it("returns 6.5% for premium (2.5% setup + 4% sales)", () => {
    expect(getSellOrderFees(true)).toBe(SELL_ORDER_TOTAL_FEE_PREMIUM);
    expect(SELL_ORDER_TOTAL_FEE_PREMIUM).toBe(0.065);
  });

  it("returns 10.5% for non-premium (2.5% setup + 8% sales)", () => {
    expect(getSellOrderFees(false)).toBe(SELL_ORDER_TOTAL_FEE_NON_PREMIUM);
    expect(SELL_ORDER_TOTAL_FEE_NON_PREMIUM).toBeCloseTo(0.105, 5);
  });
});

describe("getTransportCost", () => {
  it("returns 0 when origin and destination are the same", () => {
    expect(getTransportCost(1000, "Thetford", "Thetford")).toBe(0);
  });

  it("returns 10% of item value between different cities", () => {
    expect(getTransportCost(1000, "Thetford", "Caerleon")).toBe(100);
    expect(getTransportCost(5000, "Bridgewatch", "Lymhurst")).toBe(500);
  });

  it("treats Black Market as Caerleon for transport", () => {
    // Transport to BM from Caerleon should be 0 (BM is in Caerleon).
    expect(getTransportCost(1000, "Caerleon", "Black Market")).toBe(0);
    // Transport to BM from another city = transport to Caerleon.
    expect(getTransportCost(1000, "Thetford", "Black Market")).toBe(100);
  });
});

describe("constants", () => {
  it("has correct Black Market sales tax (4%)", () => {
    expect(BLACK_MARKET_SALES_TAX).toBe(0.04);
  });

  it("has correct fast travel rate (10%)", () => {
    expect(FAST_TRAVEL_RATE).toBe(0.10);
  });

  it("has 24h stale threshold", () => {
    expect(STALE_THRESHOLD_HOURS).toBe(24);
  });

  it("has reasonable outlier thresholds", () => {
    expect(MAX_REALISTIC_MARGIN_PERCENT).toBe(500);
    expect(MAX_REALISTIC_PRICE_RATIO).toBe(10);
  });

  it("has correct return rate values from wiki", () => {
    expect(RETURN_RATE_NO_BONUS).toBeCloseTo(0.153, 3);
    expect(RETURN_RATE_WITH_BONUS).toBeCloseTo(0.367, 3);
    expect(RETURN_RATE_WITH_FOCUS_NO_BONUS).toBeCloseTo(0.435, 3);
    expect(RETURN_RATE_WITH_FOCUS_BONUS).toBeCloseTo(0.539, 3);
  });
});
