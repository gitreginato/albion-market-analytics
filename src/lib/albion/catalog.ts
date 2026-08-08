// Loads the full ao-bin-dumps items.json (~30k entries) from GitHub with a 24h cache.
// The file is large (~10MB) so we fetch it once, keep it in memory, and serve
// search queries from there. Falls back to the curated catalog if the fetch fails.

import { ITEM_CATALOG, type CatalogItem } from "./items";

const ITEMS_JSON_URL =
  "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface RawItem {
  UniqueName: string;
  LocalizedNames?: Record<string, string>;
  Index?: string | number;
}

let fullCatalog: CatalogItem[] | null = null;
let catalogPromise: Promise<CatalogItem[]> | null = null;
let catalogExpiresAt = 0;

function parseTier(uniqueName: string): number {
  const match = uniqueName.match(/^T(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseCategory(uniqueName: string): string {
  // Extract a human-readable category from the item id prefix.
  if (uniqueName.includes("_ORE")) return "Ore";
  if (uniqueName.includes("_WOOD")) return "Wood";
  if (uniqueName.includes("_HIDE")) return "Hide";
  if (uniqueName.includes("_FIBER")) return "Fiber";
  if (uniqueName.includes("_ROCK")) return "Rock";
  if (uniqueName.includes("_METALBAR")) return "Metalbar";
  if (uniqueName.includes("_PLANKS")) return "Planks";
  if (uniqueName.includes("_LEATHER")) return "Leather";
  if (uniqueName.includes("_CLOTH")) return "Cloth";
  if (uniqueName.includes("_STONEBLOCK")) return "Stoneblock";
  if (uniqueName.includes("_BAG")) return "Bag";
  if (uniqueName.includes("_CAPE")) return "Cape";
  if (uniqueName.includes("_ARMOR")) return "Armor";
  if (uniqueName.includes("_HELMET")) return "Helmet";
  if (uniqueName.includes("_SHOES")) return "Shoes";
  if (uniqueName.includes("_SWORD")) return "Sword";
  if (uniqueName.includes("_AXE")) return "Axe";
  if (uniqueName.includes("_BOW")) return "Bow";
  if (uniqueName.includes("_STAFF")) return "Staff";
  if (uniqueName.includes("_KNIFE")) return "Knife";
  if (uniqueName.includes("_HAMMER")) return "Hammer";
  if (uniqueName.includes("_SPEAR")) return "Spear";
  if (uniqueName.includes("_SHIELD")) return "Shield";
  if (uniqueName.includes("_2H_")) return "Two-handed";
  if (uniqueName.includes("_MAIN_")) return "Main-hand";
  return "Other";
}

function isTradable(uniqueName: string): boolean {
  // Filter out non-tradeable items: tools, journals, hideout kits, etc.
  if (uniqueName.startsWith("UNIQUE")) return false;
  if (uniqueName.includes("_TOOL_")) return false;
  if (uniqueName.includes("JOURNAL")) return false;
  if (uniqueName.includes("HIDEOUT")) return false;
  if (uniqueName.includes("_TEST_")) return false;
  if (uniqueName.includes("_EVENT_")) return false;
  if (uniqueName.includes("_TOKEN_")) return false;
  if (uniqueName.includes("_ARENA_")) return false;
  if (uniqueName.includes("_PREMIUM")) return false;
  // Keep resources, refined materials, gear.
  return true;
}

// Classify an item ID into a broad market category.
// - "raw": unrefined resources (ORE, WOOD, HIDE, FIBER, ROCK) — format: T{N}_{RESOURCE}
// - "refined": refined materials (METALBAR, PLANKS, LEATHER, CLOTH, STONEBLOCK) — format: T{N}_{MATERIAL}
// - "gear": equipment (weapons, armor, accessories, gatherer equipment)
export type ItemCategory = "raw" | "refined" | "gear";

export function getItemCategory(itemId: string): ItemCategory {
  // Raw resources: exactly T{N}_{RESOURCE} with no extra suffixes.
  if (/^T\d+_(ORE|WOOD|HIDE|FIBER|ROCK)$/.test(itemId)) return "raw";
  // Refined materials: exactly T{N}_{MATERIAL} with no extra suffixes.
  if (/^T\d+_(METALBAR|PLANKS|LEATHER|CLOTH|STONEBLOCK)$/.test(itemId)) return "refined";
  return "gear";
}

function transform(raw: RawItem[]): CatalogItem[] {
  return raw
    .filter((item) => item.UniqueName && isTradable(item.UniqueName))
    .map((item) => ({
      id: item.UniqueName,
      name: item.LocalizedNames?.["PT-BR"] ?? item.LocalizedNames?.["EN-US"] ?? item.UniqueName,
      tier: parseTier(item.UniqueName),
      category: parseCategory(item.UniqueName),
    }));
}

export async function getFullCatalog(): Promise<CatalogItem[]> {
  if (fullCatalog && Date.now() < catalogExpiresAt) {
    return fullCatalog;
  }
  if (catalogPromise) {
    return catalogPromise;
  }
  catalogPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(ITEMS_JSON_URL, {
        signal: controller.signal,
        headers: { "Accept-Encoding": "gzip" },
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`items.json fetch failed: ${res.status}`);
      const raw = (await res.json()) as RawItem[];
      fullCatalog = transform(raw);
      catalogExpiresAt = Date.now() + CACHE_TTL_MS;
      return fullCatalog;
    } catch {
      // Fallback to the curated catalog if the upstream is unreachable.
      if (!fullCatalog) {
        fullCatalog = ITEM_CATALOG;
      }
      catalogExpiresAt = Date.now() + CACHE_TTL_MS;
      return fullCatalog;
    } finally {
      catalogPromise = null;
    }
  })();
  return catalogPromise;
}

export async function searchFullCatalog(
  query: string,
  limit = 20,
): Promise<CatalogItem[]> {
  const catalog = await getFullCatalog();
  const q = query.trim().toLowerCase();
  if (!q) return catalog.slice(0, limit);
  return catalog
    .filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

// Get all tradable item IDs from the full catalog (no enchantments).
// Used by the scanner to scan "everything".
export async function getAllTradableItemIds(): Promise<string[]> {
  const catalog = await getFullCatalog();
  // Exclude enchanted variants (@1, @2, @3) — they have separate market data
  // but the scanner can't value them without the base item.
  return catalog
    .filter((item) => !item.id.includes("@"))
    .map((item) => item.id);
}

// Test-only hook.
export function __resetCatalogForTests(): void {
  fullCatalog = null;
  catalogPromise = null;
  catalogExpiresAt = 0;
}
