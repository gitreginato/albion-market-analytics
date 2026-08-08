"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

export const LazyPortfolioPanel = dynamic(
  () => import("@/components/dashboard/portfolio-panel").then((m) => ({ default: m.PortfolioPanel })),
  { ssr: false, loading: () => <PanelSkeleton /> },
);

export const LazyProjectionsPanel = dynamic(
  () => import("@/components/dashboard/projections-panel").then((m) => ({ default: m.ProjectionsPanel })),
  { ssr: false, loading: () => <PanelSkeleton /> },
);

function PanelSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-800/60" />
        ))}
      </div>
    </div>
  );
}

export type PortfolioPanelProps = ComponentProps<typeof LazyPortfolioPanel>;
export type ProjectionsPanelProps = ComponentProps<typeof LazyProjectionsPanel>;
