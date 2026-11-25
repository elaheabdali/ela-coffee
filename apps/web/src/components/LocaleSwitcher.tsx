"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Language switcher (fa <-> en), shown in the site header in both
 * states (hero + scrolled pill).
 *
 * The button shows the language it switches TO as its ISO code —
 * "EN" while the site is Persian, "FA" while it is English — next to
 * a Languages icon, with a full-sentence aria-label from the `nav`
 * dictionary. ISO codes (not "فا") keep the English page free of
 * Persian script, which the page test enforces (Phase 5
 * script separation). The switch is a client-side navigation
 * (next-intl `router.replace`) to the same path in the other locale,
 * so the page does not reload and the #hash (e.g. #join) is preserved;
 * next-intl rewrites the NEXT_LOCALE cookie for the new locale.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === "fa" ? "en" : "fa";
  const label = nextLocale === "en" ? "EN" : "FA";
  const ariaLabel = tNav(nextLocale === "en" ? "switchToEnglish" : "switchToPersian");

  return (
    <button
      type="button"
      onClick={() =>
        router.replace(`${pathname}${window.location.hash}`, { locale: nextLocale })
      }
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-cream/10"
    >
      <Languages size={18} aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
    </button>
  );
}
