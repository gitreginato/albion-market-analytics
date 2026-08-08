"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  DollarSign,
  LineChart,
  ArrowLeftRight,
  Coins,
  Menu,
  X,
  TrendingUp,
  User,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

export type Tab = "opportunities" | "prices" | "history" | "arbitrage" | "gold" | "items";

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: "opportunities", label: "Oportunidades", icon: LayoutDashboard },
  { id: "items", label: "Itens", icon: Package },
  { id: "prices", label: "Preços", icon: DollarSign },
  { id: "history", label: "Histórico", icon: LineChart },
  { id: "arbitrage", label: "Arbitragem", icon: ArrowLeftRight },
  { id: "gold", label: "Ouro", icon: Coins },
];

export function Sidebar({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-20 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-300 shadow-lg lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed bottom-4 left-4 z-40 hidden h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 lg:flex"
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-zinc-800/60 bg-gradient-to-b from-zinc-950 to-zinc-900/95 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "w-20 lg:translate-x-0" : "w-64 lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800/60 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-50">Albion Market</h1>
              <p className="text-[10px] text-zinc-500">Admin Dashboard</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile */}
        {!collapsed && (
          <div className="border-b border-zinc-800/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800">
                <User className="h-5 w-5 text-zinc-300" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <h5 className="truncate text-sm font-medium text-zinc-200">Mercador</h5>
                <span className="text-xs text-zinc-500">Premium</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav category */}
        {!collapsed && (
          <div className="px-5 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Navegação</p>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-3 py-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.id);
                  setMobileOpen(false);
                }}
                className={`
                  group relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all
                  ${active
                    ? "bg-gradient-to-r from-emerald-500/15 to-transparent text-emerald-300"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
                )}
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />
                  {collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500/15 px-1.5 text-[10px] font-semibold text-emerald-400">
                    {item.badge}
                  </span>
                )}
                {collapsed && active && (
                  <span className="absolute left-12 rounded-md bg-emerald-500 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer status */}
        <div className="border-t border-zinc-800/60 px-5 py-4">
          <div className={`flex items-center gap-2 text-xs text-zinc-600 ${collapsed ? "justify-center" : ""}`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {!collapsed && <span>Dados em tempo real</span>}
          </div>
        </div>
      </aside>
    </>
  );
}
