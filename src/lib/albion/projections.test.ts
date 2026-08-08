// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  __closeDbForTests,
  __setDbPathForTests,
  upsertPrices,
  type PriceRow,
} from "@/lib/db/repository";
import { calculateBmProjections } from "@/lib/albion/projections";
import type { HistoryLocation } from "@/lib/albion/types";

const TEST_DB_PATH = join(tmpdir(), `albion-test-proj-${process.pid}.db`);

function freshDate() {
  return new Date().toISOString();
}

function makePriceRow(
  itemId: string,
  city: string,
  sellMin: number,
  buyMax: number = 0,
  quality = 1,
): PriceRow {
  return {
    item_id: itemId,
    city,
    quality,
    sell_price_min: sellMin,
    sell_price_max: sellMin,
    buy_price_min: buyMax > 0 ? 1 : 0,
    buy_price_max: buyMax,
    sell_price_min_date: sellMin > 0 ? freshDate() : "0001-01-01T00:00:00",
    sell_price_max_date: sellMin > 0 ? freshDate() : "0001-01-01T00:00:00",
    buy_price_min_date: buyMax > 0 ? freshDate() : "0001-01-01T00:00:00",
    buy_price_max_date: buyMax > 0 ? freshDate() : "0001-01-01T00:00:00",
    scanned_at: Date.now(),
  };
}

// Mock getHistory to return controlled BM history data for all qualities 1-5.
function mockHistory(itemIds: string[], avgPrice: number, volume: number): HistoryLocation[] {
  const results: HistoryLocation[] = [];
  for (const id of itemIds) {
    for (let q = 1; q <= 5; q++) {
      results.push({
        item_id: id,
        location: "Black Market",
        quality: q,
        data: Array.from({ length: 30 }, (_, i) => ({
          item_count: volume,
          avg_price: avgPrice,
          timestamp: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
        })),
      });
    }
  }
  return results;
}

vi.mock("@/lib/albion/client", () => ({
  getHistory: vi.fn(async ({ itemIds }: { itemIds: string[] }) => mockHistory(itemIds, 1000, 50)),
}));

vi.mock("@/lib/albion/catalog", async (orig) => {
  const actual = await orig() as Record<string, unknown>;
  return {
    ...actual,
    getFullCatalog: vi.fn(async () => [
      { id: "T4_ORE", name: "T4 Ore", category: "raw" },
      { id: "T5_ORE", name: "T5 Ore", category: "raw" },
      { id: "T6_ORE", name: "T6 Ore", category: "raw" },
      { id: "T7_ORE", name: "T7 Ore", category: "raw" },
      { id: "T8_ORE", name: "T8 Ore", category: "raw" },
      { id: "T4_PLANKS", name: "T4 Planks", category: "refined" },
      { id: "T6_PLANKS", name: "T6 Planks", category: "refined" },
      { id: "T4_HELMET", name: "T4 Helmet", category: "gear" },
      { id: "T6_HELMET", name: "T6 Helmet", category: "gear" },
    ]),
  };
});

describe("calculateBmProjections", () => {
  beforeEach(() => {
    __setDbPathForTests(TEST_DB_PATH);
    __closeDbForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  it("returns empty when DB has no prices", async () => {
    const result = await calculateBmProjections({ tier: 6 });
    expect(result.projections).toHaveLength(0);
    expect(result.filteredCount).toBe(0);
  });

  it("filters by single tier (backward compat)", async () => {
    upsertPrices([
      makePriceRow("T5_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T5_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
    ]);
    const result = await calculateBmProjections({ tier: 6 });
    const tiers = new Set(result.projections.map((p) => p.tier));
    expect(tiers.has(6)).toBe(true);
    expect(tiers.has(5)).toBe(false);
  });

  it("filters by multiple tiers (tiers[] param)", async () => {
    upsertPrices([
      makePriceRow("T4_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T4_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T5_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T5_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T7_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T7_ORE", "Black Market", 0, 200, 1),
    ]);
    const result = await calculateBmProjections({ tiers: [4, 6] });
    const tiers = new Set(result.projections.map((p) => p.tier));
    expect(tiers.has(4)).toBe(true);
    expect(tiers.has(6)).toBe(true);
    expect(tiers.has(5)).toBe(false);
    expect(tiers.has(7)).toBe(false);
  });

  it("filters by multiple categories", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T6_PLANKS", "Caerleon", 100, 200, 1),
      makePriceRow("T6_PLANKS", "Black Market", 0, 200, 1),
      makePriceRow("T6_HELMET", "Caerleon", 100, 200, 1),
      makePriceRow("T6_HELMET", "Black Market", 0, 200, 1),
    ]);
    const result = await calculateBmProjections({
      tier: 6,
      categories: ["raw", "refined"],
    });
    const cats = new Set(result.projections.map((p) => p.category));
    expect(cats.has("raw")).toBe(true);
    expect(cats.has("refined")).toBe(true);
    expect(cats.has("gear")).toBe(false);
  });

  it("filters by quality (qualities[] param)", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 2),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 2),
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 3),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 3),
    ]);
    const result = await calculateBmProjections({
      tier: 6,
      qualities: [1, 3],
    });
    const qualities = new Set(result.projections.map((p) => p.quality));
    expect(qualities.has(1)).toBe(true);
    expect(qualities.has(3)).toBe(true);
    expect(qualities.has(2)).toBe(false);
  });

  it("filters by minConsistency server-side", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
    ]);
    // With avg_price=1000 and buy=100, all 30 days are profitable → consistency=100
    const result = await calculateBmProjections({
      tier: 6,
      minConsistency: 90,
    });
    expect(result.projections.length).toBeGreaterThan(0);

    // Now require impossible consistency
    const result2 = await calculateBmProjections({
      tier: 6,
      minConsistency: 101,
    });
    expect(result2.projections).toHaveLength(0);
  });

  it("tiers[] overrides single tier param", async () => {
    upsertPrices([
      makePriceRow("T4_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T4_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T8_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T8_ORE", "Black Market", 0, 200, 1),
    ]);
    const result = await calculateBmProjections({ tier: 4, tiers: [8] });
    const tiers = new Set(result.projections.map((p) => p.tier));
    expect(tiers.has(8)).toBe(true);
    expect(tiers.has(4)).toBe(false);
  });

  it("categories[] overrides single category param", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T6_HELMET", "Caerleon", 100, 200, 1),
      makePriceRow("T6_HELMET", "Black Market", 0, 200, 1),
    ]);
    const result = await calculateBmProjections({
      tier: 6,
      category: "raw",
      categories: ["gear"],
    });
    const cats = new Set(result.projections.map((p) => p.category));
    expect(cats.has("gear")).toBe(true);
    expect(cats.has("raw")).toBe(false);
  });

  it("returns correct tier in projection object (not the filter tier)", async () => {
    upsertPrices([
      makePriceRow("T4_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T4_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T8_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T8_ORE", "Black Market", 0, 200, 1),
    ]);
    const result = await calculateBmProjections({ tiers: [4, 8] });
    for (const p of result.projections) {
      expect(p.tier).toBe(parseInt(p.itemId.match(/^T(\d)/)![1], 10));
    }
  });
});
