"use client";

import { useTranslations } from "next-intl";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";

/**
 * Site footer — dark roast footer (audit §1.1/§1.2).
 * Brand-aware wordmark and tagline. No Modulify badge: it is a
 * template badge, not client content.
 */
export function SiteFooter() {
  const { brand } = useBrand();
  const tFooter = useTranslations("footer");
  const tNav = useTranslations("nav");
  const wordmark = BRANDS[brand].wordmark;

  const exploreLinks = [
    { href: "#story", label: tNav("story") },
    { href: "#menu", label: tNav("menu") },
    { href: "#process", label: tNav("process") },
    { href: "#origins", label: tNav("origins") },
  ];

  return (
    <footer className="bg-roast text-cream">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-16 sm:px-12 lg:px-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <span className="font-display text-3xl font-black tracking-[-0.02em]">
              {wordmark}
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-cream/70">
              {brand === "midori" ? tFooter("taglineMatcha") : tFooter("tagline")}
            </p>
          </div>
          <nav aria-label={tFooter("explore")} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cream/60">
              {tFooter("explore")}
            </h2>
            <ul className="flex flex-col gap-2">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cream/60">
              {tFooter("stayInTouch")}
            </h2>
            <p className="text-sm leading-relaxed text-cream/70">{tFooter("stayInTouchBody")}</p>
            <a href="#join" className="w-fit text-sm font-medium text-crema hover:underline">
              {tNav("join")}
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-cream/10 pt-6 text-sm text-cream/60">
          <p>{tFooter("rights")}</p>
          <a href="#hero" className="font-medium text-cream hover:underline">
            {tFooter("backToTop")}
          </a>
        </div>
      </div>
    </footer>
  );
}
