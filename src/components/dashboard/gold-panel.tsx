"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, History } from "lucide-react";
import type { GoldPrice, ServerRegion } from "@/lib/albion/types";
import { downloadCsv } from "@/lib/utils/export";
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
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface GoldPanelProps {
  region: ServerRegion;
  setLastRefresh?: (ts: number) => void;
}

const REGION_COLORS: Record<ServerRegion, string> = { west: "#f59e0b", east: "#3b82f6", europe: "#10b981" };
const ALL_REGIONS: ServerRegion[] = ["west", "east", "europe"];

export function GoldPanel({ region, setLastRefresh }: GoldPanelProps) {
  const [days, setDays] = useState(7);
  const [compareRegions, setCompareRegions] = useState<Set<ServerRegion>>(new Set([region]));
  const count = Math.max(24, days * 4);
  const regionList = Array.from(compareRegions);
  const res1 = useFetch<GoldPrice[]>(regionList.includes("west") ? `/api/gold?count=${count}&region=west` : null);
  const res2 = useFetch<GoldPrice[]>(regionList.includes("east") ? `/api/gold?count=${count}&region=east` : null);
  const res3 = useFetch<GoldPrice[]>(regionList.includes("europe") ? `/api/gold?count=${count}&region=europe` : null);
  const responses = useMemo(() => [res1, res2, res3], [res1, res2, res3]);
  const loading = responses.some((r) => r.loading);
  const error = responses.find((r) => r.error)?.error ?? null;
  const allData = useMemo(() => {
    const data: GoldPrice[][] = [];
    if (regionList.includes("west") && res1.data) data.push(res1.data);
    if (regionList.includes("east") && res2.data) data.push(res2.data);
    if (regionList.includes("europe") && res3.data) data.push(res3.data);
    return data;
  }, [regionList, res1.data, res2.data, res3.data]);

  useEffect(() => {
    if (allData.length > 0 && !loading && !error) setLastRefresh?.(Date.now());
  }, [allData, loading, error, setLastRefresh]);

  const chartData = useMemo(() => buildChartData(allData, compareRegions), [allData, compareRegions]);
  const stats = useMemo(() => computeStats(allData, compareRegions), [allData, compareRegions]);
  const regionsList = useMemo(() => Array.from(compareRegions), [compareRegions]);

  const exportCsv = useCallback(() => {
    const rows: Record<string, string | number>[] = [];
    for (let i = 0; i < allData.length; i++) {
      for (const p of allData[i]) {
        rows.push({ region: regionsList[i], timestamp: p.timestamp, price: p.price });
      }
    }
    downloadCsv(`gold-${region}-${Date.now()}.csv`, rows);
  }, [allData, regionsList, region]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <EmptyState title="Erro no ouro" description={error} />;
  if (chartData.length === 0)
    return <EmptyState title="Sem dados" description="Não há dados de ouro para o período selecionado." />;

  return (
    <div className="space-y-4">
      <Toolbar>
        <PageTitle title="Cotação do Ouro" subtitle={`Preço do ouro por região · últimos ${days} dias`} />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Período:</span>
            {[7, 30, 90, 365].map((d) => (
              <ToggleChip key={d} active={days === d} onClick={() => setDays(d)}>
                {d}d
              </ToggleChip>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Comparar:</span>
            {ALL_REGIONS.map((r) => (
              <ToggleChip
                key={r}
                active={compareRegions.has(r)}
                onClick={() => toggleRegion(compareRegions, setCompareRegions, r)}
              >
                {r.toUpperCase()}
              </ToggleChip>
            ))}
          </div>
          <ExportButton onClick={exportCsv} />
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <ShellStatCard
            key={s.region}
            label={s.region.toUpperCase()}
            value={Math.round(s.last).toLocaleString()}
            subvalue={`Máx ${Math.round(s.max).toLocaleString()} · Min ${Math.round(s.min).toLocaleString()} · ${s.change.toFixed(1)}%`}
            variant={s.change >= 0 ? "success" : "danger"}
            icon={Coins}
          />
        ))}
      </div>

      <Panel className="space-y-3">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5, 10)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {regionsList.map((r) => (
                <Line key={r} type="monotone" dataKey={r} stroke={REGION_COLORS[r]} strokeWidth={2} dot={false} name={r.toUpperCase()} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

function toggleRegion(
  selected: Set<ServerRegion>,
  setSelected: (s: Set<ServerRegion>) => void,
  region: ServerRegion,
) {
  const next = new Set(selected);
  if (next.has(region)) next.delete(region);
  else next.add(region);
  setSelected(next);
}

function buildChartData(data: GoldPrice[][], compareRegions: Set<ServerRegion>) {
  if (data.length === 0) return [];
  const allTimestamps = Array.from(new Set(data.flatMap((d) => d.map((p) => p.timestamp)))).sort();
  const regionsList = Array.from(compareRegions);
  return allTimestamps.map((ts) => {
    const point: Record<string, number | string> = { timestamp: ts };
    for (let i = 0; i < regionsList.length; i++) {
      const entry = data[i]?.find((p) => p.timestamp === ts);
      point[regionsList[i]] = entry ? entry.price : NaN;
    }
    return point;
  });
}

function computeStats(data: GoldPrice[][], compareRegions: Set<ServerRegion>) {
  const regionsList = Array.from(compareRegions);
  return data.map((series, i) => {
    const prices = series.map((p) => p.price).filter((p) => p > 0);
    const max = prices.length > 0 ? Math.max(...prices) : 0;
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const first = prices[0] ?? 0;
    const last = prices[prices.length - 1] ?? 0;
    const change = first > 0 ? ((last - first) / first) * 100 : 0;
    return { region: regionsList[i], max, min, avg, last, change };
  });
}
