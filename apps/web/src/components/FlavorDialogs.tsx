"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatToman, toFaDigits } from "@ela-coffee/i18n";
import { ALL_DRINKS, BRANDS, type Drink } from "@/data/flavours";
import { bagSubtotal, useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useFlavour } from "@/stores/flavour";
import { useBagToast } from "./BagToast";

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
 * Ingredient-sprite thumbnail (the reference's `eQ`): a cell of the
 * brand's sprite sheet, shown at 390% × 260% with the dataset's
 * sprite offsets. The `glass` variant is the wheel tile: it carries
 * the reference's SVG chroma-key filter (feColorMatrix, keying the
 * blue screen) and the .ela-glass-photo layer; the plain variant
 * (panel rows) is the same cell on a bg-cream tile.
 */
export function DrinkThumb({
  drink,
  spriteSheet,
  glass = false,
  sizes = "96px",
  className = "",
  eager = false,
}: {
  drink: Drink;
  spriteSheet: string;
  glass?: boolean;
  sizes?: string;
  className?: string;
  /**
   * Eager-load the sprite: the hero wheel tiles sit far outside the
   * viewport (slots ±7), so a lazy image there never intersects it —
   * Firefox never starts the fetch and `img.complete` stays false
   * forever (the visual suite's all-images wait timed out in every
   * viewport). The tiles are above the fold by design, and the
   * sprite is one shared URL, so eager costs a single fetch. Menu /
   * dialog thumbs keep the lazy default.
   */
  eager?: boolean;
}) {
  const filterId = `ela-cutout-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <span
      className={`relative block overflow-hidden ${glass ? "ela-tile-glass" : "bg-cream"} ${className}`}
    >
      {glass ? (
        <svg aria-hidden="true" className="absolute size-0">
          <filter
            id={filterId}
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  6 6 -6 0 1.2"
            />
          </filter>
        </svg>
      ) : null}
      <span
        className={`absolute inset-0 block ${glass ? "ela-glass-photo" : ""}`}
        style={glass ? { filter: `url(#${filterId})` } : undefined}
      >
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
            src={spriteSheet}
            alt=""
            fill
            draggable={false}
            sizes={sizes}
            loading={eager ? "eager" : undefined}
            className="object-cover"
          />
        </span>
      </span>
    </span>
  );
}

/**
 * Anchored panel shell (the reference's `ta`): an absolutely
 * positioned popover under the header pill — role="dialog", NOT a
 * modal (no overlay, no aria-modal, no focus trap). It focuses
 * itself on mount; the parent closes it on Escape / outside
 * pointerdown and returns focus to the trigger button.
 *
 * Contrast (measured 2026-11-26, both brands, panel bg roast/95
 * over the dark stage): the reference's literal text colours all
 * pass WCAG AA — cream/50 4.63:1 ela / 4.56:1 midori, cream/55
 * 5.37/5.21, cream/60 6.18/5.93, cream/70 7.95/7.54, cream/85
 * 11.33/10.51, crema 7.95/8.40, espresso/60 on cream 4.85/4.56 —
 * so no values were bumped.
 */
export function HeroPanel({
  id,
  label,
  panelRef,
  children,
}: {
  id: string;
  label: string;
  panelRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [panelRef]);
  return (
    <div
      id={id}
      ref={panelRef}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      className="ela-panel-in absolute left-1/2 top-full z-40 mt-3 max-h-[min(34rem,calc(100svh_-_6rem))] w-[min(23rem,calc(100vw_-_2rem))] -translate-x-1/2 origin-top overflow-y-auto rounded-[1.75rem] border border-cream/10 bg-roast/95 p-2 text-cream shadow-[0_40px_90px_-30px_rgb(0_0_0/0.9)] outline-none backdrop-blur-xl"
    >
      {children}
    </div>
  );
}

export interface AllFlavorsPanelProps {
  onPick: (index: number) => void;
}

/**
 * All-flavours panel (the reference's `tt`): all 6 drinks of the
 * current brand with sprite thumbnail, name, tasting notes and price.
 * The current flavour carries a crema check; clicking a row jumps the
 * wheel to that flavour and closes the panel (the parent closes it
 * via onPick).
 */
