"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Briefcase,
  Package,
  Skull,
  TrendingUp,
  MapPin,
  Scale,
  Truck,
  Coins,
  Weight,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { ServerRegion } from "@/lib/albion/types";
import type { BmProjection } from "@/lib/albion/projections";
import { DEFAULT_MOUNT_ID } from "@/lib/albion/mounts";
import { LazyPortfolioPanel, LazyProjectionsPanel } from "@/components/dashboard/lazy-panels";
import { EmptyState, LoadingSkeleton, Panel, Toolbar } from "./ui-shell";
import { fmtSilver, profitColor, marginColor } from "@/lib/utils/format";
import { QUALITY_LABELS, QUALITY_COLORS } from "@/lib/albion/constants";
import { ItemImage } from "@/components/item-image";
import type { PortfolioResult } from "./types";

type ProjCategory = "raw" | "refined" | "gear";
type ProjSortBy = "margin7d" | "consistency" | "volume7d" | "profitPerLoad" | "profitPerUnit";

interface OpportunitiesPanelProps {
  region: ServerRegion;
  setLastRefresh?: (ts: number) => void;
}

type SubTab = "arbitrage" | "blackmarket" | "refining" | "projections" | "portfolio";

interface ScanResult {
  arbitrage: ArbitrageOpp[];
  blackMarket: BlackMarketOpp[];
  refining: RefiningOpp[];
  filteredCount: number;
  filteredReasons: string[];
  dbStats?: { totalRows: number; distinctItems: number };
  error?: string;
}

interface ArbitrageOpp {
  itemId: string;
  itemName: string;
  quality: number;
  profit: number;
  margin: number;
  buyCity: string;
  sellCity: string;
  buyPrice: number;
  sellPrice: number;
  transportCost: number;
  salesTax: number;
  itemWeight: number;
  unitsPerLoad: number;
  profitPerLoad: number;
}

