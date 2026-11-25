import { cn } from "../cn";

export interface MarqueeProps {
  /** Items shown in the ticker (flavour names in the reference). */
  items: string[];
  /** Separator rendered between items. */
  separator?: string;
  /** Accessible label for the ticker region. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Flavour ticker (audit §4): `ela-marquee`, 48s linear infinite,
 * content duplicated so the `translate 0 → -50%` loop is seamless.
 * Pauses under `html[data-motion=paused]`, stops under
 * `prefers-reduced-motion`, and reverses direction in RTL
 * (globals.css `[dir="rtl"]` rule). The duplicate copy is `aria-hidden`
 * so screen readers hear each item once.
 */
export function Marquee({ items, separator = "•", ariaLabel, className }: MarqueeProps) {
  return (
    <div aria-label={ariaLabel} className={cn("overflow-hidden", className)}>
      <div className="animate-ela-marquee flex w-max items-center whitespace-nowrap font-display text-lg">
        {[0, 1].map((copy) => (
          <span key={copy} aria-hidden={copy === 1 || undefined} className="flex items-center">
            {items.map((item, i) => (
              <span key={`${item}-${i}`} className="flex items-center">
                <span className="px-4">{item}</span>
                <span aria-hidden="true" className="text-crema">
                  {separator}
                </span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
