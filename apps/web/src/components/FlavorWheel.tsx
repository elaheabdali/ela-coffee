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

/**
 * Signed angular distance from the current flavour, wrapped to (-3, 3]
 * — the wheel loops, so flavour 0 is 1 step away from flavour 5.
 * This is the `--d` of audit §3.5 (`--d = var - rot - intro`).
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

const FLOAT_DELAYS = ["0s", "-2.4s", "-4.8s", "-1.2s"];

/**
 * The flavour wheel (audit §3.5) — the heart of the page.
 *
 * Geometry: the `.ela-stage` (globals.css) is a `container-type: size`
 * box whose `--s` sizes everything (1.7917:1 frame, wheel radius 1.6×s,
 * 10.5° steps). Each flavour is a `.ela-tile` positioned at the wheel
 * pivot (centre-x, cup-cy + wheel-r) and swung onto the ring by the
 * audit's transform — rotate(d * 10.5deg) translateY(-wheel-r - s*.3*near)
 * scale(1 - .55*near) — with `--d` / `--near` set here from the store.
 *
 * Interpretation note: in the reference the tiles sit BEHIND the big
 * cup photo (`.ela-glass-photo`, z-index 1) — no tile fan is visible
 * in the resting hero (see baseline-1920px.png). We reproduce that:
 * the tiles carry the real rotation state and animate on every change,
 * while the visible wheel is the pour-masked cup, the flavour name,
 * the price pill, the dots and the floating cut-outs. Making the fan
 * visible later is a one-line z-index change.
 *
 * Driving the wheel: drag/swipe (Pointer Events, threshold 60 px),
 * scroll (the hero is a 300vh tall section with a sticky 100svh
 * stage — scroll position cycles the flavours in a loop), keyboard
 * (ArrowLeft/ArrowRight, mirrored in RTL), dots, featured buttons,
 * and the All-flavours dialog. Drag and arrows mirror in RTL
 * (architecture §10: the wheel rotates the other way).
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
  // Brief "just added" confirmation on the price chip (fix batch 4):
  // the check shows for 1.5 s after a click, then the bag icon returns
  // so the drink can be added again. The drink id is stored with the
  // state, so switching flavour within the 1.5 s never leaks the check
  // onto another drink — the chip only shows it while the ids match.
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const justAddedTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (justAddedTimerRef.current !== null) {
        window.clearTimeout(justAddedTimerRef.current);
      }
    };
  }, []);
  const featured = data.drinks.filter((d) => d.featured);

  const sectionRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ id: number; startX: number; dx: number; captured: boolean } | null>(
    null,
  );
  const lastManualRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

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
      const nextIndex = flavourIndexForProgress(progress);
      if (nextIndex !== useFlavour.getState().index) {
        useFlavour.getState().setIndex(nextIndex);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isRtl = () => typeof document !== "undefined" && document.documentElement.dir === "rtl";

  const goNext = () => {
    lastManualRef.current = Date.now();
    next();
  };
  const goPrev = () => {
    lastManualRef.current = Date.now();
    prev();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRef.current = { id: event.pointerId, startX: event.clientX, dx: 0, captured: false };
    // Deliberately no setPointerCapture here: capturing on pointerdown
    // retargets the following click to this region, so taps on the
    // price chip, the dots and the featured buttons never fired their
    // onClick (fix batch 3). Capture happens in handlePointerMove,
    // once a real drag has started.
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (isRtl()) goPrev();
      else goNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (isRtl()) goNext();
      else goPrev();
    } else if (event.key === "Home") {
      event.preventDefault();
      lastManualRef.current = Date.now();
      setIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      lastManualRef.current = Date.now();
      setIndex(FLAVOUR_COUNT - 1);
    }
  };

  const handleAddToBag = () => {
    addToBag(drink.id);
    notifyAdded(isFa ? drink.nameFa : drink.nameEn);
    setJustAddedId(drink.id);
    if (justAddedTimerRef.current !== null) {
      window.clearTimeout(justAddedTimerRef.current);
    }
    justAddedTimerRef.current = window.setTimeout(() => {
      justAddedTimerRef.current = null;
      setJustAddedId(null);
    }, 1500);
  };

  const priceText = formatToman(drink.priceToman, isFa ? "fa" : "en");
  const counter = isFa
    ? `${toFaDigits(index + 1)} / ${toFaDigits(FLAVOUR_COUNT)}`
    : `${index + 1} / ${FLAVOUR_COUNT}`;

  return (
    <section id="hero" ref={sectionRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div
          role="region"
          aria-label={isFa ? data.heroTitleFa : data.heroTitleEn}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ touchAction: "pan-y" }}
          className="ela-stage animate-ela-wheel-in"
        >
          <div aria-hidden="true" className="ela-contours absolute inset-0 opacity-60" />

          {/* The cup: the audit's 16:9 scene frame (audit §3.5) —
              width var(--scene-w), height var(--s), top var(--scene-top),
              centred. On desktop the frame is (near-)full-bleed; on
              mobile it is a strip anchored to the bottom, so the cup
              stays small and the H1 floats in the dark space above it,
              exactly like the reference. The pour mask runs on flavour
              change; the scene mask fades the strip's edges. */}
          <div className="ela-glass absolute left-1/2 top-(--scene-top) z-10 h-(--s) w-(--scene-w) -translate-x-1/2">
            <Image
              key={`${brand}-${drink.id}`}
              src={drink.image}
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 900px, 100vw"
              className="ela-stage-scene ela-glass-photo animate-ela-pour ela-pour-mask object-cover"
            />
          </div>

          {/* The tile ring (audit §3.5) — behind the cup photo, as in the
              reference: the ring carries the real rotation state (its
              transform animates on every flavour change) but the tiles
              themselves are not visible in the resting hero. The ring
              wrapper sits at z-0 under the scene (z-10); the cut-outs
              (z-20) and the bottom block (z-30) stay above the scene. */}
          <div aria-hidden="true" className="absolute inset-0 z-0">
            {data.drinks.map((tileDrink, i) => {
              const d = wrappedDelta(i - (index + dragOffset));
              const near = Math.min(Math.abs(d), 3) / 3;
              return (
                <div
                  key={tileDrink.id}
                  className="ela-tile"
                  style={{ "--d": String(d), "--near": String(near) } as CSSProperties}
                >
                  <Image src={tileDrink.image} alt="" fill sizes="160px" className="object-cover" />
                </div>
              );
            })}
          </div>

          {/* Floating ingredient cut-outs (ela-float 7s, staggered delays). */}
          {data.cutouts.map((cutout, i) => {
            const positions = [
              "start-[4%] top-[26%] max-sm:top-[60%]",
              "start-[16%] top-[56%] max-sm:top-[74%]",
              "end-[5%] top-[30%] max-sm:top-[64%]",
              "end-[15%] top-[58%] max-sm:top-[78%]",
            ];
            return (
              <div
                key={cutout.src}
                aria-hidden="true"
                className={`ela-cutout animate-ela-float absolute z-20 w-16 sm:w-24 lg:w-32 ${positions[i % positions.length]}`}
                style={{ animationDelay: FLOAT_DELAYS[i % FLOAT_DELAYS.length] }}
              >
                <Image
                  src={cutout.src}
                  alt=""
                  width={400}
                  height={400}
                  sizes="128px"
                  className="h-auto w-full object-contain"
                />
              </div>
            );
          })}

          {/* Flavour name, price/add pill, featured buttons, H1.
              On mobile the block dissolves (display: contents) and the
              label / chip / H1 anchor to the audit's --label-y /
              --chip-y / --headline-top, so the H1 floats above the
              scene strip like the reference; on ≥640px they stay in
              the bottom-anchored stack. */}
          <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-4 pb-20 max-sm:contents sm:pb-24">
            <div
              aria-live="polite"
              className="max-sm:absolute max-sm:left-1/2 max-sm:top-(--label-y) max-sm:z-30 max-sm:-translate-x-1/2 max-sm:-translate-y-1/2"
            >
              <WordReveal
                key={`${brand}-${drink.id}`}
                as="p"
                text={isFa ? drink.shortFa : drink.shortEn}
                className="text-center font-display text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-none tracking-[-0.02em] text-foreground"
              />
            </div>

            <button
              type="button"
              onClick={handleAddToBag}
              aria-label={tHero("addToBagWithPrice", {
                name: isFa ? drink.nameFa : drink.nameEn,
                price: priceText,
              })}
              className="mt-1 flex flex-col items-center gap-1 rounded-[1.25rem] bg-cream px-4 py-2 text-espresso shadow-ela-lift transition-transform hover:scale-105 active:scale-95 max-sm:absolute max-sm:left-1/2 max-sm:top-(--chip-y) max-sm:z-30 max-sm:mt-0 max-sm:-translate-x-1/2 max-sm:-translate-y-1/2"
            >
              <span className="font-mono text-sm font-bold">{priceText}</span>
              {justAddedId === drink.id ? (
                <span className="inline-flex items-center justify-center rounded-full bg-crema p-2 text-espresso">
                  <Check size={18} aria-hidden />
                </span>
              ) : (
                <span className="inline-flex items-center justify-center rounded-full bg-espresso p-2 text-cream">
                  <ShoppingBag size={18} />
                </span>
              )}
            </button>

            {/* The reference's 4-of-6 hero button group (audit §8.8):
                Dark Mocha, Brown Sugar Cinnamon, Salted Caramel, Vanilla
                Cream for coffee; the same positions (2, 3, 5, 6) for
                matcha. All 6 flavours stay reachable via the wheel,
                the dots and the All-flavours dialog. */}
            <div className="mt-2 hidden flex-wrap justify-center gap-2 md:flex">
              {featured.map((featuredDrink) => {
                const isCurrent = featuredDrink.id === drink.id;
                return (
                  <button
                    key={featuredDrink.id}
                    type="button"
                    onClick={() => {
                      lastManualRef.current = Date.now();
                      setIndex(data.drinks.indexOf(featuredDrink));
                    }}
                    aria-pressed={isCurrent}
                    className={
                      isCurrent
                        ? "rounded-full bg-cream px-4 py-1.5 text-sm font-semibold text-espresso shadow-ela-card transition-[scale,background-color] active:scale-95"
                        : "rounded-full bg-espresso/45 px-4 py-1.5 text-sm font-medium text-cream ring-1 ring-cream/25 backdrop-blur-md transition-[scale,background-color] hover:bg-cream/10 active:scale-95"
                    }
                  >
                    {isFa ? featuredDrink.shortFa : featuredDrink.shortEn}
                  </button>
                );
              })}
            </div>

            <WordReveal
              key={`${brand}-${locale}`}
              as="h1"
              text={isFa ? data.heroTitleFa : data.heroTitleEn}
              className="mt-2 text-center font-display text-[clamp(2.5rem,8vw,4.5rem)] font-black leading-[1.02] tracking-[-0.02em] text-foreground max-sm:absolute max-sm:inset-x-0 max-sm:top-(--headline-top) max-sm:z-30 max-sm:mt-0"
            />
          </div>

          {/* Counter + dots, bottom-start. */}
          <div className="absolute bottom-6 start-6 z-30 flex items-center gap-3">
            <span className="font-display text-2xl font-bold">{counter}</span>
            <span
              className="flex items-center gap-1.5"
              role="group"
              aria-label={tHero("allFlavors")}
            >
              {data.drinks.map((dotDrink, i) => (
                <button
                  key={dotDrink.id}
                  type="button"
                  onClick={() => {
                    lastManualRef.current = Date.now();
                    setIndex(i);
                  }}
                  aria-label={isFa ? dotDrink.nameFa : dotDrink.nameEn}
                  aria-current={i === index}
                  className={
                    i === index
                      ? "h-2 w-6 rounded-full bg-cream transition-all active:scale-125"
                      : "h-2 w-2 rounded-full bg-cream/40 transition-all hover:bg-cream/70 active:scale-125"
                  }
                />
              ))}
            </span>
          </div>

          {/* Scroll cue, bottom-end. */}
          <a
            href="#story"
            className="absolute bottom-6 end-6 z-30 inline-flex items-center gap-2 text-sm text-muted-foreground transition-[scale] active:scale-95"
          >
            {tHero("scrollCue")}
            <ChevronDown size={16} className="animate-ela-scroll-cue" />
          </a>
        </div>
      </div>
    </section>
  );
}
