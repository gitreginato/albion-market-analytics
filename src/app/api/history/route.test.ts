import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetCacheForTests } from "@/lib/albion/client";
import { GET as historyGET } from "@/app/api/history/route";

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

async function callHistory(path: string) {
  const res = await historyGET(makeRequest(path));
  return { status: res.status, body: await res.json(), headers: res.headers };
}

describe("GET /api/history", () => {
  beforeEach(() => {
    __resetCacheForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 400 when 'items' is missing", async () => {
    const { status, body } = await callHistory("/api/history");
    expect(status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.error.fieldErrors?.items ?? body.error.formErrors).toBeTruthy();
  });

  it("proxies with default time-scale=24 when not provided", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          location: "Caerleon",
          item_id: "T4_BAG",
          quality: 1,
          data: [{ item_count: 5, avg_price: 5000, timestamp: "2026-07-04T00:00:00" }],
        },
      ],
    } as Response);

    const { status, body, headers } = await callHistory(
      "/api/history?items=T4_BAG&locations=Caerleon&region=west",
    );
    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(headers.get("Cache-Control")).toContain("s-maxage=300");
    const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("time-scale=24");
  });

  it("forwards time-scale, date range and qualities", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await callHistory(
      "/api/history?items=T4_BAG&locations=Caerleon&qualities=2&time-scale=6&date=2026-06-01&end_date=2026-07-01&region=east",
    );
    const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("https://east.albion-online-data.com");
    expect(calledUrl).toContain("time-scale=6");
    expect(calledUrl).toContain("date=2026-06-01");
    expect(calledUrl).toContain("end_date=2026-07-01");
    expect(calledUrl).toContain("qualities=2");
  });

  it("returns 502 on upstream failure", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" }),
    } as Response);

    const { status } = await callHistory("/api/history?items=T4_BAG");
    expect(status).toBe(502);
  });
});
