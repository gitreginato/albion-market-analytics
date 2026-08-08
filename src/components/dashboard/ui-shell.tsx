// Corporate shell components: header, footer, skeletons, and shared layout primitives.

import React from "react";
import { BarChart3, Bell, Clock, Globe, Search, Settings, Shield, TrendingUp, User } from "lucide-react";
import type { ServerRegion } from "@/lib/albion/types";

export function Header({
  region,
  onRegionChange,
  lastRefresh,
}: {
  region: ServerRegion;
  onRegionChange: (r: ServerRegion) => void;
  lastRefresh: number | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100">Albion Market Analytics</h1>
            <p className="text-[10px] text-slate-500">Professional trading intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastRefresh && (
            <div className="hidden items-center gap-1.5 text-xs text-slate-400 md:flex">
              <Clock className="h-3.5 w-3.5" />
              <span>Atualizado {new Date(lastRefresh).toLocaleTimeString()}</span>
            </div>
          )}

          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1">
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={region}
              onChange={(e) => onRegionChange(e.target.value as ServerRegion)}
              className="ml-2 bg-transparent text-xs font-medium text-slate-300 outline-none"
            >
              <option value="west">Américas</option>
              <option value="east">Ásia</option>
              <option value="europe">Europa</option>
            </select>
          </div>

          <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
            <Bell className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
            <Settings className="h-4 w-4" />
          </button>
          <div className="hidden h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300 sm:flex">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-4 py-4 lg:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          <span>Dados via Albion Online Data Project</span>
        </div>
        <div className="flex gap-4">
          <span>v0.4.0</span>
          <span className="text-slate-700">|</span>
          <span>Status: Online</span>
        </div>
      </div>
    </footer>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const variants = {
    default: "bg-slate-800 text-slate-300",
    success: "bg-emerald-500/15 text-emerald-400",
    warning: "bg-amber-500/15 text-amber-400",
    danger: "bg-rose-500/15 text-rose-400",
    info: "bg-sky-500/15 text-sky-400",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60">
        <Search className="h-5 w-5 text-slate-500" />
      </div>
      <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/60" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-slate-800/60" />
    </div>
  );
}

export function ShellStatCard({
  label,
  value,
  subvalue,
  variant = "default",
  icon: Icon,
}: {
  label: string;
  value: string;
  subvalue?: string;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const variants = {
    default: "border-slate-800 bg-slate-900/40",
    success: "border-emerald-800/60 bg-emerald-950/20",
    danger: "border-rose-800/60 bg-rose-950/20",
    warning: "border-amber-800/60 bg-amber-950/20",
    info: "border-sky-800/60 bg-sky-950/20",
  };
  const iconColors = {
    default: "text-slate-500",
    success: "text-emerald-400",
    danger: "text-rose-400",
    warning: "text-amber-400",
    info: "text-sky-400",
  };
  return (
    <div className={`rounded-xl border p-4 ${variants[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${iconColors[variant]}`} />}
      </div>
      <p className={`mt-2 font-mono text-lg font-semibold ${variant === "default" ? "text-slate-200" : iconColors[variant]}`}>
        {value}
      </p>
      {subvalue && <p className="mt-1 text-xs text-slate-500">{subvalue}</p>}
    </div>
  );
}

export function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
        active
          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
          : "border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export function ExportButton({ onClick, label = "Export CSV" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
    >
      <TrendingUp className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