interface BlackMarketOpp {
  itemId: string;
  itemName: string;
  quality: number;
  profit: number;
  margin: number;
  buyCity: string;
  buyPrice: number;
  blackMarketPrice: number;
  transportCost: number;
  salesTax: number;
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

interface RefiningOpp {
  recipe: {
    rawResourceId: string;
    rawResourceName: string;
    refinedId: string;
    refinedName: string;
    tier: number;
  };
  rawCity: string;
  refinedCity: string;
  refineCity: string;
  rawPrice: number;
  refinedPrice: number;
  profit: number;
  margin: number;
}

export function OpportunitiesPanel({ region, setLastRefresh }: OpportunitiesPanelProps) {
  const [data, setData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("arbitrage");
  const [scanned, setScanned] = useState(false);
  const [useFocus, setUseFocus] = useState(false);
  const [usePremium, setUsePremium] = useState(true);
  const [progress, setProgress] = useState(0);
  const [projections, setProjections] = useState<BmProjection[]>([]);
  const [projectionsLoading, setProjectionsLoading] = useState(false);
  const [projectionsError, setProjectionsError] = useState<string | null>(null);
  const projectionsAbortRef = useRef<AbortController | null>(null);
  const [filters, setFilters] = useState({
    minProfit: "500",
    minMargin: "10",
    maxAgeHours: "24",
    hideOutliers: true,
  });
  const [dbStats, setDbStats] = useState<{ totalRows: number; distinctItems: number } | null>(null);

  // --- Projections filter state (DEFECT 1 fix: was no-op) ---
  const [projTiers, setProjTiers] = useState<Set<number>>(new Set([6]));
  const [projCategories, setProjCategories] = useState<Set<ProjCategory>>(new Set());
  const [projQualities, setProjQualities] = useState<Set<number>>(new Set());
  const [projSortBy, setProjSortBy] = useState<ProjSortBy>("margin7d");
  const [projTransportMode, setProjTransportMode] = useState<"fast" | "manual">("fast");
  const [projMountId, setProjMountId] = useState<string>(DEFAULT_MOUNT_ID);
  const [projMinMargin, setProjMinMargin] = useState(40);
  const [projMinVolume, setProjMinVolume] = useState(10);
  const [projMinConsistency, setProjMinConsistency] = useState(80);

  // --- Portfolio state (DEFECT 2 fix: was no-op + data=null) ---
  const [portfolioData, setPortfolioData] = useState<PortfolioResult | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const portfolioAbortRef = useRef<AbortController | null>(null);
  const [portInvestment, setPortInvestment] = useState(1_000_000);
  const [portBankroll, setPortBankroll] = useState(5_000_000);
  const [portSurvivalProb, setPortSurvivalProb] = useState(95);
  const [portMaxUnits, setPortMaxUnits] = useState(100);
  const [portMinMargin, setPortMinMargin] = useState(20);
  const [portMinConsistency, setPortMinConsistency] = useState(70);
  const [portUseFullBudget, setPortUseFullBudget] = useState(false);
  const [portMountId] = useState<string>(DEFAULT_MOUNT_ID);

  useEffect(() => {
    if (data && !loading && !error) setLastRefresh?.(Date.now());
  }, [data, loading, error, setLastRefresh]);

  const fetchOpportunities = useCallback(async () => {
    const params = new URLSearchParams({
      region,
      items: "all",
      use_premium: String(usePremium),
      use_focus: String(useFocus),
      min_profit: "0",
      min_margin: "0",
      enrich_bm: "true",
      limit: "200",
    });
    const res = await fetch(`/api/opportunities?${params.toString()}`);
    if (!res.ok) throw new Error(`Opportunities failed: ${res.status}`);
    const json = (await res.json()) as ScanResult;
    setData(json);
  }, [region, usePremium, useFocus]);

  // Keep latest fetchOpportunities in a ref so the mount/region effect
  // doesn't re-run when usePremium/useFocus change (avoids re-fetch storms
  // and input focus loss while typing in filter fields).
  const fetchOppRef = useRef(fetchOpportunities);
  useEffect(() => {
    fetchOppRef.current = fetchOpportunities;
  });

  useEffect(() => {
    // On mount, check if there is scanned data in the DB.
    fetch(`/api/scan?region=${region}&mode=status`)
      .then((res) => res.json())
      .then((json) => {
        const status = json as {
          dbStats?: { totalRows: number; distinctItems: number };
          lastResult?: { itemsScanned: number } | null;
        };
        setDbStats(status.dbStats ?? null);
        if ((status.lastResult?.itemsScanned ?? 0) > 0 || (status.dbStats?.totalRows ?? 0) > 0) {
          setScanned(true);
          fetchOppRef.current().catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to load");
          });
        }
      })
      .catch(() => undefined);
  }, [region]);

