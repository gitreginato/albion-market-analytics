// SQLite database layer for persisting market prices.
// Uses better-sqlite3 (synchronous, native, fast).
// The DB file lives at data/albion.db (gitignored).

import Database from "better-sqlite3";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

export interface PriceRow {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_max: number;
  buy_price_min: number;
  buy_price_max: number;
  sell_price_min_date: string;
  sell_price_max_date: string;
  buy_price_min_date: string;
  buy_price_max_date: string;
  scanned_at: number; // unix epoch ms
}

export interface ScanLogRow {
  id: number;
  item_id: string;
  cities_scanned: number;
  duration_ms: number;
  timestamp: number;
  error: string | null;
}

export type ScanJobStatus = "pending" | "running" | "done" | "failed" | "cancelled";

export interface ScanJobRow {
  id: number;
  status: ScanJobStatus;
  region: string;
  items_total: number;
  items_done: number;
  batch_size: number;
  errors_json: string | null;
  started_at: number;
  finished_at: number | null;
  updated_at: number;
}

let dbInstance: Database.Database | null = null;
// Allow tests to override the DB path to avoid concurrent access issues.
let dbPathOverride: string | null = null;

function getDbPath(): string {
  if (dbPathOverride) return dbPathOverride;
  const dataDir = join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  return join(dataDir, "albion.db");
}

// Test-only: set a custom DB path (e.g. temp file per test suite).
export function __setDbPathForTests(path: string): void {
  dbPathOverride = path;
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  const dbPath = getDbPath();
  dbInstance = new Database(dbPath);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("synchronous = NORMAL");
  initSchema(dbInstance);
  return dbInstance;
}

