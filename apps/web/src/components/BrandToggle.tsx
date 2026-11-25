"use client";

import { Coffee, Leaf } from "lucide-react";
import { useBrand } from "@/stores/brand";

export interface BrandToggleProps {
  coffeeLabel: string;
  matchaLabel: string;
  /**
   * `single` (default): one button showing the current brand — press
   * it to switch. Used in the hero header, the menu drawer and the
   * design-system catalog.
   *
   * `segmented`: both brands side by side as a segmented control, the
   * active one a cream pill on the dark surface — the reference's
   * scrolled-navbar toggle (audit §2: "Pressed state is a white pill
   * on dark"). Used in the scrolled header pill.
   */
  variant?: "single" | "segmented";
}

/**
 * Coffee / Matcha brand toggle, driven by the `useBrand` store (the
 * whole theme follows from the one `html[data-brand]` attribute).
 * `data-brand-switching` is set for 600 ms so globals.css can animate
 * the colour transition (.6s), matching the reference (audit §3.2 / §4).
 * The store also resets the flavour index and preloads the other
 * brand's images, so no tile renders as a black square (audit §8.4).
 */
export function BrandToggle({ coffeeLabel, matchaLabel, variant = "single" }: BrandToggleProps) {
  const { brand, setBrand } = useBrand();

  if (variant === "segmented") {
    const segment = (active: boolean) =>
      active
        ? "bg-cream text-espresso"
        : "text-cream hover:bg-cream/10";
    return (
      <div role="group" className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => setBrand("ela")}
          aria-pressed={brand === "ela"}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${segment(brand === "ela")}`}
        >
          <Coffee size={16} aria-hidden="true" />
          {coffeeLabel}
        </button>
        <button
          type="button"
          onClick={() => setBrand("midori")}
          aria-pressed={brand === "midori"}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${segment(brand === "midori")}`}
        >
          <Leaf size={16} aria-hidden="true" />
          {matchaLabel}
        </button>
      </div>
    );
  }

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
