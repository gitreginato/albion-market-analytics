"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemImage } from "@/components/item-image";
import { fmtSilver, fmtFull, profitColor, marginColor } from "@/lib/utils/format";
import { QUALITY_COLORS, QUALITY_LABELS } from "@/lib/albion/constants";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Package,
  Weight,
  Coins,
  Truck,
  Scale,
  ArrowRight,
  Skull,
  Sparkles,
  Clock,
  Activity,
} from "lucide-react";

// Metric row with icon, label, and value
function Metric({
  icon: Icon,
  label,
  value,
  color,
}: {
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
      <span className={`font-mono text-sm tabular-nums ${color ?? "text-zinc-200"}`}>
        {value}
      </span>
    </div>
  );
}

// ---- Black Market / Arbitrage Opportunity Card ----
export interface OppCardData {
  itemId: string;
  itemName: string;
  quality: number;
  buyCity: string;
  sellCity?: string;
  buyPrice: number;
  sellPrice?: number;
  blackMarketPrice?: number;
  transportCost: number;
  salesTax: number;
  setupFee?: number;
  profit: number;
  margin: number;
  itemWeight: number;
  unitsPerLoad: number;
  profitPerLoad: number;
  // Enriched BM fields
  bmVolume7d?: number;
  bmConsistency?: number;
  bmAvgPrice7d?: number;
  bmPriceTrend?: "up" | "down" | "stable";
  buyPriceAgeHours?: number;
  bmPriceAgeHours?: number;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
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

function OpportunityCardRaw({
  opp,
  type,
  rank,
}: {
  opp: OppCardData;
  type: "blackmarket" | "arbitrage";
  rank: number;
}) {
  const sellPrice = type === "blackmarket" ? opp.blackMarketPrice! : opp.sellPrice!;
  const sellCity = type === "blackmarket" ? "Black Market" : opp.sellCity!;
  const isBm = type === "blackmarket";

  return (
    <Card className="group relative gap-0 overflow-hidden bg-zinc-900/40 p-0 ring-1 ring-zinc-800/60 transition-all hover:ring-emerald-700/40 hover:bg-zinc-900/60 hover:shadow-lg hover:shadow-emerald-500/5">
      {/* Rank badge */}
      <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800/80 text-xs font-bold text-zinc-400 ring-1 ring-zinc-700/50">
        {rank}
      </div>

      {/* Header: image + name + quality */}
      <div className="flex items-center gap-3 border-b border-zinc-800/60 p-3">
        <ItemImage
          itemId={opp.itemId}
          itemName={opp.itemName}
          quality={opp.quality}
          size={48}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">{opp.itemName}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="outline"
              className={`border px-1.5 py-0 text-[10px] ${QUALITY_COLORS[opp.quality] ?? QUALITY_COLORS[1]}`}
            >
              {QUALITY_LABELS[opp.quality] ?? `Q${opp.quality}`}
            </Badge>
            <span className="text-xs text-zinc-600">T{opp.itemId.match(/^T(\d)/)?.[1] ?? "?"}</span>
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 px-3 py-2 text-xs">
        <div className="flex items-center gap-1 text-zinc-400">
          <MapPin className="h-3 w-3 text-emerald-500" />
          <span>{opp.buyCity}</span>
        </div>
        <ArrowRight className="h-3 w-3 text-zinc-600" />
        <div className="flex items-center gap-1 text-zinc-400">
          {isBm ? <Skull className="h-3 w-3 text-red-500" /> : <MapPin className="h-3 w-3 text-sky-500" />}
          <span>{sellCity}</span>
        </div>
      </div>

      {/* Price section */}
      <div className="grid grid-cols-2 gap-px bg-zinc-800/40">
        <div className="bg-zinc-900/40 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">Compra</p>
          <p className="font-mono text-sm text-zinc-300">{fmtFull(opp.buyPrice)}</p>
        </div>
        <div className="bg-zinc-900/40 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">{isBm ? "BM paga" : "Venda"}</p>
          <div className="flex items-center gap-1">
            <p className="font-mono text-sm text-zinc-300">{fmtFull(sellPrice)}</p>
            {isBm && opp.bmPriceTrend && <TrendIcon trend={opp.bmPriceTrend} />}
          </div>
        </div>
      </div>

      {/* Profit highlight */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-950/30 to-transparent px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span className="text-xs text-zinc-400">Lucro/unit</span>
        </div>
        <span className={`font-mono text-lg font-bold tabular-nums ${profitColor(opp.profit)}`}>
          +{fmtSilver(opp.profit)}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="space-y-1.5 px-3 py-2.5">
        <Metric
          icon={Scale}
          label="Margem"
          value={`${opp.margin.toFixed(0)}%`}
          color={marginColor(opp.margin)}
        />
        <Metric
          icon={Truck}
          label="Transporte"
          value={`-${fmtSilver(opp.transportCost)}`}
          color="text-amber-500"
        />
        <Metric
          icon={Coins}
          label="Taxa venda"
          value={`-${fmtSilver(opp.salesTax)}`}
          color="text-amber-500"
        />
        {opp.setupFee ? (
          <Metric
            icon={Coins}
            label="Taxa setup"
            value={`-${fmtSilver(opp.setupFee)}`}
            color="text-amber-500"
          />
        ) : null}
        {/* BM enriched metrics */}
        {isBm && opp.bmVolume7d !== undefined && (
          <>
            <Metric
              icon={Package}
              label="BM volume/dia"
              value={`${opp.bmVolume7d} unid`}
              color={opp.bmVolume7d >= 50 ? "text-emerald-400" : opp.bmVolume7d >= 10 ? "text-amber-400" : "text-red-400"}
            />
            <Metric
              icon={Activity}
              label="Consistência"
              value={`${opp.bmConsistency ?? 0}%`}
              color={(opp.bmConsistency ?? 0) >= 80 ? "text-emerald-400" : (opp.bmConsistency ?? 0) >= 50 ? "text-amber-400" : "text-red-400"}
            />
            {opp.bmAvgPrice7d ? (
              <Metric
                icon={TrendingUp}
                label="BM avg 7d"
                value={fmtSilver(opp.bmAvgPrice7d)}
                color="text-sky-300"
              />
            ) : null}
          </>
        )}
      </div>

      {/* Price age badges */}
      {isBm && (opp.buyPriceAgeHours !== undefined || opp.bmPriceAgeHours !== undefined) && (
        <div className="flex items-center gap-3 border-t border-zinc-800/40 px-3 py-1.5">
          <AgeBadge hours={opp.buyPriceAgeHours} label="compra" />
          <AgeBadge hours={opp.bmPriceAgeHours} label="BM" />
        </div>
      )}

      {/* Mount load section */}
      {opp.unitsPerLoad > 0 && (
        <div className="border-t border-zinc-800/60 bg-zinc-950/30 px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-600">
            <Weight className="h-3 w-3" />
            <span>Carga da montaria</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-zinc-600">Peso item</p>
              <p className="font-mono text-xs text-zinc-400">{opp.itemWeight.toFixed(2)} kg</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600">Unid./carga</p>
              <p className="font-mono text-xs text-zinc-400">{opp.unitsPerLoad.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-md bg-emerald-950/30 px-2 py-1.5">
            <span className="text-[10px] text-zinc-500">Lucro/carga</span>
            <span className={`font-mono text-sm font-bold ${profitColor(opp.profitPerLoad)}`}>
              +{fmtSilver(opp.profitPerLoad)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---- Projection Card (BM historical analysis) ----
export interface ProjCardData {
  itemId: string;
  itemName: string;
  quality: number;
  buyCity: string;
  buyPrice: number;
  bmPriceNow: number;
  bmAvg7d: number;
  bmAvg30d: number;
  marginNow: number;
  margin7d: number;
  margin30d: number;
  consistency: number;
  volume7d: number;
  profitPerUnit: number;
  itemWeight: number;
  unitsPerLoad: number;
  profitPerLoad: number;
}

function ProjectionCardRaw({ proj, rank }: { proj: ProjCardData; rank: number }) {
  const consistencyColor =
    proj.consistency >= 80 ? "text-emerald-400" : proj.consistency >= 50 ? "text-amber-400" : "text-red-400";
  const consistencyBg =
    proj.consistency >= 80 ? "bg-emerald-500" : proj.consistency >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card className="group relative gap-0 overflow-hidden bg-zinc-900/60 p-0 ring-1 ring-zinc-800/80 transition-all hover:ring-sky-700/50">
      {/* Rank badge */}
      <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800/80 text-xs font-bold text-zinc-400">
        {rank}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800/60 p-3">
        <ItemImage itemId={proj.itemId} itemName={proj.itemName} quality={proj.quality} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">{proj.itemName}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="outline"
              className={`border px-1.5 py-0 text-[10px] ${QUALITY_COLORS[proj.quality] ?? QUALITY_COLORS[1]}`}
            >
              {QUALITY_LABELS[proj.quality] ?? `Q${proj.quality}`}
            </Badge>
            <span className="text-xs text-zinc-600">T{proj.itemId.match(/^T(\d)/)?.[1] ?? "?"}</span>
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 px-3 py-2 text-xs">
        <div className="flex items-center gap-1 text-zinc-400">
          <MapPin className="h-3 w-3 text-emerald-500" />
          <span>{proj.buyCity}</span>
        </div>
        <ArrowRight className="h-3 w-3 text-zinc-600" />
        <div className="flex items-center gap-1 text-zinc-400">
          <Skull className="h-3 w-3 text-red-500" />
          <span>Black Market</span>
        </div>
      </div>

      {/* Price section: now vs 7d avg */}
      <div className="grid grid-cols-3 gap-px bg-zinc-800/40">
        <div className="bg-zinc-900/40 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">Compra</p>
          <p className="font-mono text-xs text-zinc-300">{fmtSilver(proj.buyPrice)}</p>
        </div>
        <div className="bg-zinc-900/40 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">BM agora</p>
          <p className="font-mono text-xs text-zinc-300">{fmtSilver(proj.bmPriceNow)}</p>
        </div>
        <div className="bg-zinc-900/40 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">BM 7d</p>
          <p className="font-mono text-xs text-sky-300">{fmtSilver(proj.bmAvg7d)}</p>
        </div>
      </div>

      {/* Margin highlight (7d) */}
      <div className="flex items-center justify-between bg-gradient-to-r from-sky-950/30 to-transparent px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-sky-500" />
          <span className="text-xs text-zinc-400">Margem 7d</span>
        </div>
        <span className={`font-mono text-lg font-bold tabular-nums ${marginColor(proj.margin7d)}`}>
          {proj.margin7d.toFixed(0)}%
        </span>
      </div>

      {/* Consistency bar */}
      <div className="px-3 py-2.5">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Sparkles className="h-3 w-3" />
            <span>Consistência 30d</span>
          </div>
          <span className={`font-mono text-sm font-bold ${consistencyColor}`}>{proj.consistency}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${consistencyBg}`}
            style={{ width: `${proj.consistency}%` }}
          />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="space-y-1.5 px-3 py-2.5">
        <Metric
          icon={Scale}
          label="Margem 30d"
          value={`${proj.margin30d.toFixed(0)}%`}
          color={marginColor(proj.margin30d)}
        />
        <Metric
          icon={Package}
          label="Volume/dia"
          value={`${proj.volume7d} unid`}
          color="text-sky-300"
        />
        <Metric
          icon={TrendingUp}
          label="Lucro/unit (7d)"
          value={`+${fmtSilver(proj.profitPerUnit)}`}
          color={profitColor(proj.profitPerUnit)}
        />
      </div>

      {/* Mount load section */}
      {proj.unitsPerLoad > 0 && (
        <div className="border-t border-zinc-800/60 bg-zinc-950/30 px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-600">
            <Weight className="h-3 w-3" />
            <span>Carga da montaria</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-zinc-600">Peso item</p>
              <p className="font-mono text-xs text-zinc-400">{proj.itemWeight.toFixed(2)} kg</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600">Unid./carga</p>
              <p className="font-mono text-xs text-zinc-400">{proj.unitsPerLoad.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-md bg-sky-950/30 px-2 py-1.5">
            <span className="text-[10px] text-zinc-500">Lucro/carga</span>
            <span className={`font-mono text-sm font-bold ${profitColor(proj.profitPerLoad)}`}>
              +{fmtSilver(proj.profitPerLoad)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

export const OpportunityCard = React.memo(OpportunityCardRaw);

export const ProjectionCard = React.memo(ProjectionCardRaw);

// ---- KPI Card (summary stats) ----
export function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  color = "text-emerald-400",
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <Card className="group gap-0 bg-zinc-900/40 p-3 ring-1 ring-zinc-800/60 transition-all hover:ring-zinc-700/80 hover:bg-zinc-900/70">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <Icon className={`h-4 w-4 ${color} transition-transform group-hover:scale-110`} />
      </div>
      <p className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-zinc-600">{sublabel}</p>}
    </Card>
  );
}
