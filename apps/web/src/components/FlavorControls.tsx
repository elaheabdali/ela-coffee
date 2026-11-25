"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Info, LayoutGrid, ShoppingBag, Shuffle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toFaDigits } from "@ela-coffee/i18n";
import { BRANDS } from "@/data/flavours";
import { bagCount, useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useFlavour } from "@/stores/flavour";

/**
 * The flavour dialogs load on demand in their own chunk (architecture
 * §12 "dialogs lazy"): they are only mounted while open, so the chunk
 * is fetched on the first open, not on page load.
 */
const AllFlavorsDialog = dynamic(() => import("./FlavorDialogs").then((m) => m.AllFlavorsDialog));
const TastingNotesDialog = dynamic(() =>
  import("./FlavorDialogs").then((m) => m.TastingNotesDialog),
);

/**
 * Top-centre glass pill (audit §2, reference hero nav, fix batch 2):
 * All flavors, Tasting notes, Surprise me, and the bag with a count
 * badge — `rounded-[1.15rem] border-cream/10 bg-espresso/45
 * backdrop-blur-md` with the reference's shadow, icon buttons
 * `size-9 sm:size-10 rounded-[0.85rem] text-cream/75`, and the bag
 * button on `bg-espresso` with the crema badge (`bg-crema
 * text-espresso ring-2 ring-espresso`, the reference's `kuro-bump`).
 * The badge is keyed by the count so the `ela-bump` animation
 * re-triggers on every add. The dialogs are only mounted while open,
 * so the toast hook inside the tasting-notes dialog only runs when it
 * is actually shown.
 */
export function FlavorControls() {
  const tHero = useTranslations("hero");
  const tBag = useTranslations("bag");
  const locale = useLocale();
  const { brand } = useBrand();
  const { index, surprise } = useFlavour();
  const { items, openBag, isOpen: bagOpen } = useBag();
  const [allOpen, setAllOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const count = bagCount(items);
  const drink = BRANDS[brand].drinks[index];

  const iconButtonClass =
    "relative grid size-9 cursor-pointer place-items-center rounded-[0.85rem] text-cream/75 transition-[scale,background-color,color] duration-200 hover:bg-cream/10 hover:text-cream active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema sm:size-10";
  const badgeClass =
    "animate-ela-bump absolute -end-1.5 -top-1.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-crema px-1 text-[0.625rem] font-bold leading-none text-espresso ring-2 ring-espresso";

  return (
    <>
      <div className="flex items-center gap-1 rounded-[1.15rem] border border-cream/10 bg-espresso/45 p-1 shadow-[0_12px_32px_-14px_rgb(0_0_0/0.7)] backdrop-blur-md">
        <button
          type="button"
          aria-label={tHero("allFlavors")}
          title={tHero("allFlavors")}
          onClick={() => setAllOpen(true)}
          className={iconButtonClass}
        >
          <LayoutGrid size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={tHero("tastingNotes")}
          title={tHero("tastingNotes")}
          onClick={() => setNotesOpen(true)}
          className={iconButtonClass}
        >
          <Info size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={tHero("surpriseMe")}
          title={tHero("surpriseMe")}
          onClick={surprise}
          className={iconButtonClass}
        >
          <Shuffle size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={tBag("open")}
          title={tBag("open")}
          aria-haspopup="dialog"
          aria-expanded={bagOpen}
          onClick={openBag}
          className={`${iconButtonClass} bg-espresso text-cream hover:bg-black`}
        >
          <ShoppingBag size={16} aria-hidden="true" />
          {count > 0 ? (
            <span key={count} data-testid="bag-count" className={badgeClass}>
              {locale === "fa" ? toFaDigits(count) : count}
            </span>
          ) : null}
        </button>
      </div>
      {allOpen ? <AllFlavorsDialog open={allOpen} onClose={() => setAllOpen(false)} /> : null}
      {notesOpen ? (
        <TastingNotesDialog open={notesOpen} onClose={() => setNotesOpen(false)} drink={drink} />
      ) : null}
    </>
  );
}
