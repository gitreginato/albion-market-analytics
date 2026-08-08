import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetCacheForTests } from "@/lib/albion/client";
import { GET as goldGET } from "@/app/api/gold/route";

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

async function callGold(path: string) {
  const res = await goldGET(makeRequest(path));
  return { status: res.status, body: await res.json(), headers: res.headers };
}

describe("GET /api/gold", () => {
  beforeEach(() => {
    __resetCacheForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("proxies to the gold endpoint and returns the payload", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { price: 7700, timestamp: "2026-07-04T10:00:00" },
        { price: 7720, timestamp: "2026-07-04T11:00:00" },
      ],
    } as Response);

    const { status, body, headers } = await callGold("/api/gold?count=2&region=west");
    expect(status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].price).toBe(7700);
    expect(headers.get("Cache-Control")).toContain("s-maxage=60");
  });

  it("defaults to west region", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await callGold("/api/gold");
    const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("https://west.albion-online-data.com");
    expect(calledUrl).toContain("/api/v2/stats/gold.json");
  });

  it("forwards count and date range", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await callGold("/api/gold?count=168&date=2026-06-01&end_date=2026-07-01&region=europe");
    const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("https://europe.albion-online-data.com");
    expect(calledUrl).toContain("count=168");
    expect(calledUrl).toContain("date=2026-06-01");
    expect(calledUrl).toContain("end_date=2026-07-01");
  });

  it("returns 502 on upstream failure", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: "down" }),
    } as Response);

    const { status, body } = await callGold("/api/gold");
    expect(status).toBe(502);
    expect(body).toEqual({ error: expect.stringContaining("503") });
  });
});
