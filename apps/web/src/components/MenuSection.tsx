"use client";

import { useLocale, useTranslations } from "next-intl";
import { Eyebrow, Reveal, WordReveal } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";
import { MenuCard } from "@/components/MenuCard";

/**
 * Menu section (#menu) — cream section (audit §1.1/§1.2).
 * Six cards from the brand dataset, the wheel link back to #hero,
 * then "Make it yours" with the customisation groups from the data.
 */
export function MenuSection() {
  const { brand } = useBrand();
  const locale = useLocale();
  const isFa = locale === "fa";
  const tMenu = useTranslations("menu");
  const data = BRANDS[brand];
  const menu = data.menu;

  return (
    <section id="menu" className="bg-cream text-espresso">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-24 sm:px-12 lg:px-16">
        <div className="flex flex-col gap-4">
          <Reveal variant="fade-up">
            <Eyebrow>{tMenu("eyebrow")}</Eyebrow>
          </Reveal>
          <WordReveal
            as="h2"
            text={isFa ? menu.titleFa : menu.titleEn}
            className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] font-black tracking-[-0.02em]"
          />
          <Reveal variant="fade-up" delayMs={300}>
            <p className="max-w-2xl leading-relaxed text-espresso/80">
              {isFa ? menu.introFa : menu.introEn}
            </p>
          </Reveal>
          <Reveal variant="fade-up" delayMs={450}>
            <a
              href="#hero"
              className="w-fit font-medium text-espresso underline decoration-crema decoration-2 underline-offset-4"
            >
              {tMenu("spinWheel")}
            </a>
          </Reveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.drinks.map((drink, index) => (
            <MenuCard key={drink.id} drink={drink} delayMs={(index % 3) * 150} />
          ))}
        </div>

        <Reveal variant="fade-up">
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-2xl font-bold">{tMenu("makeItYours")}</h3>
            <p className="text-sm leading-relaxed text-espresso/70">{tMenu("makeItYoursNote")}</p>
          </div>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-3">
          {data.makeItYours.map((group) => (
            <Reveal key={group.labelEn} variant="fade-up" delayMs={300}>
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-espresso/60">
                  {isFa ? group.labelFa : group.labelEn}
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {(isFa ? group.optionsFa : group.optionsEn).map((option) => (
                    <li key={option} className="text-base">
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
