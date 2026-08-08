"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  LineChart as LineChartIcon,
  BarChart3 as CorrelationIcon,
  Package,
  Scale,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import type { CatalogItem } from "@/lib/albion/items";
import { CITIES } from "@/lib/albion/items";
import type { HistoryLocation, ServerRegion } from "@/lib/albion/types";
import { QUALITY_LABELS, QUALITY_COLORS } from "@/lib/albion/constants";
import { fmtSilver, fmtFull } from "@/lib/utils/format";
import { useFetch } from "./use-fetch";

// Quality colors are tailwind class strings, not raw colors.
const qualityText = (q: number): string => {
  const cls = QUALITY_COLORS[q];
  return cls ? cls.split(" ").find((c) => c.startsWith("text-")) ?? "text-slate-300" : "text-slate-300";
};

interface PriceRow {
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: number | string;
}

interface ItemDetailModalProps {
  item: CatalogItem | null;
  region: ServerRegion;
  onClose: () => void;
}

type ModalTab = "overview" | "prices" | "history" | "correlation";

export function ItemDetailModal({ item, region, onClose }: ItemDetailModalProps) {
  const [modalTab, setModalTab] = useState<ModalTab>("overview");
  const [correlationItem, setCorrelationItem] = useState<CatalogItem | null>(null);
  const [correlationQuery, setCorrelationQuery] = useState("");
  const [correlationSuggestions, setCorrelationSuggestions] = useState<CatalogItem[]>([]);
  const [showCorrelationSuggestions, setShowCorrelationSuggestions] = useState(false);
  const [historyDays, setHistoryDays] = useState(30);
  const [historyCities, setHistoryCities] = useState<Set<string>>(new Set(["Caerleon"]));

  useEffect(() => {
    if (item) {
      Promise.resolve().then(() => {
        setModalTab("overview");
        setCorrelationItem(null);
        setCorrelationQuery("");
      });
    }
  }, [item]);

  useEffect(() => {
    if (!correlationQuery.trim()) {
      Promise.resolve().then(() => setCorrelationSuggestions([]));
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items/search?q=${encodeURIComponent(correlationQuery)}&limit=6`);
        if (res.ok) setCorrelationSuggestions((await res.json()) as CatalogItem[]);
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [correlationQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (item) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  const pricesUrl = item ? `/api/prices?items=${item.id}&region=${region}` : null;
  const { data: pricesData, loading: pricesLoading } = useFetch<PriceRow[]>(pricesUrl);

  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - historyDays);
    return d;
  }, [historyDays]);
  const historyItems = correlationItem ? `${item?.id},${correlationItem.id}` : item?.id ?? "";
  const historyLocs = useMemo(() => Array.from(historyCities).join(","), [historyCities]);
  const historyUrl = useMemo(() => {
    if (!item) return null;
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return `/api/history?items=${historyItems}&locations=${historyLocs}&time-scale=24&date=${fmt(startDate)}&end_date=${fmt(endDate)}&region=${region}`;
  }, [item, historyItems, historyLocs, startDate, endDate, region]);
  const { data: historyData, loading: historyLoading } = useFetch<HistoryLocation[]>(historyUrl);

  if (!item) return null;

  const prices = pricesData ?? [];
  const bestBuy = prices.reduce((best, p) => (p.buy_price_max > best.buy_price_max ? p : best), prices[0]);
  const bestSell = prices.reduce((best, p) => (p.sell_price_min > 0 && p.sell_price_min < best.sell_price_min ? p : best), prices[0] ?? { sell_price_min: Infinity } as PriceRow);
  const spread = bestBuy && bestSell && bestBuy.buy_price_max > 0 && bestSell.sell_price_min < Infinity
    ? bestBuy.buy_price_max - bestSell.sell_price_min
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
              <Package className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{item.name}</h2>
              <p className="text-xs text-slate-500">T{item.tier} · {item.category} · {region.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800 px-6">
          <ModalTabBtn id="overview" label="Visão Geral" icon={DollarSign} active={modalTab === "overview"} onClick={setModalTab} />
          <ModalTabBtn id="prices" label="Preços" icon={DollarSign} active={modalTab === "prices"} onClick={setModalTab} />
          <ModalTabBtn id="history" label="Histórico" icon={LineChartIcon} active={modalTab === "history"} onClick={setModalTab} />
          <ModalTabBtn id="correlation" label="Correlação" icon={CorrelationIcon} active={modalTab === "correlation"} onClick={setModalTab} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {modalTab === "overview" && (
            <OverviewTab prices={prices} loading={pricesLoading} bestBuy={bestBuy} bestSell={bestSell} spread={spread} />
          )}
          {modalTab === "prices" && (
            <PricesTab prices={prices} loading={pricesLoading} />
          )}
          {modalTab === "history" && (
            <HistoryTab
              data={historyData}
              loading={historyLoading}
              days={historyDays}
              setDays={setHistoryDays}
              cities={historyCities}
              setCities={setHistoryCities}
            />
          )}
          {modalTab === "correlation" && (
            <CorrelationTab
              primaryItem={item}
              secondaryItem={correlationItem}
              query={correlationQuery}
              onQueryChange={setCorrelationQuery}
              suggestions={correlationSuggestions}
              showSuggestions={showCorrelationSuggestions}
              onFocus={() => setShowCorrelationSuggestions(true)}
              onBlur={() => setShowCorrelationSuggestions(false)}
              onPick={(it) => { setCorrelationItem(it); setCorrelationQuery(it.name); setShowCorrelationSuggestions(false); }}
              historyData={historyData}
              loading={historyLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ModalTabBtn({ id, label, icon: Icon, active, onClick }: {
  id: ModalTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: (id: ModalTab) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active ? "border-sky-500 text-sky-300" : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function OverviewTab({ prices, loading, bestBuy, bestSell, spread }: {
  prices: PriceRow[];
  loading: boolean;
  bestBuy?: PriceRow;
  bestSell?: PriceRow;
  spread: number;
}) {
  if (loading) return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</div>;
  if (prices.length === 0) return <EmptyModal text="Sem dados de preço para este item." />;

  const marginPct = bestBuy && bestSell && bestSell.sell_price_min > 0 && bestBuy.buy_price_max > 0
    ? ((bestBuy.buy_price_max - bestSell.sell_price_min) / bestSell.sell_price_min) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Melhor Compra" value={bestBuy ? fmtSilver(bestBuy.buy_price_max) : "—"} sub={bestBuy ? `${bestBuy.city} · ${QUALITY_LABELS[bestBuy.quality]}` : ""} color="text-sky-400" />
        <StatCard label="Melhor Venda" value={bestSell && bestSell.sell_price_min < Infinity ? fmtSilver(bestSell.sell_price_min) : "—"} sub={bestSell && bestSell.sell_price_min < Infinity ? `${bestSell.city} · ${QUALITY_LABELS[bestSell.quality]}` : ""} color="text-emerald-400" />
        <StatCard label="Spread" value={fmtSilver(spread)} sub="buy_max - sell_min" color="text-amber-400" />
        <StatCard label="Margem %" value={`${marginPct.toFixed(1)}%`} sub="potencial de arbitragem" color={marginPct > 20 ? "text-emerald-400" : marginPct > 0 ? "text-amber-400" : "text-red-400"} />
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-300">Preços por cidade (Qualidade Normal)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-500">
                <th className="pb-2 pr-4">Cidade</th>
                <th className="pb-2 pr-4">Sell Min</th>
                <th className="pb-2 pr-4">Buy Max</th>
                <th className="pb-2 pr-4">Spread</th>
                <th className="pb-2">Margem</th>
              </tr>
            </thead>
            <tbody>
              {prices.filter((p) => p.quality === 1).map((p) => {
                const sp = p.buy_price_max - p.sell_price_min;
                const mg = p.sell_price_min > 0 ? (sp / p.sell_price_min) * 100 : 0;
                return (
                  <tr key={p.city} className="border-b border-slate-800/50">
                    <td className="py-2 pr-4 text-slate-300">{p.city}</td>
                    <td className="py-2 pr-4 font-mono text-slate-400">{p.sell_price_min > 0 ? fmtFull(p.sell_price_min) : "—"}</td>
                    <td className="py-2 pr-4 font-mono text-slate-400">{p.buy_price_max > 0 ? fmtFull(p.buy_price_max) : "—"}</td>
                    <td className="py-2 pr-4 font-mono text-amber-400">{sp > 0 ? fmtFull(sp) : "—"}</td>
                    <td className={`py-2 font-mono ${mg > 20 ? "text-emerald-400" : mg > 0 ? "text-amber-400" : "text-red-400"}`}>{mg.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PricesTab({ prices, loading }: { prices: PriceRow[]; loading: boolean }) {
  if (loading) return <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</div>;
  if (prices.length === 0) return <EmptyModal text="Sem dados de preço." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-left text-slate-500">
            <th className="pb-2 pr-3">Cidade</th>
            <th className="pb-2 pr-3">Qualidade</th>
            <th className="pb-2 pr-3">Sell Min</th>
            <th className="pb-2 pr-3">Sell Max</th>
            <th className="pb-2 pr-3">Buy Min</th>
            <th className="pb-2 pr-3">Buy Max</th>
            <th className="pb-2">Atualizado</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p, i) => (
            <tr key={`${p.city}-${p.quality}-${i}`} className="border-b border-slate-800/50">
              <td className="py-2 pr-3 text-slate-300">{p.city}</td>
              <td className="py-2 pr-3">
                <span className={qualityText(p.quality)}>{QUALITY_LABELS[p.quality]}</span>
              </td>
              <td className="py-2 pr-3 font-mono text-slate-400">{p.sell_price_min > 0 ? fmtFull(p.sell_price_min) : "—"}</td>
              <td className="py-2 pr-3 font-mono text-slate-400">{p.sell_price_max > 0 ? fmtFull(p.sell_price_max) : "—"}</td>
              <td className="py-2 pr-3 font-mono text-slate-400">{p.buy_price_min > 0 ? fmtFull(p.buy_price_min) : "—"}</td>
              <td className="py-2 pr-3 font-mono text-slate-400">{p.buy_price_max > 0 ? fmtFull(p.buy_price_max) : "—"}</td>
              <td className="py-2 text-slate-500">{String(p.sell_price_min_date).slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTab({ data, loading, days, setDays, cities, setCities }: {
  data: HistoryLocation[] | null;
  loading: boolean;
  days: number;
  setDays: (d: number) => void;
  cities: Set<string>;
  setCities: (c: Set<string>) => void;
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const allTs = Array.from(new Set(data.flatMap((loc) => loc.data.map((d) => d.timestamp)))).sort();
    return allTs.map((ts) => {
      const point: Record<string, number | string> = { timestamp: ts };
      for (const loc of data) {
        const entry = loc.data.find((d) => d.timestamp === ts);
        point[`${loc.item_id}-${loc.location}`] = entry ? Math.round(entry.avg_price) : NaN;
      }
      return point;
    });
  }, [data]);

  const toggleCity = (city: string) => {
    const next = new Set(cities);
    if (next.has(city)) next.delete(city);
    else next.add(city);
    setCities(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Período:</span>
          {[7, 30, 90, 365].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`rounded px-2 py-1 text-xs ${days === d ? "bg-sky-500/10 text-sky-300" : "text-slate-400 hover:text-slate-200"}`}>{d}d</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-slate-500">Cidades:</span>
          {CITIES.map((city) => (
            <button key={city} onClick={() => toggleCity(city)} className={`rounded px-2 py-1 text-xs ${cities.has(city) ? "bg-sky-500/10 text-sky-300" : "text-slate-500 hover:text-slate-300"}`}>{city}</button>
          ))}
        </div>
      </div>

      {loading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>}
      {!loading && (!data || data.length === 0) && <EmptyModal text="Sem dados de histórico para os filtros selecionados." />}
      {!loading && data && data.length > 0 && (
        <div className="h-80 w-full rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5, 10)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {data.map((loc) => (
                <Line key={`${loc.item_id}-${loc.location}`} type="monotone" dataKey={`${loc.item_id}-${loc.location}`} stroke={loc.location === "Black Market" ? "#ef4444" : "#3b82f6"} strokeWidth={2} dot={false} name={`${loc.item_id} @ ${loc.location}`} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((loc) => {
            const prices = loc.data.map((d) => d.avg_price).filter((p) => p > 0);
            const vols = loc.data.map((d) => d.item_count).filter((v) => v > 0);
            const max = Math.max(...prices);
            const min = Math.min(...prices);
            const avg = prices.reduce((s, v) => s + v, 0) / prices.length;
            const totalVol = vols.reduce((s, v) => s + v, 0);
            const change = prices.length > 1 ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0;
            return (
              <div key={`${loc.item_id}-${loc.location}`} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">{loc.item_id} @ {loc.location}</span>
                  <span className={`flex items-center gap-1 text-xs ${change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-slate-500"}`}>
                    {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {change.toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Máx:</span> <span className="font-mono text-slate-300">{fmtFull(max)}</span></div>
                  <div><span className="text-slate-500">Min:</span> <span className="font-mono text-slate-300">{fmtFull(min)}</span></div>
                  <div><span className="text-slate-500">Média:</span> <span className="font-mono text-slate-300">{fmtFull(Math.round(avg))}</span></div>
                  <div><span className="text-slate-500">Volume:</span> <span className="font-mono text-slate-300">{totalVol}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CorrelationTab({ primaryItem, secondaryItem, query, onQueryChange, suggestions, showSuggestions, onFocus, onBlur, onPick, historyData, loading }: {
  primaryItem: CatalogItem;
  secondaryItem: CatalogItem | null;
  query: string;
  onQueryChange: (v: string) => void;
  suggestions: CatalogItem[];
  showSuggestions: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onPick: (item: CatalogItem) => void;
  historyData: HistoryLocation[] | null;
  loading: boolean;
}) {
  const { correlation, beta, chartData } = useMemo(() => {
    if (!historyData || historyData.length < 2) return { correlation: 0, beta: 0, chartData: [] as Record<string, number | string>[] };
    const allTs = Array.from(new Set(historyData.flatMap((loc) => loc.data.map((d) => d.timestamp)))).sort();
    const chart = allTs.map((ts) => {
      const point: Record<string, number | string> = { timestamp: ts };
      for (const loc of historyData) {
        const entry = loc.data.find((d) => d.timestamp === ts);
        point[loc.item_id] = entry ? Math.round(entry.avg_price) : NaN;
      }
      return point;
    });
    const a = historyData[0].data.map((d) => d.avg_price).filter((p) => p > 0);
    const b = historyData[1].data.map((d) => d.avg_price).filter((p) => p > 0);
    const len = Math.min(a.length, b.length);
    if (len === 0) return { correlation: 0, beta: 0, chartData: chart };
    const xs = a.slice(-len);
    const ys = b.slice(-len);
    const meanX = xs.reduce((s, v) => s + v, 0) / len;
    const meanY = ys.reduce((s, v) => s + v, 0) / len;
    let num = 0, denX = 0, denY = 0, denBeta = 0;
    for (let i = 0; i < len; i++) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
      denBeta += dx * dx;
    }
    return {
      correlation: Math.sqrt(denX * denY) === 0 ? 0 : num / Math.sqrt(denX * denY),
      beta: denBeta === 0 ? 0 : num / denBeta,
      chartData: chart,
    };
  }, [historyData]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Comparar com outro item</label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            onBlur={() => setTimeout(onBlur, 150)}
            placeholder="Buscar item para correlacionar..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-200 outline-none focus:border-sky-600/50"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-2xl">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button onClick={() => onPick(s)} className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-800">
                    <span>{s.name}</span>
                    <span className="text-xs text-slate-500">T{s.tier}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {secondaryItem && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <Scale className="h-3 w-3" />
            Comparando: <strong className="text-slate-200">{primaryItem.name}</strong> vs <strong className="text-slate-200">{secondaryItem.name}</strong>
          </div>
        )}
      </div>

      {!secondaryItem && (
        <EmptyModal text="Selecione um segundo item para calcular a correlação de Pearson e Beta." />
      )}

      {secondaryItem && loading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>}

      {secondaryItem && !loading && historyData && historyData.length >= 2 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Correlação de Pearson" value={correlation.toFixed(3)} sub={corrLabel(correlation)} color={Math.abs(correlation) > 0.7 ? "text-sky-400" : "text-slate-300"} />
            <StatCard label="Beta" value={beta.toFixed(3)} sub="sensibilidade relativa" color={beta > 0 ? "text-emerald-400" : "text-red-400"} />
            <StatCard label="Pontos" value={String(historyData[0].data.length)} sub="dias comparados" color="text-slate-300" />
          </div>

          <div className="h-72 w-full rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5, 10)} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey={primaryItem.id} stroke="#3b82f6" strokeWidth={2} dot={false} name={primaryItem.name} connectNulls />
                <Line type="monotone" dataKey={secondaryItem.id} stroke="#f59e0b" strokeWidth={2} dot={false} name={secondaryItem.name} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {secondaryItem && !loading && (!historyData || historyData.length < 2) && (
        <EmptyModal text="Dados insuficientes para correlação. Tente outro item ou período." />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold ${color ?? "text-slate-200"}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600">{sub}</p>}
    </div>
  );
}

function SkeletonRow() {
  return <div className="h-8 animate-pulse rounded bg-slate-800/50" />;
}

function EmptyModal({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

function corrLabel(r: number): string {
  const abs = Math.abs(r);
  if (abs > 0.9) return "Muito forte";
  if (abs > 0.7) return "Forte";
  if (abs > 0.5) return "Moderada";
  if (abs > 0.3) return "Fraca";
  return "Desprezível";
}
