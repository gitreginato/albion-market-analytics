// Incremental scanner: fetches prices in batches across all cities,
// persists results to SQLite. Designed for robustness over speed.
//
// Strategy: batch N items per API call (all cities in a single call).
// The Albion API supports comma-separated item IDs with a URL limit of ~4096 chars.
// Each item ID is ~8 chars, so ~400 items fit per call. We use a conservative
// batch size of 20 to balance speed vs reliability.
// Each scan is logged for progress tracking.

import { getPrices } from "./client";
import { CITIES } from "./items";
import {
  createScanJob,
  getDistinctItemCount,
  getPriceCount,
  getPricesForItems,
  logScan,
  updateScanJob,
  upsertPrices,
  type PriceRow,
  type ScanJobRow,
} from "../db/repository";
import { scanOpportunitiesFromPrices } from "./opportunities";
import type { MarketPrice, ServerRegion } from "./types";

export interface ScanProgress {
  currentItem: string;
  itemIndex: number;
  totalItems: number;
  citiesScanned: number;
  errors: string[];
  startedAt: number;
  jobId: number;
}

export interface ScanResult {
  itemsScanned: number;
  citiesPerItem: number;
  totalRowsSaved: number;
  errors: string[];
  durationMs: number;
  jobId: number;
}

// Default batch size: 20 items per API call.
export const DEFAULT_BATCH_SIZE = 20;

function buildRows(prices: MarketPrice[]): PriceRow[] {
  const now = Date.now();
  return prices.map((p) => ({
    item_id: p.item_id,
    city: p.city,
    quality: p.quality,
    sell_price_min: p.sell_price_min,
    sell_price_max: p.sell_price_max,
    buy_price_min: p.buy_price_min,
    buy_price_max: p.buy_price_max,
    sell_price_min_date: p.sell_price_min_date,
    sell_price_max_date: p.sell_price_max_date,
    buy_price_min_date: p.buy_price_min_date,
    buy_price_max_date: p.buy_price_max_date,
    scanned_at: now,
  }));
}

// Scan a batch of items across all cities, persist to DB.
export async function scanBatch(
  itemIds: string[],
  region: ServerRegion,
  timeoutMs: number = 20_000,
): Promise<{ citiesScanned: number; rowsSaved: number; error: string | null }> {
  const start = Date.now();
  const batchLabel = itemIds.length === 1 ? itemIds[0] : `${itemIds[0]}..${itemIds[itemIds.length - 1]} (${itemIds.length})`;
  try {
    const prices = await getPrices(
      {
        itemIds,
        locations: [...CITIES],
        region,
      },
      timeoutMs,
    );

    const rows = buildRows(prices);
    if (rows.length > 0) {
      upsertPrices(rows);
    }

    const durationMs = Date.now() - start;
    logScan(batchLabel, rows.length, durationMs);

    return { citiesScanned: rows.length, rowsSaved: rows.length, error: null };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    const durationMs = Date.now() - start;
    logScan(batchLabel, 0, durationMs, errorMsg);
    return { citiesScanned: 0, rowsSaved: 0, error: errorMsg };
  }
}

// Scan a single item across all cities, persist to DB.
export async function scanItem(
  itemId: string,
  region: ServerRegion,
): Promise<{ citiesScanned: number; rowsSaved: number; error: string | null }> {
  return scanBatch([itemId], region, 15_000);
}

function buildProgress(
  jobId: number,
  itemIds: string[],
  itemsScanned: number,
  currentBatch: string[],
  citiesScanned: number,
  errors: string[],
  startedAt: number,
): ScanProgress {
  const batchLabel = currentBatch.length === 1
    ? currentBatch[0]
    : `${currentBatch[0]}..${currentBatch[currentBatch.length - 1]}`;
  return {
    jobId,
    currentItem: batchLabel,
    itemIndex: itemsScanned,
    totalItems: itemIds.length,
    citiesScanned,
    errors,
    startedAt,
  };
}

