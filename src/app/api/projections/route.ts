// Black Market projections API.
// Returns projected profit margins based on historical BM data + current city prices.
//
// Query params:
// - tier: item tier (default: 6, single)
// - tiers: comma-separated tiers (e.g. "4,5,6" — overrides tier if present)
// - category: "raw" | "refined" | "gear" (optional, single)
// - categories: comma-separated categories (e.g. "raw,refined" — overrides category if present)
// - qualities: comma-separated quality IDs 1-5 (optional)
// - use_premium: use 4% tax instead of 8% (default: false)
// - mount: mount ID for carry weight calculations (optional)
// - transport: "fast" | "manual" (default: "fast")
// - min_margin: minimum 7d projected margin % (default: 0)
// - min_volume: minimum 7d daily volume (default: 0)
// - min_consistency: minimum consistency % 0-100 (default: 0, server-side filter)
// - limit: max results (default: 100, max: 200)

import { NextRequest, NextResponse } from "next/server";
import { calculateBmProjections } from "@/lib/albion/projections";
import { getMountById } from "@/lib/albion/mounts";
import { withRequestLog } from "@/lib/api/observability";
import type { ItemCategory } from "@/lib/albion/catalog";
import type { ServerRegion } from "@/lib/albion/types";

function parseTiers(params: URLSearchParams): number[] | undefined {
  const tiersParam = params.get("tiers");
  if (tiersParam) {
    return tiersParam.split(",").map((t) => parseInt(t.trim(), 10)).filter((t) => !isNaN(t) && t >= 1 && t <= 8);
  }
  return undefined;
}

function parseCategories(params: URLSearchParams): ItemCategory[] | undefined {
  const catsParam = params.get("categories");
  if (catsParam) {
    const valid: ItemCategory[] = ["raw", "refined", "gear"];
    return catsParam.split(",").map((c) => c.trim()).filter((c): c is ItemCategory => valid.includes(c as ItemCategory));
  }
  return undefined;
}

function parseQualities(params: URLSearchParams): number[] | undefined {
  const qParam = params.get("qualities");
  if (qParam) {
    return qParam.split(",").map((q) => parseInt(q.trim(), 10)).filter((q) => !isNaN(q) && q >= 1 && q <= 5);
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  return withRequestLog(request, async () => {
    const params = request.nextUrl.searchParams;
    const tier = params.get("tier") ? parseInt(params.get("tier")!, 10) : 6;
    const tiers = parseTiers(params);
    const categoryParam = params.get("category");
    const category = categoryParam as ItemCategory | null;
    const categories = parseCategories(params);
    const qualities = parseQualities(params);
    const usePremium = params.get("use_premium") === "true";
    const mountParam = params.get("mount");
    const mount = mountParam ? getMountById(mountParam) : undefined;
    const transportMode = (params.get("transport") as "fast" | "manual") ?? "fast";
    const minMargin = params.get("min_margin") ? Number(params.get("min_margin")) : 0;
    const minVolume = params.get("min_volume") ? Number(params.get("min_volume")) : 0;
    const minConsistency = params.get("min_consistency") ? Number(params.get("min_consistency")) : 0;
    const limit = params.get("limit") ? Math.min(Number(params.get("limit")), 200) : 100;
    const region = (params.get("region") as ServerRegion | null) ?? "west";

    try {
      const result = await calculateBmProjections({
        region,
        tier,
        tiers,
        category: category ?? undefined,
        categories,
        qualities,
        usePremium,
        mountMaxLoadKg: mount?.maxLoadKg,
        transportMode,
        minMargin,
        minVolume,
        minConsistency,
        limit,
      });

      return NextResponse.json(result, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  });
}
