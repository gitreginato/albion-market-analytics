// Shared formatting utilities for silver values, profit colors, and margin colors.
// Used across dashboard components, opp-cards, and item-detail-modal.

// Format large silver values: 1234 -> "1.2k", 1234567 -> "1.23M"
export function fmtSilver(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

// Full number with thousand separators (pt-BR locale)
export function fmtFull(v: number): string {
  return v.toLocaleString("pt-BR");
}

// Color-code profit: green for high, yellow for medium, zinc for low
export function profitColor(profit: number): string {
  if (profit >= 1_000_000) return "text-emerald-400";
  if (profit >= 100_000) return "text-emerald-500";
  if (profit >= 10_000) return "text-lime-500";
  if (profit > 0) return "text-zinc-300";
  return "text-zinc-500";
}

// Color-code margin percentage
export function marginColor(margin: number): string {
  if (margin >= 200) return "text-emerald-400";
  if (margin >= 50) return "text-lime-500";
  if (margin >= 20) return "text-yellow-500";
  if (margin > 0) return "text-zinc-300";
  return "text-zinc-500";
}
