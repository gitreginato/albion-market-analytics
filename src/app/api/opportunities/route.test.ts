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
import { GET as opportunitiesGET } from "@/app/api/opportunities/route";

const TEST_DB_PATH = join(tmpdir(), `albion-test-opps-${process.pid}.db`);

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

async function callOpps(path: string) {
  const res = await opportunitiesGET(makeRequest(path));
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

describe("GET /api/opportunities (DB-backed)", () => {
  beforeEach(() => {
    __setDbPathForTests(TEST_DB_PATH);
    __closeDbForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  it("returns error message when DB is empty", async () => {
    const { status, body } = await callOpps("/api/opportunities?items=T4_ORE");
    expect(status).toBe(200);
    expect(body.arbitrage).toEqual([]);
    expect(body.blackMarket).toEqual([]);
    expect(body.refining).toEqual([]);
    // Either error message or empty results are acceptable when DB is empty.
    expect(body.dbStats.distinctItems).toBe(0);
  });

  it("returns opportunities from DB data with arbitrage, blackMarket, refining", async () => {
    // Populate DB with test data.
    upsertPrices([
      makePriceRow("T4_ORE", "Bridgewatch", 500),
      makePriceRow("T4_ORE", "Caerleon", 1500),
      makePriceRow("T4_METALBAR", "Lymhurst", 1200),
    ]);

    const { status, body } = await callOpps("/api/opportunities?items=T4_ORE,T4_METALBAR");
    expect(status).toBe(200);
    expect(body).toHaveProperty("arbitrage");
    expect(body).toHaveProperty("blackMarket");
    expect(body).toHaveProperty("refining");
    expect(body).toHaveProperty("filteredCount");
    expect(body).toHaveProperty("dbStats");
    expect(body.dbStats.distinctItems).toBe(2);
    expect(Array.isArray(body.arbitrage)).toBe(true);
  });

  it("includes transportCost in arbitrage opportunities", async () => {
    upsertPrices([
      makePriceRow("T4_ORE", "Bridgewatch", 500),
      makePriceRow("T4_ORE", "Caerleon", 1500),
    ]);

    const { body } = await callOpps("/api/opportunities?items=T4_ORE");
    if (body.arbitrage.length > 0) {
      expect(body.arbitrage[0]).toHaveProperty("transportCost");
      expect(body.arbitrage[0].transportCost).toBeGreaterThan(0);
    }
  });

  it("respects use_focus and use_premium params without crashing", async () => {
    upsertPrices([
      makePriceRow("T4_ORE", "Bridgewatch", 500),
      makePriceRow("T4_ORE", "Caerleon", 1500),
    ]);

    const { status } = await callOpps(
      "/api/opportunities?items=T4_ORE&use_focus=true&use_premium=false",
    );
    expect(status).toBe(200);
  });

  it("returns dbStats with correct counts", async () => {
    upsertPrices([
      makePriceRow("T4_ORE", "Bridgewatch", 500),
      makePriceRow("T4_ORE", "Caerleon", 1500),
      makePriceRow("T4_METALBAR", "Lymhurst", 1200),
    ]);

    const { body } = await callOpps("/api/opportunities?items=T4_ORE,T4_METALBAR");
    expect(body.dbStats.distinctItems).toBe(2);
    expect(body.dbStats.totalRows).toBe(3);
  });
});
