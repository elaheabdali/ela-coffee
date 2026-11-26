"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatToman } from "@ela-coffee/i18n";
import { Reveal } from "@ela-coffee/ui";
import type { Drink } from "@/data/flavours";
import { BRANDS } from "@/data/flavours";
import { useBag } from "@/stores/bag";
import { useBagToast } from "@/components/BagToast";

export interface MenuCardProps {
  drink: Drink;
  /** Stagger delay for the scroll reveal, in milliseconds. */
  delayMs?: number;
}

/**
 * One menu card — rebuilt class-for-class from the reference markup
 * (fix batch 7): dark `bg-roast` card on the dark section, portrait
 * scene image with a hover zoom, a 56px ingredient-sprite thumbnail
 * and a price pill overlaid on the image, outline tasting-note pills,
 * and a full-width cream "Add to bag" button.
 *
 * Deliberate deviations from the reference's literal classes:
 * - `font-display` is our theme's Fraunces (the reference's
 *   `font-heading font-soft` has no equivalent token here).
 * - The thumbnail sits at `start-4` and the price pill at `end-4`
 *   (logical) instead of the reference's physical `left-4`/`right-4`,
 *   so in fa (RTL) they mirror to the opposite corners.
 * - `ela-reveal-media` is our renamed `kuro-reveal-media` (P12).
 * - The price is Toman, not dollars: the reference's "$5.40" pill
 *   shows `formatToman` ("180,000 T" / "۱۸۰٬۰۰۰ تومان").
 * - The image alt is the drink name; the reference's long descriptive
 *   scene alts were not copied (see results.md).
 */
export function MenuCard({ drink, delayMs = 0 }: MenuCardProps) {
  const locale = useLocale();
  const isFa = locale === "fa";
  const priceLocale = isFa ? "fa" : "en";
  const tDialog = useTranslations("dialog");
  const tHero = useTranslations("hero");
  const add = useBag((state) => state.add);
  const { notifyAdded } = useBagToast();

  const name = isFa ? drink.nameFa : drink.nameEn;
  const description = isFa ? drink.descriptionFa : drink.descriptionEn;
  const notes = isFa ? drink.notesFa : drink.notesEn;
  const priceText = formatToman(drink.priceToman, priceLocale);
  // Reference aria-label: "Add Kuro Original to your bag, $5.40" —
  // the fa form follows the hero chip's pattern ("«…» را به سبد
  // اضافه کن") with the Toman price appended.
  const addLabel = isFa
    ? `«${name}» را به سبد اضافه کن، ${priceText}`
    : `Add ${name} to your bag, ${priceText}`;

  return (
    <Reveal as="li" variant="image" delayMs={delayMs} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-cream/10 bg-roast transition-colors duration-300 hover:border-cream/20">
        <div className="relative aspect-[4/5] overflow-hidden bg-espresso">
          <Image
            src={drink.image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 70vw, (min-width: 640px) 110vw, 220vw"
            className="ela-reveal-media object-cover object-[50%_48%] transition-[scale] duration-700 ease-out group-hover:scale-105"
          />
          {/* Ingredient sprite thumbnail: one cell of the brand's 3×2
              sheet (390% × 260% span, per-drink offsets in the dataset).
              The img is decorative (alt="") — the drink name is the
              card's heading. */}
          <span className="absolute start-4 top-4 block size-14 overflow-hidden rounded-2xl bg-cream shadow-[0_16px_30px_-12px_rgb(0_0_0/0.8)] ring-1 ring-black/10">
            <span className="absolute inset-0 block">
              <span
                className="absolute block"
                style={{
                  width: "390%",
                  height: "260%",
                  left: `${drink.sprite.x}%`,
                  top: `${drink.sprite.y}%`,
                }}
              >
                <Image
                  src={BRANDS[drink.brand].spriteSheet}
                  alt=""
                  draggable={false}
                  fill
                  sizes="(max-width: 639px) 320px, 800px"
                  className="object-cover"
                />
              </span>
            </span>
          </span>
          <span className="absolute end-4 top-4 rounded-full bg-espresso/70 px-3 py-1.5 text-sm font-semibold tabular-nums text-cream backdrop-blur-md">
            {priceText}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="font-display text-2xl font-medium leading-tight tracking-[-0.02em] text-cream">
            {name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-cream/65">{description}</p>
          <ul
            aria-label={`${name} ${tHero("tastingNotes")}`}
            className="mt-4 flex flex-wrap gap-1.5"
          >
            {notes.map((note) => (
              <li
                key={note}
                className="rounded-full border border-cream/15 px-2.5 py-1 text-xs text-cream/75"
              >
                {note}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-6">
            <button
              type="button"
              aria-label={addLabel}
              onClick={() => {
                add(drink.id);
                notifyAdded(name);
              }}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-cream px-5 py-3 text-sm font-semibold text-espresso transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
            >
              <ShoppingBag className="size-4" aria-hidden="true" />
              {tDialog("addToBag")}
            </button>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
