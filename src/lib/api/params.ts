// Shared API parameter parsing utilities.
// Eliminates duplication across API routes for region, tier, category, mount, and price date maps.

import type { ServerRegion } from "@/lib/albion/types";
import type { ItemCategory } from "@/lib/albion/catalog";
import { getMountById, type Mount } from "@/lib/albion/mounts";
import type { PriceRow } from "@/lib/db/repository";

const VALID_REGIONS: ServerRegion[] = ["west", "east", "europe"];

export function parseRegion(params: URLSearchParams): ServerRegion {
  const raw = params.get("region") as ServerRegion | null;
  if (raw && VALID_REGIONS.includes(raw)) return raw;
  return "west";
}

export function parseTierFilter(param: string | null): Set<number> | null {
  if (!param) return null;
  return new Set(
    param
      .split(",")
      .map((t) => parseInt(t.trim(), 10))
      .filter((t) => t >= 1 && t <= 8),
  );
}

export function parseCategoryFilter(param: string | null): Set<ItemCategory> | null {
  if (!param) return null;
  return new Set(
    param
      .split(",")
      .map((c) => c.trim())
      .filter((c): c is ItemCategory => c === "raw" || c === "refined" || c === "gear"),
  );
}

export function parseMount(param: string | null): { mount: Mount | undefined; maxLoadKg: number } {
  const mount = getMountById(param ?? "T5_OX_TRANSPORT");
  return { mount, maxLoadKg: mount?.maxLoadKg ?? 2676 };
}

// Build price date maps from DB rows for BM enrichment age calculation.
// Returns the most recent sell_price_min_date per item|quality|city (buy side)
// and the most recent buy_price_max_date per item|quality for Black Market.
export function buildPriceDateMaps(allPrices: PriceRow[]): {
  buyPriceDates: Map<string, string>;
  bmPriceDates: Map<string, string>;
} {
  const buyPriceDates = new Map<string, string>();
  const bmPriceDates = new Map<string, string>();
  for (const p of allPrices) {
    const buyKey = `${p.item_id}|${p.quality}|${p.city}`;
    if (p.sell_price_min > 0 && p.sell_price_min_date) {
      const existing = buyPriceDates.get(buyKey);
      if (!existing || p.sell_price_min_date > existing) {
        buyPriceDates.set(buyKey, p.sell_price_min_date);
      }
    }
    if (p.city === "Black Market" && p.buy_price_max > 0 && p.buy_price_max_date) {
      const bmKey = `${p.item_id}|${p.quality}`;
      const existing = bmPriceDates.get(bmKey);
      if (!existing || p.buy_price_max_date > existing) {
        bmPriceDates.set(bmKey, p.buy_price_max_date);
      }
    }
  }
  return { buyPriceDates, bmPriceDates };
}
