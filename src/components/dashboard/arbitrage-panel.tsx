"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeftRight, TrendingUp, MapPin, ArrowRight, Truck, Weight } from "lucide-react";
import { CITIES, type CatalogItem } from "@/lib/albion/items";
import { getItemWeight, getUnitsPerLoad, DEFAULT_MOUNT_ID, getMountById } from "@/lib/albion/mounts";
import type { MarketPrice, ServerRegion } from "@/lib/albion/types";
import { fmtFull, fmtSilver, profitColor, marginColor } from "@/lib/utils/format";
import { downloadCsv } from "@/lib/utils/export";
import { ItemImage } from "@/components/item-image";
import {
  EmptyState,
  ExportButton,
  LoadingSkeleton,
  PageTitle,
  Panel,
  ShellStatCard,
  ToggleChip,
  Toolbar,
} from "./ui-shell";
import { useFetch } from "./use-fetch";

interface ArbitragePanelProps {
  item: CatalogItem;
  region: ServerRegion;
  setLastRefresh?: (ts: number) => void;
}

interface ArbitrageRoute {
  from: string;
  to: string;
  buy: number;
  sell: number;
  transportCost: number;
  fees: number;
  net: number;
  margin: number;
}

interface CityRow {
  city: string;
  sellMin: number;
  buyMax: number;
}

export function ArbitragePanel({ item, region, setLastRefresh }: ArbitragePanelProps) {
  const [usePremium, setUsePremium] = useState(true);
  const [transportMode, setTransportMode] = useState<"fast" | "manual">("fast");
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set(CITIES));
  const url = `/api/prices?items=${item.id}&locations=${CITIES.join(",")}&region=${region}`;
  const { data, loading, error } = useFetch<MarketPrice[]>(url);

  useEffect(() => {
    if (data && !loading && !error) setLastRefresh?.(Date.now());
  }, [data, loading, error, setLastRefresh]);

  const { routes, bestBuy, bestSell, bestRoute } = useMemo(
    () => computeArbitrage(data, selectedCities, usePremium, transportMode),
    [data, selectedCities, usePremium, transportMode],
  );

  const exportCsv = useCallback(() => {
    const rows = routes.slice(0, 50).map((r) => ({
      item: item.name,
      from: r.from,
      to: r.to,
      buyPrice: r.buy,
      sellPrice: r.sell,
      transportCost: r.transportCost,
      fees: r.fees,
      netProfit: r.net,
      marginPercent: r.margin.toFixed(2),
    }));
    downloadCsv(`arbitrage-${item.id}-${region}-${Date.now()}.csv`, rows);
  }, [routes, item, region]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <EmptyState title="Erro na arbitragem" description={error} />;
  if (!data || data.length === 0)
    return <EmptyState title="Sem dados" description="Não há preços suficientes para calcular rotas de arbitragem." />;

  return (
    <div className="space-y-4">
      {/* Item header with image + mount load */}
      <div className="flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <ItemImage itemId={item.id} itemName={item.name} size={64} quality={1} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-100">{item.name}</h2>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span>T{item.tier}</span>
            <span>·</span>
            <span>{item.category}</span>
            <span>·</span>
            <span>{item.id}</span>
          </div>
        </div>
        {(() => {
          const weight = getItemWeight(item.id);
          const mount = getMountById(DEFAULT_MOUNT_ID);
          const units = mount ? getUnitsPerLoad(item.id, mount.maxLoadKg) : 0;
          if (weight <= 0) return null;
          return (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-slate-500">
                <Weight className="h-3.5 w-3.5" />
                <span>{weight.toFixed(2)} kg</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Truck className="h-3.5 w-3.5" />
                <span>{units.toLocaleString()} unid./carga</span>
              </div>
            </div>
          );
        })()}
      </div>

      <Toolbar>
        <PageTitle title="Rotas de arbitragem" subtitle="Entre cidades com cálculo líquido" />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <TransportSelector mode={transportMode} onChange={setTransportMode} />
          <PremiumToggle premium={usePremium} onChange={setUsePremium} />
          <ExportButton onClick={exportCsv} />
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ShellStatCard label="Melhor compra" value={bestBuy ? fmtFull(bestBuy.sellMin) : "—"} subvalue={bestBuy ? bestBuy.city : undefined} variant="success" icon={ArrowLeftRight} />
        <ShellStatCard label="Melhor venda" value={bestSell ? fmtFull(bestSell.buyMax) : "—"} subvalue={bestSell ? bestSell.city : undefined} variant="danger" icon={ArrowLeftRight} />
        <ShellStatCard label="Melhor rota líquida" value={bestRoute ? fmtFull(bestRoute.net) : "—"} subvalue={bestRoute ? `${bestRoute.from} → ${bestRoute.to}` : undefined} variant="warning" icon={TrendingUp} />
        <ShellStatCard label="Margem líquida" value={bestRoute ? `${bestRoute.margin.toFixed(1)}%` : "—"} subvalue="com taxas e transporte" variant={bestRoute && bestRoute.margin > 0 ? "success" : "default"} icon={Activity} />
      </div>

      <Panel className="space-y-3">
        <CityFilter selected={selectedCities} onChange={setSelectedCities} />
        <RoutesTable routes={routes} item={item} />
      </Panel>
    </div>
  );
}

function TransportSelector({ mode, onChange }: { mode: "fast" | "manual"; onChange: (m: "fast" | "manual") => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Transporte:</span>
      <ToggleChip active={mode === "fast"} onClick={() => onChange("fast")}>Fast Travel (10%)</ToggleChip>
      <ToggleChip active={mode === "manual"} onClick={() => onChange("manual")}>Manual (grátis)</ToggleChip>
    </div>
  );
}

