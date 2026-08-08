import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __disableRetriesForTests,
  __enableRetriesForTests,
  __resetCacheForTests,
  __resetRateLimitForTests,
  getGold,
  getHistory,
  getPrices,
} from "@/lib/albion/client";
import type { HistoryLocation, MarketPrice } from "@/lib/albion/types";

const PRICE_PAYLOAD: MarketPrice[] = [
  {
    item_id: "T4_BAG",
    city: "Caerleon",
    quality: 1,
    sell_price_min: 5000,
    sell_price_min_date: "2026-07-04T10:00:00",
    sell_price_max: 5200,
    sell_price_max_date: "2026-07-04T10:00:00",
    buy_price_min: 4800,
    buy_price_min_date: "2026-07-04T10:00:00",
    buy_price_max: 4900,
    buy_price_max_date: "2026-07-04T10:00:00",
  },
];

const HISTORY_PAYLOAD: HistoryLocation[] = [
  {
    location: "Caerleon",
    item_id: "T4_BAG",
    quality: 1,
    data: [
      { item_count: 10, avg_price: 5000, timestamp: "2026-07-04T00:00:00" },
      { item_count: 12, avg_price: 5100, timestamp: "2026-07-04T06:00:00" },
    ],
  },
];

function mockFetchOnce(payload: unknown, status = 200): void {
  vi.mocked(globalThis.fetch).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response);
}

async function flushRateLimit(): Promise<void> {
  // Allow any queued setTimeout from the rate limiter to run.
  await vi.advanceTimersByTimeAsync(0);
}

