import type { CSSProperties, JSX } from "react";
import { cn } from "../cn";

export type WordRevealAs = "h1" | "h2" | "h3" | "p" | "span";
export type WordRevealVariant = "default" | "soft";

export interface WordRevealProps {
  /** Heading text — split on spaces, one word per animated span. */
  text: string;
  as?: WordRevealAs;
  /**
   * `soft` uses the `.ela-words-soft` variant (blur 10px, translate
   * .45em, 1.1s — audit §4) instead of the masked word-up.
   */
  variant?: WordRevealVariant;
  /** Extra delay before the first word, in milliseconds. */
  delayMs?: number;
  className?: string;
}

/**
 * Word-by-word heading reveal (audit §4): each word sits in a
 * `.ela-word` (overflow hidden) with a `.ela-word-inner` that animates
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
  const isHeading = as === "h1" || as === "h2" || as === "h3";

  // The words live in separate spans with no whitespace text nodes
  // between them, so without this the accessible name would collapse
  // to e.g. "Sixicedlattes". `aria-label` keeps the spoken heading exact
  // — but aria-label is prohibited on <p>/<span> (axe
  // aria-prohibited-attr), so for multi-word non-headings the words are
  // hidden from assistive tech and the full text is provided once,
  // visually hidden, instead. A single word has no boundary to lose,
  // so it needs no duplication.
  const wordSpans = words.map((word, i) => (
    <span key={`${word}-${i}`} className="ela-word me-[0.25em] last:me-0">
      <span className="ela-word-inner" style={{ "--i": i } as CSSProperties}>
        {word}
      </span>
    </span>
  ));
  const needsSrText = !isHeading && words.length > 1;
  return (
    <Tag
      style={style}
      aria-label={isHeading ? text : undefined}
      className={cn(variant === "soft" && "ela-words-soft", className)}
    >
      {needsSrText ? (
        <>
          <span aria-hidden="true">{wordSpans}</span>
          <span className="sr-only">{text}</span>
        </>
      ) : (
        wordSpans
      )}
    </Tag>
  );
}
