"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { Eyebrow, Reveal, WordReveal } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";

/**
 * Story section (#story) — cream section (audit §1.1/§1.2).
 * Copy, stats and image all come from the brand dataset; the locale
 * picks the En/Fa fields.
 */
export function Story() {
  const { brand } = useBrand();
  const locale = useLocale();
  const isFa = locale === "fa";
  const data = BRANDS[brand];
  const story = data.story;

  return (
    <section id="story" className="bg-cream text-espresso">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-12 lg:grid-cols-12 lg:px-16">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Reveal variant="fade-up">
            {/* text-espresso/70, not the Eyebrow default muted: the
                muted token (#b9a690) is designed for dark backgrounds
                and fails AA on cream (1.99:1); espresso/70 is 6.88:1
                (Phase 9 contrast table). Same in Menu/Origins. */}
            <Eyebrow className="text-espresso/70">
              {isFa ? story.eyebrowFa : story.eyebrowEn}
            </Eyebrow>
          </Reveal>
          <WordReveal
            as="h2"
            text={isFa ? story.titleFa : story.titleEn}
            className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] font-black tracking-[-0.02em]"
          />
          {(isFa ? story.bodyFa : story.bodyEn).map((paragraph) => (
            <Reveal key={paragraph.slice(0, 24)} variant="fade-up" delayMs={300}>
              <p className="leading-relaxed text-espresso/80">{paragraph}</p>
            </Reveal>
          ))}
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8">
            {story.stats.map((stat) => (
              // The Reveal wrapper div is the dl's direct child and holds
              // the dt/dd pair itself: axe (definition-list / dlitem)
              // requires dt/dd to sit directly in the dl or in a div
              // that is itself a direct child of the dl — an extra
              // nested div between them is a violation.
              <Reveal
                key={stat.labelEn}
                variant="fade-up"
                delayMs={450}
                className="flex flex-col gap-1"
              >
                <dt className="order-2 text-sm leading-snug text-espresso/70">
                  {isFa ? stat.labelFa : stat.labelEn}
                </dt>
                <dd className="order-1 font-display text-3xl font-black">
                  {isFa ? stat.valueFa : stat.valueEn}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
        <Reveal variant="image" className="lg:col-span-7">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-kuro-card">
            <Image
              src={story.image}
              alt={isFa ? story.imageAltFa : story.imageAltEn}
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
