import type { ReactNode } from "react";
import { cn } from "../cn";

export type EyebrowSize = "sm" | "md";

export interface EyebrowProps {
  children: ReactNode;
  /** `sm` — .625rem / .2em; `md` — .6875rem / .18em (audit §3.3). */
  size?: EyebrowSize;
  className?: string;
}

const SIZES: Record<EyebrowSize, string> = {
  sm: "text-[0.625rem] tracking-[0.2em]",
  md: "text-[0.6875rem] tracking-[0.18em]",
};

/**
 * Small uppercase section label (OUR STORY, THE MENU, …).
 * Persian copy uses no letter-spacing on the glyphs themselves — the
 * tracking here is the reference's Latin eyebrow style; in `fa` the
 * text stays uppercase-free because Persian has no case.
 */
export function Eyebrow({ children, size = "md", className }: EyebrowProps) {
  return (
    <span className={cn("font-semibold uppercase text-muted-foreground", SIZES[size], className)}>
      {children}
    </span>
  );
}
