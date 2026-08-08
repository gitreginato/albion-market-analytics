// Curated item catalog for the MVP.
// The full ao-bin-dumps items.json (~30k entries) is wired in Phase 2.
// For now we expose a hand-picked set of high-liquidity items so the UI is usable.

export interface CatalogItem {
  id: string;
  name: string;
  tier: number;
  category: string;
}

export const ITEM_CATALOG: CatalogItem[] = [
  { id: "T4_BAG", name: "Adept's Bag", tier: 4, category: "Bag" },
  { id: "T5_BAG", name: "Expert's Bag", tier: 5, category: "Bag" },
  { id: "T6_BAG", name: "Master's Bag", tier: 6, category: "Bag" },
  { id: "T4_CAPE", name: "Adept's Cape", tier: 4, category: "Cape" },
  { id: "T5_CAPE", name: "Expert's Cape", tier: 5, category: "Cape" },
  { id: "T6_CAPE", name: "Master's Cape", tier: 6, category: "Cape" },
  { id: "T4_MAIN_SWORD", name: "Adept's Broadsword", tier: 4, category: "Weapon" },
  { id: "T5_MAIN_SWORD", name: "Expert's Broadsword", tier: 5, category: "Weapon" },
  { id: "T6_MAIN_SWORD", name: "Master's Broadsword", tier: 6, category: "Weapon" },
  { id: "T4_MAIN_FIRESTAFF", name: "Adept's Fire Staff", tier: 4, category: "Weapon" },
  { id: "T5_MAIN_FIRESTAFF", name: "Expert's Fire Staff", tier: 5, category: "Weapon" },
  { id: "T6_MAIN_FIRESTAFF", name: "Master's Fire Staff", tier: 6, category: "Weapon" },
  { id: "T4_2H_BOW", name: "Adept's Bow", tier: 4, category: "Weapon" },
  { id: "T5_2H_BOW", name: "Expert's Bow", tier: 5, category: "Weapon" },
  { id: "T6_2H_BOW", name: "Master's Bow", tier: 6, category: "Weapon" },
  { id: "T4_LEATHER_SHOES", name: "Adept's Leather Shoes", tier: 4, category: "Armor" },
  { id: "T5_LEATHER_SHOES", name: "Expert's Leather Shoes", tier: 5, category: "Armor" },
  { id: "T6_LEATHER_SHOES", name: "Master's Leather Shoes", tier: 6, category: "Armor" },
  { id: "T4_LEATHER_ARMOR", name: "Adept's Leather Jacket", tier: 4, category: "Armor" },
  { id: "T5_LEATHER_ARMOR", name: "Expert's Leather Jacket", tier: 5, category: "Armor" },
  { id: "T6_LEATHER_ARMOR", name: "Master's Leather Jacket", tier: 6, category: "Armor" },
  { id: "T4_PLATE_HELMET", name: "Adept's Plate Helmet", tier: 4, category: "Armor" },
  { id: "T5_PLATE_HELMET", name: "Expert's Plate Helmet", tier: 5, category: "Armor" },
  { id: "T6_PLATE_HELMET", name: "Master's Plate Helmet", tier: 6, category: "Armor" },
  { id: "T4_ORE", name: "Adept's Ore", tier: 4, category: "Resource" },
  { id: "T5_ORE", name: "Expert's Ore", tier: 5, category: "Resource" },
  { id: "T4_WOOD", name: "Adept's Wood", tier: 4, category: "Resource" },
  { id: "T5_WOOD", name: "Expert's Wood", tier: 5, category: "Resource" },
  { id: "T4_HIDE", name: "Adept's Hide", tier: 4, category: "Resource" },
  { id: "T5_HIDE", name: "Expert's Hide", tier: 5, category: "Resource" },
];

export const CITIES = [
  "Caerleon",
  "Bridgewatch",
  "Martlock",
  "Thetford",
  "Lymhurst",
  "Fort Sterling",
  "Brecilien",
  "Black Market",
] as const;

export type City = (typeof CITIES)[number];

export function searchItems(query: string, limit = 20): CatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return ITEM_CATALOG.slice(0, limit);
  return ITEM_CATALOG.filter(
    (item) =>
      item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q),
  ).slice(0, limit);
}

export function findItem(id: string): CatalogItem | undefined {
  return ITEM_CATALOG.find((item) => item.id === id);
}
