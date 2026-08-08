"use client";

// Central dashboard store to make tabs "talk to each other".
// Holds shared selections, filters, watchlist, and saved searches.

import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import type { CatalogItem } from "@/lib/albion/items";
import type { ServerRegion } from "@/lib/albion/types";

export interface SavedSearch {
  id: string;
  name: string;
  itemId: string;
  itemName: string;
  region: ServerRegion;
  tab: string;
  createdAt: number;
}

export interface WatchlistItem {
  itemId: string;
  itemName: string;
  quality: number;
  addedAt: number;
}

interface DashboardState {
  item: CatalogItem | null;
  region: ServerRegion;
  qualityFilter: Set<number>;
  watchlist: WatchlistItem[];
  savedSearches: SavedSearch[];
  lastRefresh: number | null;
}

type Action =
  | { type: "SET_ITEM"; payload: CatalogItem | null }
  | { type: "SET_REGION"; payload: ServerRegion }
  | { type: "TOGGLE_QUALITY"; payload: number }
  | { type: "SET_QUALITY_FILTER"; payload: Set<number> }
  | { type: "ADD_WATCHLIST"; payload: WatchlistItem }
  | { type: "REMOVE_WATCHLIST"; payload: { itemId: string; quality: number } }
  | { type: "SAVE_SEARCH"; payload: SavedSearch }
  | { type: "DELETE_SEARCH"; payload: string }
  | { type: "SET_LAST_REFRESH"; payload: number }
  | { type: "HYDRATE"; payload: Partial<DashboardState> };

const STORAGE_KEY = "albion-market-dashboard-v1";

function loadState(): Partial<DashboardState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      region: (parsed.region as ServerRegion) ?? "west",
      qualityFilter: new Set((parsed.qualityFilter as number[]) ?? []),
      watchlist: (parsed.watchlist as WatchlistItem[]) ?? [],
      savedSearches: (parsed.savedSearches as SavedSearch[]) ?? [],
      lastRefresh: (parsed.lastRefresh as number) ?? null,
    };
  } catch {
    return {};
  }
}

function saveState(state: DashboardState): void {
  if (typeof window === "undefined") return;
  try {
    const serializable = {
      region: state.region,
      qualityFilter: Array.from(state.qualityFilter),
      watchlist: state.watchlist,
      savedSearches: state.savedSearches,
      lastRefresh: state.lastRefresh,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore quota errors.
  }
}

const initialState: DashboardState = {
  item: null,
  region: "west",
  qualityFilter: new Set(),
  watchlist: [],
  savedSearches: [],
  lastRefresh: null,
};

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case "SET_ITEM":
      return { ...state, item: action.payload };
    case "SET_REGION":
      return { ...state, region: action.payload };
    case "TOGGLE_QUALITY": {
      const next = new Set(state.qualityFilter);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, qualityFilter: next };
    }
    case "SET_QUALITY_FILTER":
      return { ...state, qualityFilter: action.payload };
    case "ADD_WATCHLIST": {
      const exists = state.watchlist.some(
        (w) => w.itemId === action.payload.itemId && w.quality === action.payload.quality,
      );
      if (exists) return state;
      return { ...state, watchlist: [...state.watchlist, action.payload] };
    }
    case "REMOVE_WATCHLIST":
      return {
        ...state,
        watchlist: state.watchlist.filter(
          (w) => !(w.itemId === action.payload.itemId && w.quality === action.payload.quality),
        ),
      };
    case "SAVE_SEARCH":
      return { ...state, savedSearches: [action.payload, ...state.savedSearches].slice(0, 50) };
    case "DELETE_SEARCH":
      return { ...state, savedSearches: state.savedSearches.filter((s) => s.id !== action.payload) };
    case "SET_LAST_REFRESH":
      return { ...state, lastRefresh: action.payload };
    case "HYDRATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const hydrated = loadState();
    if (Object.keys(hydrated).length > 0) {
      dispatch({ type: "HYDRATE", payload: hydrated });
    }
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

export function useDashboardActions() {
  const { dispatch } = useDashboard();

  const setItem = useCallback((item: CatalogItem | null) => dispatch({ type: "SET_ITEM", payload: item }), [dispatch]);
  const setRegion = useCallback((region: ServerRegion) => dispatch({ type: "SET_REGION", payload: region }), [dispatch]);
  const toggleQuality = useCallback((quality: number) => dispatch({ type: "TOGGLE_QUALITY", payload: quality }), [dispatch]);
  const setQualityFilter = useCallback((filter: Set<number>) => dispatch({ type: "SET_QUALITY_FILTER", payload: filter }), [dispatch]);
  const addWatchlist = useCallback((item: WatchlistItem) => dispatch({ type: "ADD_WATCHLIST", payload: item }), [dispatch]);
  const removeWatchlist = useCallback((itemId: string, quality: number) => dispatch({ type: "REMOVE_WATCHLIST", payload: { itemId, quality } }), [dispatch]);
  const saveSearch = useCallback((search: SavedSearch) => dispatch({ type: "SAVE_SEARCH", payload: search }), [dispatch]);
  const deleteSearch = useCallback((id: string) => dispatch({ type: "DELETE_SEARCH", payload: id }), [dispatch]);
  const setLastRefresh = useCallback((ts: number) => dispatch({ type: "SET_LAST_REFRESH", payload: ts }), [dispatch]);

  return {
    setItem,
    setRegion,
    toggleQuality,
    setQualityFilter,
    addWatchlist,
    removeWatchlist,
    saveSearch,
    deleteSearch,
    setLastRefresh,
  };
}
