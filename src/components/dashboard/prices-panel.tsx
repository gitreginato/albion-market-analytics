"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Filter, Globe, TrendingUp, Clock, MapPin } from "lucide-react";
import { CITIES, type CatalogItem } from "@/lib/albion/items";
import { QUALITY_LABELS, QUALITY_COLORS } from "@/lib/albion/constants";
import type { MarketPrice, ServerRegion } from "@/lib/albion/types";
import { fmtFull } from "@/lib/utils/format";
import { downloadCsv } from "@/lib/utils/export";
import { useDashboard } from "@/lib/store/dashboard-store";
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

interface PricesPanelProps {
  item: CatalogItem;
  region: ServerRegion;
  setLastRefresh?: (ts: number) => void;
}

export function PricesPanel({ item, region, setLastRefresh }: PricesPanelProps) {
  const { state, dispatch } = useDashboard();
  const qualities = state.qualityFilter;
  const [now] = useState(() => Date.now());
  const url = `/api/prices?items=${item.id}&locations=${CITIES.join(",")}&region=${region}`;
  const { data, loading, error } = useFetch<MarketPrice[]>(url);

  useEffect(() => {
    if (data && !loading && !error) setLastRefresh?.(Date.now());
  }, [data, loading, error, setLastRefresh]);

  const rows = useMemo(() => {
    if (!data) return [];
    return qualities.size > 0 ? data.filter((r) => qualities.has(r.quality)) : data;
  }, [data, qualities]);

  const byCity = useMemo(() => groupByCity(rows), [rows]);
  const cities = useMemo(() => Array.from(byCity.keys()).sort(), [byCity]);
  const bestSell = useMemo(() => findBestSell(rows), [rows]);
  const bestBuy = useMemo(() => findBestBuy(rows), [rows]);
  const spread = bestSell && bestBuy ? bestBuy.buy_price_max - bestSell.sell_price_min : 0;
  const marginPct = bestSell && bestBuy && bestSell.sell_price_min > 0 ? (spread / bestSell.sell_price_min) * 100 : 0;
  const freshestHours = useMemo(() => {
    if (!rows.length) return undefined;
    const ages = rows.map((r) => (now - new Date(r.sell_price_min_date).getTime()) / 3600000).filter((h) => h >= 0);
    return ages.length ? Math.min(...ages) : undefined;
  }, [rows, now]);

  const exportCsv = useCallback(() => {
    const exportRows = rows.map((r) => ({
      item: item.name,
      itemId: r.item_id,
      city: r.city,
      quality: QUALITY_LABELS[r.quality] ?? r.quality,
      sellMin: r.sell_price_min,
      buyMax: r.buy_price_max,
      sellMax: r.sell_price_max,
      buyMin: r.buy_price_min,
      sellMinDate: r.sell_price_min_date,
      buyMaxDate: r.buy_price_max_date,
    }));
    downloadCsv(`prices-${item.id}-${region}-${Date.now()}.csv`, exportRows);
  }, [rows, item, region]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <EmptyState title="Erro ao carregar preços" description={error} />;
  if (!data || data.length === 0)
    return <EmptyState title="Sem dados" description="Não há preços disponíveis para este item nesta região." />;

  return (
    <div className="space-y-4">
      {/* Item header with image */}
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
        {freshestHours !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${freshestHours <= 6 ? "text-emerald-400" : freshestHours <= 24 ? "text-amber-400" : "text-red-400"}`}>
            <Clock className="h-3.5 w-3.5" />
            <span>Dado mais fresco: {freshestHours.toFixed(0)}h</span>
          </div>
        )}
      </div>

      <Toolbar>
        <PageTitle title="Preços por cidade" subtitle={`Região ${region.toUpperCase()}`} />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Qualidade:</span>
            {[1, 2, 3, 4, 5].map((q) => (
              <ToggleChip
                key={q}
                active={qualities.has(q)}
                onClick={() => dispatch({ type: "TOGGLE_QUALITY", payload: q })}
              >
                {QUALITY_LABELS[q] ?? q}
              </ToggleChip>
            ))}
          </div>
          <ExportButton onClick={exportCsv} />
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ShellStatCard label="Melhor compra" value={bestSell ? fmtFull(bestSell.sell_price_min) : "—"} subvalue={bestSell ? `${bestSell.city} · ${QUALITY_LABELS[bestSell.quality]}` : undefined} variant="success" icon={ArrowLeftRight} />
        <ShellStatCard label="Melhor venda" value={bestBuy ? fmtFull(bestBuy.buy_price_max) : "—"} subvalue={bestBuy ? `${bestBuy.city} · ${QUALITY_LABELS[bestBuy.quality]}` : undefined} variant="danger" icon={ArrowLeftRight} />
        <ShellStatCard label="Cidades ativas" value={cities.length.toString()} subvalue={`${rows.length} registros`} variant="info" icon={Globe} />
        <ShellStatCard label="Spread / Margem" value={spread > 0 ? fmtFull(spread) : "—"} subvalue={marginPct > 0 ? `${marginPct.toFixed(0)}% margem` : undefined} variant="warning" icon={TrendingUp} />
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">Qualidade</th>
                <th className="px-4 py-3 text-right">Sell Min</th>
                <th className="px-4 py-3 text-right">Buy Max</th>
                <th className="px-4 py-3 text-right">Sell Max</th>
                <th className="px-4 py-3 text-right">Buy Min</th>
                <th className="px-4 py-3 text-right">Idade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cities.map((city) => renderCityRows(city, byCity.get(city) ?? [], bestSell, bestBuy, now))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function groupByCity(rows: MarketPrice[]) {
  const map = new Map<string, MarketPrice[]>();
  for (const row of rows) {
    const list = map.get(row.city) ?? [];
    list.push(row);
    map.set(row.city, list);
  }
  return map;
}

function findBestSell(rows: MarketPrice[]) {
  return rows
    .filter((r) => r.sell_price_min > 0)
    .sort((a, b) => a.sell_price_min - b.sell_price_min)[0];
}

function findBestBuy(rows: MarketPrice[]) {
  return rows
    .filter((r) => r.buy_price_max > 0)
    .sort((a, b) => b.buy_price_max - a.buy_price_max)[0];
}

function renderCityRows(city: string, cityRows: MarketPrice[], bestSell: MarketPrice | undefined, bestBuy: MarketPrice | undefined, now: number) {
  return cityRows
    .slice()
    .sort((a, b) => a.quality - b.quality)
    .map((row, idx) => {
      const ageHours = (now - new Date(row.sell_price_min_date).getTime()) / 3600000;
      const ageColor = ageHours <= 6 ? "text-emerald-400" : ageHours <= 24 ? "text-amber-400" : "text-red-400";
      return (
      <tr key={`${city}-${row.quality}`} className="hover:bg-slate-800/30">
        {idx === 0 && (
          <td rowSpan={cityRows.length} className="px-4 py-3 font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-slate-600" />
              {city}
            </div>
          </td>
        )}
        <td className="px-4 py-3">
          <span className={`rounded border px-1.5 py-0 text-[10px] ${QUALITY_COLORS[row.quality] ?? QUALITY_COLORS[1]}`}>
            {QUALITY_LABELS[row.quality] ?? row.quality}
          </span>
        </td>
        <td className={`px-4 py-3 text-right font-mono ${row.sell_price_min === bestSell?.sell_price_min ? "text-emerald-400 font-semibold" : "text-slate-300"}`}>
          {row.sell_price_min > 0 ? fmtFull(row.sell_price_min) : "—"}
        </td>
        <td className={`px-4 py-3 text-right font-mono ${row.buy_price_max === bestBuy?.buy_price_max ? "text-rose-400 font-semibold" : "text-slate-300"}`}>
          {row.buy_price_max > 0 ? fmtFull(row.buy_price_max) : "—"}
        </td>
        <td className="px-4 py-3 text-right font-mono text-slate-400">{row.sell_price_max > 0 ? fmtFull(row.sell_price_max) : "—"}</td>
        <td className="px-4 py-3 text-right font-mono text-slate-400">{row.buy_price_min > 0 ? fmtFull(row.buy_price_min) : "—"}</td>
        <td className={`px-4 py-3 text-right text-xs ${ageColor}`}>
          <div className="flex items-center justify-end gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {ageHours.toFixed(0)}h
          </div>
        </td>
      </tr>
      );
    });
}
