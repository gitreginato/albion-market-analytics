// Shared constants for Albion Online domain.

export const QUALITY_LABELS = ["", "Normal", "Good", "Outstanding", "Excellent", "Masterpiece"] as const;

export const QUALITY_COLORS: Record<number, string> = {
  1: "bg-zinc-500/20 text-zinc-300 border-zinc-600/50",
  2: "bg-green-500/20 text-green-300 border-green-600/50",
  3: "bg-blue-500/20 text-blue-300 border-blue-600/50",
  4: "bg-purple-500/20 text-purple-300 border-purple-600/50",
  5: "bg-amber-500/20 text-amber-300 border-amber-600/50",
};
