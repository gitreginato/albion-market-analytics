// Albion Online Data Project REST client.
// Wraps the public API with timeouts, retries, in-memory TTL cache and rate-limit aware batching.

import { error, warn } from "@/lib/logger";
import type {
  GoldPrice,
  HistoryLocation,
  HistoryQuery,
  MarketPrice,
  PriceQuery,
  ServerRegion,
} from "./types";

const HOSTS: Record<ServerRegion, string> = {
  west: "https://west.albion-online-data.com",
  east: "https://east.albion-online-data.com",
  europe: "https://europe.albion-online-data.com",
};

const REQUEST_TIMEOUT_MS = 8000;
const URL_MAX_LENGTH = 4096;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [1000, 2000, 4000];

let retryEnabled = true;

export function __disableRetriesForTests(): void {
  retryEnabled = false;
}

export function __enableRetriesForTests(): void {
  retryEnabled = true;
}

// Rate limiting: 180 req/min ~= 3 req/s, but we keep a safer 2 req/s burst.
const MAX_REQUESTS_PER_WINDOW = 2;
const WINDOW_MS = 1000;

const requestTimestamps: number[] = [];

export function __resetRateLimitForTests(): void {
  requestTimestamps.length = 0;
}

function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  // Remove timestamps outside the current window.
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length < MAX_REQUESTS_PER_WINDOW) {
    requestTimestamps.push(now);
    return Promise.resolve();
  }
  // Window is full: wait until the oldest request leaves the window, then claim its slot.
  const oldest = requestTimestamps[0];
  const wait = Math.max(0, oldest + WINDOW_MS - now);
  return new Promise((resolve) => {
    setTimeout(() => {
      const pushedAt = Date.now();
      // Discard anything that expired while we waited.
      while (requestTimestamps.length > 0 && requestTimestamps[0] <= pushedAt - WINDOW_MS) {
        requestTimestamps.shift();
      }
      requestTimestamps.push(pushedAt);
      resolve();
    }, wait);
  });
}

function isRetryableError(status: number, message: string): boolean {
  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;
  if (message.includes("timeout") || message.includes("abort") || message.includes("ECONNRESET") || message.includes("ETIMEDOUT")) return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Test-only hook to clear the in-memory cache between cases.
export function __resetCacheForTests(): void {
  cache.clear();
}

export function getCacheSize(): number {
  return cache.size;
}

export function getRateLimitQueueSize(): number {
  return requestTimestamps.length;
}

async function fetchJson<T>(url: string, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<T> {
  let lastStatus = 0;
  let lastMessage = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitForRateLimit();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "Accept-Encoding": "gzip" },
      });
      if (!res.ok) {
        lastStatus = res.status;
        lastMessage = `Albion API ${res.status}: ${url}`;
        warn("Albion API non-2xx response", { url, status: res.status, attempt });
        if (retryEnabled && isRetryableError(res.status, lastMessage) && attempt < MAX_RETRIES) {
          await sleep(RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1]);
          continue;
        }
        throw new Error(lastMessage);
      }
      return (await res.json()) as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastMessage = message;
      warn("Albion API request failed", { url, attempt, message });
      if (retryEnabled && isRetryableError(0, message) && attempt < MAX_RETRIES) {
        await sleep(RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1]);
        continue;
      }
      error("Albion API failed after retries", { url, attempts: attempt + 1, lastStatus });
      throw new Error(`Albion API failed after ${attempt + 1} attempt(s): ${lastMessage} (${lastStatus || "network"})`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Albion API failed after ${MAX_RETRIES + 1} attempts: ${lastMessage} (${lastStatus || "network"})`);
}

function joinList(values?: string[] | number[]): string {
  if (!values || values.length === 0) return "";
  return values.join(",");
}

function buildPricesUrl(query: PriceQuery): string {
  const base = HOSTS[query.region ?? "west"];
  const items = query.itemIds.join(",");
  const params = new URLSearchParams();
  const locations = joinList(query.locations);
  const qualities = joinList(query.qualities);
  if (locations) params.set("locations", locations);
  if (qualities) params.set("qualities", qualities);
  const qs = params.toString();
  const url = `${base}/api/v2/stats/prices/${items}.json${qs ? `?${qs}` : ""}`;
  if (url.length > URL_MAX_LENGTH) {
    throw new Error(`URL exceeds ${URL_MAX_LENGTH} chars: split the request.`);
  }
  return url;
}

export async function getPrices(query: PriceQuery, timeoutMs?: number): Promise<MarketPrice[]> {
  const url = buildPricesUrl(query);
  const cacheKey = `prices:${url}`;
  const cached = getCached<MarketPrice[]>(cacheKey);
  if (cached) return cached;
  const data = await fetchJson<MarketPrice[]>(url, timeoutMs);
  // Prices move fast: 60s TTL balances freshness vs rate-limit budget.
  setCached(cacheKey, data, 60_000);
  return data;
}

export async function getHistory(query: HistoryQuery): Promise<HistoryLocation[]> {
  const base = HOSTS[query.region ?? "west"];
  const items = query.itemIds.join(",");
  const params = new URLSearchParams();
  const locations = joinList(query.locations);
  const qualities = joinList(query.qualities);
  if (locations) params.set("locations", locations);
  if (qualities) params.set("qualities", qualities);
  if (query.timeScale) params.set("time-scale", String(query.timeScale));
  if (query.date) params.set("date", query.date);
  if (query.endDate) params.set("end_date", query.endDate);
  const qs = params.toString();
  const url = `${base}/api/v2/stats/history/${items}.json${qs ? `?${qs}` : ""}`;
  if (url.length > URL_MAX_LENGTH) {
    throw new Error(`URL exceeds ${URL_MAX_LENGTH} chars: split the request.`);
  }
  const cacheKey = `history:${url}`;
  const cached = getCached<HistoryLocation[]>(cacheKey);
  if (cached) return cached;
  const data = await fetchJson<HistoryLocation[]>(url);
  // History is aggregated and changes slowly: 5min TTL.
  setCached(cacheKey, data, 300_000);
  return data;
}

export async function getGold(
  region: ServerRegion = "west",
  count?: number,
  date?: string,
  endDate?: string,
): Promise<GoldPrice[]> {
  const base = HOSTS[region];
  const params = new URLSearchParams();
  if (count) params.set("count", String(count));
  if (date) params.set("date", date);
  if (endDate) params.set("end_date", endDate);
  const qs = params.toString();
  const url = `${base}/api/v2/stats/gold.json${qs ? `?${qs}` : ""}`;
  const cacheKey = `gold:${url}`;
  const cached = getCached<GoldPrice[]>(cacheKey);
  if (cached) return cached;
  const data = await fetchJson<GoldPrice[]>(url);
  setCached(cacheKey, data, 60_000);
  return data;
}
