"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { AppFooter } from "./app-footer";
import type { Tab } from "./sidebar";
import type { ServerRegion } from "@/lib/albion/types";

export function AppShell({
  children,
  tab,
  onTabChange,
  region,
  onRegionChange,
}: {
  children: ReactNode;
  tab: Tab;
  onTabChange: (t: Tab) => void;
  region: ServerRegion;
  onRegionChange: (r: ServerRegion) => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <Sidebar tab={tab} onChange={onTabChange} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar region={region} onRegionChange={onRegionChange} />
          <main className="flex-1 p-4 lg:p-6">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
