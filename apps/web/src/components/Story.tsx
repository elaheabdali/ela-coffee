"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { Eyebrow, Reveal, WordReveal } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";

/**
 * Story section (#story) — rebuilt class-for-class from the reference
 * markup (fix batch 6): image first (lg:col-span-5), text second
 * (lg:col-span-7), floating badge card over the image, exactly three
 * stats. Copy, badge and stats all come from the brand dataset; the
 * locale picks the En/Fa fields.
 *
 * Deliberate deviations from the reference's literal classes:
 * - `font-display` is our theme's Fraunces (the reference's
 *   `font-heading font-soft` has no equivalent token here).
 * - The badge sits at `end-4 sm:end-8` (logical) instead of the
 *   reference's physical `right-4 sm:right-8`, so in fa (RTL) it
 *   mirrors to the inner edge of the image, like the reference's
 *   placement in LTR.
 * - The eyebrow keeps the reference's `text-espresso/60`: it passes
 *   AA for normal text on cream (4.85:1 ela, 4.56:1 midori — computed
 *   from the tokens; the E2E axe suite re-checks it live in both
 *   brands).
 */
export function Story() {
  const { brand } = useBrand();
  const locale = useLocale();
  const isFa = locale === "fa";
  const data = BRANDS[brand];
  const story = data.story;

  return (
    <section id="story" aria-labelledby="story-title" className="bg-cream text-espresso">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-32">
        <Reveal variant="image" className="relative lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.4)]">
            <Image
              src={story.image}
              alt={isFa ? story.imageAltFa : story.imageAltEn}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="ela-reveal-media object-cover"
            />
          </div>
          <Reveal
            variant="fade-up"
            delayMs={450}
            className="absolute -bottom-6 end-4 rounded-2xl bg-espresso px-5 py-4 text-cream shadow-[0_24px_50px_-20px_rgb(0_0_0/0.6)] sm:end-8"
          >
            <p className="font-display text-3xl font-medium leading-none">
              {isFa ? story.badge.valueFa : story.badge.valueEn}
            </p>
            <p className="mt-1.5 text-xs text-cream/65">
              {isFa ? story.badge.captionFa : story.badge.captionEn}
            </p>
          </Reveal>
        </Reveal>
        <div className="lg:col-span-7">
          <div className="max-w-2xl">
            <Reveal variant="fade-up">
              <Eyebrow className="tracking-[0.2em] text-espresso/60">
                {isFa ? story.eyebrowFa : story.eyebrowEn}
              </Eyebrow>
            </Reveal>
            <WordReveal
              as="h2"
              id="story-title"
              text={isFa ? story.titleFa : story.titleEn}
              delayMs={80}
              className="mt-4 text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.03em]"
            />
          </div>
          <div className="mt-6 max-w-2xl space-y-5 text-base leading-relaxed text-espresso/75 sm:text-lg">
            {(isFa ? story.bodyFa : story.bodyEn).map((paragraph, i) => (
              <Reveal
                key={paragraph.slice(0, 24)}
                variant="fade-up"
                delayMs={i === 0 ? 200 : 320}
              >
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-4 border-t border-espresso/15 pt-8">
            {story.stats.map((stat, i) => (
              // The Reveal wrapper div is the dl's direct child and holds
              // the dt/dd pair itself: axe (definition-list / dlitem)
              // requires dt/dd to sit directly in the dl or in a div
              // that is itself a direct child of the dl — an extra
              // nested div between them is a violation.
              <Reveal
                key={stat.labelEn}
                variant="fade-up"
                delayMs={i * 120}
                className="flex flex-col-reverse gap-2"
              >
                <dt className="text-xs leading-snug text-espresso/65 sm:text-sm">
                  {isFa ? stat.labelFa : stat.labelEn}
                </dt>
                <dd className="font-display text-4xl font-medium leading-none tracking-[-0.03em] sm:text-5xl">
                  {isFa ? stat.valueFa : stat.valueEn}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
