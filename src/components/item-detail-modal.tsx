"use client";

import { useEffect, useState } from "react";
import { X, TrendingUp, Skull, Package, Activity, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemImage } from "@/components/item-image";
import { fmtSilver as fmt, fmtFull } from "@/lib/utils/format";

interface CityPrice {
  city: string;
  sellPriceMin: number;
  sellPriceMinDate: string;
  buyPriceMax: number;
  buyPriceMaxDate: string;
  ageHours: number | null;
}

interface ItemDetails {
  itemId: string;
  itemName: string | null;
  quality: number;
  cityPrices: CityPrice[];
  bestBuy: { city: string; sellPriceMin: number } | null;
  bestSell: { city: string; buyPriceMax: number } | null;
  bmPrice: { price: number; date: string } | null;
  bmHistory: { item_count: number; avg_price: number; timestamp: string }[];
  bmStats: {
    bmVolume7d: number;
    bmAvgPrice7d: number;
    bmVolume30d: number;
    bmAvgPrice30d: number;
    bmConsistency: number;
  };
  arbitrageOps: { sellCity: string; sellPrice: number; buyPrice: number; profit: number; margin: number }[];
  bmOpportunity: { buyCity: string; buyPrice: number; bmPrice: number; profit: number; margin: number } | null;
}

function ageColor(hours: number | null): string {
  if (hours === null) return "text-zinc-600";
  if (hours <= 6) return "text-emerald-400";
  if (hours <= 24) return "text-amber-400";
  return "text-red-400";
}

const CITIES = ["Bridgewatch", "Martlock", "Thetford", "Fort Sterling", "Lymhurst", "Caerleon", "Brecilien", "Black Market"];

