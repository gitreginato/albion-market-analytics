// Refining recipes for Albion Online.
// Raw resources are refined into refined materials at crafting stations.
// Each recipe is 1 raw -> 1 refined (before return rate bonuses).
//
// Sources:
// - https://wiki.albiononline.com/wiki/Resource_return_rate
// - https://www.albioncodex.com/guides/albion-online-return-rate-explained

import {
  getReturnRateForCity,
  getSellOrderFees,
  getTransportCost,
  type RefiningResource,
  RETURN_RATE_NO_BONUS,
  SELL_ORDER_TOTAL_FEE_PREMIUM,
  SELL_ORDER_SETUP_FEE,
  SALES_TAX_PREMIUM,
  BLACK_MARKET_SALES_TAX,
} from "./city-config";

export interface RefiningRecipe {
  rawResourceId: string;
  refinedId: string;
  station: string;
  tier: number;
  resource: RefiningResource;
}

// Raw -> Refined mappings per resource type.
const RESOURCE_PAIRS: { raw: RefiningResource; refined: string; station: string }[] = [
  { raw: "ORE", refined: "METALBAR", station: "Smelter" },
  { raw: "WOOD", refined: "PLANKS", station: "Lumbermill" },
  { raw: "HIDE", refined: "LEATHER", station: "Tannery" },
  { raw: "FIBER", refined: "CLOTH", station: "Weaver" },
  { raw: "ROCK", refined: "STONEBLOCK", station: "Stonemason" },
];

// Refining is available from T3 to T8.
const MIN_TIER = 3;
const MAX_TIER = 8;

export const REFINING_RECIPES: RefiningRecipe[] = (() => {
  const recipes: RefiningRecipe[] = [];
  for (const { raw, refined, station } of RESOURCE_PAIRS) {
    for (let tier = MIN_TIER; tier <= MAX_TIER; tier++) {
      recipes.push({
        rawResourceId: `T${tier}_${raw}`,
        refinedId: `T${tier}_${refined}`,
        station,
        tier,
        resource: raw,
      });
    }
  }
  return recipes;
})();

// Re-export from city-config for backwards compatibility with existing tests.
export const SETUP_FEE_RATE = SELL_ORDER_SETUP_FEE;
export const SALES_TAX_RATE = SALES_TAX_PREMIUM;
export const BLACK_MARKET_SALES_TAX_RATE = BLACK_MARKET_SALES_TAX;
export const BASE_RETURN_RATE = RETURN_RATE_NO_BONUS;

export interface RefiningOpportunity {
  recipe: RefiningRecipe;
  rawCity: string;
  refinedCity: string;
  refineCity: string; // where the refining happens (affects return rate)
  rawPrice: number;
  refinedPrice: number;
  returnRate: number; // actual return rate used (depends on city)
  transportCost: number; // cost to move refined goods to sell city
  effectiveCost: number;
  revenue: number;
  profit: number;
  margin: number;
}

export function calculateRefiningProfit(
  rawPrice: number,
  refinedPrice: number,
  returnRate: number = BASE_RETURN_RATE,
  sellFees: number = SELL_ORDER_TOTAL_FEE_PREMIUM,
  transportCost: number = 0,
): { effectiveCost: number; revenue: number; profit: number; margin: number } {
  // Effective cost: raw price minus the value of returned materials.
  // Return rate means you get back `returnRate` fraction of raw materials,
  // so the net cost per unit produced is rawPrice * (1 - returnRate).
  const effectiveCost = rawPrice * (1 - returnRate);
  // Revenue: refined price minus sell order fees (setup + sales tax) and transport.
  const revenue = refinedPrice * (1 - sellFees) - transportCost;
  const profit = revenue - effectiveCost;
  const margin = effectiveCost > 0 ? (profit / effectiveCost) * 100 : 0;
  return { effectiveCost, revenue, profit, margin };
}

// Calculate refining profit with city-specific return rate.
export function calculateRefiningProfitForCity(
  rawPrice: number,
  refinedPrice: number,
  resource: RefiningResource,
  refineCity: string,
  sellCity: string,
  useFocus = false,
  usePremium = true,
): { effectiveCost: number; revenue: number; profit: number; margin: number; returnRate: number; transportCost: number } {
  const returnRate = getReturnRateForCity(resource, refineCity, useFocus);
  const sellFees = getSellOrderFees(usePremium);
  const transportCost = getTransportCost(refinedPrice, refineCity, sellCity);
  const result = calculateRefiningProfit(rawPrice, refinedPrice, returnRate, sellFees, transportCost);
  return { ...result, returnRate, transportCost };
}
