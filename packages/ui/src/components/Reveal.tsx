"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export type RevealVariant = "fade-up" | "fade" | "image";

export interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  /** Extra delay before the reveal animation, in milliseconds. */
  delayMs?: number;
  className?: string;
}

/**
 * Scroll reveal, matching the reference's `data-reveal` / `data-revealed`
 * system (audit §4) with one deliberate difference: the `data-reveal`
 * attribute is only added from the effect, so without JavaScript — or if
 * the IntersectionObserver never fires — the content stays visible instead
 * of being stuck at opacity 0 (audit defect §8.7). If the browser has no
 * IntersectionObserver, content is revealed immediately.
 *
 * The animation itself lives in `globals.css` (`ela-reveal-*` keyframes)
 * and honours `--reveal-delay`.
 */
export function Reveal({
  children,
  variant = "fade-up",
  delayMs = 0,
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute("data-reveal", variant);
    if (typeof IntersectionObserver === "undefined") {
      // No observer (old browser / jsdom): reveal immediately so content
      // is never stuck hidden.
      el.setAttribute("data-revealed", "");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.setAttribute("data-revealed", "");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [variant]);

  const style = {
    "--reveal-delay": `${delayMs}ms`,
  } as CSSProperties;

  // `data-revealed` is set imperatively by the effect above (not as a
  // React prop), so the attribute is never rendered by SSR — without JS
  // the element has no `data-reveal` and stays visible.
  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
