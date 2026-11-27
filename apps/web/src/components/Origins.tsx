"use client";

import type { CSSProperties } from "react";
import { Mountain, Sprout } from "lucide-react";
import { useLocale } from "next-intl";
import { toFaDigits } from "@ela-coffee/i18n";
import { Reveal, WordReveal } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";

/**
 * Origins section (#origins) — rebuilt class-for-class from the
 * reference markup (fix batch 9, ref-home.html): dark `bg-background`
 * section, crema eyebrow, WordReveal h2, intro in text-cream/65, and
 * a two-column grid of `kuro-contours` cards on bg-roast, each with
 * its share of the blend, region + country, a circular icon badge
 * (Mountain for coffee, Sprout for matcha), description and a
 * three-column fact list. Copy is the reference's English, verified
 * against the JS dataset (ref-js/0u26thf6sg1fh.js `origins.items`).
 *
 * Deliberate deviations from the reference's literal classes:
 * - `font-display` is our theme's Fraunces (the reference's
 *   `font-heading font-soft` has no equivalent token here).
 * - The fact `dt` is `text-cream/60`, not the reference's
 *   `text-cream/45`: cream at 45% over roast measures 3.99:1 (ela)
 *   / 3.94:1 (midori) against the WCAG AA 4.5:1 minimum for this
 *   11px semibold uppercase text; at 60% it measures 6.18:1 /
 *   5.93:1 and passes. The `dd` keeps the reference's full cream.
 * - The `--reveal-delay` lives on the `Reveal` wrapper and
 *   `--contour-at` on the article (the reference puts both on the
 *   article); visually identical.
 */
export function Origins() {
  const { brand } = useBrand();
  const locale = useLocale();
  const isFa = locale === "fa";
  const data = BRANDS[brand];
  const origins = data.origins;
  const Icon = brand === "ela" ? Mountain : Sprout;

  return (
    <section
      id="origins"
      aria-labelledby="origins-title"
      className="bg-background py-24 text-cream lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <Reveal variant="fade-up">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-crema">
              {isFa ? origins.eyebrowFa : origins.eyebrowEn}
            </p>
          </Reveal>
          <WordReveal
            as="h2"
            id="origins-title"
            text={isFa ? origins.titleFa : origins.titleEn}
            delayMs={80}
            className="mt-4 text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.03em]"
          />
          <Reveal variant="fade-up" delayMs={260}>
            <p className="mt-5 text-base leading-relaxed text-cream/65 sm:text-lg">
              {isFa ? origins.introFa : origins.introEn}
            </p>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {origins.cards.map((card, index) => {
            const slug = card.nameEn.toLowerCase();
            return (
              <Reveal key={card.nameEn} variant="fade-up" delayMs={index === 0 ? 0 : 140}>
                <article
                  aria-labelledby={`origin-${slug}`}
                  style={{ "--contour-at": index === 0 ? "85% 115%" : "15% -15%" } as CSSProperties}
                  className="kuro-contours relative flex flex-col overflow-hidden rounded-[1.75rem] border border-cream/10 bg-roast p-7 sm:p-10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-crema">
                        {isFa
                          ? `${toFaDigits(String(card.share))}٪ از ترکیب`
                          : `${card.share}% of the blend`}
                      </p>
                      <h3
                        id={`origin-${slug}`}
                        className="mt-3 font-display text-4xl font-medium tracking-[-0.03em] sm:text-5xl"
                      >
                        {isFa ? card.nameFa : card.nameEn}
                      </h3>
                      <p className="mt-1 text-cream/60">
                        {isFa ? card.regionFa : card.regionEn}
                      </p>
                    </div>
                    <span className="grid size-12 shrink-0 place-items-center rounded-full border border-cream/15 bg-espresso/60">
                      <Icon className="size-5 text-crema" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-8 max-w-md text-sm leading-relaxed text-cream/75 sm:text-base">
                    {isFa ? card.introFa : card.introEn}
                  </p>
                  <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-cream/10 pt-6">
                    {card.facts.map((fact) => (
                      <div key={fact.labelEn}>
                        <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-cream/60">
                          {isFa ? fact.labelFa : fact.labelEn}
                        </dt>
                        <dd className="mt-1.5 text-sm font-medium text-cream">
                          {isFa ? fact.valueFa : fact.valueEn}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
