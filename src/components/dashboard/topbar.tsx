"use client";

import { Activity, Clock, Globe } from "lucide-react";
import type { ServerRegion } from "@/lib/albion/types";
import { useDashboard } from "@/lib/store/dashboard-store";

const REGIONS: { id: ServerRegion; label: string }[] = [
  { id: "west", label: "Americas" },
  { id: "east", label: "Asia" },
  { id: "europe", label: "Europa" },
];

export function Topbar({
  region,
  onRegionChange,
}: {
  region: ServerRegion;
  onRegionChange: (r: ServerRegion) => void;
}) {
  const { state } = useDashboard();
  const lastRefresh = state.lastRefresh;
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Mobile brand */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-sky-700">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-sm font-semibold text-slate-100">Albion Market</span>
        </div>

        {/* Spacer for desktop — search is handled per-panel */}
        <div className="hidden lg:block lg:flex-1" />

        {/* Status + actions */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 text-xs text-slate-400 md:flex">
            {lastRefresh ? (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{new Date(lastRefresh).toLocaleTimeString()}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Online</span>
            </div>
          </div>

          {/* Region switcher */}
          <div className="hidden rounded-lg border border-slate-800 bg-slate-900/80 p-1 sm:flex">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => onRegionChange(r.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  region === r.id
                    ? "bg-sky-600/90 text-white shadow-sm shadow-sky-500/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Globe className="h-3 w-3" />
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
