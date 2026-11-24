import type { ReactNode } from "react";

export interface PillProps {
  children: ReactNode;
  className?: string;
}

/** Small uppercase label pill (eyebrows, tags, chips). */
export function Pill({ children, className = "" }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground ${className}`}
    >
      {children}
    </span>
  );
}
