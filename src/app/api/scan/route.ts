// Scan endpoint: triggers incremental batch scan and persists to SQLite.
//
// Query params:
// - region: west | east | europe (default: west)
// - items: comma-separated item IDs (default: all refining-related items)
// - mode: "start" | "status" | "cancel" (default: start)
// - batch_size: items per API call (default: 20, max: 100)
// - resume: if "true", resumes the most recent unfinished scan job instead of starting a new one

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRequestLog } from "@/lib/api/observability";
import { DEFAULT_SCAN_ITEMS } from "@/lib/albion/opportunities";
import {
  scanItems,
  getDbStats,
  DEFAULT_BATCH_SIZE,
  scanJobToProgress,
  type ScanProgress,
  type ScanResult,
} from "@/lib/albion/scanner";
import {
  getLastScanTimestamp,
  getLatestScanJob,
  getRecentScanJobs,
  getRecentScanLogs,
  getRowsSavedForJob,
  getRunningScanJob,
  updateScanJob,
  type ScanJobRow,
} from "@/lib/db/repository";
import { getAllTradableItemIds } from "@/lib/albion/catalog";
// import type { ServerRegion } from "@/lib/albion/types";

const scanQuerySchema = z.object({
  mode: z.enum(["start", "status", "cancel"]).default("start"),
  region: z.enum(["west", "east", "europe"]).default("west"),
  items: z.string().optional(),
  batch_size: z.coerce.number().int().min(1).max(100).default(DEFAULT_BATCH_SIZE),
  resume: z.enum(["true", "false"]).default("false"),
});

async function resolveItemIds(itemsParam: string | undefined): Promise<{ itemIds: string[]; source: string }> {
  if (itemsParam === "all") {
    const ids = await getAllTradableItemIds();
    return { itemIds: ids, source: "all" };
  }
  if (itemsParam) {
    const ids = itemsParam.split(",").map((s) => s.trim()).filter(Boolean);
    return { itemIds: ids, source: "custom" };
  }
  return { itemIds: DEFAULT_SCAN_ITEMS, source: "default" };
}

function buildStatusResponse(runningJob: ScanJobRow | null, latestJob: ScanJobRow | null) {
  const progress: ScanProgress | null = runningJob
    ? scanJobToProgress(runningJob)
    : latestJob && latestJob.status !== "done"
      ? scanJobToProgress(latestJob)
      : null;

  const lastResult: ScanResult | null = latestJob && latestJob.status !== "running"
    ? {
        itemsScanned: latestJob.items_done,
        citiesPerItem: 0,
        totalRowsSaved: getRowsSavedForJob(latestJob.started_at, latestJob.finished_at ?? Date.now()),
        errors: latestJob.errors_json ? JSON.parse(latestJob.errors_json) : [],
        durationMs: latestJob.finished_at
          ? latestJob.finished_at - latestJob.started_at
          : Date.now() - latestJob.started_at,
        jobId: latestJob.id,
      }
    : null;

  return {
    isScanning: runningJob !== null,
    progress,
    lastResult,
    dbStats: getDbStats(),
    lastScanTimestamp: getLastScanTimestamp(),
    recentLogs: getRecentScanLogs(10),
    recentJobs: getRecentScanJobs(5),
  };
}

export async function GET(request: NextRequest) {
  return withRequestLog(request, async () => {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = scanQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    const { mode, region, items, batch_size, resume } = parsed.data;

    if (mode === "status") {
      const runningJob = getRunningScanJob();
      const latestJob = getLatestScanJob();
      return NextResponse.json(buildStatusResponse(runningJob, latestJob));
    }

    if (mode === "cancel") {
      const runningJob = getRunningScanJob();
      if (runningJob) {
        updateScanJob(runningJob.id, { status: "cancelled", finishedAt: Date.now() });
      }
      return NextResponse.json({ cancelled: runningJob?.id ?? null });
    }

    // mode === "start"
    const runningJob = getRunningScanJob();
    if (runningJob) {
      return NextResponse.json(
        { error: "Scan already in progress", jobId: runningJob.id },
        { status: 409 },
      );
    }

    let itemIds: string[];
    let source: string;
    try {
      const resolved = await resolveItemIds(items);
      itemIds = resolved.itemIds;
      source = resolved.source;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load catalog";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    if (itemIds.length === 0) {
      return NextResponse.json({ error: "No items to scan" }, { status: 400 });
    }

    // Resume logic: if resume=true, mark the latest non-done job as running and restart the scan.
    // Note: without storing the last scanned index, we restart from the beginning to guarantee completeness.
    if (resume === "true") {
      const latest = getLatestScanJob();
      if (latest && latest.status !== "done" && latest.items_done < latest.items_total) {
        updateScanJob(latest.id, { status: "running", finishedAt: null });
        scanItems(itemIds, region, undefined, latest.batch_size).catch(() => undefined);
        return NextResponse.json({
          message: "Scan resumed",
          jobId: latest.id,
          totalItems: itemIds.length,
          batchSize: latest.batch_size,
          region,
          source,
          pollUrl: `/api/scan?mode=status`,
        });
      }
    }

    scanItems(itemIds, region, undefined, batch_size).catch(() => undefined);

    return NextResponse.json({
      message: "Scan started",
      totalItems: itemIds.length,
      batchSize: batch_size,
      region,
      source,
      pollUrl: `/api/scan?mode=status`,
    });
  });
}
