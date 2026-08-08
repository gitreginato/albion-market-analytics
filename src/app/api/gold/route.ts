// Proxy route for gold price history.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGold } from "@/lib/albion/client";
import { withRequestLog } from "@/lib/api/observability";
import type { ServerRegion } from "@/lib/albion/types";

const goldQuerySchema = z.object({
  region: z.enum(["west", "east", "europe"]).default("west"),
  count: z.coerce.number().int().positive().optional(),
  date: z.string().date().optional(),
  end_date: z.string().date().optional(),
});

export async function GET(request: NextRequest) {
  return withRequestLog(request, async () => {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = goldQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { region, count, date, end_date } = parsed.data;

    try {
      const data = await getGold(region as ServerRegion, count, date, end_date);
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  });
}