// Test-only: close the DB connection and delete the file for a clean slate.
// Does NOT clear dbPathOverride — call __setDbPathForTests(null) to reset it.
export function __closeDbForTests(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  // Delete the DB file and WAL/SHM files so tests start fresh.
  const dbPath = getDbPath();
  try {
    rmSync(dbPath, { force: true });
    rmSync(dbPath + "-wal", { force: true });
    rmSync(dbPath + "-shm", { force: true });
  } catch {
    // ignore — files may not exist
  }
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prices (
      item_id       TEXT    NOT NULL,
      city          TEXT    NOT NULL,
      quality       INTEGER NOT NULL,
      sell_price_min INTEGER NOT NULL DEFAULT 0,
      sell_price_max INTEGER NOT NULL DEFAULT 0,
      buy_price_min  INTEGER NOT NULL DEFAULT 0,
      buy_price_max  INTEGER NOT NULL DEFAULT 0,
      sell_price_min_date TEXT NOT NULL DEFAULT '',
      sell_price_max_date TEXT NOT NULL DEFAULT '',
      buy_price_min_date  TEXT NOT NULL DEFAULT '',
      buy_price_max_date  TEXT NOT NULL DEFAULT '',
      scanned_at    INTEGER NOT NULL,
      PRIMARY KEY (item_id, city, quality)
    );

    CREATE INDEX IF NOT EXISTS idx_prices_item ON prices(item_id);
    CREATE INDEX IF NOT EXISTS idx_prices_city ON prices(city);
    CREATE INDEX IF NOT EXISTS idx_prices_scanned ON prices(scanned_at);

    CREATE TABLE IF NOT EXISTS scan_log (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id        TEXT    NOT NULL,
      cities_scanned INTEGER NOT NULL DEFAULT 0,
      duration_ms    INTEGER NOT NULL DEFAULT 0,
      timestamp      INTEGER NOT NULL,
      error          TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_scan_log_ts ON scan_log(timestamp);

    CREATE TABLE IF NOT EXISTS scan_jobs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      status        TEXT    NOT NULL DEFAULT 'pending',
      region        TEXT    NOT NULL,
      items_total   INTEGER NOT NULL DEFAULT 0,
      items_done    INTEGER NOT NULL DEFAULT 0,
      batch_size    INTEGER NOT NULL DEFAULT 20,
      errors_json   TEXT,
      started_at    INTEGER NOT NULL,
      finished_at   INTEGER,
      updated_at    INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON scan_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_scan_jobs_started ON scan_jobs(started_at);
  `);
}

// ---- Repository functions ----

const UPSERT_PRICE = `
  INSERT INTO prices (
    item_id, city, quality,
    sell_price_min, sell_price_max, buy_price_min, buy_price_max,
    sell_price_min_date, sell_price_max_date, buy_price_min_date, buy_price_max_date,
    scanned_at
  ) VALUES (
    @item_id, @city, @quality,
    @sell_price_min, @sell_price_max, @buy_price_min, @buy_price_max,
    @sell_price_min_date, @sell_price_max_date, @buy_price_min_date, @buy_price_max_date,
    @scanned_at
  )
  ON CONFLICT(item_id, city, quality) DO UPDATE SET
    sell_price_min = @sell_price_min,
    sell_price_max = @sell_price_max,
    buy_price_min = @buy_price_min,
    buy_price_max = @buy_price_max,
    sell_price_min_date = @sell_price_min_date,
    sell_price_max_date = @sell_price_max_date,
    buy_price_min_date = @buy_price_min_date,
    buy_price_max_date = @buy_price_max_date,
    scanned_at = @scanned_at
`;

export function upsertPrices(rows: PriceRow[]): void {
  const db = getDb();
  const stmt = db.prepare(UPSERT_PRICE);
  const tx = db.transaction((items: PriceRow[]) => {
    for (const row of items) {
      stmt.run(row);
    }
  });
  tx(rows);
}

export function getPricesForItem(itemId: string): PriceRow[] {
  const db = getDb();
  return db.prepare("SELECT * FROM prices WHERE item_id = ?").all(itemId) as PriceRow[];
}

export function getPricesForItems(itemIds: string[]): PriceRow[] {
  if (itemIds.length === 0) return [];
  const db = getDb();
  const placeholders = itemIds.map(() => "?").join(",");
  return db
    .prepare(`SELECT * FROM prices WHERE item_id IN (${placeholders})`)
    .all(...itemIds) as PriceRow[];
}

export function getAllPrices(): PriceRow[] {
  const db = getDb();
  return db.prepare("SELECT * FROM prices").all() as PriceRow[];
}

export function getPriceCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM prices").get() as { count: number };
  return row.count;
}

export function getDistinctItemCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(DISTINCT item_id) as count FROM prices").get() as { count: number };
  return row.count;
}

export function getStaleItemCount(staleThresholdMs: number): number {
  const db = getDb();
  const cutoff = Date.now() - staleThresholdMs;
  const row = db
    .prepare("SELECT COUNT(DISTINCT item_id) as count FROM prices WHERE scanned_at < ?")
    .get(cutoff) as { count: number };
  return row.count;
}

// ---- Scan log ----

const INSERT_SCAN_LOG = `
  INSERT INTO scan_log (item_id, cities_scanned, duration_ms, timestamp, error)
  VALUES (@item_id, @cities_scanned, @duration_ms, @timestamp, @error)
`;

export function logScan(
  itemId: string,
  citiesScanned: number,
  durationMs: number,
  error: string | null = null,
): void {
  const db = getDb();
  db.prepare(INSERT_SCAN_LOG).run({
    item_id: itemId,
    cities_scanned: citiesScanned,
    duration_ms: durationMs,
    timestamp: Date.now(),
    error,
  });
}

export function getRecentScanLogs(limit = 20): ScanLogRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM scan_log ORDER BY timestamp DESC LIMIT ?")
    .all(limit) as ScanLogRow[];
}

export function getLastScanTimestamp(): number | null {
  const db = getDb();
  const row = db
    .prepare("SELECT MAX(timestamp) as ts FROM scan_log")
    .get() as { ts: number | null };
  return row.ts;
}

// Sum cities_scanned (rows saved) for all scan_log entries within a job's time range.
export function getRowsSavedForJob(startedAt: number, finishedAt: number): number {
  const db = getDb();
  const end = finishedAt || Date.now();
  const row = db
    .prepare("SELECT COALESCE(SUM(cities_scanned), 0) as total FROM scan_log WHERE timestamp >= ? AND timestamp <= ?")
    .get(startedAt, end) as { total: number };
  return row.total;
}

// ---- Scan jobs ----

const INSERT_SCAN_JOB = `
  INSERT INTO scan_jobs (status, region, items_total, items_done, batch_size, errors_json, started_at, finished_at, updated_at)
  VALUES (@status, @region, @items_total, @items_done, @batch_size, @errors_json, @started_at, @finished_at, @updated_at)
`;

export function createScanJob(
  region: string,
  itemsTotal: number,
  batchSize: number,
): number {
  const db = getDb();
  const now = Date.now();
  const result = db.prepare(INSERT_SCAN_JOB).run({
    status: "pending",
    region,
    items_total: itemsTotal,
    items_done: 0,
    batch_size: batchSize,
    errors_json: null,
    started_at: now,
    finished_at: null,
    updated_at: now,
  });
  return Number(result.lastInsertRowid);
}

const UPDATE_SCAN_JOB = `
  UPDATE scan_jobs SET
    status = @status,
    items_done = @items_done,
    errors_json = @errors_json,
    finished_at = @finished_at,
    updated_at = @updated_at
  WHERE id = @id
`;

export function updateScanJob(
  id: number,
  updates: {
    status?: ScanJobStatus;
    itemsDone?: number;
    errors?: string[];
    finishedAt?: number | null;
  },
): void {
  const db = getDb();
  const current = db.prepare("SELECT * FROM scan_jobs WHERE id = ?").get(id) as ScanJobRow | undefined;
  if (!current) return;
  db.prepare(UPDATE_SCAN_JOB).run({
    id,
    status: updates.status ?? current.status,
    items_done: updates.itemsDone ?? current.items_done,
    errors_json: updates.errors ? JSON.stringify(updates.errors) : current.errors_json,
    finished_at: updates.finishedAt !== undefined ? updates.finishedAt : current.finished_at,
    updated_at: Date.now(),
  });
}

export function getScanJob(id: number): ScanJobRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM scan_jobs WHERE id = ?").get(id) as ScanJobRow | undefined;
  return row ?? null;
}

export function getRunningScanJob(): ScanJobRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM scan_jobs WHERE status = 'running' ORDER BY started_at DESC LIMIT 1").get() as ScanJobRow | undefined;
  return row ?? null;
}

export function getLatestScanJob(): ScanJobRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM scan_jobs ORDER BY started_at DESC LIMIT 1").get() as ScanJobRow | undefined;
  return row ?? null;
}

export function getRecentScanJobs(limit = 10): ScanJobRow[] {
  const db = getDb();
  return db.prepare("SELECT * FROM scan_jobs ORDER BY started_at DESC LIMIT ?").all(limit) as ScanJobRow[];
}
