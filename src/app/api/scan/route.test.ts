// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  __closeDbForTests,
  __setDbPathForTests,
  getRunningScanJob,
} from "@/lib/db/repository";
import { GET } from "@/app/api/scan/route";

const TEST_DB_PATH = join(tmpdir(), `albion-test-scan-api-${process.pid}.db`);

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

async function callApi(path: string) {
  const res = await GET(makeRequest(path));
  return { status: res.status, body: await res.json() };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

vi.mock("@/lib/albion/client", () => ({
  getPrices: vi.fn(async ({ itemIds }: { itemIds: string[] }) => {
    return itemIds.flatMap((id) => [
      {
        item_id: id,
        city: "Caerleon",
        quality: 1,
        sell_price_min: 100,
        sell_price_min_date: "2026-07-04T10:00:00",
        sell_price_max: 110,
        sell_price_max_date: "2026-07-04T10:00:00",
        buy_price_min: 90,
        buy_price_min_date: "2026-07-04T10:00:00",
        buy_price_max: 95,
        buy_price_max_date: "2026-07-04T10:00:00",
      },
      {
        item_id: id,
        city: "Black Market",
        quality: 1,
        sell_price_min: 0,
        sell_price_min_date: "0001-01-01T00:00:00",
        sell_price_max: 0,
        sell_price_max_date: "0001-01-01T00:00:00",
        buy_price_min: 200,
        buy_price_min_date: "2026-07-04T10:00:00",
        buy_price_max: 200,
        buy_price_max_date: "2026-07-04T10:00:00",
      },
    ]);
  }),
}));

vi.mock("@/lib/albion/catalog", async (orig) => {
  const actual = await orig() as Record<string, unknown>;
  return {
    ...actual,
    getAllTradableItemIds: vi.fn(async () => ["T4_ORE", "T5_ORE", "T6_ORE"]),
  };
});

describe("GET /api/scan", () => {
  beforeEach(() => {
    __setDbPathForTests(TEST_DB_PATH);
    __closeDbForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  afterEach(() => {
    __closeDbForTests();
  });

  it("returns 400 for invalid mode", async () => {
    const { status, body } = await callApi("/api/scan?mode=invalid");
    expect(status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("starts a scan and returns status with recentJobs", async () => {
    const { status, body } = await callApi("/api/scan?items=T4_ORE,T5_ORE&batch_size=1");
    expect(status).toBe(200);
    expect(body.message).toBe("Scan started");
    expect(body.totalItems).toBe(2);
    expect(body.pollUrl).toBe("/api/scan?mode=status");

    // Wait for the background scan to finish.
    await sleep(500);

    const { body: finalStatus } = await callApi("/api/scan?mode=status");
    expect(finalStatus.isScanning).toBe(false);
    expect(finalStatus.recentJobs.length).toBeGreaterThan(0);
    expect(finalStatus.lastResult).not.toBeNull();
    expect(finalStatus.lastResult.jobId).toBeGreaterThan(0);
  });

  it("prevents concurrent scans and returns 409", async () => {
    // Use enough items so the scan is still running when we hit the second request.
    const items = Array.from({ length: 10 }, (_, i) => `T4_ORE_${i}`).join(",");
    const first = await callApi(`/api/scan?items=${items}&batch_size=1`);
    expect(first.status).toBe(200);

    const second = await callApi("/api/scan?items=T4_ORE");
    expect(second.status).toBe(409);

    await sleep(4000);
  });

  it("cancels a running scan", async () => {
    const items = Array.from({ length: 10 }, (_, i) => `T4_ORE_${i}`).join(",");
    await callApi(`/api/scan?items=${items}&batch_size=1`);
    const running = getRunningScanJob();
    expect(running).not.toBeNull();

    const { status, body } = await callApi("/api/scan?mode=cancel");
    expect(status).toBe(200);
    expect(body.cancelled).toBe(running!.id);
  });

  it("resumes the latest non-done scan", async () => {
    const first = await callApi("/api/scan?items=T4_ORE,T5_ORE&batch_size=1");
    expect(first.status).toBe(200);
    await sleep(500);

    const { body: statusBefore } = await callApi("/api/scan?mode=status");
    expect(statusBefore.recentJobs[0].status).toBe("done");

    // Manually mark the last job as failed so resume logic has something to resume.
    const { getLatestScanJob, updateScanJob } = await import("@/lib/db/repository");
    const latest = getLatestScanJob();
    expect(latest).not.toBeNull();
    updateScanJob(latest!.id, { status: "failed", itemsDone: 0, finishedAt: null });

    const resumed = await callApi("/api/scan?items=T4_ORE,T5_ORE&batch_size=1&resume=true");
    expect(resumed.status).toBe(200);
    expect(resumed.body.message).toBe("Scan resumed");
    expect(resumed.body.jobId).toBe(latest!.id);

    await sleep(500);

    const { body: statusAfter } = await callApi("/api/scan?mode=status");
    expect(statusAfter.recentJobs[0].status).toBe("done");
  });
});
