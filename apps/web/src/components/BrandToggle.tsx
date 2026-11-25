"use client";

import { Coffee, Leaf } from "lucide-react";
import { useBrand } from "@/stores/brand";

export interface BrandToggleProps {
  coffeeLabel: string;
  matchaLabel: string;
  /**
   * `single` (default): one labelled pill showing the current brand —
   * press it to switch. Used in the menu drawer and the design-system
   * catalog (our own surfaces, not the reference navbar).
   *
   * `segmented`: both brands side by side, the active one a cream pill
   * on the dark surface — the reference's navbar toggle (audit §2).
   * `groupClassName` carries the responsive visibility + surface,
   * which differ per navbar state (scrolled pill: `hidden
   * border-transparent bg-cream/[0.06] backdrop-blur-none
   * sm:inline-flex`; hero: `hidden border-cream/10 bg-espresso/45
   * backdrop-blur-md lg:inline-flex`); `groupLabel` is the group
   * accessible name.
   *
   * `icon`: a single icon-only button showing the OTHER brand's icon —
   * the reference's mobile brand switch (below `sm` in the scrolled
   * pill, below `lg` in the hero). Its accessible name is the
   * `switchTo*Label` of the brand it switches TO, so it never collides
   * with the segmented buttons' "Coffee"/"Matcha" names. `className`
   * carries the reference button classes incl. responsive visibility.
   */
  variant?: "single" | "segmented" | "icon";
  groupClassName?: string;
  groupLabel?: string;
  switchToCoffeeLabel?: string;
  switchToMatchaLabel?: string;
  className?: string;
}

/** Focus ring shared by every toggle button (reference: crema outline). */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema";

/**
 * Coffee / Matcha brand toggle, driven by the `useBrand` store (the
 * whole theme follows from the one `html[data-brand]` attribute).
 * `data-brand-switching` is set for 600 ms so globals.css can animate
 * the colour transition (.6s), matching the reference (audit §3.2 / §4).
 * The store also resets the flavour index and preloads the other
 * brand's images, so no tile renders as a black square (audit §8.4).
 */
export function BrandToggle({
  coffeeLabel,
  matchaLabel,
  variant = "single",
  groupClassName = "",
  groupLabel = "Menu",
  switchToCoffeeLabel,
  switchToMatchaLabel,
  className = "",
}: BrandToggleProps) {
  const { brand, setBrand } = useBrand();

  if (variant === "segmented") {
    const segment = (active: boolean) =>
      active ? "bg-cream text-espresso" : "text-cream/70 hover:text-cream";
    return (
      <div
        role="group"
        aria-label={groupLabel}
        className={`items-center gap-1 rounded-full border p-1 ${groupClassName}`}
      >
        <button
          type="button"
          onClick={() => setBrand("ela")}
          aria-pressed={brand === "ela"}
          className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${FOCUS} ${segment(brand === "ela")}`}
        >
          <Coffee size={16} aria-hidden="true" />
          {coffeeLabel}
        </button>
        <button
          type="button"
          onClick={() => setBrand("midori")}
          aria-pressed={brand === "midori"}
          className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${FOCUS} ${segment(brand === "midori")}`}
        >
          <Leaf size={16} aria-hidden="true" />
          {matchaLabel}
        </button>
      </div>
    );
  }

  if (variant === "icon") {
    // The icon shows the brand the button switches TO (reference:
    // while matcha is active the button shows the coffee icon and
    // reads "Switch to coffee").
    const other = brand === "ela" ? "midori" : "ela";
    const label =
      other === "ela"
        ? (switchToCoffeeLabel ?? coffeeLabel)
        : (switchToMatchaLabel ?? matchaLabel);
    return (
      <button
        type="button"
        onClick={() => setBrand(other)}
        aria-label={label}
        title={label}
        className={className}
      >
        {other === "ela" ? (
          <Coffee size={16} aria-hidden="true" />
        ) : (
          <Leaf size={16} aria-hidden="true" />
        )}
      </button>
    );
  }

  const toggle = () => setBrand(brand === "ela" ? "midori" : "ela");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={brand === "midori"}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium ring-1 ring-border transition-[background-color] hover:bg-accent ${FOCUS}`}
    >
      {brand === "ela" ? <Coffee size={16} /> : <Leaf size={16} />}
      {brand === "ela" ? coffeeLabel : matchaLabel}
    </button>
  );
}