describe("albion client", () => {
  beforeEach(() => {
    __resetCacheForTests();
    __resetRateLimitForTests();
    __enableRetriesForTests();
    vi.useFakeTimers();
    vi.mocked(globalThis.fetch).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getPrices", () => {
    it("builds the correct URL for west region with locations and qualities", async () => {
      mockFetchOnce(PRICE_PAYLOAD);
      const promise = getPrices({
        itemIds: ["T4_BAG"],
        locations: ["Caerleon", "Bridgewatch"],
        qualities: [1, 2],
        region: "west",
      });
      await flushRateLimit();
      await promise;
      expect(globalThis.fetch).toHaveBeenCalledOnce();
      const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("https://west.albion-online-data.com");
      expect(calledUrl).toContain("/api/v2/stats/prices/T4_BAG.json");
      expect(calledUrl).toContain("locations=Caerleon%2CBridgewatch");
      expect(calledUrl).toContain("qualities=1%2C2");
    });

    it("defaults to west region when omitted", async () => {
      mockFetchOnce(PRICE_PAYLOAD);
      const promise = getPrices({ itemIds: ["T4_BAG"] });
      await flushRateLimit();
      await promise;
      const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("https://west.albion-online-data.com");
    });

    it("uses the europe host when region=europe", async () => {
      mockFetchOnce(PRICE_PAYLOAD);
      const promise = getPrices({ itemIds: ["T4_BAG"], region: "europe" });
      await flushRateLimit();
      await promise;
      const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("https://europe.albion-online-data.com");
    });

    it("returns cached data on second call without hitting fetch", async () => {
      mockFetchOnce(PRICE_PAYLOAD);
      let promise = getPrices({ itemIds: ["T4_BAG"], region: "west" });
      await flushRateLimit();
      await promise;
      // Second call: no new mock queued, fetch should NOT be called again.
      promise = getPrices({ itemIds: ["T4_BAG"], region: "west" });
      await flushRateLimit();
      await promise;
      expect(globalThis.fetch).toHaveBeenCalledOnce();
    });

    it("re-fetches after the 60s TTL expires", async () => {
      mockFetchOnce(PRICE_PAYLOAD);
      let promise = getPrices({ itemIds: ["T4_BAG"], region: "west" });
      await flushRateLimit();
      await promise;
      vi.advanceTimersByTime(61_000);
      mockFetchOnce(PRICE_PAYLOAD);
      promise = getPrices({ itemIds: ["T4_BAG"], region: "west" });
      await flushRateLimit();
      await promise;
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("throws when the API responds with non-2xx after retries", async () => {
      mockFetchOnce({ error: "boom" }, 500);
      mockFetchOnce({ error: "boom" }, 500);
      mockFetchOnce({ error: "boom" }, 500);
      mockFetchOnce({ error: "boom" }, 500);
      const promise = getPrices({ itemIds: ["T4_BAG"], region: "west" });
      const assertion = expect(promise).rejects.toThrow(/Albion API 500/);
      await flushRateLimit();
      await vi.advanceTimersByTimeAsync(7000); // backoffs: 1s + 2s + 4s
      await assertion;
    });

    it("throws when the URL would exceed 4096 chars", async () => {
      const manyItems = Array.from({ length: 500 }, (_, i) => `T4_ITEM_${i}`);
      await expect(
        getPrices({ itemIds: manyItems, region: "west" }),
      ).rejects.toThrow(/4096/);
    });

    it("does not accumulate rate-limit backlog indefinitely", async () => {
      // Burst of 5 requests should all eventually resolve within a few windows.
      for (let i = 0; i < 5; i++) mockFetchOnce(PRICE_PAYLOAD);
      const promises = Array.from({ length: 5 }, () =>
        getPrices({ itemIds: ["T4_BAG"], region: "west" }),
      );
      await flushRateLimit();
      await vi.advanceTimersByTimeAsync(3000);
      await Promise.all(promises);
      expect(globalThis.fetch).toHaveBeenCalledTimes(5);

      // After a full window and cache reset, a new request should hit the network.
      __resetRateLimitForTests();
      __resetCacheForTests();
      mockFetchOnce(PRICE_PAYLOAD);
      const next = getPrices({ itemIds: ["T4_BAG"], region: "west" });
      await flushRateLimit();
      await next;
      expect(globalThis.fetch).toHaveBeenCalledTimes(6);
    });
  });

  describe("getHistory", () => {
    it("builds the URL with time-scale, date range and locations", async () => {
      mockFetchOnce(HISTORY_PAYLOAD);
      const promise = getHistory({
        itemIds: ["T4_BAG"],
        locations: ["Caerleon"],
        timeScale: 6,
        date: "2026-06-01",
        endDate: "2026-07-01",
        region: "east",
      });
      await flushRateLimit();
      await promise;
      const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("https://east.albion-online-data.com");
      expect(calledUrl).toContain("/api/v2/stats/history/T4_BAG.json");
      expect(calledUrl).toContain("time-scale=6");
      expect(calledUrl).toContain("date=2026-06-01");
      expect(calledUrl).toContain("end_date=2026-07-01");
    });

    it("caches history with a 5min TTL", async () => {
      mockFetchOnce(HISTORY_PAYLOAD);
      let promise = getHistory({ itemIds: ["T4_BAG"], region: "west" });
      await flushRateLimit();
      await promise;
      // 4 minutes later: still cached.
      vi.advanceTimersByTime(240_000);
      promise = getHistory({ itemIds: ["T4_BAG"], region: "west" });
      await flushRateLimit();
      await promise;
      expect(globalThis.fetch).toHaveBeenCalledOnce();
      // 1 more minute (total 5min): TTL expired, re-fetch.
      vi.advanceTimersByTime(60_001);
      mockFetchOnce(HISTORY_PAYLOAD);
      promise = getHistory({ itemIds: ["T4_BAG"], region: "west" });
      await flushRateLimit();
      await promise;
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("getGold", () => {
    it("builds the gold URL with count", async () => {
      mockFetchOnce([{ price: 7700, timestamp: "2026-07-04T10:00:00" }]);
      const promise = getGold("west", 5);
      await flushRateLimit();
      await promise;
      const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("/api/v2/stats/gold.json");
      expect(calledUrl).toContain("count=5");
    });

    it("builds the gold URL with date range", async () => {
      mockFetchOnce([{ price: 7700, timestamp: "2026-07-04T10:00:00" }]);
      const promise = getGold("west", undefined, "2026-06-01", "2026-07-01");
      await flushRateLimit();
      await promise;
      const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("date=2026-06-01");
      expect(calledUrl).toContain("end_date=2026-07-01");
    });
  });

  describe("fetchJson timeout", () => {
    it("aborts the request after the timeout", async () => {
      __disableRetriesForTests();
      // fetch never resolves; the AbortController should fire after 8s.
      vi.mocked(globalThis.fetch).mockImplementation(
        (_input: string | URL | Request, init?: RequestInit) => {
          if (init?.signal?.aborted) {
            return Promise.reject(new DOMException("aborted", "AbortError"));
          }
          return new Promise((_resolve, reject) => {
            const onAbort = () => reject(new DOMException("aborted", "AbortError"));
            init?.signal?.addEventListener("abort", onAbort, { once: true });
          });
        },
      );
      const promise = getPrices({ itemIds: ["T4_BAG"], region: "west" });
      const assertion = expect(promise).rejects.toThrow();
      await flushRateLimit();
      await vi.advanceTimersByTimeAsync(9000);
      await assertion;
    });

    it("retries on retryable errors and gives up after max retries", async () => {
      mockFetchOnce({ error: "boom" }, 500);
      mockFetchOnce({ error: "boom" }, 500);
      mockFetchOnce({ error: "boom" }, 500);
      mockFetchOnce({ error: "boom" }, 500);
      const promise = getPrices({ itemIds: ["T4_BAG"], region: "west" });
      const assertion = expect(promise).rejects.toThrow(/Albion API 500/);
      await flushRateLimit();
      await vi.advanceTimersByTimeAsync(7000); // backoffs: 1s + 2s + 4s
      await assertion;
    });
  });
});
