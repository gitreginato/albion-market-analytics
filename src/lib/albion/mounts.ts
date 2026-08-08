// Mount carry weight configuration for Albion Online.
// Source: https://wiki.albiononline.com/wiki/Max_LOAD
//
// Max load is the carry weight in kg before movement speed is reduced.
// "Montaria lotada" = fully loaded mount = profit calculated per mount load.

export interface Mount {
  id: string;
  name: string;
  tier: number;
  maxLoadKg: number;
  category: "transport" | "riding" | "special";
}

// All weights in kg, based on Normal quality mounts.
export const MOUNTS: Mount[] = [
  // Transport Oxen — highest carry capacity, slowest
  { id: "T3_OX_TRANSPORT", name: "Boi de Carga do Aprendiz", tier: 3, maxLoadKg: 1569, category: "transport" },
  { id: "T4_OX_TRANSPORT", name: "Boi de Carga do Perito", tier: 4, maxLoadKg: 2231, category: "transport" },
  { id: "T5_OX_TRANSPORT", name: "Boi de Carga do Mestre", tier: 5, maxLoadKg: 2676, category: "transport" },
  { id: "T6_OX_TRANSPORT", name: "Boi de Carga do Grão-mestre", tier: 6, maxLoadKg: 3148, category: "transport" },
  { id: "T7_OX_TRANSPORT", name: "Boi de Carga do Ancião", tier: 7, maxLoadKg: 3583, category: "transport" },
  { id: "T8_OX_TRANSPORT", name: "Boi de Carga do Antigo", tier: 8, maxLoadKg: 4116, category: "transport" },
  // Transport Mammoth — highest carry capacity in game
  { id: "T8_MAMMOTH_TRANSPORT", name: "Mamute de Carga do Antigo", tier: 8, maxLoadKg: 41162, category: "special" },
  // Riding Horses — fast, low carry
  { id: "T3_HORSE", name: "Cavalo do Aprendiz", tier: 3, maxLoadKg: 157, category: "riding" },
  { id: "T4_HORSE", name: "Cavalo do Perito", tier: 4, maxLoadKg: 233, category: "riding" },
  { id: "T5_HORSE", name: "Cavalo do Mestre", tier: 5, maxLoadKg: 268, category: "riding" },
  { id: "T6_HORSE", name: "Cavalo do Grão-mestre", tier: 6, maxLoadKg: 314, category: "riding" },
  { id: "T7_HORSE", name: "Cavalo do Ancião", tier: 7, maxLoadKg: 358, category: "riding" },
  { id: "T8_HORSE", name: "Cavalo do Antigo", tier: 8, maxLoadKg: 412, category: "riding" },
  // Special mounts
  { id: "T2_MULE", name: "Mula do Novato", tier: 2, maxLoadKg: 60, category: "transport" },
  { id: "T3_RAM", name: "Carneiro do Recruta", tier: 3, maxLoadKg: 320, category: "riding" },
  { id: "T4_STAG", name: "Cervo Gigante do Perito", tier: 4, maxLoadKg: 465, category: "riding" },
  { id: "T5_BEAR", name: "Urso Selado", tier: 5, maxLoadKg: 1231, category: "special" },
  { id: "T6_DIREBOAR", name: "Javali Selado", tier: 6, maxLoadKg: 1252, category: "special" },
  { id: "T7_DIREBEAR", name: "Urso Dire Selado", tier: 7, maxLoadKg: 2469, category: "special" },
];

export const DEFAULT_MOUNT_ID = "T5_OX_TRANSPORT";

export function getMountById(id: string): Mount | undefined {
  return MOUNTS.find((m) => m.id === id);
}

// Item weight estimation in kg.
// Based on Albion Online data:
// - Raw resources (ORE, WOOD, HIDE, FIBER, ROCK): tier * 0.1275 kg per unit
// - Refined materials (METALBAR, PLANKS, LEATHER, CLOTH, STONEBLOCK): tier * 0.1275 kg per unit
// - Gear (weapons, armor, accessories): tier * 1.275 kg per unit (varies by slot)
//
// Source: albiondatabase.com (T4_ORE = 0.51 kg, T4_MAIN_SWORD = 5.1 kg)
const RESOURCE_WEIGHT_PER_TIER = 0.1275;
const GEAR_WEIGHT_PER_TIER = 1.275;

export function getItemWeight(itemId: string): number {
  const tierMatch = itemId.match(/^T(\d+)/);
  if (!tierMatch) return 1;
  const tier = parseInt(tierMatch[1], 10);

  // Raw resources and refined materials
  if (/^T\d+_(ORE|WOOD|HIDE|FIBER|ROCK|METALBAR|PLANKS|LEATHER|CLOTH|STONEBLOCK)$/.test(itemId)) {
    return tier * RESOURCE_WEIGHT_PER_TIER;
  }

  // 2H weapons are heavier
  if (itemId.includes("_2H_")) {
    return tier * GEAR_WEIGHT_PER_TIER * 2;
  }

  // Armor pieces
  if (itemId.includes("_ARMOR_")) {
    return tier * GEAR_WEIGHT_PER_TIER * 1.5;
  }

  // Bags and capes are lighter
  if (itemId.includes("_BAG") || itemId.includes("_CAPE")) {
    return tier * GEAR_WEIGHT_PER_TIER * 0.25;
  }

  // Default: 1H weapon weight
  return tier * GEAR_WEIGHT_PER_TIER;
}

// Calculate how many units of an item fit on a fully loaded mount.
export function getUnitsPerLoad(itemId: string, mountMaxLoadKg: number): number {
  const weight = getItemWeight(itemId);
  if (weight <= 0) return 0;
  return Math.floor(mountMaxLoadKg / weight);
}
