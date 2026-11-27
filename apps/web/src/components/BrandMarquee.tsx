"use client";

import { useLocale } from "next-intl";
import { Marquee } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";

/**
 * The flavour ticker between hero and story (audit §1.1): a crema
 * strip scrolling the current brand's drink names, rebuilt to the
 * reference's structure (fix batch 4) — four identical lists, 2xl/3xl
 * Fraunces names, a bean (coffee) or leaf (matcha) separator. The
 * band is aria-hidden: a decorative duplicate of the names in the
 * menu section. No `relative z-10` (unlike the old band): nothing
 * overlaps the strip — the hero's sticky stage is confined to its
 * own 300vh section — so no stacking is needed.
 */
export function BrandMarquee() {
  const { brand } = useBrand();
  const locale = useLocale();
  const data = BRANDS[brand];
  const items = locale === "en" ? data.marqueeEn : data.marqueeFa;

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-espresso/10 bg-crema text-espresso"
    >
      <Marquee items={items} separator={brand === "midori" ? "leaf" : "bean"} />
    </div>
  );
}
