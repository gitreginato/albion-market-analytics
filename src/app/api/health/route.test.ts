// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { __closeDbForTests, __setDbPathForTests } from "@/lib/db/repository";
import { GET } from "@/app/api/health/route";

const TEST_DB_PATH = join(tmpdir(), `albion-test-health-${process.pid}.db`);

function makeRequest() {
  return new NextRequest(new URL("http://localhost:3000/api/health"));
}

describe("GET /api/health", () => {
  beforeEach(() => {
    __setDbPathForTests(TEST_DB_PATH);
    __closeDbForTests();
  });

  afterEach(() => {
    __closeDbForTests();
  });

  it("returns healthy status with db and cache metrics", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.uptime).toBe("number");
    expect(body.db).toEqual({ distinctItems: 0, totalRows: 0 });
    expect(typeof body.cache.size).toBe("number");
    expect(typeof body.rateLimit.queueSize).toBe("number");
  });
});
