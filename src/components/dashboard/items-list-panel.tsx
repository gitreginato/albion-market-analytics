"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  X,
  Scale,
  Truck,
  Coins,
  Weight,
  Activity,
  Clock,
  Skull,
  ArrowRight,
  MapPin,
  Sparkles,
} from "lucide-react";
import { ITEM_CATALOG, type CatalogItem } from "@/lib/albion/items";
import { ItemImage } from "@/components/item-image";
import { QUALITY_COLORS, QUALITY_LABELS } from "@/lib/albion/constants";
import { fmtSilver, fmtFull, profitColor, marginColor } from "@/lib/utils/format";
import type { ServerRegion } from "@/lib/albion/types";

interface ItemsListPanelProps {
  region: ServerRegion;
  onPickItem: (item: CatalogItem) => void;
}

// Enriched opportunity data from /api/opportunities
interface ArbitrageOpp {
  itemId: string;
  itemName: string;
  buyCity: string;
  sellCity: string;
  buyPrice: number;
  sellPrice: number;
  quality: number;
  transportCost: number;
  salesTax: number;
  setupFee: number;
  profit: number;
  margin: number;
  itemWeight: number;
  unitsPerLoad: number;
  profitPerLoad: number;
}

interface BlackMarketOpp {
  itemId: string;
  itemName: string;
  buyCity: string;
  buyPrice: number;
  blackMarketPrice: number;
  quality: number;
  transportCost: number;
  salesTax: number;
  profit: number;
  margin: number;
  itemWeight: number;
  unitsPerLoad: number;
  profitPerLoad: number;
  bmVolume7d?: number;
  bmConsistency?: number;
  bmAvgPrice7d?: number;
  bmPriceTrend?: "up" | "down" | "stable";
  buyPriceAgeHours?: number;
  bmPriceAgeHours?: number;
}

interface OppResponse {
  arbitrage: ArbitrageOpp[];
  blackMarket: BlackMarketOpp[];
  dbStats: { totalRows: number; distinctItems: number };
}

interface ItemCardData {
  item: CatalogItem;
  bestArb?: ArbitrageOpp;
  bestBm?: BlackMarketOpp;
  bestBuy: number;
  bestSell: number;
  spread: number;
  marginPct: number;
  citiesActive: number;
  lastUpdate: string;
  hasData: boolean;
}

const TIERS = [4, 5, 6, 7, 8];
const CATEGORIES = ["Bag", "Cape", "Weapon", "Armor", "Resource", "Refined", "Consumable"];

