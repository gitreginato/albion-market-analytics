// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  __closeDbForTests,
  __setDbPathForTests,
  getPricesForItem,
} from "@/lib/db/repository";
import { __resetCacheForTests } from "./client";
import { scanItem, scanBatch, scanItems, scanOpportunitiesFromDb } from "./scanner";
import type { MarketPrice } from "./types";

const TEST_DB_PATH = join(tmpdir(), `albion-test-scanner-${process.pid}.db`);

function makeApiPrice(itemId: string, city: string, quality = 1): MarketPrice {
  return {
    item_id: itemId,
    city,
    quality,
    sell_price_min: 1000,
    sell_price_min_date: new Date().toISOString(),
    sell_price_max: 1100,
    sell_price_max_date: new Date().toISOString(),
    buy_price_min: 900,
    buy_price_min_date: new Date().toISOString(),
    buy_price_max: 950,
    buy_price_max_date: new Date().toISOString(),
  };
}

describe("scanner", () => {
  beforeEach(() => {
    __setDbPathForTests(TEST_DB_PATH);
    __closeDbForTests();
    __resetCacheForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  describe("scanItem", () => {
    it("fetches prices for one item and persists to DB", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          makeApiPrice("T4_ORE", "Thetford"),
          makeApiPrice("T4_ORE", "Caerleon"),
        ],
      } as Response);

      const result = await scanItem("T4_ORE", "west");
      expect(result.citiesScanned).toBe(2);
      expect(result.rowsSaved).toBe(2);
      expect(result.error).toBeNull();

      // Verify DB was populated.
      const dbPrices = getPricesForItem("T4_ORE");
      expect(dbPrices).toHaveLength(2);
      expect(dbPrices[0].item_id).toBe("T4_ORE");
    });

    it("handles API errors gracefully", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: "down" }),
      } as Response);

      const result = await scanItem("T4_ORE", "west");
      expect(result.citiesScanned).toBe(0);
      expect(result.rowsSaved).toBe(0);
      expect(result.error).not.toBeNull();
    });

    it("handles empty API response", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      const result = await scanItem("T99_NONEXISTENT", "west");
      expect(result.citiesScanned).toBe(0);
      expect(result.rowsSaved).toBe(0);
      expect(result.error).toBeNull();
    });
  });

  describe("scanOpportunitiesFromDb", () => {
    it("computes opportunities from DB data without fetching", async () => {
      // Populate DB via scanItem mock.
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { ...makeApiPrice("T4_ORE", "Bridgewatch"), sell_price_min: 500, sell_price_max: 500 },
          { ...makeApiPrice("T4_ORE", "Caerleon"), sell_price_min: 1500, sell_price_max: 1500 },
          { ...makeApiPrice("T4_METALBAR", "Lymhurst"), sell_price_min: 1200, sell_price_max: 1200 },
        ],
      } as Response);

      await scanItem("T4_ORE", "west");
      // Need to also scan T4_METALBAR.
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { ...makeApiPrice("T4_METALBAR", "Lymhurst"), sell_price_min: 1200, sell_price_max: 1200 },
        ],
      } as Response);
      await scanItem("T4_METALBAR", "west");

      // Now compute opportunities from DB — no fetch should happen.
      const fetchCallsBefore = vi.mocked(globalThis.fetch).mock.calls.length;
      const result = scanOpportunitiesFromDb(["T4_ORE", "T4_METALBAR"]);
      const fetchCallsAfter = vi.mocked(globalThis.fetch).mock.calls.length;

      // No additional fetch calls — everything from DB.
      expect(fetchCallsAfter).toBe(fetchCallsBefore);
      expect(result.arbitrage.length).toBeGreaterThan(0);
      expect(result.refining.length).toBeGreaterThan(0);
    });

    it("returns empty arrays when DB has no matching items", () => {
      const result = scanOpportunitiesFromDb(["T99_NONEXISTENT"]);
      expect(result.arbitrage).toEqual([]);
      expect(result.blackMarket).toEqual([]);
      expect(result.refining).toEqual([]);
    });
  });

  describe("scanBatch", () => {
    it("fetches multiple items in one API call and persists to DB", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          makeApiPrice("T4_ORE", "Thetford"),
          makeApiPrice("T4_ORE", "Caerleon"),
          makeApiPrice("T4_WOOD", "Fort Sterling"),
          makeApiPrice("T4_WOOD", "Lymhurst"),
        ],
      } as Response);

      const result = await scanBatch(["T4_ORE", "T4_WOOD"], "west");
      expect(result.rowsSaved).toBe(4);
      expect(result.error).toBeNull();

      // Only 1 fetch call for 2 items.
      expect(vi.mocked(globalThis.fetch).mock.calls).toHaveLength(1);

      // Verify DB has both items.
      expect(getPricesForItem("T4_ORE")).toHaveLength(2);
      expect(getPricesForItem("T4_WOOD")).toHaveLength(2);
    });

    it("handles API errors for the entire batch", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "server error" }),
      } as Response);

      const result = await scanBatch(["T4_ORE", "T4_WOOD"], "west");
      expect(result.rowsSaved).toBe(0);
      expect(result.error).not.toBeNull();
    });
  });

  describe("scanItems with batchSize", () => {
    it("splits items into batches of the specified size", async () => {
      // 4 items with batchSize=2 = 2 batches = 2 fetch calls.
      vi.mocked(globalThis.fetch)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            makeApiPrice("T4_ORE", "Thetford"),
            makeApiPrice("T4_WOOD", "Fort Sterling"),
          ],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            makeApiPrice("T4_HIDE", "Martlock"),
            makeApiPrice("T4_FIBER", "Lymhurst"),
          ],
        } as Response);

      const progressCalls: { itemIndex: number; totalItems: number }[] = [];
      const result = await scanItems(
        ["T4_ORE", "T4_WOOD", "T4_HIDE", "T4_FIBER"],
        "west",
        (p) => progressCalls.push({ itemIndex: p.itemIndex, totalItems: p.totalItems }),
        2, // batchSize=2
      );

      expect(result.itemsScanned).toBe(4);
      expect(result.totalRowsSaved).toBe(4);
      expect(vi.mocked(globalThis.fetch).mock.calls).toHaveLength(2);
      // Progress should show 0 -> 2 -> 4.
      expect(progressCalls[progressCalls.length - 1].itemIndex).toBe(4);
    });

    it("uses default batch size of 20 when not specified", async () => {
      // 25 items with default batchSize=20 = 2 batches (20 + 5).
      const items = Array.from({ length: 25 }, (_, i) => `T4_ITEM${i}`);
      vi.mocked(globalThis.fetch)
        .mockResolvedValue({ ok: true, status: 200, json: async () => [] } as Response);

      await scanItems(items, "west", undefined);

      // 25 items / 20 per batch = 2 batches.
      expect(vi.mocked(globalThis.fetch).mock.calls).toHaveLength(2);
    });
  });
});
