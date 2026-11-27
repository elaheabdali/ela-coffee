"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Info, LayoutGrid, ShoppingBag, Shuffle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toFaDigits } from "@ela-coffee/i18n";
import { BRANDS } from "@/data/flavours";
import { bagCount, useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useFlavour } from "@/stores/flavour";

/**
 * The flavour panels load on demand in their own chunk (architecture
 * §12 "dialogs lazy"): they are only mounted while open, so the chunk
 * is fetched on the first open, not on page load.
 */
const AllFlavorsPanel = dynamic(() =>
  import("./FlavorDialogs").then((m) => m.AllFlavorsPanel),
);
const TastingNotesPanel = dynamic(() =>
  import("./FlavorDialogs").then((m) => m.TastingNotesPanel),
);
const BagPanel = dynamic(() => import("./FlavorDialogs").then((m) => m.BagPanel));
const HeroPanel = dynamic(() => import("./FlavorDialogs").then((m) => m.HeroPanel));

type Panel = "flavors" | "notes" | "bag";

const PANEL_IDS: Record<Panel, string> = {
  flavors: "kuro-panel-flavors",
  notes: "kuro-panel-notes",
  bag: "kuro-panel-bag",
};

/**
 * Top-centre glass pill (audit §2, reference hero nav, fix batch 2):
 * All flavors, Tasting notes, Surprise me, and the bag with a count
 * badge — `rounded-[1.15rem] border-cream/10 bg-espresso/45
 * backdrop-blur-md` with the reference's shadow, icon buttons
 * `size-9 sm:size-10 rounded-[0.85rem] text-cream/75`, and the bag
 * button on `bg-espresso` with the crema badge (`bg-crema
 * text-espresso ring-2 ring-espresso`, the reference's `kuro-bump`).
 * The badge is keyed by the count so the `ela-bump` animation
 * re-triggers on every add.
 *
 * The three dialog buttons open the reference's ANCHORED PANELS (fix
 * batch 9, ref-js `tm`/`ta`) — a popover positioned under the pill,
 * not a centred modal: one panel at a time, toggled by its button,
 * closed by Escape (focus returns to the trigger) or by a pointerdown
 * outside the pill + panel. The open button carries
 * aria-haspopup="dialog", aria-expanded and aria-controls; while open
 * it is highlighted (bg-cream/15, or bg-black + ring-cream/25 for the
 * dark bag button). Surprise me has no panel: it jumps straight to a
 * random other flavour, exactly like the reference's `q`.
 *
 * The bag button's accessible name is the reference's dynamic label
 * ("Your bag, empty" / "Your bag, 3 drinks"); the bag panel's
 * Checkout button closes the panel and opens the existing bag drawer,
 * where the real order flow lives.
 */
export function FlavorControls() {
  const tHero = useTranslations("hero");
  const tBag = useTranslations("bag");
  const locale = useLocale();
  const isFa = locale === "fa";
  const { brand } = useBrand();
  const { index, setIndex, surprise } = useFlavour();
  const { items, openBag } = useBag();
  const [panel, setPanel] = useState<Panel | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<Panel, HTMLButtonElement | null>>({
    flavors: null,
    notes: null,
    bag: null,
  });

  const count = bagCount(items);
  const drink = BRANDS[brand].drinks[index];

  // Close on Escape (focus returns to the trigger) or on a pointerdown
  // outside the pill + panel (the reference's `tm` effect).
  useEffect(() => {
    if (!panel) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setPanel(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
        triggerRefs.current[panel]?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panel]);

  const togglePanel = (next: Panel) => {
    setPanel((current) => (current === next ? null : next));
  };

  const countText =
    count === 1
      ? tBag("oneDrink")
      : tBag("drinksCount", { count: isFa ? toFaDigits(count) : String(count) });
  const bagLabel = count === 0 ? tBag("emptyLabel") : `${tBag("title")}, ${countText}`;

  const iconButtonClass =
    "relative grid size-9 cursor-pointer place-items-center rounded-[0.85rem] text-cream/75 transition-[scale,background-color,color] duration-200 hover:bg-cream/10 hover:text-cream active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema sm:size-10";
  const badgeClass =
    "animate-ela-bump absolute -end-1.5 -top-1.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-crema px-1 text-[0.625rem] font-bold leading-none text-espresso ring-2 ring-espresso";

  const panelButton = (name: Panel, label: string, dark: boolean, icon: ReactNode) => {
    const open = panel === name;
    return (
      <button
        ref={(el) => {
          triggerRefs.current[name] = el;
        }}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? PANEL_IDS[name] : undefined}
        onClick={() => togglePanel(name)}
        className={`${iconButtonClass} ${dark ? "bg-espresso text-cream hover:bg-black" : ""} ${
          open ? (dark ? "bg-black ring-1 ring-cream/25" : "bg-cream/15 text-cream") : ""
        }`}
      >
        {icon}
      </button>
    );
  };

  const panelLabel =
    panel === "notes"
      ? isFa
        ? drink.nameFa
        : drink.nameEn
      : panel === "bag"
        ? tBag("title")
        : tHero("allFlavors");

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-1 rounded-[1.15rem] border border-cream/10 bg-espresso/45 p-1 shadow-[0_12px_32px_-14px_rgb(0_0_0/0.7)] backdrop-blur-md">
        {panelButton(
          "flavors",
          tHero("allFlavors"),
          false,
          <LayoutGrid size={16} aria-hidden="true" />,
        )}
        {panelButton(
          "notes",
          tHero("tastingNotes"),
          false,
          <Info size={16} aria-hidden="true" />,
        )}
        <button
          type="button"
          aria-label={tHero("surpriseMe")}
          title={tHero("surpriseMe")}
          onClick={surprise}
          className={iconButtonClass}
        >
          <Shuffle size={16} aria-hidden="true" />
        </button>
        {panelButton(
          "bag",
          bagLabel,
          true,
          <>
            <ShoppingBag size={16} aria-hidden="true" />
            {count > 0 ? (
              <span key={count} data-testid="bag-count" className={badgeClass}>
                {isFa ? toFaDigits(count) : count}
              </span>
            ) : null}
          </>,
        )}
      </div>
      {panel ? (
        <HeroPanel id={PANEL_IDS[panel]} label={panelLabel} panelRef={panelRef}>
          {panel === "flavors" ? (
            <AllFlavorsPanel
              onPick={(i) => {
                setIndex(i);
                setPanel(null);
              }}
            />
          ) : panel === "notes" ? (
            <TastingNotesPanel drink={drink} />
          ) : (
            <BagPanel
              onCheckout={() => {
                setPanel(null);
                openBag();
              }}
            />
          )}
        </HeroPanel>
      ) : null}
    </div>
  );
}
