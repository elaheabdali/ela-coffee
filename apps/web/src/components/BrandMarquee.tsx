"use client";

import { useLocale } from "next-intl";
import { Marquee } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";

/**
 * The flavour ticker between hero and story (audit §1.1): a tan strip
 * scrolling the current brand's drink names. Brand-aware, so it flips
 * to the matcha names (and the green crema) on brand switch. Direction
 * reverses in RTL via the globals.css rule.
 */
export function BrandMarquee() {
  const { brand } = useBrand();
  const locale = useLocale();
  const data = BRANDS[brand];
  const items = locale === "en" ? data.marqueeEn : data.marqueeFa;

  return (
    <div className="relative z-10 border-y border-border bg-crema py-3 text-espresso">
      <Marquee items={items} />
    </div>
  );
}