export function ItemDetailModal({
  itemId,
  quality,
  onClose,
}: {
  itemId: string;
  quality: number;
  onClose: () => void;
}) {
  const [data, setData] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // Reset state for new fetch via callback (not synchronous setState in effect).
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/item-details?item_id=${encodeURIComponent(itemId)}&quality=${quality}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = (await res.json()) as ItemDetails;
        if (!cancelled) {
          setData(d);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [itemId, quality]);

  // Close on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <Card
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-zinc-900 p-0 ring-1 ring-zinc-700"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <ItemImage itemId={itemId} itemName={data?.itemName ?? itemId} quality={quality} size={48} />
            <div>
              <h2 className="text-base font-semibold text-zinc-100">{data?.itemName ?? itemId}</h2>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge variant="outline" className="border-zinc-600 px-1.5 py-0 text-[10px] text-zinc-300">
                  Q{quality}
                </Badge>
                <span className="text-xs text-zinc-500">{itemId}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-4">
          {loading && (
            <div className="py-12 text-center text-sm text-zinc-500">Carregando dados...</div>
          )}
          {error && (
            <div className="py-12 text-center text-sm text-red-400">Erro: {error}</div>
          )}
          {data && !loading && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {data.bestBuy && (
                  <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Melhor compra</p>
                    <p className="font-mono text-sm text-emerald-400">{fmt(data.bestBuy.sellPriceMin)}</p>
                    <p className="text-xs text-zinc-500">{data.bestBuy.city}</p>
                  </div>
                )}
                {data.bmPrice && (
                  <div className="rounded-lg border border-red-800/50 bg-red-950/20 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">BM paga</p>
                    <p className="font-mono text-sm text-red-400">{fmt(data.bmPrice.price)}</p>
                    <p className="text-xs text-zinc-500">Black Market</p>
                  </div>
                )}
                {data.bmOpportunity && (
                  <div className="rounded-lg border border-sky-800/50 bg-sky-950/20 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Lucro BM</p>
                    <p className="font-mono text-sm text-sky-400">+{fmt(data.bmOpportunity.profit)}</p>
                    <p className="text-xs text-zinc-500">{data.bmOpportunity.margin}% margem</p>
                  </div>
                )}
                {data.bmStats && (
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Volume BM/dia</p>
                    <p className="font-mono text-sm text-zinc-300">{data.bmStats.bmVolume7d}</p>
                    <p className="text-xs text-zinc-500">consist. {data.bmStats.bmConsistency}%</p>
                  </div>
                )}
              </div>

              {/* City prices table */}
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Precos por cidade
                </h3>
                <div className="overflow-hidden rounded-lg border border-zinc-800">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-800/50 text-zinc-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Cidade</th>
                        <th className="px-3 py-2 text-right">Sell Min</th>
                        <th className="px-3 py-2 text-right">Buy Max</th>
                        <th className="px-3 py-2 text-right">Idade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {CITIES.map((city) => {
                        const p = data.cityPrices.find((cp) => cp.city === city);
                        return (
                          <tr key={city} className={city === "Black Market" ? "bg-red-950/10" : ""}>
                            <td className="px-3 py-2 text-zinc-300">
                              {city === "Black Market" ? (
                                <span className="flex items-center gap-1 text-red-400">
                                  <Skull className="h-3 w-3" /> BM
                                </span>
                              ) : city}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-zinc-300">
                              {p && p.sellPriceMin > 0 ? fmtFull(p.sellPriceMin) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-zinc-300">
                              {p && p.buyPriceMax > 0 ? fmtFull(p.buyPriceMax) : "—"}
                            </td>
                            <td className={`px-3 py-2 text-right font-mono ${ageColor(p?.ageHours ?? null)}`}>
                              {p?.ageHours !== null && p?.ageHours !== undefined ? `${p.ageHours}h` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BM history mini-chart */}
              {data.bmHistory.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Historico Black Market (30 dias)
                  </h3>
                  <BmHistoryChart history={data.bmHistory} />
                </div>
              )}

              {/* Arbitrage opportunities */}
              {data.arbitrageOps.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Oportunidades de arbitragem
                  </h3>
                  <div className="space-y-1.5">
                    {data.arbitrageOps.slice(0, 5).map((op) => (
                      <div
                        key={op.sellCity}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 text-zinc-400">
                          <span>{data.bestBuy?.city}</span>
                          <ArrowRight className="h-3 w-3 text-zinc-600" />
                          <span>{op.sellCity}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-zinc-500">{fmt(op.buyPrice)} → {fmt(op.sellPrice)}</span>
                          <span className="font-mono font-bold text-emerald-400">+{fmt(op.profit)}</span>
                          <span className="text-zinc-500">{op.margin}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BM stats */}
              {data.bmStats && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard icon={Package} label="Vol 7d" value={`${data.bmStats.bmVolume7d}/dia`} />
                  <StatCard icon={Package} label="Vol 30d" value={`${data.bmStats.bmVolume30d}/dia`} />
                  <StatCard icon={Activity} label="Consistência" value={`${data.bmStats.bmConsistency}%`} />
                  <StatCard icon={TrendingUp} label="Avg preço 7d" value={fmt(data.bmStats.bmAvgPrice7d)} />
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 font-mono text-sm text-zinc-300">{value}</p>
    </div>
  );
}

function BmHistoryChart({ history }: { history: { item_count: number; avg_price: number; timestamp: string }[] }) {
  const data = history.slice(-30);
  if (data.length === 0) return null;
  const prices = data.map((d) => d.avg_price);
  const volumes = data.map((d) => d.item_count);
  const maxPrice = Math.max(...prices, 1);
  const maxVolume = Math.max(...volumes, 1);
  const width = 100;
  const priceHeight = 60;
  const volumeHeight = 30;

  // Build SVG polyline for prices.
  const pricePoints = data
    .map((d, i) => `${(i / (data.length - 1)) * width},${priceHeight - (d.avg_price / maxPrice) * priceHeight}`)
    .join(" ");

  // Build SVG bars for volumes.
  const volumeBars = data.map((d, i) => {
    const barWidth = width / data.length - 0.5;
    const barHeight = (d.item_count / maxVolume) * volumeHeight;
    const x = (i / data.length) * width;
    const y = volumeHeight - barHeight;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="rgb(82 82 91 / 0.5)" />`;
  }).join("");

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/20 p-3">
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>Preco (silver)</span>
        <span>Volume (unid/dia)</span>
      </div>
      <svg viewBox={`0 0 ${width} ${priceHeight + volumeHeight}`} className="mt-2 w-full" preserveAspectRatio="none">
        {/* Volume bars (bottom) */}
        <g transform={`translate(0, ${priceHeight})`}>
          <g dangerouslySetInnerHTML={{ __html: volumeBars }} />
        </g>
        {/* Price line (top) */}
        <polyline
          points={pricePoints}
          fill="none"
          stroke="rgb(52 211 153)"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
        <span>{new Date(data[0].timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
        <span>{new Date(data[data.length - 1].timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
      </div>
    </div>
  );
}
