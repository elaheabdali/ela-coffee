import type { ReactNode } from "react";
import { cn } from "../cn";

export type PillVariant = "glass" | "label";

export interface PillProps {
  children: ReactNode;
  /**
   * `glass` (default) is the reference's header / hero pill:
   * `bg-espresso/45 backdrop-blur-md`, border `cream/10` (audit §3.4).
   * `label` is the small uppercase tag used for eyebrows and chips.
   */
  variant?: PillVariant;
  className?: string;
}

const VARIANTS: Record<PillVariant, string> = {
  glass:
    "rounded-full bg-espresso/45 px-4 py-2 text-sm font-medium text-cream ring-1 ring-cream/10 backdrop-blur-md",
  label:
    "rounded-full bg-secondary px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
};

export function Pill({ children, variant = "glass", className }: PillProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
