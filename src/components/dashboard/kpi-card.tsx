"use client";

import type { ReactNode } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: { value: number; label: string; positive: boolean };
  icon: ReactNode;
  iconClassName?: string;
  sparklineData?: number[];
  footer?: ReactNode;
}

export function KpiCard({
  title,
  value,
  change,
  icon,
  iconClassName,
  sparklineData,
  footer,
}: KpiCardProps) {
  const sparkline = sparklineData?.map((v, i) => ({ i, v })) ?? [];
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-5 shadow-sm transition-all hover:border-zinc-700/60">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-zinc-100">{value}</span>
            {change && (
              <span className={`text-xs font-medium ${change.positive ? "text-emerald-400" : "text-rose-400"}`}>
                {change.positive ? "+" : ""}{change.value}% {change.label}
              </span>
            )}
          </div>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClassName ?? "bg-zinc-800 text-zinc-400"}`}>
          {icon}
        </div>
      </div>
      {sparkline.length > 1 && (
        <div className="mt-3 h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={change?.positive ?? true ? "#10b981" : "#f43f5e"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {footer && <div className="mt-3 border-t border-zinc-800/60 pt-3">{footer}</div>}
    </div>
  );
}
