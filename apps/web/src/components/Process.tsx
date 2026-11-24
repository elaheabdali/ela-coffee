"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { Eyebrow, Reveal, WordReveal } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";

/**
 * Process section (#process) — dark roast section (audit §1.1/§1.2).
 * Four steps from the brand dataset. A step image flagged
 * `imagePlaceholder` in the data is still rendered as-is — the
 * placeholder is documented in the data file and the Phase 4 doc,
 * it gets no invented UI copy.
 */
export function Process() {
  const { brand } = useBrand();
  const locale = useLocale();
  const isFa = locale === "fa";
  const data = BRANDS[brand];
  const process = data.process;

  return (
    <section id="process" className="bg-roast text-cream">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-24 sm:px-12 lg:px-16">
        <div className="flex flex-col gap-4">
          <Reveal variant="fade-up">
            <Eyebrow>{isFa ? process.eyebrowFa : process.eyebrowEn}</Eyebrow>
          </Reveal>
          <WordReveal
            as="h2"
            text={isFa ? process.titleFa : process.titleEn}
            className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] font-black tracking-[-0.02em]"
          />
        </div>
        <ol className="grid gap-10 lg:grid-cols-4">
          {process.steps.map((step, index) => (
            <li key={step.titleEn} className="flex flex-col gap-4">
              <span className="font-mono text-sm text-crema">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step.image ? (
                <Reveal variant="image">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
                    <Image
                      src={step.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              ) : null}
              <h3 className="font-display text-xl font-bold">
                {isFa ? step.titleFa : step.titleEn}
              </h3>
              <p className="text-sm leading-relaxed text-cream/75">
                {isFa ? step.bodyFa : step.bodyEn}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
