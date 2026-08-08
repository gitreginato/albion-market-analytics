// Albion Online Data Project API types.
// Source: https://www.albion-online-data.com/api

export type ServerRegion = "west" | "east" | "europe";

export interface MarketPrice {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

export interface HistoryEntry {
  item_count: number;
  avg_price: number;
  timestamp: string;
}

export interface HistoryLocation {
  location: string;
  item_id: string;
  quality: number;
  data: HistoryEntry[];
}

export interface GoldPrice {
  price: number;
  timestamp: string;
}

export interface ItemMetadata {
  UniqueName: string;
  LocalizedNames?: Record<string, string>;
  Index?: number;
}

export interface PriceQuery {
  itemIds: string[];
  locations?: string[];
  qualities?: number[];
  region?: ServerRegion;
}

export interface HistoryQuery {
  itemIds: string[];
  locations?: string[];
  qualities?: number[];
  timeScale?: 1 | 6 | 24;
  date?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  region?: ServerRegion;
}
