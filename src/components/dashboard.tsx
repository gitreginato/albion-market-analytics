"use client";

import { useEffect, useState } from "react";
import {
  ITEM_CATALOG,
  type CatalogItem,
} from "@/lib/albion/items";
import { useDashboard, useDashboardActions } from "@/lib/store/dashboard-store";
import { type Tab as SidebarTab } from "@/components/dashboard/sidebar";
import { AppShell } from "@/components/dashboard/app-shell";
import { ItemSearch } from "@/components/dashboard/item-search";
import { PricesPanel } from "@/components/dashboard/prices-panel";
import { HistoryPanel } from "@/components/dashboard/history-panel";
import { ArbitragePanel } from "@/components/dashboard/arbitrage-panel";
import { GoldPanel } from "@/components/dashboard/gold-panel";
import { OpportunitiesPanel } from "@/components/dashboard/opportunities-panel";
import { ItemsListPanel } from "@/components/dashboard/items-list-panel";
import { ItemDetailModal } from "@/components/dashboard/item-detail-modal";

type Tab = SidebarTab;

export default function Dashboard() {
  const { state } = useDashboard();
  const { setRegion, setItem, setLastRefresh } = useDashboardActions();
  const region = state.region;
  const selectedItem = state.item ?? ITEM_CATALOG[0];

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("opportunities");
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      Promise.resolve().then(() => setSuggestions([]));
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items/search?q=${encodeURIComponent(query)}&limit=8`);
        if (res.ok) {
          const data = (await res.json()) as CatalogItem[];
          setSuggestions(data);
        }
      } catch {
        // ignore — suggestions are non-critical.
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <AppShell tab={tab} onTabChange={setTab} region={region} onRegionChange={setRegion}>
      {tab !== "opportunities" && tab !== "items" && (
        <ItemSearch
          query={query}
          onQueryChange={(v) => {
            setQuery(v);
            setShowSuggestions(true);
          }}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          onPick={(item) => {
            setItem(item);
            setQuery(item.name);
            setShowSuggestions(false);
          }}
          selectedItem={selectedItem}
          tab={tab}
          region={region}
        />
      )}

      <section className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
        {tab === "opportunities" && <OpportunitiesPanel region={region} setLastRefresh={setLastRefresh} />}
        {tab === "items" && <ItemsListPanel region={region} onPickItem={setModalItem} />}
        {tab === "prices" && <PricesPanel item={selectedItem} region={region} setLastRefresh={setLastRefresh} />}
        {tab === "history" && <HistoryPanel item={selectedItem} region={region} setLastRefresh={setLastRefresh} />}
        {tab === "arbitrage" && <ArbitragePanel item={selectedItem} region={region} setLastRefresh={setLastRefresh} />}
        {tab === "gold" && <GoldPanel region={region} setLastRefresh={setLastRefresh} />}
      </section>

      {modalItem && <ItemDetailModal item={modalItem} region={region} onClose={() => setModalItem(null)} />}
    </AppShell>
  );
}
