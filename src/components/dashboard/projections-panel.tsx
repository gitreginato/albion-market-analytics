"use client";

import { useState } from "react";
import { getMountById } from "@/lib/albion/mounts";
import type { BmProjection } from "@/lib/albion/projections";
import { ProjectionCard, KpiCard } from "@/components/opp-cards";
import { fmtSilver } from "@/lib/utils/format";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  Scale,
  Package,
  Weight,
  Target,
  Layers,
  Package as PackageIcon,
  Shield,
  Truck,
  SlidersHorizontal,
  ChevronDown,
  X,
  Filter,
  Crown,
  MapPin,
} from "lucide-react";
import { MOUNTS } from "@/lib/albion/mounts";

type ProjCategory = "raw" | "refined" | "gear";
type SortBy = "margin7d" | "consistency" | "volume7d" | "profitPerLoad" | "profitPerUnit";

const TIERS = [4, 5, 6, 7, 8];
const CATEGORIES: { id: ProjCategory; label: string }[] = [
  { id: "raw", label: "Brutos" },
  { id: "refined", label: "Refinados" },
  { id: "gear", label: "Gear" },
];
const QUALITIES = [
  { id: 1, label: "Normal" },
  { id: 2, label: "Good" },
  { id: 3, label: "Outstanding" },
  { id: 4, label: "Excellent" },
  { id: 5, label: "Masterpiece" },
];
const SORT_OPTIONS: { id: SortBy; label: string }[] = [
  { id: "margin7d", label: "Margem 7d" },
  { id: "consistency", label: "Consistência" },
  { id: "volume7d", label: "Volume/dia" },
  { id: "profitPerUnit", label: "Lucro/unit" },
  { id: "profitPerLoad", label: "Lucro/carga" },
];

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function TogglePill({
  active,
  onClick,
  children,
  mono,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
        mono ? "font-mono" : ""
      } ${
        active
          ? "border-sky-500/60 bg-sky-500/10 text-sky-300 shadow-sm shadow-sky-500/10"
          : "border-slate-700/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  icon: Icon,
  label,
  children,
  activeCount,
  onClear,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  activeCount?: number;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {activeCount && activeCount > 0 ? (
          <Badge variant="secondary" className="h-4 bg-sky-500/15 px-1.5 text-[10px] text-sky-300">
            {activeCount}
          </Badge>
        ) : null}
        {onClear && activeCount && activeCount > 0 ? (
          <button
            onClick={onClear}
            className="ml-auto text-[10px] text-slate-600 transition-colors hover:text-slate-400"
          >
            limpar
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function MountSelector({
  mountId,
  setMountId,
}: {
  mountId: string;
  setMountId: (v: string) => void;
}) {
  const current = MOUNTS.find((m) => m.id === mountId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-slate-700/60 px-2.5 py-1 text-xs text-slate-300 transition-all hover:border-slate-600 hover:text-slate-100">
        <Truck className="h-3.5 w-3.5 text-slate-500" />
        <span className="max-w-[140px] truncate">
          {current ? current.name : "Montaria"}
        </span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[240px] max-h-[300px] overflow-y-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Montaria (capacidade)</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {MOUNTS.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => setMountId(m.id)}
            className={m.id === mountId ? "bg-sky-500/10 text-sky-300" : ""}
          >
            <span className="flex-1 truncate">{m.name}</span>
            <span className="ml-2 text-[10px] text-slate-500">
              {m.maxLoadKg.toLocaleString()} kg
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function countActiveFilters(
  tiers: Set<number>,
  categories: Set<ProjCategory>,
  qualities: Set<number>,
  minMargin: number,
  minVolume: number,
  minConsistency: number,
): number {
  let count = 0;
  count += tiers.size;
  count += categories.size;
  count += qualities.size;
  if (minMargin > 0) count++;
  if (minVolume > 0) count++;
  if (minConsistency > 0) count++;
  return count;
}

function ErrorState({ message }: { message: string }) {
  return <p className="text-sm text-red-400">Erro: {message}</p>;
}

export function ProjectionsPanel({
  projections,
  loading,
  error,
  onFetch,
  transportMode,
  setTransportMode,
  minMargin,
  setMinMargin,
  minVolume,
  setMinVolume,
  usePremium,
  setUsePremium,
  mountId,
  setMountId,
  tiers,
  setTiers,
  categories,
  setCategories,
  qualities,
  setQualities,
  minConsistency,
  setMinConsistency,
  sortBy,
  setSortBy,
}: {
  projections: BmProjection[];
  loading: boolean;
  error: string | null;
  onFetch: () => void;
  transportMode: "fast" | "manual";
  setTransportMode: (m: "fast" | "manual") => void;
  minMargin: number;
  setMinMargin: (n: number) => void;
  minVolume: number;
  setMinVolume: (n: number) => void;
  usePremium: boolean;
  setUsePremium: (v: boolean) => void;
  mountId: string;
  setMountId: (v: string) => void;
  tiers: Set<number>;
  setTiers: (s: Set<number>) => void;
  categories: Set<ProjCategory>;
  setCategories: (s: Set<ProjCategory>) => void;
  qualities: Set<number>;
  setQualities: (s: Set<number>) => void;
  minConsistency: number;
  setMinConsistency: (n: number) => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
}) {
  const [open, setOpen] = useState(true);
  const mount = getMountById(mountId);
  const salesTaxPct = usePremium ? 4 : 8;
  const bestProj = projections[0];
  const tripsTo33M = bestProj && bestProj.profitPerLoad > 0
    ? Math.ceil(33_000_000 / bestProj.profitPerLoad)
    : 0;

  const activeCount = countActiveFilters(tiers, categories, qualities, minMargin, minVolume, minConsistency);

  const clearAll = () => {
    setTiers(new Set([6]));
    setCategories(new Set());
    setQualities(new Set());
    setMinMargin(40);
    setMinVolume(10);
    setMinConsistency(80);
  };

  const tierLabel = tiers.size === 0
    ? "T6"
    : tiers.size === 1
      ? `T${Array.from(tiers)[0]}`
      : `${tiers.size} tiers`;

  const categoryLabel = categories.size === 0
    ? "Todos"
    : categories.size === 1
      ? CATEGORIES.find((c) => categories.has(c.id))?.label ?? "—"
      : `${categories.size} tipos`;

  return (
    <div className="space-y-4">
      {/* Filter controls — collapsible */}
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-slate-800/60 bg-slate-900/40">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-slate-200 transition-colors hover:text-slate-100">
            <SlidersHorizontal className="h-4 w-4 text-sky-400" />
            <span>Projeções BM</span>
            {activeCount > 0 && (
              <Badge className="bg-sky-500/20 text-sky-300">
                {activeCount} ativo{activeCount > 1 ? "s" : ""}
              </Badge>
            )}
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>

          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-slate-300"
              >
                <X className="h-3 w-3" />
                Limpar
              </button>
            )}
            <button
              onClick={onFetch}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Filter className="h-3.5 w-3.5" />
              {loading ? "Analisando..." : "Calcular"}
            </button>
          </div>
        </div>

        <Separator className="bg-slate-800/60" />

        {/* Collapsible content */}
        <CollapsibleContent>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Tiers — multi-select */}
            <FilterGroup
              icon={Layers}
              label="Tiers"
              activeCount={tiers.size}
              onClear={() => setTiers(new Set())}
            >
              {TIERS.map((t) => (
                <TogglePill
                  key={t}
                  active={tiers.has(t)}
                  onClick={() => setTiers(toggleInSet(tiers, t))}
                  mono
                >
                  T{t}
                </TogglePill>
              ))}
            </FilterGroup>

            {/* Categories — multi-select */}
            <FilterGroup
              icon={PackageIcon}
              label="Tipos"
              activeCount={categories.size}
              onClear={() => setCategories(new Set())}
            >
              {CATEGORIES.map((cat) => (
                <TogglePill
                  key={cat.id}
                  active={categories.has(cat.id)}
                  onClick={() => setCategories(toggleInSet(categories, cat.id))}
                >
                  {cat.label}
                </TogglePill>
              ))}
            </FilterGroup>

            {/* Qualities — multi-select */}
            <FilterGroup
              icon={Shield}
              label="Qualidade"
              activeCount={qualities.size}
              onClear={() => setQualities(new Set())}
            >
              {QUALITIES.map((q) => (
                <TogglePill
                  key={q.id}
                  active={qualities.has(q.id)}
                  onClick={() => setQualities(toggleInSet(qualities, q.id))}
                >
                  {q.label}
                </TogglePill>
              ))}
            </FilterGroup>

            {/* Sort */}
            <FilterGroup icon={TrendingUp} label="Ordenar por">
              <div className="flex flex-wrap gap-1">
                {SORT_OPTIONS.map((s) => (
                  <TogglePill
                    key={s.id}
                    active={sortBy === s.id}
                    onClick={() => setSortBy(s.id)}
                  >
                    {s.label}
                  </TogglePill>
                ))}
              </div>
            </FilterGroup>

            {/* Transport mode */}
            <FilterGroup icon={MapPin} label="Transporte">
              <div className="flex gap-1">
                <TogglePill
                  active={transportMode === "fast"}
                  onClick={() => setTransportMode("fast")}
                >
                  Fast Travel (10%)
                </TogglePill>
                <TogglePill
                  active={transportMode === "manual"}
                  onClick={() => setTransportMode("manual")}
                >
                  Manual (grátis)
                </TogglePill>
              </div>
            </FilterGroup>

            {/* Mount */}
            <FilterGroup icon={Truck} label="Montaria">
              <MountSelector mountId={mountId} setMountId={setMountId} />
            </FilterGroup>

            {/* Numeric: min margin */}
            <FilterGroup icon={Scale} label="Margem mín %">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={minMargin}
                  onChange={(e) => setMinMargin(Math.max(Number(e.target.value) || 0, 0))}
                  className="w-20 rounded-md border border-slate-700/60 bg-slate-900/60 px-2.5 py-1 text-center font-mono text-sm text-slate-200 outline-none transition-colors focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
            </FilterGroup>

            {/* Numeric: min volume */}
            <FilterGroup icon={Package} label="Volume mín/dia">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={minVolume}
                  onChange={(e) => setMinVolume(Math.max(Number(e.target.value) || 0, 0))}
                  className="w-20 rounded-md border border-slate-700/60 bg-slate-900/60 px-2.5 py-1 text-center font-mono text-sm text-slate-200 outline-none transition-colors focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
                />
                <span className="text-xs text-slate-500">/dia</span>
              </div>
            </FilterGroup>

            {/* Numeric: min consistency */}
            <FilterGroup icon={Target} label="Consistência mín %">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={10}
                  value={minConsistency}
                  onChange={(e) => setMinConsistency(Math.min(100, Math.max(Number(e.target.value) || 0, 0)))}
                  className="w-20 rounded-md border border-slate-700/60 bg-slate-900/60 px-2.5 py-1 text-center font-mono text-sm text-slate-200 outline-none transition-colors focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
            </FilterGroup>

            {/* Premium switch */}
            <FilterGroup icon={Crown} label="Conta">
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-amber-400/70" />
                    Premium ({usePremium ? 4 : 8}% taxa)
                  </span>
                  <Switch
                    checked={usePremium}
                    onCheckedChange={(v) => setUsePremium(v === true)}
                    size="sm"
                  />
                </label>
              </div>
            </FilterGroup>
          </div>

          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-800/60 px-4 py-2 text-xs text-slate-500">
            <span><strong className="text-slate-300">{tierLabel}</strong></span>
            <span className="text-slate-700">|</span>
            <span><strong className="text-slate-300">{categoryLabel}</strong></span>
            <span className="text-slate-700">|</span>
            <span>Taxa: <strong className="text-slate-300">{salesTaxPct}%</strong></span>
            <span className="text-slate-700">|</span>
            <span>Montaria: <strong className="text-slate-300">{mount?.name ?? "—"}</strong> ({mount?.maxLoadKg.toLocaleString() ?? 0} kg)</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Info banner */}
      <div className="rounded-lg border border-sky-900/40 bg-sky-950/20 p-3 text-xs text-sky-300/80">
        <strong>Fluxo:</strong> Comprar na hora (sell_min na cidade) &rarr; Levar ao BM &rarr; Vender na hora (buy_max no BM).
        Sem taxa de setup (2.5%) na venda instantânea. Apenas {salesTaxPct}% taxa de venda.
        Projeções usam média histórica do BM (24h, 7d, 30d) para estimar margem consistente.
        <strong> Consistência</strong> = % de dias nos últimos 30d com lucro projetado positivo.
      </div>

      {error && <ErrorState message={error} />}

      {/* Empty state */}
      {!loading && projections.length === 0 && !error && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center">
          <p className="text-sm text-slate-400">
            Clique em &quot;Calcular&quot; para ver itens com margem histórica consistente no BM.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center">
          <p className="text-sm text-slate-400">Buscando histórico do BM... (pode levar 10-20s)</p>
        </div>
      )}

      {/* Results */}
      {!loading && projections.length > 0 && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label={`Oportunidades ${tierLabel}`}
              value={projections.length.toString()}
              sublabel={`${categoryLabel} | consistência ≥ ${minConsistency}%`}
              icon={TrendingUp}
              color="text-sky-400"
            />
            <KpiCard
              label="Melhor margem 7d"
              value={`${projections[0].margin7d.toFixed(0)}%`}
              sublabel={projections[0].itemName}
              icon={Scale}
              color="text-emerald-400"
            />
            <KpiCard
              label="Maior volume"
              value={`${Math.max(...projections.map((p) => p.volume7d))}/dia`}
              sublabel="unidades vendidas no BM"
              icon={Package}
              color="text-amber-400"
            />
            <KpiCard
              label="Lucro/carga top"
              value={`+${fmtSilver(projections[0].profitPerLoad)}`}
              sublabel={mount ? `${tripsTo33M} viagens p/ 33M` : "sem montaria"}
              icon={Weight}
              color="text-emerald-400"
            />
          </div>

          {/* Meta banner */}
          {mount && bestProj && bestProj.profitPerLoad > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-4">
              <Target className="h-8 w-8 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500">Meta 33M (premium):</span>{" "}
                  <span className="font-mono font-bold text-emerald-400">{tripsTo33M} viagens</span>
                  {" "}com {mount.name} lotado
                </p>
                <p className="text-xs text-slate-500">
                  Top item: {bestProj.itemName} Q{bestProj.quality} · {bestProj.buyCity} &rarr; BM · +{fmtSilver(bestProj.profitPerLoad)}/carga
                </p>
              </div>
            </div>
          )}

          {/* Card grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projections.map((proj, i) => (
              <ProjectionCard key={`${proj.itemId}-${proj.quality}-${i}`} proj={proj} rank={i + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
