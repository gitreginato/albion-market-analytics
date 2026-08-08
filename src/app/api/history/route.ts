// Proxy route for historical market prices (sell orders only).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getHistory } from "@/lib/albion/client";
import { withRequestLog } from "@/lib/api/observability";
import type { ServerRegion } from "@/lib/albion/types";

const historyQuerySchema = z.object({
  items: z.string().min(1),
  locations: z.string().optional(),
  qualities: z.string().regex(/^\d+(,\d+)*$/).optional(),
  "time-scale": z.enum(["1", "6", "24"]).default("24"),
  date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  region: z.enum(["west", "east", "europe"]).default("west"),
});

export async function GET(request: NextRequest) {
  return withRequestLog(request, async () => {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = historyQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { items, locations, qualities, date, end_date, region } = parsed.data;
    const timeScale = Number(parsed.data["time-scale"]) as 1 | 6 | 24;
    const itemIds = items.split(",").map((s) => s.trim()).filter(Boolean);
    const locationList = locations?.split(",").map((s) => s.trim()).filter(Boolean);
    const qualityList = qualities?.split(",").map((q) => Number(q)).filter((n) => !Number.isNaN(n));

    try {
      const data = await getHistory({
        itemIds,
        locations: locationList,
        qualities: qualityList,
        timeScale,
        date,
        endDate: end_date,
        region: region as ServerRegion,
      });
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  });
}
