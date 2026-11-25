"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Menu, Pause, Play, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toFaDigits } from "@ela-coffee/i18n";
import { BRANDS } from "@/data/flavours";
import { bagCount, useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useMotion } from "@/stores/motion";
import { BrandToggle } from "./BrandToggle";
import { FlavorControls } from "./FlavorControls";
import { LocaleSwitcher } from "./LocaleSwitcher";

/**
 * The drawers are interaction-only (menu, checkout): they load on
 * demand in their own chunks instead of riding in the first-load JS
 * (architecture §12 "dialogs lazy"). Both are mounted only while open,
 * so the chunk is fetched on the first open, not on page load.
 */
const BagDrawer = dynamic(() => import("./BagDrawer").then((m) => m.BagDrawer));
const MenuDrawer = dynamic(() => import("./MenuDrawer").then((m) => m.MenuDrawer));

/** Text links of the scrolled pill, in dictionary order. */
const SCROLLED_LINKS = [
  { href: "#story", labelKey: "story" },
  { href: "#menu", labelKey: "menu" },
  { href: "#process", labelKey: "process" },
  { href: "#origins", labelKey: "origins" },
] as const;

/** Crema focus ring, as on the reference's header buttons/links. */
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema";

/** Bag count badge (reference: crema pill, espresso ring, -1.5 offsets). */
const BAG_BADGE =
  "animate-ela-bump absolute -end-1.5 -top-1.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-crema px-1 text-[0.625rem] font-bold leading-none text-espresso ring-2 ring-espresso";

/**
 * Fixed site header (audit §2/§7), rebuilt in fix batch 2 to match the
 * reference navbar class-for-class (verified live against
 * kuro-coffee-template.modulify.website, 1440px + 360px, hero +
 * scrolled states). Two states, driven by scroll:
 *
 * HERO (top of the page): the reference's 3-column grid nav
 * (`grid-cols-[1fr_auto_1fr]`) — wordmark left, the glass icon pill
 * (FlavorControls) centred, and right: the segmented Coffee/Matcha
 * toggle (lg+), the single icon brand switch (below lg), the locale
 * switcher, the motion pause button (sm+) and the hamburger.
 *
 * SCROLLED (past the hero): the reference's dark floating pill
 * (`max-w-7xl rounded-[1.25rem] border-cream/10 bg-espresso/80
 * backdrop-blur-xl`, `py-2 ps-5 pe-2`) with the wordmark, pill text
 * links, the segmented toggle (sm+), the single icon brand switch
 * (below sm), the locale switcher, the cream Join pill (sm+), the bag
 * button with its count badge, and the hamburger (below lg).
 *
 * Only one state is mounted at a time (no duplicate interactive
 * elements in the DOM); the entering state replays the reference's
 * 500 ms fade + -4px slide as a mount animation
 * (`animate-ela-header-in`, globals.css). The scroll trigger matches
 * the reference: the pill appears only once the 300vh sticky hero
 * has been scrolled through (`scrollY > heroHeight - innerHeight`,
 * measured live off the #hero section); before that the hero nav
 * stays, even mid-wheel. Without a #hero on the page (header unit
 * tests render it alone) it falls back to `innerHeight - 120`.
 *
 * RTL: the reference is LTR-only, so its physical paddings/offsets
 * are written as logical ones here (`ps-5 pe-2`, `-end-1.5`) and the
 * fa layout mirrors. `font-display` is our Fraunces heading font —
 * the reference's `font-heading font-soft` utilities do not exist in
 * this project's Tailwind theme.
 *
 * The menu drawer and the bag drawer are mounted here, once.
 */