  const fetchProjections = useCallback(async () => {
    projectionsAbortRef.current?.abort();
    const controller = new AbortController();
    projectionsAbortRef.current = controller;
    setProjectionsLoading(true);
    setProjectionsError(null);
    try {
      const res = await fetch(`/api/projections?region=${region}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Projections failed: ${res.status}`);
      const json = (await res.json()) as { projections: BmProjection[] };
      setProjections(json.projections);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setProjectionsError(err.message);
      }
    } finally {
      setProjectionsLoading(false);
    }
  }, [region]);

  const fetchPortfolio = useCallback(async () => {
    portfolioAbortRef.current?.abort();
    const controller = new AbortController();
    portfolioAbortRef.current = controller;
    setPortfolioLoading(true);
    setPortfolioError(null);
    try {
      const params = new URLSearchParams({
        region,
        investment: String(portInvestment),
        bankroll: String(portBankroll),
        survival_prob: String(portSurvivalProb / 100),
        mount: portMountId,
        max_units_per_item: String(portMaxUnits),
        min_margin: String(portMinMargin),
        min_consistency: String(portMinConsistency),
        use_full_budget: String(portUseFullBudget),
      });
      const res = await fetch(`/api/portfolio?${params.toString()}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Portfolio failed: ${res.status}`);
      const json = (await res.json()) as PortfolioResult;
      setPortfolioData(json);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setPortfolioError(err.message);
      }
    } finally {
      setPortfolioLoading(false);
    }
  }, [region, portInvestment, portBankroll, portSurvivalProb, portMountId, portMaxUnits, portMinMargin, portMinConsistency, portUseFullBudget]);

  const pollScanProgress = useCallback(async () => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await fetch(`/api/scan?region=${region}&mode=status`);
      if (!res.ok) continue;
      const json = (await res.json()) as { isScanning?: boolean; progress?: { percent?: number } | null; lastResult?: { durationMs?: number } | null };
      const percent = json.progress?.percent ?? 0;
      setProgress(percent);
      if (!json.isScanning && json.lastResult) break;
    }
  }, [region]);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const res = await fetch(`/api/scan?region=${region}&mode=start&items=all&batch_size=100`);
      if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
      const json = (await res.json()) as { status: string; completed?: boolean; progress?: number; message?: string; totalItems?: number };
      if (!json.completed && (json.totalItems ?? 0) > 0) {
        await pollScanProgress();
      }
      await fetchOpportunities();
      setScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan error");
    } finally {
      setLoading(false);
    }
  }, [region, pollScanProgress, fetchOpportunities]);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchOpportunities();
      setScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis error");
    } finally {
      setLoading(false);
    }
  }, [fetchOpportunities]);

  const filteredArbitrage = useMemo(() => applyFilters(data?.arbitrage ?? [], filters), [data, filters]);
  const filteredBlackMarket = useMemo(() => applyFilters(data?.blackMarket ?? [], filters), [data, filters]);
  const filteredRefining = useMemo(() => applyFilters(data?.refining ?? [], filters), [data, filters]);

  const totalProfit = useMemo(() => {
    const list = subTab === "arbitrage" ? filteredArbitrage : subTab === "blackmarket" ? filteredBlackMarket : filteredRefining;
    return list.reduce((sum, o) => sum + (o.profit ?? 0), 0);
  }, [filteredArbitrage, filteredBlackMarket, filteredRefining, subTab]);

  return (
    <div className="space-y-6">
      <Toolbar>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Oportunidades de Mercado</h2>
          <p className="text-sm text-slate-500">Análise de arbitragem, Black Market e refino</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" checked={usePremium} onChange={(e) => setUsePremium(e.target.checked)} className="accent-emerald-500" />
            Premium
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" checked={useFocus} onChange={(e) => setUseFocus(e.target.checked)} className="accent-emerald-500" />
            Focus
          </label>
          {dbStats && dbStats.totalRows > 0 ? (
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 disabled:opacity-50"
            >
              <Activity className="h-4 w-4" />
              {loading ? "Calculando..." : "Calcular oportunidades"}
            </button>
          ) : null}
          <button
            onClick={runScan}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50"
          >
            <Activity className="h-4 w-4" />
            {loading ? (dbStats && dbStats.totalRows > 0 ? `Escaneando ${progress}%...` : `Analisando ${progress}%...`) : "Escanear mercado"}
          </button>
        </div>
      </Toolbar>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-800/60 pb-3">
        <SubTabButton id="blackmarket" label="Black Market" icon={Skull} active={subTab === "blackmarket"} onClick={setSubTab} />
        <SubTabButton id="arbitrage" label="Arbitragem" icon={ArrowLeftRight} active={subTab === "arbitrage"} onClick={setSubTab} />
        <SubTabButton id="refining" label="Refino" icon={Package} active={subTab === "refining"} onClick={setSubTab} />
        <SubTabButton id="projections" label="Projeções BM" icon={BarChart3} active={subTab === "projections"} onClick={() => { setSubTab("projections"); fetchProjections(); }} />
        <SubTabButton id="portfolio" label="Portfolio" icon={Briefcase} active={subTab === "portfolio"} onClick={setSubTab} />
      </div>

      <InlineFilters filters={filters} onChange={setFilters} />

      {!scanned && !data && !loading && (
        <EmptyState
          title={dbStats && dbStats.totalRows > 0 ? "Dados escaneados disponíveis" : "Nenhuma análise disponível"}
          description={
            dbStats && dbStats.totalRows > 0
              ? `Banco de dados tem ${dbStats.totalRows.toLocaleString()} registros de ${dbStats.distinctItems} itens. Clique em 'Calcular oportunidades' para analisar.`
              : "Clique em 'Escanear mercado' para coletar dados e descobrir oportunidades."
          }
        />
      )}

      {loading && <LoadingSkeleton />}
      {error && <EmptyState title="Erro na análise" description={error} />}

      {scanned && data && !loading && !error && subTab !== "projections" && subTab !== "portfolio" && (
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">Resultados</span>
              <span className="text-xs text-slate-500">
                {subTab === "arbitrage" && `${filteredArbitrage.length} rotas`}
                {subTab === "blackmarket" && `${filteredBlackMarket.length} itens`}
                {subTab === "refining" && `${filteredRefining.length} receitas`}
              </span>
            </div>
            <span className="text-xs text-slate-500">Lucro total projetado: <strong className="text-emerald-400">{fmtSilver(totalProfit)}</strong></span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subTab === "arbitrage" && filteredArbitrage.map((o, i) => <OppCard key={`${o.itemId}-${o.buyCity}-${o.sellCity}-${o.quality}-${i}`} opp={o} type="arbitrage" rank={i + 1} />)}
            {subTab === "blackmarket" && filteredBlackMarket.map((o, i) => <OppCard key={`${o.itemId}-${o.buyCity}-${o.quality}-${i}`} opp={o} type="blackmarket" rank={i + 1} />)}
            {subTab === "refining" && filteredRefining.map((o, i) => <OppCard key={`${o.recipe.rawResourceId}-${o.recipe.refinedId}-${o.rawCity}-${o.refinedCity}-${i}`} opp={o} type="refining" rank={i + 1} />)}
          </div>
        </Panel>
      )}

      {subTab === "projections" && (
        <LazyProjectionsPanel
          projections={projections}
          loading={projectionsLoading}
          error={projectionsError}
          onFetch={fetchProjections}
          transportMode={projTransportMode}
          setTransportMode={setProjTransportMode}
          minMargin={projMinMargin}
          setMinMargin={setProjMinMargin}
          minVolume={projMinVolume}
          setMinVolume={setProjMinVolume}
          usePremium={usePremium}
          setUsePremium={setUsePremium}
          mountId={projMountId}
          setMountId={setProjMountId}
          tiers={projTiers}
          setTiers={setProjTiers}
          categories={projCategories}
          setCategories={setProjCategories}
          qualities={projQualities}
          setQualities={setProjQualities}
          minConsistency={projMinConsistency}
          setMinConsistency={setProjMinConsistency}
          sortBy={projSortBy}
          setSortBy={setProjSortBy}
        />
      )}

      {subTab === "portfolio" && (
        <LazyPortfolioPanel
          data={portfolioData}
          loading={portfolioLoading}
          error={portfolioError}
          onOptimize={fetchPortfolio}
          investment={portInvestment}
          setInvestment={setPortInvestment}
          mountId={portMountId}
          minMargin={portMinMargin}
          setMinMargin={setPortMinMargin}
          minConsistency={portMinConsistency}
          setMinConsistency={setPortMinConsistency}
          useFullBudget={portUseFullBudget}
          setUseFullBudget={setPortUseFullBudget}
          survivalProb={portSurvivalProb}
          setSurvivalProb={setPortSurvivalProb}
          bankroll={portBankroll}
          setBankroll={setPortBankroll}
          maxUnits={portMaxUnits}
          setMaxUnits={setPortMaxUnits}
          onItemClick={() => {}}
        />
      )}
    </div>
  );
}