export function AllFlavorsPanel({ onPick }: AllFlavorsPanelProps) {
  const tHero = useTranslations("hero");
  const locale = useLocale();
  const { brand } = useBrand();
  const { index } = useFlavour();
  const drinks = BRANDS[brand].drinks;
  const separator = locale === "fa" ? "، " : ", ";

  return (
    <>
      <p className="px-3 pb-2 pt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-cream/50">
        {tHero("allFlavors")}
      </p>
      <ul className="flex flex-col gap-0.5">
        {drinks.map((drink, i) => {
          const isCurrent = i === index;
          return (
            <li key={drink.id}>
              <button
                type="button"
                onClick={() => onPick(i)}
                aria-current={isCurrent ? "true" : undefined}
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-cream/[0.06] focus-visible:outline-2 focus-visible:outline-crema aria-[current=true]:bg-cream/10"
              >
                <DrinkThumb
                  drink={drink}
                  spriteSheet={BRANDS[brand].spriteSheet}
                  className="size-11 shrink-0 rounded-xl"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[0.9375rem] font-medium leading-tight text-cream">
                    {drinkName(drink, locale)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-cream/55">
                    {drinkNotes(drink, locale).join(separator)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-cream/85">
                  {formatToman(drink.priceToman, locale === "en" ? "en" : "fa")}
                </span>
                <Check
                  size={16}
                  aria-hidden="true"
                  className={`size-4 shrink-0 text-crema ${isCurrent ? "" : "invisible"}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export interface TastingNotesPanelProps {
  drink: Drink;
}

/**
 * Tasting-notes panel (the reference's `tr`): sprite thumbnail,
 * title, description, the same 3 tasting notes the menu cards use,
 * a 3-cell Size / Caffeine / Price strip, and an Add to bag button.
 *
 * The Add button follows the batch-9 transient spec (shared with the
 * menu card): local state, on click add + set true, reset after
 * 1400 ms; while active it keeps bg-cream (NO crema switch), the
 * icon becomes a Check (strokeWidth 2.5, size-4), the text becomes
 * "Added to your bag" and the price span is hidden. The batch-5
 * cream toast still fires, and the panel stays open (the reference
 * never closes it on add).
 */
export function TastingNotesPanel({ drink }: TastingNotesPanelProps) {
  const tDialog = useTranslations("dialog");
  const tHero = useTranslations("hero");
  const locale = useLocale();
  const { add } = useBag();
  const { notifyAdded } = useBagToast();
  const { brand } = useBrand();

  const [added, setAdded] = useState(false);
  const addedTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  const name = drinkName(drink, locale);
  const notes = drinkNotes(drink, locale);
  // fa: Persian digits + the Persian unit ("۱۵۰ میلی‌گرم"); en keeps "150 mg".
  const caffeine =
    locale === "fa" ? `${toFaDigits(drink.caffeineMg)} میلی‌گرم` : `${drink.caffeineMg} mg`;
  const size = locale === "fa" ? drink.sizeFa : drink.size;
  const price = formatToman(drink.priceToman, locale === "en" ? "en" : "fa");

  const handleAdd = () => {
    add(drink.id);
    notifyAdded(name);
    setAdded(true);
    if (addedTimerRef.current !== null) {
      window.clearTimeout(addedTimerRef.current);
    }
    addedTimerRef.current = window.setTimeout(() => {
      addedTimerRef.current = null;
      setAdded(false);
    }, 1400);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-2">
        <DrinkThumb
          drink={drink}
          spriteSheet={BRANDS[brand].spriteSheet}
          className="size-14 shrink-0 rounded-2xl"
        />
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-cream/50">
            {tHero("tastingNotes")}
          </p>
          <h2 className="mt-1 font-display text-xl font-medium leading-tight text-cream">
            {name}
          </h2>
        </div>
      </div>
      <p className="px-2 pt-1 text-sm leading-relaxed text-cream/75">
        {drinkDescription(drink, locale)}
      </p>
      <ul aria-label={tHero("tastingNotes")} className="flex flex-wrap gap-1.5 px-2 pt-3">
        {notes.map((note) => (
          <li
            key={note}
            className="rounded-full border border-cream/15 px-2.5 py-1 text-xs text-cream/85"
          >
            {note}
          </li>
        ))}
      </ul>
      <dl className="mx-2 mt-4 grid grid-cols-3 rounded-2xl bg-cream/5 py-3 text-center">
        <div>
          <dt className="text-[0.6875rem] text-cream/50">{tDialog("size")}</dt>
          <dd className="mt-0.5 text-sm font-semibold">{size}</dd>
        </div>
        <div className="border-x border-cream/10">
          <dt className="text-[0.6875rem] text-cream/50">{tDialog("caffeine")}</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{caffeine}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] text-cream/50">{tDialog("price")}</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{price}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-espresso transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
      >
        {added ? (
          <Check size={16} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <ShoppingBag size={16} aria-hidden="true" />
        )}
        <span>{added ? tDialog("addedToBag") : tDialog("addToBag")}</span>
        {!added ? <span className="tabular-nums text-espresso/60">{price}</span> : null}
      </button>
    </>
  );
}

export interface BagPanelProps {
  /** Open the bag drawer (checkout flow) — the panel closes first. */
  onCheckout: () => void;
}

/**
 * Bag panel (the reference's `e9`): bag contents with quantity
 * steppers, line totals, subtotal and Clear bag — wired to the real
 * bag store, not a mock. The reference has no checkout at all (its
 * bag is a local list only); the Checkout button below is a
 * deliberate addition that opens our existing bag drawer, which is
 * where the real order flow lives.
 */
export function BagPanel({ onCheckout }: BagPanelProps) {
  const tBag = useTranslations("bag");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const isFa = locale === "fa";
  const { items, setQty, clear } = useBag();

  const byId = new Map(ALL_DRINKS.map((d) => [d.id, d]));
  const lines = items
    .map((item) => ({ item, drink: byId.get(item.drinkId) }))
    .filter((line): line is { item: (typeof items)[number]; drink: Drink } => Boolean(line.drink));
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const countText =
    count === 1
      ? tBag("oneDrink")
      : tBag("drinksCount", { count: isFa ? toFaDigits(count) : String(count) });

  return (
    <>
      <div className="flex items-center justify-between px-3 pb-2 pt-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-cream/50">
          {tBag("title")}
        </p>
        {count > 0 ? <p className="text-xs text-cream/55">{countText}</p> : null}
      </div>
      {lines.length === 0 ? (
        <div className="flex flex-col items-center px-6 pb-6 pt-3 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-cream/5 text-cream/60">
            <ShoppingBag size={20} aria-hidden="true" />
          </span>
          <p className="mt-3 font-display text-lg font-medium text-cream">{tBag("empty")}</p>
          <p className="mt-1 text-sm text-cream/60">{tBag("emptyHint")}</p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-0.5">
            {lines.map(({ item, drink }) => {
              const name = drinkName(drink, locale);
              const brand = BRANDS[drink.brand];
              return (
                <li key={drink.id} className="flex items-center gap-3 rounded-2xl p-2">
                  <DrinkThumb
                    drink={drink}
                    spriteSheet={brand.spriteSheet}
                    className="size-11 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[0.9375rem] font-medium leading-tight text-cream">
                      {name}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-cream/55">
                      {formatToman(drink.priceToman * item.qty, locale === "en" ? "en" : "fa")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center rounded-full border border-cream/15 p-0.5">
                    <button
                      type="button"
                      onClick={() => setQty(drink.id, item.qty - 1)}
                      aria-label={tBag("removeOne", { name })}
                      className="grid size-8 cursor-pointer place-items-center rounded-full text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream focus-visible:outline-2 focus-visible:outline-crema"
                    >
                      <Minus size={14} aria-hidden="true" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums">
                      {isFa ? toFaDigits(item.qty) : item.qty}
                      <span className="sr-only">
                        {isFa ? " در سبدت" : " in your bag"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(drink.id, item.qty + 1)}
                      aria-label={tBag("addOneMore", { name })}
                      className="grid size-8 cursor-pointer place-items-center rounded-full text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream focus-visible:outline-2 focus-visible:outline-crema"
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mx-2 mt-2 flex items-center justify-between border-t border-cream/10 px-1 pb-1 pt-3">
            <span className="text-sm text-cream/70">{tBag("subtotal")}</span>
            <span className="font-display text-xl font-medium tabular-nums text-cream">
              {formatToman(bagSubtotal(items), locale === "en" ? "en" : "fa")}
            </span>
          </div>
          <button
            type="button"
            onClick={clear}
            className="mt-2 w-full cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-medium text-cream/70 transition-colors hover:bg-cream/5 hover:text-cream focus-visible:outline-2 focus-visible:outline-crema"
          >
            {tBag("clear")}
          </button>
          <button
            type="button"
            onClick={onCheckout}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-espresso transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
          >
            <ShoppingBag size={16} aria-hidden="true" />
            {tCheckout("title")}
          </button>
        </>
      )}
    </>
  );
}