function PremiumToggle({ premium, onChange }: { premium: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-400">
      <input type="checkbox" checked={premium} onChange={(e) => onChange(e.target.checked)} className="accent-sky-500" />
      Premium ({premium ? "4%" : "8%"} taxa)
    </label>
  );
}

function CityFilter({ selected, onChange }: { selected: Set<string>; onChange: (s: Set<string>) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">Cidades incluídas:</span>
      {CITIES.map((city) => (
        <ToggleChip
          key={city}
          active={selected.has(city)}
          onClick={() => {
            const next = new Set(selected);
            if (next.has(city)) next.delete(city);
            else next.add(city);
            onChange(next);
          }}
        >
          {city}
        </ToggleChip>
      ))}
    </div>
  );
}

function RoutesTable({ routes, item }: { routes: ArbitrageRoute[]; item: CatalogItem }) {
  const weight = getItemWeight(item.id);
  const mount = getMountById(DEFAULT_MOUNT_ID);
  const unitsPerLoad = mount ? getUnitsPerLoad(item.id, mount.maxLoadKg) : 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/80">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Rota</th>
            <th className="px-4 py-3 text-right">Compra</th>
            <th className="px-4 py-3 text-right">Venda</th>
            <th className="px-4 py-3 text-right">Transporte</th>
            <th className="px-4 py-3 text-right">Taxas</th>
            <th className="px-4 py-3 text-right">Lucro/unit</th>
            <th className="px-4 py-3 text-right">Margem</th>
            {unitsPerLoad > 0 && <th className="px-4 py-3 text-right">Lucro/carga</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {routes.slice(0, 20).map((route, i) => {
            const profitPerLoad = unitsPerLoad > 0 ? route.net * unitsPerLoad : 0;
            return (
              <tr key={`${route.from}-${route.to}`} className="hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-medium text-slate-300">
                    {i === 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">1</span>}
                    <MapPin className="h-3 w-3 text-emerald-500" />
                    <span>{route.from}</span>
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                    <MapPin className="h-3 w-3 text-sky-500" />
                    <span>{route.to}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">{fmtFull(route.buy)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">{fmtFull(route.sell)}</td>
                <td className="px-4 py-3 text-right font-mono text-amber-500/80">-{fmtSilver(route.transportCost)}</td>
                <td className="px-4 py-3 text-right font-mono text-amber-500/80">-{fmtSilver(route.fees)}</td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${profitColor(route.net)}`}>{route.net > 0 ? "+" : ""}{fmtSilver(route.net)}</td>
                <td className={`px-4 py-3 text-right font-mono ${marginColor(route.margin)}`}>{route.margin.toFixed(0)}%</td>
                {unitsPerLoad > 0 && (
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${profitColor(profitPerLoad)}`}>
                    {profitPerLoad > 0 ? "+" : ""}{fmtSilver(profitPerLoad)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {weight > 0 && (
        <div className="border-t border-slate-800/60 px-4 py-2 text-[10px] text-slate-600">
          Peso item: {weight.toFixed(2)} kg · Unid./carga: {unitsPerLoad.toLocaleString()}
        </div>
      )}
    </div>
  );
}

function computeArbitrage(
  data: MarketPrice[] | null,
  selectedCities: Set<string>,
  usePremium: boolean,
  transportMode: "fast" | "manual",
) {
  if (!data) return { perCity: [] as CityRow[], routes: [] as ArbitrageRoute[], bestBuy: null, bestSell: null, bestRoute: null };
  const bestPerCity = new Map<string, { sell: MarketPrice; buy: MarketPrice }>();
  for (const row of data) {
    if (!selectedCities.has(row.city)) continue;
    const existing = bestPerCity.get(row.city);
    if (!existing) {
      bestPerCity.set(row.city, { sell: row, buy: row });
      continue;
    }
    if (row.sell_price_min > 0 && (existing.sell.sell_price_min === 0 || row.sell_price_min < existing.sell.sell_price_min)) {
      existing.sell = row;
    }
    if (row.buy_price_max > existing.buy.buy_price_max) {
      existing.buy = row;
    }
  }
  const list = Array.from(bestPerCity.entries()).map(([city, { sell, buy }]) => ({ city, sellMin: sell.sell_price_min, buyMax: buy.buy_price_max }));
  const cheapestSell = list.filter((r) => r.sellMin > 0).sort((a, b) => a.sellMin - b.sellMin)[0] ?? null;
  const highestBuy = list.filter((r) => r.buyMax > 0).sort((a, b) => b.buyMax - a.buyMax)[0] ?? null;

  const taxRate = usePremium ? 0.04 : 0.08;
  const setupFee = 0.025;
  const allRoutes: ArbitrageRoute[] = [];
  for (const buyCity of list) {
    for (const sellCity of list) {
      if (buyCity.city === sellCity.city || buyCity.sellMin <= 0 || sellCity.buyMax <= 0) continue;
      const gross = sellCity.buyMax - buyCity.sellMin;
      const transportCost = transportMode === "fast" ? Math.round(buyCity.sellMin * 0.1) : 0;
      const sellFee = Math.round(sellCity.buyMax * (taxRate + setupFee));
      const net = gross - transportCost - sellFee;
      const margin = (net / buyCity.sellMin) * 100;
      allRoutes.push({ from: buyCity.city, to: sellCity.city, buy: buyCity.sellMin, sell: sellCity.buyMax, transportCost, fees: sellFee, net, margin });
    }
  }
  const sortedRoutes = allRoutes.sort((a, b) => b.net - a.net);
  return { perCity: list, routes: sortedRoutes, bestBuy: cheapestSell, bestSell: highestBuy, bestRoute: sortedRoutes[0] ?? null };
}
