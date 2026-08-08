// Search the full Albion item catalog (ao-bin-dumps items.json, ~30k entries).
// Cached server-side for 24h.

import { NextRequest, NextResponse } from "next/server";
import { searchFullCatalog } from "@/lib/albion/catalog";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const limitParam = params.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), 100) : 20;

  try {
    const results = await searchFullCatalog(q, limit);
    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
