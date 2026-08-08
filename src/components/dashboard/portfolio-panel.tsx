"use client";

import { useState, useMemo } from "react";
import { TrendingUp, Scale, Package, Target, Briefcase, Clock, AlertTriangle } from "lucide-react";
import { fmtSilver } from "@/lib/utils/format";
import { KpiCard } from "@/components/opp-cards";
import { ItemImage } from "@/components/item-image";
import { getMountById } from "@/lib/albion/mounts";
import type { PortfolioResult } from "./types";

export function PortfolioPanel({
  data,
  loading,
  error,
  onOptimize,
  investment,
  setInvestment,
  mountId,
  minMargin,
  setMinMargin,
  minConsistency,
  setMinConsistency,
  useFullBudget,
  setUseFullBudget,
  survivalProb,
  setSurvivalProb,
  bankroll,
  setBankroll,
  maxUnits,
  setMaxUnits,
  onItemClick,
}: {
  data: PortfolioResult | null;
  loading: boolean;
  error: string | null;
  onOptimize: () => void;
  investment: number;
  setInvestment: (v: number) => void;
  mountId: string;
  minMargin: number;
  setMinMargin: (v: number) => void;
  minConsistency: number;
  setMinConsistency: (v: number) => void;
  useFullBudget: boolean;
  setUseFullBudget: (v: boolean) => void;
  survivalProb: number;
  setSurvivalProb: (v: number) => void;
  bankroll: number;
  setBankroll: (v: number) => void;
  maxUnits: number;
  setMaxUnits: (v: number) => void;
  onItemClick: (itemId: string, quality: number) => void;
}) {
  const mount = getMountById(mountId);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const best = data?.cityPortfolios[0] ?? null;

  // Analytical insights computed from data.
  const insights = useMemo(() => {
    if (!data || data.cityPortfolios.length === 0) return null;
    const bestCp = data.cityPortfolios[0];
    // Bottleneck: capital vs weight.
    const isCapitalBottleneck = bestCp.budgetUtilization > bestCp.loadUtilization;
    const freeWeight = data.mountMaxLoad - bestCp.totalWeight;
    const freeCapital = investment - bestCp.totalInvestment;
    // Staleness alerts: items with buy price age > 12h.
    const staleItems = bestCp.items.filter((i) => (i.buyPriceAgeHours ?? 0) > 12);
    // Trend alerts: items with BM price trend down.
    const downTrendItems = bestCp.items.filter((i) => i.bmPriceTrend === "down");
    // High risk items.
    const highRiskItems = bestCp.items.filter((i) => i.riskScore >= 70);
    return { isCapitalBottleneck, freeWeight, freeCapital, staleItems, downTrendItems, highRiskItems, bestCp };
  }, [data, investment]);

  return (
    <div className="space-y-4">
      {/* ============ CONFIG BAR ============ */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500">Bankroll total (silver)</label>
            <input
              type="number"
              min={100000}
              step={1000000}
              value={bankroll || ""}
              onChange={(e) => setBankroll(Math.max(0, Number(e.target.value) || 0))}
              placeholder="10000000"
              className="mt-1 w-36 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Capital por viagem</label>
            <input
              type="number"
              min={100000}
              step={1000000}
              value={investment || ""}
              onChange={(e) => setInvestment(Math.max(0, Number(e.target.value) || 0))}
              placeholder="10000000"
              className="mt-1 w-36 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Sobrevivencia (%)</label>
            <input
              type="number"
              min={1}
              max={99}
              step={5}
              value={survivalProb}
              onChange={(e) => setSurvivalProb(Math.max(1, Math.min(99, Number(e.target.value) || 90)))}
              className="mt-1 w-20 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Max unid/item</label>
            <input
              type="number"
              min={1}
              max={500}
              step={5}
              value={maxUnits}
              onChange={(e) => setMaxUnits(Math.max(1, Number(e.target.value) || 20))}
              className="mt-1 w-20 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Margem min (%)</label>
            <input
              type="number"
              min={0}
              step={5}
              value={minMargin}
              onChange={(e) => setMinMargin(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-20 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Consist. min (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={10}
              value={minConsistency}
              onChange={(e) => setMinConsistency(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              className="mt-1 w-20 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
            />
          </div>
          <div className="text-xs text-slate-500">
            <p>Montaria: <span className="text-slate-300">{mount?.name ?? mountId}</span></p>
            <p>Carga: <span className="text-slate-300">{mount?.maxLoadKg.toLocaleString() ?? "?"} kg</span></p>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={useFullBudget}
              onChange={(e) => setUseFullBudget(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Usar todo o capital
          </label>
          <button
            onClick={onOptimize}
            disabled={loading || investment <= 0}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Otimizando..." : <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> Otimizar por cidade</span>}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
          {data && !loading && (
            <span className="ml-auto text-xs text-slate-500">
              {data.opportunitiesConsidered} ops · {data.cityPortfolios.length} cidades
            </span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Bankroll = capital total. Capital por viagem = quanto arriscar em cada trip.
          {" "}Sobrevivencia = prob de nao ser ganked. Max unid/item = liquidez real de compra (comprar mais que isso faz o preco subir).
          {" "}EV = p × lucro - q × investimento.
        </p>
      </div>

      {/* ============ EXECUTIVE KPIs (best city by EV) ============ */}
      {best && !loading && (
        <div className={`rounded-xl border p-5 ${best.expectedValue >= 0 ? "border-emerald-800/50 bg-gradient-to-br from-emerald-950/30 to-slate-950" : "border-red-800/50 bg-gradient-to-br from-red-950/30 to-slate-950"}`}>
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${best.expectedValue >= 0 ? "bg-emerald-600" : "bg-red-600"}`}>
              {best.expectedValue >= 0 ? "Dashboard de Otimizacao" : "EV Negativo - Nao Recomendado"}
            </span>
            <span className="text-lg font-bold text-slate-100">{best.city}</span>
            <span className="text-xs text-slate-500">→ Black Market · p={best.survivalProb.toFixed(0)}% sobreviver</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard
              label="EV por viagem"
              value={`${best.expectedValue >= 0 ? "+" : ""}${fmtSilver(best.expectedValue)}`}
              sublabel={best.expectedValue >= 0 ? "Valor esperado (primario)" : "Perda esperada"}
              icon={TrendingUp}
              color={best.expectedValue >= 0 ? "text-emerald-400" : "text-red-400"}
            />
            <KpiCard
              label="Lucro se sobreviver"
              value={`+${fmtSilver(best.totalProfit)}`}
              sublabel={`${best.expectedROI.toFixed(0)}% ROI projetado`}
              icon={Briefcase}
              color="text-emerald-400"
            />
            <KpiCard
              label="Perda se ganked"
              value={`-${fmtSilver(best.totalInvestment)}`}
              sublabel={`${((1 - best.survivalProb) * 100).toFixed(0)}% de acontecer`}
              icon={AlertTriangle}
              color="text-red-400"
            />
            <KpiCard
              label="Kelly (half)"
              value={`${(best.kellyHalfFraction * 100).toFixed(1)}%`}
              sublabel={`Capital rec: ${fmtSilver(best.recommendedCapital)}`}
              icon={Target}
              color={best.kellyFraction > 0 ? "text-sky-400" : "text-red-400"}
            />
            <KpiCard
              label="Viagens p/ meta (EV)"
              value={best.tripsToTargetEV > 0 ? String(best.tripsToTargetEV) : "∞"}
              sublabel={best.tripsToTarget > 0 ? `vs ${best.tripsToTarget} se garantido` : "EV negativo"}
              icon={Package}
              color="text-amber-400"
            />
            <KpiCard
              label="Risco de ruina"
              value={`${(best.ruinProb10Trips * 100).toFixed(2)}%`}
              sublabel="10 perdas seguidas"
              icon={Scale}
              color={best.ruinProb10Trips < 0.001 ? "text-emerald-400" : best.ruinProb10Trips < 0.01 ? "text-amber-400" : "text-red-400"}
            />
          </div>
        </div>
      )}

      {/* ============ ANALYTICAL INSIGHTS ============ */}
      {insights && !loading && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Bottleneck analysis */}
          <div className={`rounded-lg border p-4 ${insights.isCapitalBottleneck ? "border-sky-800/50 bg-sky-950/20" : "border-amber-800/50 bg-amber-950/20"}`}>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
              <Package className={`h-3.5 w-3.5 ${insights.isCapitalBottleneck ? "text-sky-400" : "text-amber-400"}`} />
              <span className={insights.isCapitalBottleneck ? "text-sky-400" : "text-amber-400"}>Gargalo Identificado</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              {insights.isCapitalBottleneck ? (
                <>
                  A restricao ativa e o <strong className="text-sky-300">capital</strong>.
                  {" "}Carga livre: <strong className="text-slate-200">{Math.round(insights.freeWeight).toLocaleString()} kg</strong>.
                  {" "}Upgrade de montaria <span className="text-amber-400">nao aumenta</span> o lucro.
                  {" "}Aumentar capital em 2x projetaria ~2x lucro.
                </>
              ) : (
                <>
                  A restricao ativa e o <strong className="text-amber-300">peso da montaria</strong>.
                  {" "}Capital livre: <strong className="text-slate-200">{fmtSilver(insights.freeCapital)}</strong>.
                  {" "}Upgrade de montaria <span className="text-emerald-400">aumentaria o lucro</span> proporcionalmente.
                </>
              )}
            </p>
          </div>

          {/* Staleness alerts */}
          <div className={`rounded-lg border p-4 ${insights.staleItems.length > 0 ? "border-amber-800/50 bg-amber-950/20" : "border-emerald-800/40 bg-emerald-950/10"}`}>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
              <Clock className={`h-3.5 w-3.5 ${insights.staleItems.length > 0 ? "text-amber-400" : "text-emerald-400"}`} />
              <span className={insights.staleItems.length > 0 ? "text-amber-400" : "text-emerald-400"}>Alerta de Staleness</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              {insights.staleItems.length === 0 ? (
                <>Todos os precos de compra estao atualizados (&lt; 12h). Pode executar com confianca.</>
              ) : (
                <>
                  {insights.staleItems.length} item(s) com preco de compra desatualizado (&gt; 12h):
                  {" "}{insights.staleItems.map((i) => `${i.itemName} (${i.buyPriceAgeHours}h)`).join(", ")}.
                  {" "}Verificar preco atual no jogo antes de comprar.
                </>
              )}
            </p>
          </div>

          {/* Risk & trend alerts */}
          <div className={`rounded-lg border p-4 ${insights.highRiskItems.length > 0 || insights.downTrendItems.length > 0 ? "border-red-800/50 bg-red-950/20" : "border-emerald-800/40 bg-emerald-950/10"}`}>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
              <AlertTriangle className={`h-3.5 w-3.5 ${insights.highRiskItems.length > 0 || insights.downTrendItems.length > 0 ? "text-red-400" : "text-emerald-400"}`} />
              <span className={insights.highRiskItems.length > 0 || insights.downTrendItems.length > 0 ? "text-red-400" : "text-emerald-400"}>Risco e Tendencia</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              {insights.highRiskItems.length > 0 && (
                <>{insights.highRiskItems.length} item(s) com risco &ge; 70: {insights.highRiskItems.map((i) => i.itemName).join(", ")}.<br /></>
              )}
              {insights.downTrendItems.length > 0 && (
                <>{insights.downTrendItems.length} item(s) com tendencia BM em queda: {insights.downTrendItems.map((i) => i.itemName).join(", ")}.</>
              )}
              {insights.highRiskItems.length === 0 && insights.downTrendItems.length === 0 && (
                <>Sem alertas de risco. Todos os itens tem risco &lt; 70 e tendencia estavel ou em alta.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ============ EXECUTION NARRATIVE ============ */}
      {best && !loading && (
        <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/10 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-400">
            <Briefcase className="h-3.5 w-3.5" />
            Narrativa de Execucao
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{best.narrative}</p>
        </div>
      )}

      {/* ============ CITY RANKING TABLE ============ */}
      {data && !loading && data.cityPortfolios.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <div className="bg-slate-900/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ranking Completo por Cidade (EV decrescente)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/60 text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Cidade</th>
                  <th className="px-3 py-2 text-right">EV/viagem</th>
                  <th className="px-3 py-2 text-right">Lucro</th>
                  <th className="px-3 py-2 text-right">Perda</th>
                  <th className="px-3 py-2 text-right">ROI</th>
                  <th className="px-3 py-2 text-right">Kelly%</th>
                  <th className="px-3 py-2 text-right">Cap. rec.</th>
                  <th className="px-3 py-2 text-right">Viagens EV</th>
                  <th className="px-3 py-2 text-right">Risco ruina</th>
                  <th className="px-3 py-2 text-right">Carga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.cityPortfolios.map((cp, i) => (
                  <tr
                    key={cp.city}
                    onClick={() => setExpandedCity(expandedCity === cp.city ? null : cp.city)}
                    className={`cursor-pointer transition-colors hover:bg-slate-800/30 ${i === 0 ? "bg-emerald-950/20" : ""}`}
                  >
                    <td className="px-3 py-2 font-mono text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-slate-200">{cp.city}</span>
                      {i === 0 && <span className="ml-1.5 rounded bg-emerald-600 px-1 py-0.5 text-[9px] font-bold text-white">MELHOR EV</span>}
                    </td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${cp.expectedValue >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {cp.expectedValue >= 0 ? "+" : ""}{fmtSilver(cp.expectedValue)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-400">+{fmtSilver(cp.totalProfit)}</td>
                    <td className="px-3 py-2 text-right font-mono text-red-400">-{fmtSilver(cp.totalInvestment)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${cp.expectedROI >= 100 ? "text-emerald-400" : cp.expectedROI >= 50 ? "text-amber-400" : "text-slate-400"}`}>{cp.expectedROI.toFixed(0)}%</td>
                    <td className={`px-3 py-2 text-right font-mono ${cp.kellyFraction > 0 ? "text-sky-400" : "text-red-400"}`}>
                      {cp.kellyFraction > 0 ? `${(cp.kellyHalfFraction * 100).toFixed(0)}%` : "N/A"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-400">{fmtSilver(cp.recommendedCapital)}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-400">{cp.tripsToTargetEV > 0 ? cp.tripsToTargetEV : "∞"}</td>
                    <td className={`px-3 py-2 text-right font-mono ${cp.ruinProb10Trips < 0.001 ? "text-emerald-400" : cp.ruinProb10Trips < 0.01 ? "text-amber-400" : "text-red-400"}`}>
                      {(cp.ruinProb10Trips * 100).toFixed(2)}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-500">{cp.loadUtilization.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ EXPANDED CITY DETAILS ============ */}
      {data && !loading && expandedCity && (() => {
        const cp = data.cityPortfolios.find((c) => c.city === expandedCity);
        if (!cp) return null;
        return (
          <div className={`rounded-lg border p-4 ${cp === best ? "border-emerald-700/60 bg-emerald-950/10" : "border-slate-800 bg-slate-900/40"}`}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100">{cp.city}</span>
              <span className="text-xs text-slate-500">{cp.items.length} itens · densidade ordenada</span>
            </div>

            {/* Items table with profit density */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/80 text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Qtd</th>
                    <th className="px-3 py-2 text-right">Peso total</th>
                    <th className="px-3 py-2 text-right">Custo unit.</th>
                    <th className="px-3 py-2 text-right">Investimento</th>
                    <th className="px-3 py-2 text-right">Lucro/unid.</th>
                    <th className="px-3 py-2 text-right">Lucro total</th>
                    <th className="px-3 py-2 text-right">Densidade</th>
                    <th className="px-3 py-2 text-right">Margem</th>
                    <th className="px-3 py-2 text-right">Risco</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {cp.items.map((item, i) => {
                    const density = item.itemWeight > 0 ? item.profit / item.itemWeight : 0;
                    return (
                      <tr
                        key={`${item.itemId}-${item.quality}-${i}`}
                        onClick={() => onItemClick(item.itemId, item.quality)}
                        className="cursor-pointer transition-colors hover:bg-slate-800/30"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <ItemImage itemId={item.itemId} itemName={item.itemName} quality={item.quality} size={24} />
                            <div>
                              <p className="text-slate-200">{item.itemName}</p>
                              <p className="text-[10px] text-slate-500">
                                Q{item.quality} · vol {item.bmVolume7d}/dia · consist {item.bmConsistency}%
                                {item.bmPriceTrend === "down" && <span className="text-red-400"> · ↓ BM</span>}
                                {item.bmPriceTrend === "up" && <span className="text-emerald-400"> · ↑ BM</span>}
                                {(item.buyPriceAgeHours ?? 0) > 12 && <span className="text-amber-400"> · stale {item.buyPriceAgeHours}h</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-300">{item.quantity.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-500">{item.totalWeight.toFixed(1)} kg</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-400">{fmtSilver(item.buyPrice)}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-400">{fmtSilver(item.totalCost)}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-400">+{fmtSilver(item.profit)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400">+{fmtSilver(item.totalProfit)}</td>
                        <td className="px-3 py-2 text-right font-mono text-sky-400">{density.toFixed(0)}/kg</td>
                        <td className={`px-3 py-2 text-right font-mono ${item.margin >= 100 ? "text-emerald-400" : item.margin >= 50 ? "text-amber-400" : "text-slate-400"}`}>{item.margin.toFixed(0)}%</td>
                        <td className={`px-3 py-2 text-right font-mono ${item.riskScore < 40 ? "text-emerald-400" : item.riskScore < 70 ? "text-amber-400" : "text-red-400"}`}>{item.riskScore}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-slate-700 bg-slate-900/60 font-bold">
                  <tr>
                    <td className="px-3 py-2 text-slate-300">TOTAL</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">{cp.items.reduce((s, i) => s + i.quantity, 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-400">{cp.totalWeight.toFixed(1)} kg</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">{fmtSilver(cp.totalInvestment)}</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-400">+{fmtSilver(cp.totalProfit)}</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right font-mono text-slate-400">{cp.expectedROI.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-400">{cp.avgRiskScore}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ============ EMPTY STATE ============ */}
      {data && !loading && data.cityPortfolios.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center">
          <p className="text-sm text-slate-400">
            Nenhuma carteira viavel. Tente aumentar o capital ou relaxar os filtros (margem, consistencia, idade).
          </p>
        </div>
      )}
    </div>
  );
}
