"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export interface LocaleSwitcherProps {
  /**
   * Surface + responsive behaviour, matching the reference's other
   * header icon buttons: hero — `border-cream/10 bg-espresso/45
   * backdrop-blur-md`; scrolled pill — `border-transparent
   * bg-cream/[0.06] backdrop-blur-none`. The button itself is an
   * `h-10` rounded-[0.9rem] pill so the Globe icon + ISO code fit.
   */
  className?: string;
}

/**
 * Language switcher (fa <-> en), shown in the site header in both
 * states (hero + scrolled pill).
 *
 * The button shows the language it switches TO as its ISO code —
 * "EN" while the site is Persian, "FA" while it is English — next to
 * a Globe icon, with a full-sentence aria-label + title from the `nav`
 * dictionary. ISO codes (not "فا") keep the English page free of
 * Persian script, which the page test enforces (Phase 5 script
 * separation). The globe lifts slightly on hover; the icon + code are
 * `aria-hidden` because the aria-label already names the action.
 *
 * No-scroll switch (fix batch 2): the switch is a client-side
 * navigation (next-intl `router.replace`) to the bare pathname in the
 * other locale — NO `#hash` is carried over (the old code appended
 * `window.location.hash`, so switching from e.g. #join jumped the
 * page down to that anchor) — with `scroll: false`, and the scroll
 * position is recorded beforehand and restored afterwards as
 * belt-and-braces, because a locale soft-navigation can still reset
 * scroll. next-intl rewrites the NEXT_LOCALE cookie for the new locale.
 */
export function LocaleSwitcher({ className = "" }: LocaleSwitcherProps) {
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === "fa" ? "en" : "fa";
  const label = nextLocale === "en" ? "EN" : "FA";
  const ariaLabel = tNav(nextLocale === "en" ? "switchToEnglish" : "switchToPersian");

  const onSwitch = () => {
    const y = window.scrollY;
    router.replace(pathname, { locale: nextLocale, scroll: false });
    // Belt-and-braces: if anything still moves the page, put it back
    // once the navigation has settled.
    const restore = () => {
      if (window.scrollY !== y) window.scrollTo(0, y);
    };
    requestAnimationFrame(() => requestAnimationFrame(restore));
    window.setTimeout(restore, 100);
  };

  return (
    <button
      type="button"
      onClick={onSwitch}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`group inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[0.9rem] px-3 text-xs font-semibold text-cream transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema ${className}`}
    >
      <Globe
        size={16}
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12"
      />
      <span aria-hidden="true">{label}</span>
    </button>
  );
}
