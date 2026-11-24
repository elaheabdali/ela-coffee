import type { CSSProperties, JSX } from "react";
import { cn } from "../cn";

export type WordRevealAs = "h1" | "h2" | "h3" | "p" | "span";
export type WordRevealVariant = "default" | "soft";

export interface WordRevealProps {
  /** Heading text — split on spaces, one word per animated span. */
  text: string;
  as?: WordRevealAs;
  /**
   * `soft` uses the `.kuro-words-soft` variant (blur 10px, translate
   * .45em, 1.1s — audit §4) instead of the masked word-up.
   */
  variant?: WordRevealVariant;
  /** Extra delay before the first word, in milliseconds. */
  delayMs?: number;
  className?: string;
}

/**
 * Word-by-word heading reveal (audit §4): each word sits in a
 * `.kuro-word` (overflow hidden) with a `.kuro-word-inner` that animates
 * `translate 110% → 0` in .95s, staggered 65 ms per word via `--i`.
 * The animation itself lives in `globals.css`; this component only
 * provides the markup and the `--i` / `--reveal-delay` variables.
 */
export function WordReveal({
  text,
  as = "h2",
  variant = "default",
  delayMs = 0,
  className,
}: WordRevealProps) {
  const words = text.split(" ").filter((word) => word.length > 0);
  const Tag = as as keyof JSX.IntrinsicElements;
  const style = { "--reveal-delay": `${delayMs}ms` } as CSSProperties;

  // The words live in separate spans with no whitespace text nodes
  // between them, so without this the accessible name would collapse
  // to e.g. "Sixicedlattes". `aria-label` keeps the spoken heading exact.
  return (
    <Tag
      style={style}
      aria-label={text}
      className={cn(variant === "soft" && "kuro-words-soft", className)}
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="kuro-word me-[0.25em] last:me-0">
          <span className="kuro-word-inner" style={{ "--i": i } as CSSProperties}>
            {word}
          </span>
        </span>
      ))}
    </Tag>
  );
}
