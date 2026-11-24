import { formatToman } from "@ela-coffee/i18n";
import type { Locale } from "@ela-coffee/i18n";
import { cn } from "../cn";

export type PriceSize = "sm" | "md" | "lg";

export interface PriceProps {
  /** Amount in Toman (integer). Placeholder prices until the client confirms real ones. */
  amountToman: number;
  /** Optional struck-through original price (e.g. a discount). */
  originalPriceToman?: number;
  locale?: Locale;
  size?: PriceSize;
  className?: string;
}

const SIZES: Record<PriceSize, string> = {
  sm: "text-sm",
  md: "text-base font-semibold",
  lg: "font-display text-2xl font-bold",
};

/**
 * Toman price, formatted with Persian digits in `fa` and Latin digits
 * in `en` (packages/i18n `formatToman`).
 */
export function Price({
  amountToman,
  originalPriceToman,
  locale = "fa",
  size = "md",
  className,
}: PriceProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", SIZES[size], className)}>
      <span>{formatToman(amountToman, locale)}</span>
      {originalPriceToman !== undefined ? (
        <s className="text-sm font-normal text-muted-foreground line-through">
          {formatToman(originalPriceToman, locale)}
        </s>
      ) : null}
    </span>
  );
}
