"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Eyebrow, Reveal, WordReveal } from "@ela-coffee/ui";
import { ALL_DRINKS, BRANDS } from "@/data/flavours";
import type { DrinkDTO } from "@/lib/types";
import { useBrand } from "@/stores/brand";
import { MenuCard } from "@/components/MenuCard";

/**
 * Menu section (#menu) — rebuilt class-for-class from the reference
 * markup (fix batch 7): DARK section (`bg-background`, dark brown in
 * ela, dark green in midori) with cream text, a header row with the
 * "Spin the flavor wheel" pill link, six dark `bg-roast` cards, and
 * the "Make it yours" panel as one bordered box with comma-joined
 * options.
 *
 * Deliberate deviations from the reference's literal classes:
 * - `font-display` is our theme's Fraunces (the reference's
 *   `font-heading font-soft` has no equivalent token here).
 * - The wheel-link arrow uses `rtl:-scale-x-100` so it mirrors in fa;
 *   the codebase had no prior `rtl:` icon convention to follow.
 * - "Make it yours" options are joined with ", " in en and "، " in fa.
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
    <section id="menu" aria-labelledby="menu-title" className="bg-background py-24 text-cream lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Reveal variant="fade-up">
              <Eyebrow className="tracking-[0.2em] text-crema">{tMenu("eyebrow")}</Eyebrow>
            </Reveal>
            <WordReveal
              as="h2"
              id="menu-title"
              text={isFa ? menu.titleFa : menu.titleEn}
              delayMs={80}
              className="mt-4 text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.03em]"
            />
            <Reveal variant="fade-up" delayMs={260}>
              <p className="mt-5 text-base leading-relaxed text-cream/65 sm:text-lg">
                {isFa ? menu.introFa : menu.introEn}
              </p>
            </Reveal>
          </div>
          <Reveal variant="fade-up" delayMs={350} className="shrink-0">
            <a
              href="#hero"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-cream/15 px-5 py-3 text-sm font-semibold text-cream transition-colors hover:bg-cream/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
            >
              {tMenu("spinWheel")}
              <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {drinks.map((drink, index) => (
            <MenuCard key={drink.id} drink={drink} delayMs={(index % 3) * 110} />
          ))}
        </ul>

        <Reveal
          variant="fade-up"
          className="mt-16 grid gap-8 rounded-[1.75rem] border border-cream/10 bg-cream/[0.03] p-6 sm:grid-cols-3 sm:p-8 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:items-center"
        >
          <div className="sm:col-span-3 lg:col-span-1">
            <h3 className="font-display text-2xl font-medium tracking-[-0.02em]">
              {tMenu("makeItYours")}
            </h3>
            <p className="mt-2 text-sm text-cream/60">{tMenu("makeItYoursNote")}</p>
          </div>
          {data.makeItYours.map((group) => (
            <div key={group.labelEn}>
              {/* text-cream/60, not the reference's cream/45: cream/45
                  measures 4.02:1 on the panel and fails WCAG AA (4.5:1);
                  cream/60 is 6.20:1. Same rule as the story eyebrow. */}
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-cream/60">
                {isFa ? group.labelFa : group.labelEn}
              </p>
              <p className="mt-2 text-sm text-cream/85">
                {(isFa ? group.optionsFa : group.optionsEn).join(isFa ? "، " : ", ")}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
