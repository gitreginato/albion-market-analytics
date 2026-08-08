// Observability helpers for API routes.
// Logs request latency and outcome in a structured format.

import { NextRequest, NextResponse } from "next/server";
import { info, error } from "@/lib/logger";

export async function withRequestLog(
  request: NextRequest,
  handler: () => Promise<NextResponse<unknown>>,
): Promise<NextResponse<unknown>> {
  const start = Date.now();
  const path = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  try {
    const response = await handler();
    info("API request completed", {
      path,
      search,
      status: response.status,
      durationMs: Date.now() - start,
    });
    return response;
  } catch (err) {
    const errObj = err instanceof Error ? err : new Error(String(err));
    error("API request failed", {
      path,
      search,
      durationMs: Date.now() - start,
    }, errObj);
    return NextResponse.json({ error: errObj.message }, { status: 500 });
  }
}
