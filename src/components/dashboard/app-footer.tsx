"use client";

export function AppFooter() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950/40 py-5">
      <div className="flex flex-col items-center justify-between gap-2 px-4 text-xs text-zinc-600 sm:flex-row lg:px-6">
        <span>Dados: Albion Online Data Project · Não afiliado à Sandbox Interactive.</span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistema operacional</span>
        </div>
      </div>
    </footer>
  );
}
