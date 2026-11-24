"use client";

import { useState } from "react";
import { Coffee, Leaf } from "lucide-react";

export interface BrandToggleProps {
  coffeeLabel: string;
  matchaLabel: string;
}

/**
 * Coffee / Matcha brand toggle. Switches `html[data-brand]` between
 * `kuro` and `midori`; the whole theme (tokens, copy, prices, images)
 * follows from that one attribute. `data-brand-switching` is set for
 * 600 ms so globals.css can animate the colour transition (.6s),
 * matching the reference (audit §3.2 / §4).
 */
export function BrandToggle({ coffeeLabel, matchaLabel }: BrandToggleProps) {
  const [brand, setBrand] = useState<"kuro" | "midori">("kuro");

  const toggle = () => {
    const next = brand === "kuro" ? "midori" : "kuro";
    const root = document.documentElement;
    root.setAttribute("data-brand-switching", "");
    root.setAttribute("data-brand", next);
    setBrand(next);
    window.setTimeout(() => root.removeAttribute("data-brand-switching"), 600);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={brand === "midori"}
      className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium ring-1 ring-border transition-[background-color] hover:bg-accent"
    >
      {brand === "kuro" ? <Coffee size={16} /> : <Leaf size={16} />}
      {brand === "kuro" ? coffeeLabel : matchaLabel}
    </button>
  );
}
