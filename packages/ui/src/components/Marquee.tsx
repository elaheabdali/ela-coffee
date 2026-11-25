import { Bean, Leaf } from "lucide-react";
import { cn } from "../cn";

export interface MarqueeProps {
  /** Items shown in the ticker (flavour names in the reference). */
  items: string[];
  /**
   * Separator icon between items: the coffee bean, or the matcha leaf
   * (the reference uses a leaf in matcha mode).
   */
  separator?: "bean" | "leaf";
  /** Accessible label for the ticker region. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Flavour ticker (audit §4, rebuilt to the reference's structure in
 * fix batch 4): `ela-marquee`, 48s linear infinite, four identical
 * lists so the `translate 0 → -50%` loop is seamless (the track is
 * exactly two lists wide at -50%). Pauses under
 * `html[data-motion=paused]`, stops under `prefers-reduced-motion`,
 * and reverses direction in RTL (globals.css `[dir="rtl"]` rule).
 * Copies 2–4 are `aria-hidden` so screen readers hear each item once;
 * the page-level band (BrandMarquee) hides the whole ticker, since
 * the names also appear in the menu section.
 */
export function Marquee({ items, separator = "bean", ariaLabel, className }: MarqueeProps) {
  const SeparatorIcon = separator === "leaf" ? Leaf : Bean;
  return (
    <div aria-label={ariaLabel} className={cn("animate-ela-marquee flex w-max", className)}>
      {[0, 1, 2, 3].map((copy) => (
        <ul
          key={copy}
          aria-hidden={copy === 0 ? undefined : true}
          className="flex shrink-0 items-center"
        >
          {items.map((item) => (
            <li
              key={`${copy}-${item}`}
              className="flex items-center gap-6 pr-6 font-display text-2xl font-medium tracking-[-0.02em] whitespace-nowrap sm:text-3xl"
            >
              <span>{item}</span>
              <SeparatorIcon aria-hidden="true" className="size-5 text-espresso/45" />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
