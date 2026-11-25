"use client";

import { Coffee, Leaf } from "lucide-react";
import { useBrand } from "@/stores/brand";

export interface BrandToggleProps {
  coffeeLabel: string;
  matchaLabel: string;
}

/**
 * Coffee / Matcha brand toggle, driven by the `useBrand` store (the
 * whole theme follows from the one `html[data-brand]` attribute).
 * `data-brand-switching` is set for 600 ms so globals.css can animate
 * the colour transition (.6s), matching the reference (audit §3.2 / §4).
 * The store also resets the flavour index and preloads the other
 * brand's images, so no tile renders as a black square (audit §8.4).
 */
export function BrandToggle({ coffeeLabel, matchaLabel }: BrandToggleProps) {
  const { brand, setBrand } = useBrand();
  const toggle = () => setBrand(brand === "ela" ? "midori" : "ela");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={brand === "midori"}
      className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium ring-1 ring-border transition-[background-color] hover:bg-accent"
    >
      {brand === "ela" ? <Coffee size={16} /> : <Leaf size={16} />}
      {brand === "ela" ? coffeeLabel : matchaLabel}
    </button>
  );
}
