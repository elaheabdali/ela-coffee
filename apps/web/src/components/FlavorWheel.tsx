"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Check, ChevronDown, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { WordReveal } from "@ela-coffee/ui";
import { formatToman, toFaDigits } from "@ela-coffee/i18n";
import { BRANDS } from "@/data/flavours";
import { useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { FLAVOUR_COUNT, useFlavour } from "@/stores/flavour";
import { useBagToast } from "@/components/BagToast";
import { DrinkThumb } from "./FlavorDialogs";

/**
 * Signed angular distance from the current flavour, wrapped to (-3, 3]
 * — the wheel loops, so flavour 0 is 1 step away from flavour 5.
 * Kept for the scroll mapping and unit tests; the tiles themselves use
 * the reference's raw slot distance (see the wheel below).
 */
export function wrappedDelta(value: number): number {
  return ((((value + 3) % FLAVOUR_COUNT) + FLAVOUR_COUNT) % FLAVOUR_COUNT) - 3;
}

/**
 * Scroll progress (0..1) through the tall hero section maps to a
 * flavour index, looping back to 01 at the end — exactly what the
 * reference does (audit §2: scrolling cycles 01–06 in a loop).
 */
export function flavourIndexForProgress(progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return Math.floor(clamped * FLAVOUR_COUNT) % FLAVOUR_COUNT;
}

/** Two-digit counter, Persian digits in fa ("01 / 06"). */
function pad2(n: number, isFa: boolean): string {
  const s = String(n).padStart(2, "0");
  return isFa ? toFaDigits(s) : s;
}

/**
 * The flavour wheel — rebuilt class-for-class from the reference hero
 * (fix batch 9, ref-home.html + ref-js 0u26thf6sg1fh.js, component
 * `tf`), in the reference's own structure:
 *
 * - <section id="hero" aria-labelledby="hero-title">, height
 *   calc(max(100svh, 40rem) + 275svh); the `.ela-stage` is the sticky
 *   100svh (min 40rem) stage with the radial stage background.
 * - The scene is ALL SIX drink photos layered in one frame
 *   (`.ela-stage-scene`, mask fades top/sides): the active one at
 *   z-[2] with the pour mask while pouring, the previous one kept at
 *   z-[1] underneath so the pour reveals over it, the rest z-0
 *   opacity-0. (Previously a single keyed <Image> remounted on every
 *   change; the layered version is what the reference ships.)
 * - <h1> is absolutely positioned at --headline-top (two WordReveal
 *   spans, "Choose your" / "coffee", <br sm:hidden>), the flavour
 *   label at --label-y and the price chip at --chip-y — not a
 *   bottom-anchored flex stack. The label is a plain fading span
 *   (the reference does not word-reveal it).
 * - The wheel is 15 <button> tiles (slots index-7..index+7, the
 *   reference's `e0`), each a glass ingredient-sprite cut-out with
 *   the SVG chroma-key filter and a `kuro-float` delay of -1.2s per
 *   wrapped drink index. A tile is reachable (tabbable, clickable)
 *   when its slot distance from the current flavour is 1 or 2; the
 *   rest are aria-hidden with tabindex -1. The tile ring's rotation
 *   lives in --rot on the wheel container (the reference's mechanism:
 *   index + live drag offset), and .ela-tile derives --d/--near/
 *   opacity from it (globals.css).
 * - Counter bottom-start: "01 / 06" with progress bars (active w-6
 *   bg-crema, others w-2 bg-cream/25), aria-hidden. Scroll cue
 *   bottom-end: "Scroll to taste" + the kuro-scroll-cue circle, fading
 *   out once the page has scrolled past 1% of the hero.
 * - A sr-only live region announces "{name} selected, {price}" on
 *   flavour change and "{name} added to your bag" on add.
 *
 * Deliberate deviations from the reference (all pre-existing, kept):
 * - The header nav lives in the fixed SiteHeader (hero + scrolled
 *   pill states) instead of inside the sticky stage, so the scrolled
 *   pill can take over after the hero; the hero header itself was
 *   rebuilt class-for-class in fix batch 2.
 * - Drag keeps the fix-batch-3 pointer-capture rule (capture only
 *   after a 10px move, so taps still reach the chip/tiles) and the
 *   60px drag threshold; the reference captures immediately and
 *   snaps on a 1/4-step drag. The [data-no-drag] guard on the chip
 *   is the reference's.
 * - Scroll maps progress to an index with flavourIndexForProgress
 *   (floor) instead of the reference's smoothstep interpolation.
 * - The price chip is h-(--chip) min-w-(--chip) with px-2 instead of
 *   the reference's square size-(--chip): the reference's "$5.40"
 *   fits the square, but our Toman price ("180,000 T" / "۱۸۰٬۰۰۰
 *   تومان") does not. The icon circle is calc(var(--chip) * .44) so
 *   it stays circular at the wider width.
 * - The check shows for 1600 ms (the reference's timeout), its
 *   circle is bg-crema (brand-coloured: tan in coffee, green in
 *   matcha), and the toast still fires.
 * - The reference's hero has no floating ingredient cut-outs and no
 *   contours layer apart from the tiles themselves — the four
 *   .ela-cutout images and the .ela-contours div we rendered before
 *   are removed. The reference also has no featured-flavour button
 *   group and no dot buttons: flavours are reached via the wheel,
 *   the tiles, the dialogs, keyboard, drag and scroll.
 * - Keyboard keeps Home/End as well as the reference's arrows.
 * - Counter/scroll-cue use logical start/end offsets so fa mirrors;
 *   the reference is LTR-only (physical left/right).
 */
export function FlavorWheel() {
  const locale = useLocale();
  const isFa = locale !== "en";
  const tHero = useTranslations("hero");
  const { brand } = useBrand();
  const { index, setIndex, next, prev } = useFlavour();
  const addToBag = useBag((s) => s.add);
  const { notifyAdded } = useBagToast();

  const data = BRANDS[brand];
  const drink = data.drinks[index];
  const drinkName = isFa ? drink.nameFa : drink.nameEn;
  const title = isFa ? data.heroTitleFa : data.heroTitleEn;
  const titleWords = title.split(" ").filter(Boolean);
  const titleLine1 = titleWords.slice(0, 2).join(" ");
  const titleLine2 = titleWords.slice(2).join(" ");

  // Brief "just added" confirmation on the price chip: the check shows
  // for 1.6 s after a click (the reference's timeout), then the bag
  // icon returns so the drink can be added again. The drink id is
  // stored with the state, so switching flavour within the 1.6 s never
  // leaks the check onto another drink.
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const justAddedTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (justAddedTimerRef.current !== null) {
        window.clearTimeout(justAddedTimerRef.current);
      }
    };
  }, []);

  // Scene layering (the reference's `eZ`): the active photo pours in
  // over the previous one. Set during render, like the reference.
  const [scene, setScene] = useState<{
    active: number;
    previous: number | null;
    pouring: boolean;
  }>({ active: index, previous: null, pouring: false });
  if (scene.active !== index) {
    setScene({ active: index, previous: scene.active, pouring: true });
  }

  // sr-only live region (the reference's `h` state): "{name} selected,
  // {price}" on flavour change, "{name} added to your bag" on add.
  const priceText = formatToman(drink.priceToman, isFa ? "fa" : "en");
  const [liveMessage, setLiveMessage] = useState("");
  const firstFlavourRef = useRef(true);
  useEffect(() => {
    if (firstFlavourRef.current) {
      firstFlavourRef.current = false;
      return;
    }
    setLiveMessage(tHero("flavorSelected", { name: drinkName, price: priceText }));
  }, [index, brand, locale, drinkName, priceText, tHero]);

  const sectionRef = useRef<HTMLElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastFocusedOffsetRef = useRef(1);
  const dragRef = useRef<{ id: number; startX: number; dx: number; captured: boolean } | null>(
    null,
  );
  const lastManualRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [scrolledPast, setScrolledPast] = useState(false);

  // Scroll-linked flavour progression (audit §2).
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onScroll = () => {
      if (Date.now() - lastManualRef.current < 1000) return;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.min(Math.max(-rect.top / total, 0), 1);
      setScrolledPast(progress > 0.01);
      const nextIndex = flavourIndexForProgress(progress);
      if (nextIndex !== useFlavour.getState().index) {
        useFlavour.getState().setIndex(nextIndex);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus restoration (the reference's `e0` effect): if the focused
  // tile stops being reachable when the flavour changes, move focus to
  // the tile at the same offset from the new flavour.
  useEffect(() => {
    const wheel = wheelRef.current;
    const active = document.activeElement;
    if (!wheel || !(active instanceof HTMLElement)) return;
    if (!wheel.contains(active) || active.dataset.reachable === "true") return;
    const target = wheel.querySelector<HTMLElement>(
      `[data-slot='${index + lastFocusedOffsetRef.current}']`,
    );
    target?.focus({ preventScroll: true });
  }, [index]);

  const isRtl = () => typeof document !== "undefined" && document.documentElement.dir === "rtl";

  const goNext = () => {
    lastManualRef.current = Date.now();
    next();
  };
  const goPrev = () => {
    lastManualRef.current = Date.now();
    prev();
  };

  // Keyboard (the reference's window-level handler): ArrowLeft/Right
  // cycle the flavours (mirrored in RTL), Home/End jump to the ends.
  // Ignored while a dialog is open or focus is in an editable field —
  // the reference's guard, plus any open role="dialog" in the page.
  // The stage itself is not focusable (the reference's stage isn't
  // either); the <section> is the labelled region.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.key !== "ArrowLeft" &&
          event.key !== "ArrowRight" &&
          event.key !== "Home" &&
          event.key !== "End")
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
      ) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      lastManualRef.current = Date.now();
      const flavour = useFlavour.getState();
      const rtl = document.documentElement.dir === "rtl";
      if (event.key === "ArrowRight") {
        if (rtl) flavour.prev();
        else flavour.next();
      } else if (event.key === "ArrowLeft") {
        if (rtl) flavour.next();
        else flavour.prev();
      } else if (event.key === "Home") {
        flavour.setIndex(0);
      } else {
        flavour.setIndex(FLAVOUR_COUNT - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // The reference ignores drags starting on [data-no-drag] targets
    // (header, price chip): a tap there must reach the control.
    if ((event.target as HTMLElement).closest("[data-no-drag]")) return;
    dragRef.current = { id: event.pointerId, startX: event.clientX, dx: 0, captured: false };
    // Deliberately no setPointerCapture here: capturing on pointerdown
    // retargets the following click to this region, so taps on the
    // price chip, the tiles and the dots never fired their onClick
    // (fix batch 3). Capture happens in handlePointerMove, once a
    // real drag has started.
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    drag.dx = event.clientX - drag.startX;
    setDragOffset(Math.max(-1, Math.min(1, drag.dx / 140)));
    // Capture only once the pointer has moved 10px: a tap never moves
    // that far, so its click still reaches the button it landed on,
    // while a drag that leaves the element keeps working.
    if (!drag.captured && Math.abs(drag.dx) > 10) {
      drag.captured = true;
      // jsdom (tests) has no setPointerCapture — guard it.
      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    setDragOffset(0);
    if (Math.abs(drag.dx) <= 60) return;
    // Drag left = next flavour in LTR; mirrored in RTL.
    const nextFlavour = isRtl() ? drag.dx > 0 : drag.dx < 0;
    if (nextFlavour) goNext();
    else goPrev();
  };

  const handleAddToBag = () => {
    addToBag(drink.id);
    notifyAdded(drinkName);
    setLiveMessage(tHero("flavorAdded", { name: drinkName }));
    setJustAddedId(drink.id);
    if (justAddedTimerRef.current !== null) {
      window.clearTimeout(justAddedTimerRef.current);
    }
    justAddedTimerRef.current = window.setTimeout(() => {
      justAddedTimerRef.current = null;
      setJustAddedId(null);
    }, 1600);
  };

  const slots = Array.from({ length: 15 }, (_, i) => index - 7 + i);

  return (
    <section
      id="hero"
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative w-full"
      style={{ height: "calc(max(100svh, 40rem) + 275svh)" }}
    >
      <div className="sticky top-0 h-svh min-h-[40rem] w-full overflow-clip sm:min-h-[37.5rem]">
        <div
          data-testid="hero-stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ touchAction: "pan-y" }}
          className="ela-stage isolate touch-pan-y select-none text-cream"
        >
          {/* The scene: all six drink photos layered in one masked
              frame; the active one pours in over the previous one. */}
          <div className="ela-stage-scene ela-glass pointer-events-none absolute left-1/2 top-(--scene-top) z-10 h-(--s) w-(--scene-w) -translate-x-1/2">
            {data.drinks.map((sceneDrink, i) => {
              const isActive = i === index;
              const isPrevious = i === scene.previous;
              return (
                <Image
                  key={sceneDrink.id}
                  src={sceneDrink.image}
                  alt={isActive ? (isFa ? sceneDrink.nameFa : sceneDrink.nameEn) : ""}
                  aria-hidden={!isActive}
                  fill
                  draggable={false}
                  priority={i === 0}
                  loading={i === 0 ? undefined : "lazy"}
                  sizes="(max-width: 639px) 250vw, 180vh"
                  className={
                    isActive
                      ? `object-cover z-[2] opacity-100${scene.pouring ? " ela-pour-mask animate-ela-pour" : ""}`
                      : isPrevious
                        ? "object-cover z-[1] opacity-100"
                        : "object-cover z-0 opacity-0"
                  }
                />
              );
            })}
          </div>

          {/* Invisible measure of the wheel step, used by the
              reference's drag math (kept for structure; our drag
              still divides by the tested 140px step). */}
          <span
            aria-hidden="true"
            className="pointer-events-none invisible absolute left-0 top-0 h-px w-(--wheel-d1)"
          />

          <h1
            id="hero-title"
            aria-label={title}
            className="pointer-events-none absolute inset-x-0 top-(--headline-top) z-10 px-5 text-center font-display text-(length:--h-size) font-medium leading-[1.04] tracking-[-0.03em] text-cream [text-shadow:0_6px_40px_rgb(0_0_0/0.5)] sm:whitespace-nowrap"
          >
            <span className="block">
              <WordReveal as="span" variant="soft" delayMs={250} text={titleLine1} />
              {titleLine2 ? (
                <>
                  {" "}
                  <br className="sm:hidden" />
                  {/* Second line starts at word index 2 in the
                      reference (+2 × 65ms stagger). */}
                  <WordReveal as="span" variant="soft" delayMs={380} text={titleLine2} />
                </>
              ) : null}
            </span>
          </h1>

          {/* The wheel: 15 tiles, slots index-7..index+7. */}
          <div
            ref={wheelRef}
            role="group"
            aria-label={tHero("flavors")}
            style={{ "--rot": index + dragOffset } as CSSProperties}
            className="animate-ela-wheel-in absolute left-1/2 top-(--wheel-y) z-20 size-0"
          >
            {slots.map((slot) => {
              const wrapped = ((slot % FLAVOUR_COUNT) + FLAVOUR_COUNT) % FLAVOUR_COUNT;
              const tileDrink = data.drinks[wrapped];
              const distance = slot - index;
              const reachable = distance !== 0 && Math.abs(distance) <= 2;
              const tileName = isFa ? tileDrink.nameFa : tileDrink.nameEn;
              return (
                <button
                  key={slot}
                  type="button"
                  data-slot={slot}
                  data-reachable={reachable}
                  tabIndex={reachable ? 0 : -1}
                  aria-hidden={!reachable}
                  aria-label={tHero("chooseFlavor", { name: tileName })}
                  title={tileName}
                  onFocus={() => {
                    lastFocusedOffsetRef.current = distance;
                  }}
                  onClick={() => {
                    lastManualRef.current = Date.now();
                    setIndex(
                      ((slot % FLAVOUR_COUNT) + FLAVOUR_COUNT) % FLAVOUR_COUNT,
                    );
                  }}
                  style={{ "--v": slot } as CSSProperties}
                  className="ela-tile group absolute left-[calc(var(--tile)/-2)] top-[calc(var(--tile)/-2)] size-(--tile) cursor-pointer rounded-[24%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema data-[reachable=false]:pointer-events-none"
                >
                  <span
                    className="animate-ela-float block size-full"
                    style={{ animationDelay: `${-1.2 * wrapped}s` }}
                  >
                    <DrinkThumb
                      drink={tileDrink}
                      spriteSheet={data.spriteSheet}
                      glass
                      eager
                      sizes="(max-width: 639px) 320px, 800px"
                      className="size-full rounded-[24%] transition-[scale] duration-300 ease-out group-hover:scale-[1.06] group-active:scale-95"
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Flavour label. */}
          <p className="pointer-events-none absolute inset-x-0 top-(--label-y) z-10 -translate-y-1/2 text-center font-display text-(length:--label-size) font-medium leading-none tracking-[-0.02em] text-cream [text-shadow:0_2px_22px_rgb(0_0_0/0.6)]">
            <span key={drink.id} className="ela-label-in inline-block">
              {isFa ? drink.shortFa : drink.shortEn}
            </span>
          </p>

          {/* Price chip / Add to bag. */}
          <button
            type="button"
            data-no-drag="true"
            onClick={handleAddToBag}
            aria-label={tHero("addToBagWithPrice", { name: drinkName, price: priceText })}
            className="absolute left-1/2 top-(--chip-y) z-20 flex h-(--chip) min-w-(--chip) -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center gap-1 rounded-[30%] bg-cream px-2 text-espresso shadow-[0_20px_44px_-16px_rgb(0_0_0/0.85)] ring-1 ring-black/10 transition-[scale] duration-200 ease-out hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema active:scale-95"
          >
            <span
              key={drink.id}
              className="ela-price-in whitespace-nowrap text-[0.6875rem] font-bold leading-none tabular-nums"
            >
              {priceText}
            </span>
            <span
              className={`grid size-[calc(var(--chip)*0.44)] place-items-center rounded-full transition-colors duration-300 ${
                justAddedId === drink.id ? "bg-crema text-espresso" : "bg-espresso text-cream"
              }`}
            >
              {justAddedId === drink.id ? (
                <Check size={16} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <ShoppingBag size={16} aria-hidden="true" />
              )}
            </span>
          </button>

          {/* Counter + progress bars, bottom-start. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-5 start-4 z-20 hidden max-sm:block sm:bottom-8 sm:start-8 lg:block"
          >
            <p className="font-display font-medium leading-none tabular-nums text-cream">
              <span className="text-2xl sm:text-3xl">{pad2(index + 1, isFa)}</span>
              <span className="text-sm text-cream/50"> / {pad2(FLAVOUR_COUNT, isFa)}</span>
            </p>
            <div className="mt-2.5 flex items-center gap-1">
              {data.drinks.map((barDrink, i) => (
                <span
                  key={barDrink.id}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === index ? "w-6 bg-crema" : "w-2 bg-cream/25"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Scroll cue, bottom-end. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-5 end-4 z-20 hidden items-center gap-2 text-xs font-medium text-cream/70 transition-opacity duration-500 max-sm:flex sm:bottom-8 sm:end-8 lg:flex ${
              scrolledPast ? "opacity-0" : "opacity-100"
            }`}
          >
            <span>{tHero("scrollCue")}</span>
            <span className="animate-ela-scroll-cue grid size-7 place-items-center rounded-full border border-cream/20">
              <ChevronDown size={16} aria-hidden="true" />
            </span>
          </div>

          {/* sr-only live region (the reference's role="status" <p>). */}
          <p role="status" aria-live="polite" data-testid="hero-live-region" className="sr-only">
            {liveMessage}
          </p>
        </div>
      </div>
    </section>
  );
}
