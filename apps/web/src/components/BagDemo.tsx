"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@ela-coffee/ui";

export interface BagDemoProps {
  addLabel: string;
}

/**
 * Placeholder bag interaction for the Phase 2 demo page: each press
 * bumps the count badge (`kuro-bump`, .48s — audit §4). The real bag
 * (Zustand + localStorage) lands with the menu in Phase 4.
 */
export function BagDemo({ addLabel }: BagDemoProps) {
  const [count, setCount] = useState(0);

  return (
    <span className="relative inline-flex items-center gap-3">
      <Button onClick={() => setCount((c) => c + 1)}>
        <ShoppingBag size={18} />
        {addLabel}
      </Button>
      {count > 0 && (
        <span
          key={count}
          className="animate-kuro-bump inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground"
          aria-label={`${count}`}
        >
          {count}
        </span>
      )}
    </span>
  );
}
