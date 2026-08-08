// City configuration: refining bonuses, marketplace fees, transport costs.
// All values verified against the Albion Online wiki and community guides.
//
// Sources:
// - https://wiki.albiononline.com/wiki/Resource_return_rate
// - https://www.albioncodex.com/guides/albion-online-return-rate-explained
// - https://wiki.albiononline.com/wiki/Marketplace
// - https://wiki.albiononline.com/wiki/Margin

export interface CityConfig {
  name: string;
  // Refining bonus: which resource type gets +40% return rate in this city.
  // null means no refining bonus (Caerleon, Brecilien, Black Market).
  refiningBonus: RefiningResource | null;
  // Whether this city has a marketplace.
  hasMarket: boolean;
  // Whether this is the Black Market (NPC buyer, different fee structure).
  isBlackMarket: boolean;
}

export type RefiningResource = "ORE" | "WOOD" | "HIDE" | "FIBER" | "ROCK";

export const CITY_CONFIGS: Record<string, CityConfig> = {
  "Fort Sterling": {
    name: "Fort Sterling",
    refiningBonus: "WOOD",
    hasMarket: true,
    isBlackMarket: false,
  },
  Lymhurst: {
    name: "Lymhurst",
    refiningBonus: "FIBER",
    hasMarket: true,
    isBlackMarket: false,
  },
  Martlock: {
    name: "Martlock",
    refiningBonus: "HIDE",
    hasMarket: true,
    isBlackMarket: false,
  },
  Bridgewatch: {
    name: "Bridgewatch",
    refiningBonus: "ROCK",
    hasMarket: true,
    isBlackMarket: false,
  },
  Thetford: {
    name: "Thetford",
    refiningBonus: "ORE",
    hasMarket: true,
    isBlackMarket: false,
  },
  Caerleon: {
    name: "Caerleon",
    refiningBonus: null,
    hasMarket: true,
    isBlackMarket: false,
  },
  Brecilien: {
    name: "Brecilien",
    refiningBonus: null,
    hasMarket: true,
    isBlackMarket: false,
  },
  "Black Market": {
    name: "Black Market",
    refiningBonus: null,
    hasMarket: true,
    isBlackMarket: true,
  },
};

// ---- Marketplace fees ----
// These are universal across all cities (no city-specific tax differences).
// Source: https://wiki.albiononline.com/wiki/Marketplace

// Setup fee for placing a sell order (listing fee). Charged upfront, non-refundable.
export const SELL_ORDER_SETUP_FEE = 0.025; // 2.5%

// Setup fee for placing a buy order. Charged upfront, non-refundable.
export const BUY_ORDER_SETUP_FEE = 0.025; // 2.5%

// Sales tax when a sell order fills. Premium: 4%, non-premium: 8%.
// We default to premium (4%) since most active market players have premium.
export const SALES_TAX_PREMIUM = 0.04;
export const SALES_TAX_NON_PREMIUM = 0.08;

// Total cost of a sell order (setup + sales tax with premium).
export const SELL_ORDER_TOTAL_FEE_PREMIUM = SELL_ORDER_SETUP_FEE + SALES_TAX_PREMIUM; // 6.5%
export const SELL_ORDER_TOTAL_FEE_NON_PREMIUM = SELL_ORDER_SETUP_FEE + SALES_TAX_NON_PREMIUM; // 10.5%

// Black Market: instant sell to buy orders. No setup fee, only sales tax.
export const BLACK_MARKET_SALES_TAX = SALES_TAX_PREMIUM; // 4% with premium

// ---- Refining return rates ----
// Source: https://wiki.albiononline.com/wiki/Resource_return_rate
//
// Royal City without bonus: 15.3% base return rate
// Royal City with bonus: 36.7% base return rate (18% base + 40% specialty = 58% stack → 36.7% effective)
// With focus: 43.5% (no bonus) / 53.9% (with bonus)
//
// We use base rates without focus (most refining is done without focus for volume).
export const RETURN_RATE_NO_BONUS = 0.153; // 15.3%
export const RETURN_RATE_WITH_BONUS = 0.367; // 36.7%
export const RETURN_RATE_WITH_FOCUS_NO_BONUS = 0.435; // 43.5%
export const RETURN_RATE_WITH_FOCUS_BONUS = 0.539; // 53.9%

// ---- Transport costs ----
// Fast travel between royal cities costs roughly 10% of item value.
// Walking/riding is free but risky (PvP in red zones) and time-consuming.
// We default to fast travel cost as a conservative estimate.
export const FAST_TRAVEL_RATE = 0.10; // 10% of item value

// ---- Price freshness ----
// The API returns timestamps for when prices were last observed.
// Prices with timestamp "0001-01-01T00:00:00" mean no data (price is 0).
// We consider prices older than this threshold as "stale" (unreliable).
export const STALE_THRESHOLD_HOURS = 24;
export const STALE_THRESHOLD_MS = STALE_THRESHOLD_HOURS * 60 * 60 * 1000;

// The "zero date" sentinel used by the API when no data exists.
export const ZERO_DATE = "0001-01-01T00:00:00";

// ---- Outlier detection ----
// Opportunities with margins above this threshold are likely false positives
// (mispriced items, troll listings, or data errors).
export const MAX_REALISTIC_MARGIN_PERCENT = 500; // 500%
// Price ratio above this is suspicious (sell price > N × buy price).
export const MAX_REALISTIC_PRICE_RATIO = 10; // 10x

// ---- Helper functions ----

export function getRefiningBonusCity(resource: RefiningResource): string | null {
  for (const [cityName, config] of Object.entries(CITY_CONFIGS)) {
    if (config.refiningBonus === resource) {
      return cityName;
    }
  }
  return null;
}

export function getReturnRateForCity(
  resource: RefiningResource,
  city: string,
  useFocus = false,
): number {
  const config = CITY_CONFIGS[city];
  if (!config) return RETURN_RATE_NO_BONUS;
  const hasBonus = config.refiningBonus === resource;
  if (useFocus) {
    return hasBonus ? RETURN_RATE_WITH_FOCUS_BONUS : RETURN_RATE_WITH_FOCUS_NO_BONUS;
  }
  return hasBonus ? RETURN_RATE_WITH_BONUS : RETURN_RATE_NO_BONUS;
}

export function getSellOrderFees(usePremium = true): number {
  return usePremium ? SELL_ORDER_TOTAL_FEE_PREMIUM : SELL_ORDER_TOTAL_FEE_NON_PREMIUM;
}

export function getTransportCost(itemValue: number, fromCity: string, toCity: string): number {
  if (fromCity === toCity) return 0;
  // Fast travel cost is a percentage of item value.
  // Black Market is in Caerleon, so transport to BM = transport to Caerleon.
  const destCity = toCity === "Black Market" ? "Caerleon" : toCity;
  if (fromCity === destCity) return 0;
  return Math.round(itemValue * FAST_TRAVEL_RATE);
}
