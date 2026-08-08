// Price validation: freshness checking and outlier detection.
// Filters unreliable data from the Albion API before computing opportunities.

import { MAX_REALISTIC_MARGIN_PERCENT, MAX_REALISTIC_PRICE_RATIO, ZERO_DATE } from "./city-config";
import type { MarketPrice } from "./types";

export interface PriceValidity {
  isValid: boolean;
  isStale: boolean;
  ageHours: number;
  reason?: string;
}

// Check if a price timestamp is fresh enough to trust.
export function checkPriceFreshness(
  timestamp: string,
  now: Date = new Date(),
  staleThresholdHours = 24,
): PriceValidity {
  if (timestamp === ZERO_DATE) {
    return { isValid: false, isStale: true, ageHours: Infinity, reason: "No data (zero date)" };
  }
  const priceTime = new Date(timestamp);
  if (isNaN(priceTime.getTime())) {
    return { isValid: false, isStale: true, ageHours: Infinity, reason: "Invalid timestamp" };
  }
  const ageMs = now.getTime() - priceTime.getTime();
  const ageHours = ageMs / (60 * 60 * 1000);
  const isStale = ageHours > staleThresholdHours;
  return {
    isValid: !isStale,
    isStale,
    ageHours,
    reason: isStale ? `Stale (${Math.round(ageHours)}h old)` : undefined,
  };
}

// Filter prices to only include fresh, non-zero sell prices.
export function filterValidSellPrices(
  prices: MarketPrice[],
  staleThresholdHours = 24,
): MarketPrice[] {
  const now = new Date();
  return prices.filter((p) => {
    if (p.sell_price_min <= 0) return false;
    const validity = checkPriceFreshness(p.sell_price_min_date, now, staleThresholdHours);
    return validity.isValid;
  });
}

// Filter prices to only include fresh, non-zero buy prices.
export function filterValidBuyPrices(
  prices: MarketPrice[],
  staleThresholdHours = 24,
): MarketPrice[] {
  const now = new Date();
  return prices.filter((p) => {
    if (p.buy_price_max <= 0) return false;
    const validity = checkPriceFreshness(p.buy_price_max_date, now, staleThresholdHours);
    return validity.isValid;
  });
}

// Detect if an opportunity is likely a false positive (outlier).
export interface OutlierCheck {
  isOutlier: boolean;
  reason?: string;
}

export function detectOutlier(
  buyPrice: number,
  sellPrice: number,
  marginPercent: number,
): OutlierCheck {
  if (buyPrice <= 0 || sellPrice <= 0) {
    return { isOutlier: true, reason: "Zero or negative price" };
  }
  const ratio = sellPrice / buyPrice;
  if (ratio > MAX_REALISTIC_PRICE_RATIO) {
    return {
      isOutlier: true,
      reason: `Price ratio ${ratio.toFixed(1)}x exceeds max ${MAX_REALISTIC_PRICE_RATIO}x`,
    };
  }
  if (marginPercent > MAX_REALISTIC_MARGIN_PERCENT) {
    return {
      isOutlier: true,
      reason: `Margin ${marginPercent.toFixed(0)}% exceeds max ${MAX_REALISTIC_MARGIN_PERCENT}%`,
    };
  }
  return { isOutlier: false };
}

// Detect if a sell price is a troll listing by comparing against the median
// of all fresh sell prices for the same item+quality across cities.
// A sell price > 3x the median is almost certainly a troll listing that will
// never sell, so we filter it out.
const TROLL_LISTING_MULTIPLIER = 3;

export function detectTrollListing(
  sellPrice: number,
  allSellPrices: number[],
): OutlierCheck {
  if (allSellPrices.length < 3) return { isOutlier: false };
  const sorted = [...allSellPrices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (median <= 0) return { isOutlier: false };
  if (sellPrice > median * TROLL_LISTING_MULTIPLIER) {
    return {
      isOutlier: true,
      reason: `Sell price ${sellPrice} is ${TROLL_LISTING_MULTIPLIER}x above median ${median} (troll listing)`,
    };
  }
  return { isOutlier: false };
}

// Combined filter: freshness + outlier check for an opportunity.
export function isOpportunityValid(
  buyPrice: number,
  sellPrice: number,
  marginPercent: number,
  buyTimestamp: string,
  sellTimestamp: string,
  staleThresholdHours = 24,
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const buyFreshness = checkPriceFreshness(buyTimestamp, new Date(), staleThresholdHours);
  const sellFreshness = checkPriceFreshness(sellTimestamp, new Date(), staleThresholdHours);
  if (!buyFreshness.isValid) reasons.push(`Buy price ${buyFreshness.reason}`);
  if (!sellFreshness.isValid) reasons.push(`Sell price ${sellFreshness.reason}`);
  const outlier = detectOutlier(buyPrice, sellPrice, marginPercent);
  if (outlier.isOutlier) reasons.push(outlier.reason!);
  return { valid: reasons.length === 0, reasons };
}
