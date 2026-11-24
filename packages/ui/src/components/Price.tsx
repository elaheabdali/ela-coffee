import { formatToman } from "@ela-coffee/i18n";
import type { Locale } from "@ela-coffee/i18n";

export interface PriceProps {
  /** Amount in Toman (integer). Placeholder prices until the client confirms real ones. */
  amountToman: number;
  locale?: Locale;
  className?: string;
}

/** Toman price, formatted with Persian digits in `fa` and Latin digits in `en`. */
export function Price({ amountToman, locale = "fa", className = "" }: PriceProps) {
  return <span className={className}>{formatToman(amountToman, locale)}</span>;
}
