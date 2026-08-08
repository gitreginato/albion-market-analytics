// Health check endpoint for monitoring and load balancers.
// Returns DB stats, cache size, uptime and rate-limiter queue depth.

import { NextRequest, NextResponse } from "next/server";
import { getDistinctItemCount, getPriceCount } from "@/lib/db/repository";
import { getCacheSize, getRateLimitQueueSize } from "@/lib/albion/client";
import { withRequestLog } from "@/lib/api/observability";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return withRequestLog(request, async () => {
    const distinctItems = getDistinctItemCount();
    const totalRows = getPriceCount();
    const cacheSize = getCacheSize();
    const rateLimitQueue = getRateLimitQueueSize();

    return NextResponse.json({
      status: "ok",
      uptime: process.uptime(),
      db: {
        distinctItems,
        totalRows,
      },
      cache: {
        size: cacheSize,
      },
      rateLimit: {
        queueSize: rateLimitQueue,
      },
    });
  });
}