export function SiteHeader() {
  const tNav = useTranslations("nav");
  const tHero = useTranslations("hero");
  const tBag = useTranslations("bag");
  const tDrawer = useTranslations("drawer");
  const locale = useLocale();
  const { brand } = useBrand();
  const { paused, toggle } = useMotion();
  const { items, openBag, isOpen: bagOpen } = useBag();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Reference behaviour (user choice 2026-11-25): the pill shows
      // only after the hero, not part-way through the wheel. The
      // hero is a 300vh section with a sticky 100svh stage, so its
      // sticky phase ends at heroHeight - viewportHeight.
      const hero = document.getElementById("hero");
      const threshold = hero
        ? hero.offsetHeight - window.innerHeight
        : window.innerHeight - 120;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    // The threshold is viewport- and hero-height dependent (vh).
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const count = bagCount(items);
  const pauseLabel = paused ? tHero("playMotion") : tHero("pauseMotion");
  const wordmark = BRANDS[brand].wordmark;

  const brandToggleProps = {
    coffeeLabel: tNav("brandCoffee"),
    matchaLabel: tNav("brandMatcha"),
    groupLabel: tNav("menu"),
    switchToCoffeeLabel: tNav("switchToCoffee"),
    switchToMatchaLabel: tNav("switchToMatcha"),
  };

  const bagBadge =
    count > 0 ? (
      <span key={count} data-testid="bag-count" className={BAG_BADGE}>
        {locale === "fa" ? toFaDigits(count) : count}
      </span>
    ) : null;

  const openDrawer = () => setDrawerOpen(true);

  return (
    <>
      <a
        href="#story"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-cream focus:px-4 focus:py-2 focus:text-espresso"
      >
        {tNav("skip")}
      </a>
      <header className="fixed inset-x-0 top-0 z-50">
        {scrolled ? (
          <div className="px-3 pt-3 sm:px-6">
            <nav
              aria-label={tNav("main")}
              className="animate-ela-header-in mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[1.25rem] border border-cream/10 bg-espresso/80 py-2 ps-5 pe-2 text-cream shadow-[0_18px_40px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl"
            >
              <a
                href="#hero"
                className="rounded-md font-display text-[1.625rem] font-semibold leading-none tracking-[-0.04em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema"
              >
                {wordmark}
              </a>
              <ul className="hidden items-center gap-1 lg:flex">
                {SCROLLED_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="rounded-full px-3.5 py-2 text-sm font-medium text-cream/70 transition-[scale,color,background-color] hover:bg-cream/[0.07] hover:text-cream active:scale-95 focus-visible:outline-2 focus-visible:outline-crema"
                    >
                      {tNav(link.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2">
                <BrandToggle
                  variant="segmented"
                  {...brandToggleProps}
                  groupClassName="hidden border-transparent bg-cream/[0.06] backdrop-blur-none sm:inline-flex"
                />
                <BrandToggle
                  variant="icon"
                  {...brandToggleProps}
                  className={`grid size-10 cursor-pointer place-items-center rounded-[0.85rem] border border-transparent bg-cream/[0.06] text-crema backdrop-blur-none transition-[scale,background-color] hover:bg-espresso/70 active:scale-95 ${FOCUS} sm:hidden`}
                />
                <LocaleSwitcher className="border border-transparent bg-cream/[0.06] backdrop-blur-none hover:bg-cream/10" />
                <a
                  href="#join"
                  className={`hidden rounded-full bg-cream px-4 py-2.5 text-sm font-semibold text-espresso transition-[scale,background-color] hover:bg-white active:scale-95 ${FOCUS} sm:inline-flex`}
                >
                  {tNav("join")}
                </a>
                <div className="relative">
                  <button
                    type="button"
                    aria-label={tBag("open")}
                    title={tBag("open")}
                    aria-haspopup="dialog"
                    aria-expanded={bagOpen}
                    onClick={openBag}
                    className={`relative grid size-10 cursor-pointer place-items-center rounded-[0.9rem] bg-cream/[0.06] text-cream transition-[scale,background-color] hover:bg-cream/10 active:scale-95 ${FOCUS}`}
                  >
                    <ShoppingBag size={16} aria-hidden="true" />
                    {bagBadge}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={openDrawer}
                  aria-label={tDrawer("menu")}
                  title={tDrawer("menu")}
                  aria-haspopup="dialog"
                  aria-expanded={drawerOpen}
                  className={`grid size-10 cursor-pointer place-items-center rounded-[0.9rem] border border-cream/10 bg-cream/[0.06] text-cream/80 backdrop-blur-none transition-[scale,background-color,color] hover:bg-espresso/70 hover:text-cream active:scale-95 ${FOCUS} lg:hidden`}
                >
                  <Menu size={16} aria-hidden="true" />
                </button>
              </div>
            </nav>
          </div>
        ) : (
          <nav
            aria-label={tNav("main")}
            className="animate-ela-header-in grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-4 text-cream sm:gap-3 sm:px-8 sm:pt-6"
          >
            <a
              href="#hero"
              className="justify-self-start rounded-md font-display text-[1.5rem] font-semibold leading-none tracking-[-0.04em] text-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema sm:text-[1.75rem]"
            >
              {wordmark}
            </a>
            <div className="relative">
              <FlavorControls />
            </div>
            <div className="flex items-center gap-1.5 justify-self-end sm:gap-2">
              <BrandToggle
                variant="segmented"
                {...brandToggleProps}
                groupClassName="hidden border-cream/10 bg-espresso/45 backdrop-blur-md lg:inline-flex"
              />
              <BrandToggle
                variant="icon"
                {...brandToggleProps}
                className={`grid size-9 cursor-pointer place-items-center rounded-[0.85rem] border border-cream/10 bg-espresso/45 text-crema backdrop-blur-md transition-[scale,background-color] hover:bg-espresso/70 active:scale-95 ${FOCUS} max-[379px]:hidden lg:hidden`}
              />
              <LocaleSwitcher className="border border-cream/10 bg-espresso/45 backdrop-blur-md hover:bg-espresso/70" />
              <button
                type="button"
                onClick={toggle}
                aria-pressed={paused}
                aria-label={pauseLabel}
                title={pauseLabel}
                className={`hidden size-10 cursor-pointer place-items-center rounded-[0.9rem] border border-cream/10 bg-espresso/45 text-cream/80 backdrop-blur-md transition-[scale,background-color,color] hover:bg-espresso/70 hover:text-cream active:scale-95 ${FOCUS} sm:grid`}
              >
                {paused ? (
                  <Play size={16} aria-hidden="true" />
                ) : (
                  <Pause size={16} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={openDrawer}
                aria-label={tDrawer("menu")}
                title={tDrawer("menu")}
                aria-haspopup="dialog"
                aria-expanded={drawerOpen}
                className={`grid size-10 cursor-pointer place-items-center rounded-[0.9rem] border border-cream/10 bg-espresso/45 text-cream/80 backdrop-blur-md transition-[scale,background-color,color] hover:bg-espresso/70 hover:text-cream active:scale-95 ${FOCUS}`}
              >
                <Menu size={16} aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}
      </header>
      {drawerOpen ? <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} /> : null}
      {bagOpen ? <BagDrawer /> : null}
    </>
  );
}
