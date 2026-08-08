// @vitest-environment node

import { beforeEach, describe, expect, it } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  __closeDbForTests,
  __setDbPathForTests,
  upsertPrices,
  getPricesForItem,
  getPricesForItems,
  getAllPrices,
  getPriceCount,
  getDistinctItemCount,
  logScan,
  getRecentScanLogs,
  getLastScanTimestamp,
  type PriceRow,
} from "@/lib/db/repository";

// Use a unique temp DB file per test file to avoid concurrent access issues.
const TEST_DB_PATH = join(tmpdir(), `albion-test-repo-${process.pid}.db`);

function makeRow(itemId: string, city: string, quality = 1): PriceRow {
  return {
    item_id: itemId,
    city,
    quality,
    sell_price_min: 1000,
    sell_price_max: 1100,
    buy_price_min: 900,
    buy_price_max: 950,
    sell_price_min_date: "2026-07-04T10:00:00",
    sell_price_max_date: "2026-07-04T10:00:00",
    buy_price_min_date: "2026-07-04T10:00:00",
    buy_price_max_date: "2026-07-04T10:00:00",
    scanned_at: Date.now(),
  };
}

describe("SQLite repository", () => {
  beforeEach(() => {
    __setDbPathForTests(TEST_DB_PATH);
    __closeDbForTests();
  });

  describe("upsertPrices", () => {
    it("inserts new price rows", () => {
      upsertPrices([
        makeRow("T4_ORE", "Thetford"),
        makeRow("T4_ORE", "Caerleon"),
      ]);
      expect(getPriceCount()).toBe(2);
    });

    it("updates existing rows on conflict (same item + city + quality)", () => {
      upsertPrices([makeRow("T4_ORE", "Thetford")]);
      expect(getPricesForItem("T4_ORE")[0].sell_price_min).toBe(1000);

      // Upsert with new price.
      upsertPrices([{
        ...makeRow("T4_ORE", "Thetford"),
        sell_price_min: 2000,
      }]);
      expect(getPriceCount()).toBe(1); // no duplicate
      expect(getPricesForItem("T4_ORE")[0].sell_price_min).toBe(2000);
    });

    it("handles multiple qualities for same item + city", () => {
      upsertPrices([
        { ...makeRow("T4_BAG", "Thetford"), quality: 1 },
        { ...makeRow("T4_BAG", "Thetford"), quality: 2 },
        { ...makeRow("T4_BAG", "Thetford"), quality: 3 },
      ]);
      expect(getPriceCount()).toBe(3);
      const prices = getPricesForItem("T4_BAG");
      expect(prices).toHaveLength(3);
    });
  });

  describe("getPricesForItem", () => {
    it("returns all rows for a given item", () => {
      upsertPrices([
        makeRow("T4_ORE", "Thetford"),
        makeRow("T4_ORE", "Caerleon"),
        makeRow("T4_WOOD", "Fort Sterling"),
      ]);
      const orePrices = getPricesForItem("T4_ORE");
      expect(orePrices).toHaveLength(2);
      expect(orePrices.every((p) => p.item_id === "T4_ORE")).toBe(true);
    });

    it("returns empty array for non-existent item", () => {
      expect(getPricesForItem("T99_NONEXISTENT")).toEqual([]);
    });
  });

  describe("getPricesForItems", () => {
    it("returns rows for multiple items", () => {
      upsertPrices([
        makeRow("T4_ORE", "Thetford"),
        makeRow("T4_WOOD", "Fort Sterling"),
        makeRow("T4_HIDE", "Martlock"),
      ]);
      const prices = getPricesForItems(["T4_ORE", "T4_WOOD"]);
      expect(prices).toHaveLength(2);
    });

    it("returns empty array for empty input", () => {
      expect(getPricesForItems([])).toEqual([]);
    });
  });

  describe("getAllPrices", () => {
    it("returns all rows in the database", () => {
      upsertPrices([
        makeRow("T4_ORE", "Thetford"),
        makeRow("T4_WOOD", "Fort Sterling"),
      ]);
      expect(getAllPrices()).toHaveLength(2);
    });
  });

  describe("getPriceCount / getDistinctItemCount", () => {
    it("counts total rows and distinct items", () => {
      upsertPrices([
        makeRow("T4_ORE", "Thetford"),
        makeRow("T4_ORE", "Caerleon"),
        makeRow("T4_ORE", "Lymhurst"),
        makeRow("T4_WOOD", "Fort Sterling"),
      ]);
      expect(getPriceCount()).toBe(4);
      expect(getDistinctItemCount()).toBe(2);
    });
  });

  describe("scan_log", () => {
    it("logs scan entries and retrieves them", () => {
      logScan("T4_ORE", 8, 350);
      logScan("T4_WOOD", 8, 320, "timeout");
      const logs = getRecentScanLogs(10);
      expect(logs).toHaveLength(2);
      expect(logs[0].item_id).toBe("T4_WOOD"); // most recent first
      expect(logs[0].error).toBe("timeout");
      expect(logs[1].item_id).toBe("T4_ORE");
      expect(logs[1].error).toBeNull();
    });

    it("getLastScanTimestamp returns the most recent timestamp", () => {
      logScan("T4_ORE", 8, 350);
      const ts1 = getLastScanTimestamp();
      expect(ts1).not.toBeNull();
      // Small delay to ensure different timestamp.
      logScan("T4_WOOD", 8, 320);
      const ts2 = getLastScanTimestamp();
      expect(ts2).toBeGreaterThanOrEqual(ts1!);
    });
  });
});
