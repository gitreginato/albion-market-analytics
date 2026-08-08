import { describe, expect, it } from "vitest";
import {
  CITIES,
  ITEM_CATALOG,
  findItem,
  searchItems,
} from "@/lib/albion/items";

describe("items catalog", () => {
  describe("searchItems", () => {
    it("returns the first `limit` items when query is empty", () => {
      const result = searchItems("", 5);
      expect(result).toHaveLength(5);
      expect(result).toEqual(ITEM_CATALOG.slice(0, 5));
    });

    it("matches by name (case-insensitive)", () => {
      const result = searchItems("broadsword", 20);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((i) => i.name.toLowerCase().includes("broadsword"))).toBe(true);
    });

    it("matches by item id (case-insensitive)", () => {
      const result = searchItems("t4_bag", 20);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((i) => i.id.toLowerCase().includes("t4_bag"))).toBe(true);
    });

    it("respects the limit parameter", () => {
      const result = searchItems("t", 3);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it("returns empty array when nothing matches", () => {
      expect(searchItems("zzz_nonexistent", 20)).toEqual([]);
    });
  });

  describe("findItem", () => {
    it("returns the item matching the id", () => {
      const item = findItem("T4_BAG");
      expect(item).toBeDefined();
      expect(item?.id).toBe("T4_BAG");
      expect(item?.tier).toBe(4);
    });

    it("returns undefined for unknown id", () => {
      expect(findItem("T99_NONEXISTENT")).toBeUndefined();
    });
  });

  describe("CITIES", () => {
    it("includes all major market hubs", () => {
      expect(CITIES).toContain("Caerleon");
      expect(CITIES).toContain("Bridgewatch");
      expect(CITIES).toContain("Martlock");
      expect(CITIES).toContain("Thetford");
      expect(CITIES).toContain("Lymhurst");
      expect(CITIES).toContain("Fort Sterling");
      expect(CITIES).toContain("Black Market");
    });

    it("is a readonly tuple (no duplicates)", () => {
      const unique = new Set(CITIES);
      expect(unique.size).toBe(CITIES.length);
    });
  });

  describe("ITEM_CATALOG", () => {
    it("every item has a unique id", () => {
      const ids = ITEM_CATALOG.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("every item has tier between 4 and 8", () => {
      for (const item of ITEM_CATALOG) {
        expect(item.tier).toBeGreaterThanOrEqual(4);
        expect(item.tier).toBeLessThanOrEqual(8);
      }
    });
  });
});
