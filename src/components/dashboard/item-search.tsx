"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { ITEM_CATALOG, type CatalogItem } from "@/lib/albion/items";
import type { ServerRegion } from "@/lib/albion/types";
import { useDashboard, useDashboardActions, type SavedSearch } from "@/lib/store/dashboard-store";
import type { Tab } from "./sidebar";

interface ItemSearchProps {
  query: string;
  onQueryChange: (v: string) => void;
  suggestions: CatalogItem[];
  showSuggestions: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onPick: (item: CatalogItem) => void;
  selectedItem: CatalogItem;
  tab: Tab;
  region: ServerRegion;
}

export function ItemSearch({
  query,
  onQueryChange,
  suggestions,
  showSuggestions,
  onFocus,
  onBlur,
  onPick,
  selectedItem,
  tab,
  region,
}: ItemSearchProps) {
  const { state } = useDashboard();
  const { savedSearches } = state;
  const { saveSearch } = useDashboardActions();
  const [searchName, setSearchName] = useState("");
  const [showSave, setShowSave] = useState(false);

  const handleSave = () => {
    const name = searchName.trim() || `${selectedItem.name} · ${tab}`;
    saveSearch({
      id: `${Date.now()}-${selectedItem.id}`,
      name,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      region,
      tab,
      createdAt: Date.now(),
    });
    setShowSave(false);
    setSearchName("");
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Item
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            onBlur={() => setTimeout(onBlur, 150)}
            placeholder="Buscar item (ex: Broadsword, T4_BAG)..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-600 focus:border-sky-600/50 focus:bg-slate-900 focus:ring-1 focus:ring-sky-600/20"
          />
          <button
            onClick={() => setShowSave(!showSave)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
            title="Salvar pesquisa"
          >
            <Bookmark className="h-4 w-4" />
            Salvar
          </button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onPick(item)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-slate-800/80"
                >
                  <span>{item.name}</span>
                  <span className="text-xs text-slate-500">
                    T{item.tier} &middot; {item.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showSave && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder={`Nome (padrão: ${selectedItem.name} · ${tab})`}
            className="flex-1 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-sky-600/50"
          />
          <button onClick={handleSave} className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500">Salvar</button>
          <button onClick={() => setShowSave(false)} className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200">Cancelar</button>
        </div>
      )}

      {savedSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Pesquisas salvas:</span>
          {savedSearches.slice(0, 6).map((s: SavedSearch) => (
            <button
              key={s.id}
              onClick={() => {
                const item = ITEM_CATALOG.find((i) => i.id === s.itemId) ?? ITEM_CATALOG[0];
                onPick(item);
              }}
              className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/40 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100"
              title={`${s.itemName} · ${s.tab} · ${s.region.toUpperCase()}`}
            >
              <Bookmark className="h-3 w-3" />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
