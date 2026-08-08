import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetCacheForTests } from "@/lib/albion/client";
import { GET as pricesGET } from "@/app/api/prices/route";

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

async function callPrices(path: string) {
  const res = await pricesGET(makeRequest(path));
  return { status: res.status, body: await res.json(), headers: res.headers };
}

describe("GET /api/prices", () => {
  beforeEach(() => {
    __resetCacheForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 400 when 'items' is missing", async () => {
    const { status, body } = await callPrices("/api/prices");
    expect(status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.error.fieldErrors?.items ?? body.error.formErrors).toBeTruthy();
  });

  it("returns 400 when 'items' is empty", async () => {
    const { status } = await callPrices("/api/prices?items=");
    expect(status).toBe(400);
  });

  it("proxies to the Albion API and returns the payload", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
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
      ],
    } as Response);

    const { status, body, headers } = await callPrices(
      "/api/prices?items=T4_BAG&locations=Caerleon&region=west",
    );
    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].item_id).toBe("T4_BAG");
    // Cache-Control header is set for CDN caching.
    expect(headers.get("Cache-Control")).toContain("s-maxage=60");
  });

  it("forwards locations and qualities to the upstream client", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await callPrices(
      "/api/prices?items=T4_BAG,T5_BAG&locations=Caerleon,Bridgewatch&qualities=1,2&region=europe",
    );
    const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("https://europe.albion-online-data.com");
    expect(calledUrl).toContain("/prices/T4_BAG,T5_BAG.json");
    expect(calledUrl).toContain("locations=Caerleon%2CBridgewatch");
    expect(calledUrl).toContain("qualities=1%2C2");
  });

  it("returns 502 when the upstream Albion API fails", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: "upstream down" }),
    } as Response);

    const { status, body } = await callPrices("/api/prices?items=T4_BAG");
    expect(status).toBe(502);
    expect(body).toEqual({ error: expect.stringContaining("503") });
  });

  it("defaults region to west when not specified", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await callPrices("/api/prices?items=T4_BAG");
    const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("https://west.albion-online-data.com");
  });
});
