/** Formatting helpers: Toman prices, Persian digits, Jalali dates, Iranian phones. */

export type Locale = "fa" | "en";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Convert Latin (and Arabic-Indic) digits in a string to Persian digits. */
export function toFaDigits(value: string | number): string {
  return String(value)
    .replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
    .replace(/[٠-٩]/g, (d) => FA_DIGITS[AR_DIGITS.indexOf(d)]);
}

/** Normalise Persian/Arabic-Indic digits to Latin digits (for validation). */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * Format an amount in Toman.
 * fa → Persian digits with thousands separators + "تومان"
 *    (e.g. 180000 → "۱۸۰٬۰۰۰ تومان").
 * en → Latin digits + "Toman" (e.g. 180000 → "180,000 Toman").
 */
export function formatToman(amountToman: number, locale: Locale = "fa"): string {
  if (locale === "fa") {
    return `${new Intl.NumberFormat("fa-IR").format(amountToman)} تومان`;
  }
  return `${new Intl.NumberFormat("en-US").format(amountToman)} Toman`;
}

/** Format a date in the Jalali (Persian) calendar. */
export function formatJalali(date: Date, locale: Locale = "fa"): string {
  const tag = locale === "fa" ? "fa-IR-u-ca-persian" : "en-u-ca-persian";
  return new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Iranian mobile validation: 09xx or +98 9xx, 11 digits total after normalisation. */
export const IRANIAN_PHONE_REGEX = /^(?:\+98|0)9\d{9}$/;

export function isValidIranianPhone(phone: string): boolean {
  return IRANIAN_PHONE_REGEX.test(normalizeDigits(phone.trim()));
}
