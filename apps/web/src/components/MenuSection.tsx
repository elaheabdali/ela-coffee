"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Eyebrow, Reveal, WordReveal } from "@ela-coffee/ui";
import { ALL_DRINKS, BRANDS } from "@/data/flavours";
import type { DrinkDTO } from "@/lib/types";
import { useBrand } from "@/stores/brand";
import { MenuCard } from "@/components/MenuCard";

/**
 * Menu section (#menu) — cream section (audit §1.1/§1.2).
 * Six cards from the brand dataset, the wheel link back to #hero,
 * then "Make it yours" with the customisation groups from the data.
 *
 * Phase 6: the cards read prices/notes from GET /api/menu via
 * TanStack Query. The static dataset is the placeholderData, so the
 * section still renders instantly and the server prices (the one
 * source of truth) win on refetch.
 */
export function MenuSection() {
  const { brand } = useBrand();
  const locale = useLocale();
  const isFa = locale === "fa";
  const tMenu = useTranslations("menu");
  const data = BRANDS[brand];
  const menu = data.menu;

  // Prerender note (Next 16 + Cache Components): TanStack Query calls
  // Date.now() while rendering when initialData is used — once to
  // timestamp the initial data, once for the isStale check — and Next
  // forbids Date.now() in a Client Component during prerendering
  // ("blocking-prerender-current-time-client"). placeholderData avoids
  // both: the query state starts empty (dataUpdatedAt 0, isStale
  // short-circuits before any clock read), the static dataset renders
  // instantly as a placeholder, and the real fetch runs after mount —
  // server prices win.
  const { data: menuData } = useQuery({
    queryKey: ["menu"],
    queryFn: async (): Promise<{ drinks: DrinkDTO[] }> => {
      const response = await fetch("/api/menu");
      if (!response.ok) throw new Error("Failed to load the menu.");
      return (await response.json()) as { drinks: DrinkDTO[] };
    },
    placeholderData: {
      drinks: ALL_DRINKS.map((drink, index) => ({
        id: drink.id,
        brand: drink.brand,
        slug: drink.slug,
        nameFa: drink.nameFa,
        nameEn: drink.nameEn,
        priceToman: drink.priceToman,
        caffeineMg: drink.caffeineMg,
        notesFa: drink.notesFa,
        notesEn: drink.notesEn,
        image: drink.image,
        sort: index,
      })),
    },
    staleTime: 5 * 60_000,
  });

  // Server prices/notes win; display copy still comes from the
  // static dataset (the API has no description fields by design).
  // menuData is undefined only before the first result exists; the
  // placeholder covers that render, so fall back to the static list.
  const drinks = useMemo(() => {
    const byId = new Map(menuData?.drinks.map((d) => [d.id, d]));
    return data.drinks.map((drink) => {
      const api = byId.get(drink.id);
      return api
        ? { ...drink, priceToman: api.priceToman, notesEn: api.notesEn, notesFa: api.notesFa }
        : drink;
    });
  }, [data.drinks, menuData]);

  return (
    <section id="menu" className="bg-cream text-espresso">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-24 sm:px-12 lg:px-16">
        <div className="flex flex-col gap-4">
          <Reveal variant="fade-up">
            {/* text-espresso/70: see Story.tsx — the muted token fails
                AA on cream (1.99:1). */}
            <Eyebrow className="text-espresso/70">{tMenu("eyebrow")}</Eyebrow>
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
          {drinks.map((drink, index) => (
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