function SubTabButton({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: SubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: (id: SubTab) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function InlineFilters({
  filters,
  onChange,
}: {
  filters: { minProfit: string; minMargin: string; maxAgeHours: string; hideOutliers: boolean };
  onChange: (f: typeof filters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
      <span className="font-medium text-slate-500">Filtros</span>
      <div className="flex items-center gap-1.5">
        <span>Lucro mín:</span>
        <input
          type="number"
          min={0}
          value={filters.minProfit}
          onChange={(e) => onChange({ ...filters, minProfit: e.target.value })}
          className="w-20 rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-600/50"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span>Margem mín %:</span>
        <input
          type="number"
          min={0}
          value={filters.minMargin}
          onChange={(e) => onChange({ ...filters, minMargin: e.target.value })}
          className="w-16 rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-600/50"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span>Idade máx (h):</span>
        <input
          type="number"
          min={0}
          value={filters.maxAgeHours}
          onChange={(e) => onChange({ ...filters, maxAgeHours: e.target.value })}
          className="w-16 rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-600/50"
        />
      </div>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={filters.hideOutliers}
          onChange={(e) => onChange({ ...filters, hideOutliers: e.target.checked })}
          className="accent-emerald-500"
        />
        Ocultar outliers
      </label>
    </div>
  );
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
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <span className={`font-mono text-sm tabular-nums ${color ?? "text-slate-200"}`}>{value}</span>
    </div>
  );
}

function OppCard({
  opp,
  type,
  rank,
}: {
  opp: ArbitrageOpp | BlackMarketOpp | RefiningOpp;
  type: "arbitrage" | "blackmarket" | "refining";
  rank: number;
}) {
  if (type === "refining") {
    const r = opp as RefiningOpp;
    const isPositive = r.profit > 0;
    return (
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 transition-all hover:border-amber-700/40 hover:bg-slate-900/60">
        <div className="flex items-center gap-3 p-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
            {rank}
          </span>
          <ItemImage itemId={r.recipe.refinedId} itemName={r.recipe.refinedName} size={40} quality={1} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-100">{r.recipe.refinedName}</p>
            <span className="text-xs text-slate-600">T{r.recipe.tier}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 pb-2 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <MapPin className="h-3 w-3 text-amber-500" />
            <span>{r.rawCity}</span>
          </div>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <div className="flex items-center gap-1 text-slate-400">
            <MapPin className="h-3 w-3 text-sky-500" />
            <span>{r.refinedCity}</span>
          </div>
        </div>
        {/* Profit highlight */}
        <div className="mx-3 mb-3 flex items-center justify-between rounded-lg bg-emerald-950/30 px-3 py-2.5 ring-1 ring-emerald-800/30">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Lucro/unit</span>
            <span className={`font-mono text-xl font-bold tabular-nums ${isPositive ? "text-emerald-400" : "text-slate-400"}`}>
              {isPositive ? "+" : ""}{fmtSilver(r.profit)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Margem</span>
            <span className={`font-mono text-sm font-semibold ${marginColor(r.margin)}`}>{r.margin.toFixed(0)}%</span>
          </div>
        </div>
        <div className="space-y-1.5 px-3 pb-2.5">
          <Metric icon={Scale} label="Refino em" value={r.refineCity} color="text-sky-300" />
        </div>
        <div className="mt-auto border-t border-slate-800/60 px-3 py-2 text-[10px] text-slate-500">
          {r.recipe.rawResourceName} → {r.recipe.refinedName} · {r.refineCity}
        </div>
      </div>
    );
  }

  const o = opp as ArbitrageOpp | BlackMarketOpp;
  const isBm = type === "blackmarket";
  const isPositive = o.profit > 0;
  const sellCity = isBm ? "Black Market" : (o as ArbitrageOpp).sellCity;
  const bm = o as BlackMarketOpp;
  const consistency = bm.bmConsistency;
  const volume = bm.bmVolume7d;
  const consistencyColor = consistency !== undefined
    ? consistency >= 80 ? "text-emerald-400" : consistency >= 50 ? "text-amber-400" : "text-red-400"
    : "text-slate-500";
  const consistencyBg = consistency !== undefined
    ? consistency >= 80 ? "bg-emerald-500" : consistency >= 50 ? "bg-amber-500" : "bg-red-500"
    : "bg-slate-700";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 transition-all hover:border-emerald-700/40 hover:bg-slate-900/60">
      {/* Header: rank + image + name + quality */}
      <div className="flex items-center gap-3 p-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
          {rank}
        </span>
        <ItemImage itemId={o.itemId} itemName={o.itemName} quality={o.quality} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-100">{o.itemName}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className={`rounded border px-1.5 py-0 text-[10px] ${QUALITY_COLORS[o.quality] ?? QUALITY_COLORS[1]}`}>
              {QUALITY_LABELS[o.quality] ?? `Q${o.quality}`}
            </span>
            <span className="text-xs text-slate-600">T{o.itemId.match(/^T(\d)/)?.[1] ?? "?"}</span>
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 px-3 pb-2 text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <MapPin className="h-3 w-3 text-emerald-500" />
          <span>{o.buyCity}</span>
        </div>
        <ArrowRight className="h-3 w-3 text-slate-600" />
        <div className="flex items-center gap-1 text-slate-400">
          {isBm ? <Skull className="h-3 w-3 text-red-500" /> : <MapPin className="h-3 w-3 text-sky-500" />}
          <span>{sellCity}</span>
        </div>
      </div>

      {/* Profit highlight — the most important number */}
      <div className="mx-3 mb-3 flex items-center justify-between rounded-lg bg-emerald-950/30 px-3 py-2.5 ring-1 ring-emerald-800/30">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Lucro/unit</span>
          <span className={`font-mono text-xl font-bold tabular-nums ${profitColor(o.profit)}`}>
            {isPositive ? "+" : ""}{fmtSilver(o.profit)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Margem</span>
          <span className={`font-mono text-sm font-semibold ${marginColor(o.margin)}`}>{o.margin.toFixed(0)}%</span>
        </div>
      </div>

      {/* Consistency bar (BM only) */}
      {isBm && consistency !== undefined && (
        <div className="px-3 pb-2.5">
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
      <div className="space-y-1.5 px-3 pb-2.5">
        <Metric icon={Truck} label="Transporte" value={`-${fmtSilver(o.transportCost)}`} color="text-amber-500" />
        <Metric icon={Coins} label="Taxa venda" value={`-${fmtSilver(o.salesTax)}`} color="text-amber-500" />
        {isBm && volume !== undefined && (
          <Metric icon={Package} label="Volume/dia" value={`${volume} unid`}
            color={volume >= 50 ? "text-emerald-400" : volume >= 10 ? "text-amber-400" : "text-red-400"} />
        )}
        {isBm && bm.bmAvgPrice7d !== undefined && (
          <Metric icon={TrendingUp} label="BM avg 7d" value={fmtSilver(bm.bmAvgPrice7d)} color="text-sky-300" />
        )}
      </div>

      {/* Price age badges */}
      {isBm && (bm.buyPriceAgeHours !== undefined || bm.bmPriceAgeHours !== undefined) && (
        <div className="flex items-center gap-3 border-t border-slate-800/40 px-3 py-1.5">
          <AgeBadge hours={bm.buyPriceAgeHours} label="compra" />
          <AgeBadge hours={bm.bmPriceAgeHours} label="BM" />
        </div>
      )}

      {/* Mount load — compact footer with key metric only */}
      {o.unitsPerLoad > 0 && (
        <div className="mt-auto flex items-center justify-between border-t border-slate-800/60 bg-slate-950/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Weight className="h-3 w-3" />
            <span>{o.unitsPerLoad.toLocaleString()} unid./carga</span>
          </div>
          <span className={`font-mono text-xs font-semibold ${profitColor(o.profitPerLoad)}`}>
            +{fmtSilver(o.profitPerLoad)}/carga
          </span>
        </div>
      )}
    </div>
  );
}

function applyFilters<T extends { profit: number; margin: number; buyPriceAgeHours?: number }>(list: T[], filters: { minProfit: string; minMargin: string; maxAgeHours: string; hideOutliers: boolean }) {
  const minProfit = Number(filters.minProfit) || 0;
  const minMargin = Number(filters.minMargin) || 0;
  const maxAgeHours = Number(filters.maxAgeHours) || 0;
  return list.filter((o) => {
    if (o.profit < minProfit) return false;
    if (o.margin < minMargin) return false;
    if (filters.hideOutliers && o.margin > 500) return false;
    if (maxAgeHours > 0 && o.buyPriceAgeHours !== undefined && o.buyPriceAgeHours > maxAgeHours) return false;
    return true;
  });
}
