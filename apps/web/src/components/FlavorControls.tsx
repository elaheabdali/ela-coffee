"use client";

import { useState } from "react";
import { Info, LayoutGrid, ShoppingBag, Shuffle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Pill } from "@ela-coffee/ui";
import { BRANDS } from "@/data/flavours";
import { bagCount, useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useFlavour } from "@/stores/flavour";
import { AllFlavorsDialog, TastingNotesDialog } from "./FlavorDialogs";

/**
 * Top-centre glass pill (audit §2): All flavours, Tasting notes,
 * Surprise me, and the bag with a count badge. The badge is keyed by
 * the count so the `kuro-bump` animation re-triggers on every add.
 * The dialogs are only mounted while open, so the toast hook inside
 * the tasting-notes dialog only runs when it is actually shown.
 */
export function FlavorControls() {
  const tHero = useTranslations("hero");
  const tBag = useTranslations("bag");
  const { brand } = useBrand();
  const { index, surprise } = useFlavour();
  const { items, openBag } = useBag();
  const [allOpen, setAllOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const count = bagCount(items);
  const drink = BRANDS[brand].drinks[index];

  const iconButtonClass =
    "relative inline-flex size-9 items-center justify-center rounded-full text-cream transition-colors hover:bg-cream/10";

  return (
    <>
      <Pill variant="glass" className="gap-1 px-2 py-1.5">
        <button
          type="button"
          aria-label={tHero("allFlavours")}
          onClick={() => setAllOpen(true)}
          className={iconButtonClass}
        >
          <LayoutGrid size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={tHero("tastingNotes")}
          onClick={() => setNotesOpen(true)}
          className={iconButtonClass}
        >
          <Info size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={tHero("surpriseMe")}
          onClick={surprise}
          className={iconButtonClass}
        >
          <Shuffle size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={tBag("open")}
          onClick={openBag}
          className={iconButtonClass}
        >
          <ShoppingBag size={18} aria-hidden="true" />
          {count > 0 ? (
            <span
              key={count}
              data-testid="bag-count"
              className="animate-kuro-bump absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-bold text-primary-foreground"
            >
              {count}
            </span>
          ) : null}
        </button>
      </Pill>
      {allOpen ? <AllFlavorsDialog open={allOpen} onClose={() => setAllOpen(false)} /> : null}
      {notesOpen ? (
        <TastingNotesDialog open={notesOpen} onClose={() => setNotesOpen(false)} drink={drink} />
      ) : null}
    </>
  );
}
