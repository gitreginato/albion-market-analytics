"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, LineChart as LineChartIcon, Activity, TrendingUp } from "lucide-react";
import { CITIES, type CatalogItem } from "@/lib/albion/items";
import type { HistoryLocation, ServerRegion } from "@/lib/albion/types";
import { fmtSilver } from "@/lib/utils/format";
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
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from "recharts";

interface HistoryPanelProps {
  item: CatalogItem;
  region: ServerRegion;
  setLastRefresh?: (ts: number) => void;
}

const TIME_OPTIONS = [
  { v: 1, l: "1h" },
  { v: 6, l: "6h" },
  { v: 24, l: "24h" },
] as const;

const CITY_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444"];

export function HistoryPanel({ item, region, setLastRefresh }: HistoryPanelProps) {
  const [timeScale, setTimeScale] = useState<1 | 6 | 24>(24);
  const [days, setDays] = useState(30);
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set(["Caerleon"]));
  const [showVolume, setShowVolume] = useState(false);

  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }, [days]);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const locations = Array.from(selectedCities).join(",");
  const url = useMemo(
    () => `/api/history?items=${item.id}&locations=${locations}&time-scale=${timeScale}&date=${fmt(startDate)}&end_date=${fmt(endDate)}&region=${region}`,
    [item.id, locations, timeScale, startDate, endDate, region],
  );
  const { data, loading, error } = useFetch<HistoryLocation[]>(url);

  useEffect(() => {
    if (data && !loading && !error) setLastRefresh?.(Date.now());
  }, [data, loading, error, setLastRefresh]);

  const chartData = useMemo(() => buildChartData(data), [data]);
  const stats = useMemo(() => computeStats(data), [data]);
  const cities = useMemo(() => Array.from(selectedCities), [selectedCities]);
  const totalVolume = useMemo(() => stats.reduce((sum, s) => sum + s.totalVolume, 0), [stats]);
  const avgVolumePerDay = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const allPoints = data.flatMap((loc) => loc.data);
    if (allPoints.length === 0) return 0;
    return Math.round(allPoints.reduce((sum, p) => sum + p.item_count, 0) / days);
  }, [data, days]);

  const exportCsv = useCallback(() => {
    if (!data) return;
    const rows: Record<string, string | number>[] = [];
    for (const loc of data) {
      for (const point of loc.data) {
        rows.push({
          item: item.name,
          city: loc.location,
          timestamp: point.timestamp,
          avgPrice: point.avg_price,
          volume: point.item_count,
        });
      }
    }
    downloadCsv(`history-${item.id}-${region}-${Date.now()}.csv`, rows);
  }, [data, item, region]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <EmptyState title="Erro no histórico" description={error} />;
  if (!data || data.length === 0 || chartData.length === 0)
    return <EmptyState title="Sem histórico" description="Selecione uma cidade e período com dados disponíveis." />;

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
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-slate-500">
            <Activity className="h-3.5 w-3.5" />
            <span>Vol/dia: <strong className="text-slate-300">{avgVolumePerDay.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Total: <strong className="text-slate-300">{fmtSilver(totalVolume)}</strong></span>
          </div>
        </div>
      </div>

      <Toolbar>
        <PageTitle title="Histórico de preços" subtitle="Evolução temporal e volume" />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <RangeSelector days={days} onChange={setDays} />
          <TimeScaleSelector timeScale={timeScale} onChange={setTimeScale} />
          <ExportButton onClick={exportCsv} />
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.slice(0, 4).map((s) => (
          <ShellStatCard
            key={s.city}
            label={s.city}
            value={Math.round(s.avg).toLocaleString()}
            subvalue={`Máx ${Math.round(s.max).toLocaleString()} · Min ${Math.round(s.min).toLocaleString()} · ${s.change.toFixed(1)}% · Vol ${s.totalVolume.toLocaleString()} · Const ${s.consistency}%`}
            variant={s.change >= 0 ? "success" : "danger"}
            icon={LineChartIcon}
          />
        ))}
      </div>

      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Cidades:</span>
          {CITIES.map((city) => (
            <ToggleChip
              key={city}
              active={selectedCities.has(city)}
              onClick={() => toggleCity(selectedCities, setSelectedCities, city)}
            >
              {city}
            </ToggleChip>
          ))}
          <VolumeToggle showVolume={showVolume} onChange={setShowVolume} />
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5, 10)} />
              <YAxis yAxisId="price" tick={{ fill: "#64748b", fontSize: 11 }} domain={["auto", "auto"]} />
              {showVolume && <YAxis yAxisId="volume" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} />}
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {cities.map((city, i) => (
                <Line
                  key={city}
                  yAxisId="price"
                  type="monotone"
                  dataKey={city}
                  stroke={CITY_COLORS[i % CITY_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={city}
                  connectNulls
                />
              ))}
              {showVolume &&
                cities.map((city, i) => (
                  <Bar
                    key={`${city}-volume`}
                    yAxisId="volume"
                    dataKey={`${city}_volume`}
                    fill={CITY_COLORS[i % CITY_COLORS.length]}
                    opacity={0.3}
                    name={`${city} volume`}
                  />
                ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

function RangeSelector({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <History className="h-3.5 w-3.5 text-slate-500" />
      <span className="text-xs text-slate-500">Período:</span>
      {[7, 30, 90, 365].map((d) => (
        <ToggleChip key={d} active={days === d} onClick={() => onChange(d)}>
          {d}d
        </ToggleChip>
      ))}
    </div>
  );
}

function TimeScaleSelector({ timeScale, onChange }: { timeScale: 1 | 6 | 24; onChange: (v: 1 | 6 | 24) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Agregação:</span>
      {TIME_OPTIONS.map((opt) => (
        <ToggleChip key={opt.v} active={timeScale === opt.v} onClick={() => onChange(opt.v)}>
          {opt.l}
        </ToggleChip>
      ))}
    </div>
  );
}

function VolumeToggle({ showVolume, onChange }: { showVolume: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
      <input
        type="checkbox"
        checked={showVolume}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-sky-500"
      />
      Mostrar volume
    </label>
  );
}

function toggleCity(selected: Set<string>, setSelected: (s: Set<string>) => void, city: string) {
  const next = new Set(selected);
  if (next.has(city)) next.delete(city);
  else next.add(city);
  setSelected(next);
}

function buildChartData(data: HistoryLocation[] | null) {
  if (!data || data.length === 0) return [];
  const allTimestamps = Array.from(new Set(data.flatMap((loc) => loc.data.map((d) => d.timestamp)))).sort();
  return allTimestamps.map((ts) => {
    const point: Record<string, number | string> = { timestamp: ts };
    for (const loc of data) {
      const entry = loc.data.find((d) => d.timestamp === ts);
      point[loc.location] = entry ? Math.round(entry.avg_price) : NaN;
      point[`${loc.location}_volume`] = entry ? entry.item_count : 0;
    }
    return point;
  });
}

function computeStats(data: HistoryLocation[] | null) {
  if (!data || data.length === 0) return [];
  return data.map((loc) => {
    const prices = loc.data.map((d) => d.avg_price).filter((p) => p > 0);
    const volumes = loc.data.map((d) => d.item_count).filter((v) => v > 0);
    const max = prices.length > 0 ? Math.max(...prices) : 0;
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const first = prices[0] ?? 0;
    const last = prices[prices.length - 1] ?? 0;
    const change = first > 0 ? ((last - first) / first) * 100 : 0;
    const totalVolume = volumes.reduce((a, b) => a + b, 0);
    const consistency = prices.length > 0 ? Math.round((prices.filter((p) => p > 0).length / prices.length) * 100) : 0;
    return { city: loc.location, max, min, avg, change, count: prices.length, totalVolume, consistency };
  });
}
