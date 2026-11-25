"use client";

import { useLocale } from "next-intl";
import { toFaDigits } from "@ela-coffee/i18n";
import { Eyebrow, Reveal, WordReveal } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";

/**
 * Origins section (#origins) — cream section (audit §1.1/§1.2).
 * Two origin cards from the brand dataset, each with its share of
 * the blend and its facts.
 */
export function Origins() {
  const { brand } = useBrand();
  const locale = useLocale();
  const isFa = locale === "fa";
  const data = BRANDS[brand];
  const origins = data.origins;

  return (
    <section id="origins" className="bg-cream text-espresso">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-24 sm:px-12 lg:px-16">
        <div className="flex flex-col gap-4">
          <Reveal variant="fade-up">
            {/* text-espresso/70: see Story.tsx — the muted token fails
                AA on cream (1.99:1). */}
            <Eyebrow className="text-espresso/70">
              {isFa ? origins.eyebrowFa : origins.eyebrowEn}
            </Eyebrow>
          </Reveal>
          <WordReveal
            as="h2"
            text={isFa ? origins.titleFa : origins.titleEn}
            className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] font-black tracking-[-0.02em]"
          />
          <Reveal variant="fade-up" delayMs={300}>
            <p className="max-w-2xl leading-relaxed text-espresso/80">
              {isFa ? origins.introFa : origins.introEn}
            </p>
          </Reveal>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {origins.cards.map((card, index) => (
            <Reveal key={card.nameEn} variant="fade-up" delayMs={index * 150}>
              <article className="flex h-full flex-col gap-4 rounded-2xl bg-card p-6 text-foreground shadow-ela-card ring-1 ring-border sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold">
                    {isFa ? card.nameFa : card.nameEn}
                  </h3>
                  <span className="font-mono text-sm text-crema">
                    {isFa
                      ? `${toFaDigits(String(card.share))}٪ از ترکیب`
                      : `${card.share}% of the blend`}
                  </span>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  {isFa ? card.introFa : card.introEn}
                </p>
                <dl className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
                  {card.facts.map((fact) => (
                    <div key={fact.labelEn} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">
                        {isFa ? fact.labelFa : fact.labelEn}
                      </dt>
                      <dd className="text-sm font-medium">
                        {isFa ? fact.valueFa : fact.valueEn}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
