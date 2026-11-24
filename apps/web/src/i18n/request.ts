import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { en, fa } from "@ela-coffee/i18n";
import { routing } from "./routing";

/**
 * Per-request next-intl config. Messages come from `@ela-coffee/i18n`
 * (the single source of truth — no duplicated JSON catalogs), so the
 * dictionaries used by the app and by next-intl can never drift apart.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: locale === "fa" ? fa : en,
    timeZone: "Asia/Tehran",
  };
});
