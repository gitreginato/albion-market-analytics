"use client";

import { useState } from "react";

interface ItemImageProps {
  itemId: string;
  itemName?: string;
  size?: number;
  quality?: number;
  className?: string;
}

const QUALITY_BORDER: Record<number, string> = {
  1: "border-zinc-600",
  2: "border-green-600",
  3: "border-blue-600",
  4: "border-purple-600",
  5: "border-amber-500",
};

/**
 * Renders an item icon from the Albion Online render CDN.
 * Falls back to a placeholder with the item ID initial on error.
 */
export function ItemImage({ itemId, itemName, size = 32, quality, className = "" }: ItemImageProps) {
  const [errored, setErrored] = useState(false);
  const borderClass = quality ? QUALITY_BORDER[quality] ?? "border-zinc-600" : "border-zinc-700";

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center rounded border ${borderClass} bg-zinc-800 text-xs font-mono text-zinc-500 ${className}`}
        style={{ width: size, height: size }}
        title={itemName ?? itemId}
      >
        {itemId.charAt(0)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://render.albiononline.com/v1/item/${itemId}.png?quality=${quality ?? 1}`}
      alt={itemName ?? itemId}
      title={itemName ?? itemId}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`rounded border ${borderClass} bg-zinc-900 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
