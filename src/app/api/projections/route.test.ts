// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  __closeDbForTests,
  __setDbPathForTests,
  upsertPrices,
  type PriceRow,
} from "@/lib/db/repository";
import { GET } from "@/app/api/projections/route";

const TEST_DB_PATH = join(tmpdir(), `albion-test-proj-api-${process.pid}.db`);

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

async function callApi(path: string) {
  const res = await GET(makeRequest(path));
  return { status: res.status, body: await res.json() };
}

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

vi.mock("@/lib/albion/client", () => ({
  getHistory: vi.fn(async ({ itemIds }: { itemIds: string[] }) => {
    const results: unknown[] = [];
    for (const id of itemIds) {
      for (let q = 1; q <= 5; q++) {
        results.push({
          item_id: id,
          location: "Black Market",
          quality: q,
          data: Array.from({ length: 30 }, (_, i) => ({
            item_count: 50,
            avg_price: 1000,
            timestamp: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
          })),
        });
      }
    }
    return results;
  }),
}));

vi.mock("@/lib/albion/catalog", async (orig) => {
  const actual = await orig() as Record<string, unknown>;
  return {
    ...actual,
    getFullCatalog: vi.fn(async () => [
      { id: "T4_ORE", name: "T4 Ore", category: "raw" },
      { id: "T6_ORE", name: "T6 Ore", category: "raw" },
      { id: "T6_PLANKS", name: "T6 Planks", category: "refined" },
      { id: "T6_HELMET", name: "T6 Helmet", category: "gear" },
    ]),
  };
});

describe("GET /api/projections", () => {
  beforeEach(() => {
    __setDbPathForTests(TEST_DB_PATH);
    __closeDbForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  it("returns 200 with empty projections when DB is empty", async () => {
    const { status, body } = await callApi("/api/projections?tier=6");
    expect(status).toBe(200);
    expect(body.projections).toHaveLength(0);
    expect(body.filteredCount).toBe(0);
  });

  it("accepts tiers param (comma-separated)", async () => {
    upsertPrices([
      makePriceRow("T4_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T4_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
    ]);
    const { status, body } = await callApi("/api/projections?tiers=4,6");
    expect(status).toBe(200);
    const tiers = new Set(body.projections.map((p: { tier: number }) => p.tier));
    expect(tiers.has(4)).toBe(true);
    expect(tiers.has(6)).toBe(true);
  });

  it("accepts categories param (comma-separated)", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T6_PLANKS", "Caerleon", 100, 200, 1),
      makePriceRow("T6_PLANKS", "Black Market", 0, 200, 1),
      makePriceRow("T6_HELMET", "Caerleon", 100, 200, 1),
      makePriceRow("T6_HELMET", "Black Market", 0, 200, 1),
    ]);
    const { status, body } = await callApi("/api/projections?tier=6&categories=raw,refined");
    expect(status).toBe(200);
    const cats = new Set(body.projections.map((p: { category: string }) => p.category));
    expect(cats.has("raw")).toBe(true);
    expect(cats.has("refined")).toBe(true);
    expect(cats.has("gear")).toBe(false);
  });

  it("accepts qualities param (comma-separated)", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 2),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 2),
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 3),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 3),
    ]);
    const { status, body } = await callApi("/api/projections?tier=6&qualities=1,3");
    expect(status).toBe(200);
    const qualities = new Set(body.projections.map((p: { quality: number }) => p.quality));
    expect(qualities.has(1)).toBe(true);
    expect(qualities.has(3)).toBe(true);
    expect(qualities.has(2)).toBe(false);
  });

  it("accepts min_consistency param (server-side filter)", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
    ]);
    const { status, body } = await callApi("/api/projections?tier=6&min_consistency=90");
    expect(status).toBe(200);
    expect(body.projections.length).toBeGreaterThan(0);
  });

  it("tiers param overrides single tier param", async () => {
    upsertPrices([
      makePriceRow("T4_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T4_ORE", "Black Market", 0, 200, 1),
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
    ]);
    const { body } = await callApi("/api/projections?tier=4&tiers=6");
    const tiers = new Set(body.projections.map((p: { tier: number }) => p.tier));
    expect(tiers.has(6)).toBe(true);
    expect(tiers.has(4)).toBe(false);
  });

  it("ignores invalid tiers (out of range)", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
    ]);
    const { body } = await callApi("/api/projections?tiers=99,0,abc");
    // Invalid tiers are filtered out; empty array falls back to default tier=6
    expect(body.projections.length).toBeGreaterThan(0);
  });

  it("ignores invalid categories", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
    ]);
    const { body } = await callApi("/api/projections?tier=6&categories=invalid,foo");
    // Invalid categories are filtered out; empty array means no category filter
    expect(body.projections.length).toBeGreaterThan(0);
  });

  it("handles repeated rapid requests without hanging", async () => {
    upsertPrices([
      makePriceRow("T6_ORE", "Caerleon", 100, 200, 1),
      makePriceRow("T6_ORE", "Black Market", 0, 200, 1),
    ]);
    const results = await Promise.all([
      callApi("/api/projections?tier=6"),
      callApi("/api/projections?tier=6"),
      callApi("/api/projections?tier=6"),
    ]);
    for (const { status, body } of results) {
      expect(status).toBe(200);
      expect(body.projections.length).toBeGreaterThan(0);
    }
  });
});
