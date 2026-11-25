"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Dialog, Price } from "@ela-coffee/ui";
import { toFaDigits } from "@ela-coffee/i18n";
import { BRANDS, type Drink } from "@/data/flavours";
import { useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useFlavour } from "@/stores/flavour";
import { useBagToast } from "./BagToast";

export interface AllFlavorsDialogProps {
  open: boolean;
  onClose: () => void;
}

export interface TastingNotesDialogProps {
  open: boolean;
  onClose: () => void;
  drink: Drink | null;
}

function drinkName(drink: Drink, locale: string): string {
  return locale === "fa" ? drink.nameFa : drink.nameEn;
}

function drinkDescription(drink: Drink, locale: string): string {
  return locale === "fa" ? drink.descriptionFa : drink.descriptionEn;
}

function drinkNotes(drink: Drink, locale: string): string[] {
  return locale === "fa" ? drink.notesFa : drink.notesEn;
}

/**
 * All-flavours list (the reference's grid-icon dropdown, audit §2):
 * all 6 drinks of the current brand with thumbnail, name, price and
 * tasting notes. The current flavour carries a black checkmark.
 * Clicking a row jumps the wheel to that flavour and closes.
 */
export function AllFlavorsDialog({ open, onClose }: AllFlavorsDialogProps) {
  const tHero = useTranslations("hero");
  const tDialog = useTranslations("dialog");
  const locale = useLocale();
  const { brand } = useBrand();
  const { index, setIndex } = useFlavour();
  const drinks = BRANDS[brand].drinks;

  return (
    <Dialog open={open} onClose={onClose} title={tHero("allFlavors")} closeLabel={tDialog("close")}>
      <ul className="flex flex-col gap-1">
        {drinks.map((drink, i) => {
          const isCurrent = i === index;
          return (
            <li key={drink.id}>
              <button
                type="button"
                onClick={() => {
                  setIndex(i);
                  onClose();
                }}
                aria-current={isCurrent ? "true" : undefined}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition-[scale,background-color] hover:bg-accent active:scale-[0.98]"
              >
                <Image
                  src={drink.image}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{drinkName(drink, locale)}</span>
                    {isCurrent ? (
                      <Check size={18} aria-hidden="true" className="shrink-0 text-foreground" />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {drinkNotes(drink, locale).join(" • ")}
                  </span>
                </span>
                <Price amountToman={drink.priceToman} locale={locale === "en" ? "en" : "fa"} size="sm" />
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

/**
 * Tasting-notes dialog (the reference's info-icon card, audit §2):
 * drink image, description, the same 3 tasting notes the menu cards
 * use (one source of truth, `flavours.ts`), 3 stat boxes (size /
 * caffeine / price) and an Add to bag button.
 */
export function TastingNotesDialog({ open, onClose, drink }: TastingNotesDialogProps) {
  const tDialog = useTranslations("dialog");
  const locale = useLocale();
  const { add } = useBag();
  const { notifyAdded } = useBagToast();

  // No drink, no content (the controls only open this for a real flavour).
  if (!drink) return null;

  const name = drinkName(drink, locale);
  const notes = drinkNotes(drink, locale);
  // fa: Persian digits + the Persian unit ("۱۵۰ میلی‌گرم"); en keeps "150 mg".
  const caffeine =
    locale === "fa" ? `${toFaDigits(drink.caffeineMg)} میلی‌گرم` : `${drink.caffeineMg} mg`;
  const size = locale === "fa" ? drink.sizeFa : drink.size;

  return (
    <Dialog open={open} onClose={onClose} title={name} closeLabel={tDialog("close")}>
      <div className="flex flex-col gap-4">
        <Image
          src={drink.image}
          alt={name}
          width={480}
          height={268}
          className="w-full rounded-xl object-cover"
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {drinkDescription(drink, locale)}
        </p>
        <ul className="flex flex-wrap gap-2">
          {notes.map((note) => (
            <li
              key={note}
              className="rounded-full bg-secondary px-3 py-1 text-sm font-medium ring-1 ring-border"
            >
              {note}
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-secondary px-2 py-3 ring-1 ring-border">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {tDialog("size")}
            </p>
            <p className="mt-1 text-sm font-semibold">{size}</p>
          </div>
          <div className="rounded-xl bg-secondary px-2 py-3 ring-1 ring-border">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {tDialog("caffeine")}
            </p>
            <p className="mt-1 text-sm font-semibold">{caffeine}</p>
          </div>
          <div className="rounded-xl bg-secondary px-2 py-3 ring-1 ring-border">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {tDialog("price")}
            </p>
            <Price
              amountToman={drink.priceToman}
              locale={locale === "en" ? "en" : "fa"}
              size="sm"
              className="mt-1 justify-center"
            />
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            add(drink.id);
            notifyAdded(name);
            onClose();
          }}
        >
          {tDialog("addToBag")}
        </Button>
      </div>
    </Dialog>
  );
}