function TrendIcon({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (!trend) return null;
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-zinc-500" />;
}

function AgeBadge({ hours, label }: { hours?: number; label: string }) {
  if (hours === undefined) return null;
  const color = hours <= 6 ? "text-emerald-400" : hours <= 24 ? "text-amber-400" : "text-red-400";
  return (
    <span className={`flex items-center gap-0.5 text-[10px] ${color}`}>
      <Clock className="h-2.5 w-2.5" />
      {label}: {hours}h
    </span>
  );
}

function Metric({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <span className={`font-mono text-sm tabular-nums ${color ?? "text-zinc-200"}`}>{value}</span>
    </div>
  );
}

export function ItemsListPanel({ region, onPickItem }: ItemsListPanelProps) {
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<Set<number>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [minMargin, setMinMargin] = useState(0);
  const [minProfit, setMinProfit] = useState(0);
  const [minConsistency, setMinConsistency] = useState(0);
  const [minVolume, setMinVolume] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [data, setData] = useState<ItemCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch enriched opportunities + prices in parallel.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
    });

    const ids = ITEM_CATALOG.map((i) => i.id).join(",");
    const oppParams = new URLSearchParams({
      items: ids,
      region,
      min_profit: "0",
      limit: "200",
      use_premium: "true",
      enrich_bm: "true",
    });

    // Fetch opportunities (includes prices) + prices in smaller batches for city stats.
    const batchSize = 10;
    const batches: string[][] = [];
    for (let i = 0; i < ITEM_CATALOG.length; i += batchSize) {
      batches.push(ITEM_CATALOG.slice(i, i + batchSize).map((it) => it.id));
    }

    Promise.all([
      fetch(`/api/opportunities?${oppParams}`).then((r) => (r.ok ? r.json() : { arbitrage: [], blackMarket: [] })),
      Promise.all(
        batches.map((batch) =>
          fetch(`/api/prices?items=${batch.join(",")}&region=${region}`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ),
      ).then((results) => results.flat()),
    ])
      .then(([oppRes, priceRows]: [OppResponse, Array<{ item_id: string; city: string; quality: number; sell_price_min: number; buy_price_max: number; sell_price_min_date: string }>]) => {
        if (cancelled) return;
        const arbByItem = new Map<string, ArbitrageOpp>();
        for (const a of oppRes.arbitrage) {
          const existing = arbByItem.get(a.itemId);
          if (!existing || a.profit > existing.profit) arbByItem.set(a.itemId, a);
        }
        const bmByItem = new Map<string, BlackMarketOpp>();
        for (const b of oppRes.blackMarket) {
          const existing = bmByItem.get(b.itemId);
          if (!existing || b.profit > existing.profit) bmByItem.set(b.itemId, b);
        }
        const priceByItem = new Map<string, typeof priceRows>();
        for (const r of priceRows) {
          if (!r.item_id) continue;
          if (!priceByItem.has(r.item_id)) priceByItem.set(r.item_id, []);
          priceByItem.get(r.item_id)!.push(r);
        }

        const cards: ItemCardData[] = ITEM_CATALOG.map((item) => {
          const rows = priceByItem.get(item.id) ?? [];
          const bestArb = arbByItem.get(item.id);
          const bestBm = bmByItem.get(item.id);
          const bestBuy = Math.max(...rows.map((r) => r.buy_price_max).filter((v) => v > 0), 0);
          const sellMin = Math.min(...rows.filter((r) => r.sell_price_min > 0).map((r) => r.sell_price_min));
          const bestSell = Number.isFinite(sellMin) ? sellMin : 0;
          const spread = bestBuy > 0 && bestSell > 0 ? bestBuy - bestSell : 0;
          const marginPct = bestSell > 0 && bestBuy > 0 ? (spread / bestSell) * 100 : 0;
          const citiesActive = new Set(rows.filter((r) => r.sell_price_min > 0 || r.buy_price_max > 0).map((r) => r.city)).size;
          const dates = rows.map((r) => r.sell_price_min_date).filter(Boolean).sort().reverse();
          return {
            item,
            bestArb,
            bestBm,
            bestBuy,
            bestSell,
            spread,
            marginPct,
            citiesActive,
            lastUpdate: dates[0] ?? "",
            hasData: rows.length > 0,
          };
        });
        setData(cards);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [region]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((s) => {
      if (q && !s.item.name.toLowerCase().includes(q) && !s.item.id.toLowerCase().includes(q)) return false;
      if (tierFilter.size > 0 && !tierFilter.has(s.item.tier)) return false;
      if (categoryFilter.size > 0 && !categoryFilter.has(s.item.category)) return false;
      const profit = s.bestArb?.profit ?? s.bestBm?.profit ?? 0;
      if (profit < minProfit) return false;
      const margin = s.bestArb?.margin ?? s.bestBm?.margin ?? s.marginPct;
      if (margin < minMargin) return false;
      const consistency = s.bestBm?.bmConsistency ?? 0;
      if (consistency < minConsistency) return false;
      const volume = s.bestBm?.bmVolume7d ?? 0;
      if (volume < minVolume) return false;
      return true;
    }).sort((a, b) => {
      const aProfit = a.bestArb?.profit ?? a.bestBm?.profit ?? 0;
      const bProfit = b.bestArb?.profit ?? b.bestBm?.profit ?? 0;
      return bProfit - aProfit;
    });
  }, [query, data, tierFilter, categoryFilter, minMargin, minProfit, minConsistency, minVolume]);

  const toggle = <T,>(set: Set<T>, v: T): Set<T> => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v); else next.add(v);
    return next;
  };

  const clearFilters = () => {
    setTierFilter(new Set());
    setCategoryFilter(new Set());
    setMinMargin(0);
    setMinProfit(0);
    setMinConsistency(0);
    setMinVolume(0);
  };

  const activeFilterCount =
    tierFilter.size + categoryFilter.size +
    (minMargin > 0 ? 1 : 0) + (minProfit > 0 ? 1 : 0) +
    (minConsistency > 0 ? 1 : 0) + (minVolume > 0 ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search + filter toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou ID..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-sky-600/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? "border-sky-600/50 bg-sky-500/10 text-sky-300"
              : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Filtros robustos</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FilterGroup label="Tier">
              <div className="flex flex-wrap gap-1">
                {TIERS.map((t) => (
                  <button key={t} onClick={() => setTierFilter(toggle(tierFilter, t))}
                    className={`rounded px-2.5 py-1 text-xs font-medium ${tierFilter.has(t) ? "bg-sky-500/15 text-sky-300" : "bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}>
                    T{t}
                  </button>
                ))}
              </div>
            </FilterGroup>
            <FilterGroup label="Categoria">
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategoryFilter(toggle(categoryFilter, c))}
                    className={`rounded px-2.5 py-1 text-xs ${categoryFilter.has(c) ? "bg-sky-500/15 text-sky-300" : "bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </FilterGroup>
            <FilterGroup label={`Lucro mín: ${fmtSilver(minProfit)}`}>
              <input type="range" min={0} max={100000} step={1000} value={minProfit}
                onChange={(e) => setMinProfit(Number(e.target.value) || 0)} className="w-full accent-sky-500" />
            </FilterGroup>
            <FilterGroup label={`Margem mín: ${minMargin}%`}>
              <input type="range" min={0} max={500} step={5} value={minMargin}
                onChange={(e) => setMinMargin(Number(e.target.value) || 0)} className="w-full accent-sky-500" />
            </FilterGroup>
            <FilterGroup label={`Consistência mín: ${minConsistency}%`}>
              <input type="range" min={0} max={100} step={5} value={minConsistency}
                onChange={(e) => setMinConsistency(Number(e.target.value) || 0)} className="w-full accent-sky-500" />
            </FilterGroup>
            <FilterGroup label={`Volume/dia mín: ${minVolume} unid`}>
              <input type="range" min={0} max={500} step={5} value={minVolume}
                onChange={(e) => setMinVolume(Number(e.target.value) || 0)} className="w-full accent-sky-500" />
            </FilterGroup>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{filtered.length} itens encontrados</span>
        {loading && <span className="text-sky-400">Carregando dados enriquecidos...</span>}
      </div>

      {/* Items grid — rich cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((s) => {
          const opp = s.bestArb ?? s.bestBm;
          const isBm = !!s.bestBm;
          const profit = opp?.profit ?? 0;
          const margin = opp?.margin ?? s.marginPct;
          const consistency = s.bestBm?.bmConsistency;
          const volume = s.bestBm?.bmVolume7d;
          const consistencyColor = consistency !== undefined
            ? consistency >= 80 ? "text-emerald-400" : consistency >= 50 ? "text-amber-400" : "text-red-400"
            : "text-zinc-500";
          const consistencyBg = consistency !== undefined
            ? consistency >= 80 ? "bg-emerald-500" : consistency >= 50 ? "bg-amber-500" : "bg-red-500"
            : "bg-zinc-700";

          return (
            <button
              key={s.item.id}
              onClick={() => onPickItem(s.item)}
              className="group relative flex flex-col gap-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40 text-left ring-1 ring-slate-800/60 transition-all hover:ring-sky-600/40 hover:bg-slate-900/70"
            >
              {/* Header: image + name + quality */}
              <div className="flex items-center gap-3 border-b border-slate-800/60 p-3">
                <ItemImage itemId={s.item.id} itemName={s.item.name} size={48} quality={opp?.quality ?? 1} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100 group-hover:text-sky-300">{s.item.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded border px-1.5 py-0 text-[10px] ${QUALITY_COLORS[opp?.quality ?? 1] ?? QUALITY_COLORS[1]}`}>
                      {QUALITY_LABELS[opp?.quality ?? 1] ?? "Normal"}
                    </span>
                    <span className="text-xs text-slate-600">T{s.item.tier}</span>
                  </div>
                </div>
              </div>

              {/* Route */}
              {opp && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs">
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="h-3 w-3 text-emerald-500" />
                    <span>{opp.buyCity}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                  <div className="flex items-center gap-1 text-slate-400">
                    {isBm ? <Skull className="h-3 w-3 text-red-500" /> : <MapPin className="h-3 w-3 text-sky-500" />}
                    <span>{isBm ? "Black Market" : (opp as ArbitrageOpp).sellCity}</span>
                  </div>
                </div>
              )}

              {/* Price section */}
              {opp ? (
                <div className="grid grid-cols-2 gap-px bg-slate-800/40">
                  <div className="bg-slate-900/40 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-600">Compra</p>
                    <p className="font-mono text-sm text-slate-300">{fmtFull(opp.buyPrice)}</p>
                  </div>
                  <div className="bg-slate-900/40 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-600">{isBm ? "BM paga" : "Venda"}</p>
                    <div className="flex items-center gap-1">
                      <p className="font-mono text-sm text-slate-300">
                        {fmtFull(isBm ? s.bestBm!.blackMarketPrice : (opp as ArbitrageOpp).sellPrice)}
                      </p>
                      {isBm && <TrendIcon trend={s.bestBm?.bmPriceTrend} />}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-px bg-slate-800/40">
                  <div className="bg-slate-900/40 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-600">Melhor compra</p>
                    <p className="font-mono text-sm text-slate-300">{s.bestBuy > 0 ? fmtFull(s.bestBuy) : "—"}</p>
                  </div>
                  <div className="bg-slate-900/40 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-600">Melhor venda</p>
                    <p className="font-mono text-sm text-slate-300">{s.bestSell > 0 ? fmtFull(s.bestSell) : "—"}</p>
                  </div>
                </div>
              )}

              {/* Profit highlight */}
              {opp && profit > 0 && (
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-950/30 to-transparent px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs text-slate-400">Lucro/unit</span>
                  </div>
                  <span className={`font-mono text-lg font-bold tabular-nums ${profitColor(profit)}`}>
                    +{fmtSilver(profit)}
                  </span>
                </div>
              )}

              {/* Consistency bar (BM only) */}
              {isBm && consistency !== undefined && (
                <div className="px-3 py-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Sparkles className="h-3 w-3" />
                      <span>Consistência 30d</span>
                    </div>
                    <span className={`font-mono text-sm font-bold ${consistencyColor}`}>{consistency}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className={`h-full rounded-full transition-all ${consistencyBg}`} style={{ width: `${consistency}%` }} />
                  </div>
                </div>
              )}

              {/* Metrics grid */}
              <div className="space-y-1.5 px-3 py-2.5">
                <Metric icon={Scale} label="Margem" value={`${margin.toFixed(0)}%`} color={marginColor(margin)} />
                {opp && <Metric icon={Truck} label="Transporte" value={`-${fmtSilver(opp.transportCost)}`} color="text-amber-500" />}
                {opp && <Metric icon={Coins} label="Taxa venda" value={`-${fmtSilver(opp.salesTax)}`} color="text-amber-500" />}
                {isBm && volume !== undefined && (
                  <Metric icon={Package} label="Volume/dia" value={`${volume} unid`}
                    color={volume >= 50 ? "text-emerald-400" : volume >= 10 ? "text-amber-400" : "text-red-400"} />
                )}
                {isBm && consistency !== undefined && (
                  <Metric icon={Activity} label="Consistência" value={`${consistency}%`} color={consistencyColor} />
                )}
                {isBm && s.bestBm?.bmAvgPrice7d !== undefined && (
                  <Metric icon={TrendingUp} label="BM avg 7d" value={fmtSilver(s.bestBm.bmAvgPrice7d)} color="text-sky-300" />
                )}
              </div>

              {/* Price age badges */}
              {isBm && (s.bestBm?.buyPriceAgeHours !== undefined || s.bestBm?.bmPriceAgeHours !== undefined) && (
                <div className="flex items-center gap-3 border-t border-slate-800/40 px-3 py-1.5">
                  <AgeBadge hours={s.bestBm?.buyPriceAgeHours} label="compra" />
                  <AgeBadge hours={s.bestBm?.bmPriceAgeHours} label="BM" />
                </div>
              )}

              {/* Mount load section */}
              {opp && opp.unitsPerLoad > 0 && (
                <div className="border-t border-slate-800/60 bg-slate-950/30 px-3 py-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-600">
                    <Weight className="h-3 w-3" />
                    <span>Carga da montaria</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-600">Peso item</p>
                      <p className="font-mono text-xs text-slate-400">{opp.itemWeight.toFixed(2)} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-600">Unid./carga</p>
                      <p className="font-mono text-xs text-slate-400">{opp.unitsPerLoad.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-md bg-emerald-950/30 px-2 py-1.5">
                    <span className="text-[10px] text-slate-500">Lucro/carga</span>
                    <span className={`font-mono text-sm font-bold ${profitColor(opp.profitPerLoad)}`}>
                      +{fmtSilver(opp.profitPerLoad)}
                    </span>
                  </div>
                </div>
              )}

              {/* Footer: cities + date */}
              <div className="mt-auto flex items-center justify-between border-t border-slate-800/50 px-3 py-2 text-[10px] text-slate-500">
                <span>{s.citiesActive} cidades ativas</span>
                <span>{s.lastUpdate ? s.lastUpdate.slice(0, 10) : "—"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-500">Nenhum item encontrado com os filtros atuais.</p>
          <p className="mt-1 text-xs text-slate-600">Escanee o mercado para popular os dados de oportunidades.</p>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}