// Scan multiple items in batches, persisting each batch to DB and updating scan_jobs.
export async function scanItems(
  itemIds: string[],
  region: ServerRegion,
  onProgress?: (progress: ScanProgress) => void,
  batchSize: number = DEFAULT_BATCH_SIZE,
): Promise<ScanResult> {
  const start = Date.now();
  const errors: string[] = [];
  let totalRows = 0;
  let itemsScanned = 0;

  const jobId = createScanJob(region, itemIds.length, batchSize);
  updateScanJob(jobId, { status: "running" });

  try {
    // Split items into batches.
    const batches: string[][] = [];
    for (let i = 0; i < itemIds.length; i += batchSize) {
      batches.push(itemIds.slice(i, i + batchSize));
    }

    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b];

      onProgress?.(buildProgress(jobId, itemIds, itemsScanned, batch, 0, errors, start));

      const result = await scanBatch(batch, region);
      itemsScanned += batch.length;
      totalRows += result.rowsSaved;
      if (result.error) {
        errors.push(`${batch.join(",")}: ${result.error}`);
      }

      updateScanJob(jobId, {
        status: b === batches.length - 1 ? "done" : "running",
        itemsDone: itemsScanned,
        errors,
        finishedAt: b === batches.length - 1 ? Date.now() : null,
      });

      onProgress?.(buildProgress(jobId, itemIds, itemsScanned, batch, result.citiesScanned, errors, start));
    }

    return {
      itemsScanned,
      citiesPerItem: CITIES.length,
      totalRowsSaved: totalRows,
      errors,
      durationMs: Date.now() - start,
      jobId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    errors.push(`Fatal: ${errorMsg}`);
    updateScanJob(jobId, { status: "failed", errors, finishedAt: Date.now() });
    return {
      itemsScanned,
      citiesPerItem: CITIES.length,
      totalRowsSaved: totalRows,
      errors,
      durationMs: Date.now() - start,
      jobId,
    };
  }
}

// Build a ScanProgress object from a persisted scan job row.
export function scanJobToProgress(job: ScanJobRow): ScanProgress {
  const errors: string[] = job.errors_json ? JSON.parse(job.errors_json) : [];
  return {
    jobId: job.id,
    currentItem: job.status === "done" || job.status === "failed" || job.status === "cancelled"
      ? "Concluído"
      : `Lote ${job.items_done}/${job.items_total}`,
    itemIndex: job.items_done,
    totalItems: job.items_total,
    citiesScanned: 0,
    errors,
    startedAt: job.started_at,
  };
}

// Scan opportunities using persisted DB data (no real-time fetch).
export function scanOpportunitiesFromDb(
  itemIds: string[],
  options: {
    minProfit?: number;
    limit?: number;
    useFocus?: boolean;
    usePremium?: boolean;
    nameLookup?: Map<string, string>;
    mountMaxLoadKg?: number;
  } = {},
) {
  const { minProfit = 0, limit = 50, useFocus = false, usePremium = true } = options;
  const rows = getPricesForItems(itemIds);

  // Convert PriceRow back to MarketPrice format for the scanner.
  const prices: MarketPrice[] = rows.map((r) => ({
    item_id: r.item_id,
    city: r.city,
    quality: r.quality,
    sell_price_min: r.sell_price_min,
    sell_price_min_date: r.sell_price_min_date,
    sell_price_max: r.sell_price_max,
    sell_price_max_date: r.sell_price_max_date,
    buy_price_min: r.buy_price_min,
    buy_price_min_date: r.buy_price_min_date,
    buy_price_max: r.buy_price_max,
    buy_price_max_date: r.buy_price_max_date,
  }));

  return scanOpportunitiesFromPrices(prices, {
    minProfit,
    limit,
    useFocus,
    usePremium,
    nameLookup: options.nameLookup,
    mountMaxLoadKg: options.mountMaxLoadKg,
  });
}

// Get DB stats for UI display.
export function getDbStats() {
  return {
    totalRows: getPriceCount(),
    distinctItems: getDistinctItemCount(),
  };
}


