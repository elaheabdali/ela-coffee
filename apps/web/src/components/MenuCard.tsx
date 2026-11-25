"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Button, Pill, Price, Reveal } from "@ela-coffee/ui";
import type { Drink } from "@/data/flavours";
import { useBag } from "@/stores/bag";
import { useBagToast } from "@/components/BagToast";

export interface MenuCardProps {
  drink: Drink;
  /** Stagger delay for the scroll reveal, in milliseconds. */
  delayMs?: number;
}

/**
 * One menu card: portrait scene image, name, description, the same 3
 * tasting notes the dialog reads (single source of truth — audit
 * defect §8.2), locale-aware price and an add-to-bag action.
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

  return (
    <Reveal variant="fade-up" delayMs={delayMs}>
      <article className="flex h-full flex-col gap-4 rounded-2xl bg-card p-4 text-foreground shadow-ela-card ring-1 ring-border">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
          <Image
            src={drink.image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <h3 className="font-display text-xl font-bold leading-snug">{name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        <ul className="flex flex-wrap gap-2" aria-label={tHero("tastingNotes")}>
          {notes.map((note) => (
            <li key={note}>
              <Pill variant="label">{note}</Pill>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <Price amountToman={drink.priceToman} locale={priceLocale} size="md" />
          <Button
            size="sm"
            onClick={() => {
              add(drink.id);
              notifyAdded(name);
            }}
          >
            {tDialog("addToBag")}
          </Button>
        </div>
      </article>
    </Reveal>
  );
}
