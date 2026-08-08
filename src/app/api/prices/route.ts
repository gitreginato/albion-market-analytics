// Proxy route for current market prices.
// Keeps the Albion API keyless but moves calls server-side to avoid CORS
// and centralize caching/rate-limit budget.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrices } from "@/lib/albion/client";
import { withRequestLog } from "@/lib/api/observability";
import type { ServerRegion } from "@/lib/albion/types";

const pricesQuerySchema = z.object({
  items: z.string().min(1),
  locations: z.string().optional(),
  qualities: z.string().regex(/^\d+(,\d+)*$/).optional(),
  region: z.enum(["west", "east", "europe"]).default("west"),
});

export async function GET(request: NextRequest) {
  return withRequestLog(request, async () => {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = pricesQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { items, locations, qualities, region } = parsed.data;
    const itemIds = items.split(",").map((s) => s.trim()).filter(Boolean);
    const locationList = locations?.split(",").map((s) => s.trim()).filter(Boolean);
    const qualityList = qualities?.split(",").map((q) => Number(q)).filter((n) => !Number.isNaN(n));

    try {
      const data = await getPrices({
        itemIds,
        locations: locationList,
        qualities: qualityList,
        region: region as ServerRegion,
      });
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  });
}
