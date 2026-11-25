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

/**
 * The drawers are interaction-only (menu, checkout): they load on
 * demand in their own chunks instead of riding in the first-load JS
 * (architecture §12 "dialogs lazy"). Both are mounted only while open,
 * so the chunk is fetched on the first open, not on page load.
 */
const BagDrawer = dynamic(() => import("./BagDrawer").then((m) => m.BagDrawer));
const MenuDrawer = dynamic(() => import("./MenuDrawer").then((m) => m.MenuDrawer));

/**
 * Fixed site header (audit §2/§7), with two states driven by scroll:
 *
 * HERO (top of the page, transparent): wordmark left, the glass icon
 * pill centre, brand toggle + motion pause + hamburger right. Below
 * `sm` only the icon pill and the hamburger show.
 *
 * SCROLLED (past the hero): a cream bar with the wordmark, text links,
 * brand toggle, a Join pill and a bag button with a count badge.
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
      setScrolled(window.scrollY > window.innerHeight - 120);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const count = bagCount(items);
  const pauseLabel = paused ? tHero("playMotion") : tHero("pauseMotion");

  return (
    <>
      <a
        href="#story"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-cream focus:px-4 focus:py-2 focus:text-espresso"
      >
        {tNav("skip")}
      </a>
      <header
        className={
          scrolled
            ? "fixed inset-x-0 top-0 z-40 bg-cream text-espresso shadow-ela-card"
            : "fixed inset-x-0 top-0 z-40 bg-transparent text-cream"
        }
      >
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a
            href="#hero"
            className="font-display text-2xl font-black tracking-[-0.02em] sm:text-3xl"
          >
            {BRANDS[brand].wordmark}
          </a>

          {scrolled ? (
            <>
              <nav aria-label={tNav("menu")} className="hidden items-center gap-6 lg:flex">
                <a
                  href="#story"
                  className="text-sm font-medium transition-opacity hover:opacity-70"
                >
                  {tNav("story")}
                </a>
                <a href="#menu" className="text-sm font-medium transition-opacity hover:opacity-70">
                  {tNav("menu")}
                </a>
                <a
                  href="#process"
                  className="text-sm font-medium transition-opacity hover:opacity-70"
                >
                  {tNav("process")}
                </a>
                <a
                  href="#origins"
                  className="text-sm font-medium transition-opacity hover:opacity-70"
                >
                  {tNav("origins")}
                </a>
              </nav>
              <div className="flex items-center gap-2">
                <span className="max-sm:hidden">
                  <BrandToggle
                    coffeeLabel={tNav("brandCoffee")}
                    matchaLabel={tNav("brandMatcha")}
                  />
                </span>
                <a
                  href="#join"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground transition hover:brightness-110 max-sm:hidden"
                >
                  {tNav("join")}
                </a>
                <button
                  type="button"
                  aria-label={tBag("open")}
                  onClick={openBag}
                  className="relative inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-espresso/10"
                >
                  <ShoppingBag size={20} aria-hidden="true" />
                  {count > 0 ? (
                    <span
                      key={count}
                      data-testid="bag-count"
                      className="animate-ela-bump absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-bold text-primary-foreground"
                    >
                      {locale === "fa" ? toFaDigits(count) : count}
                    </span>
                  ) : null}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <FlavorControls />
              </div>
              <div className="flex items-center gap-2">
                <span className="max-sm:hidden">
                  <BrandToggle
                    coffeeLabel={tNav("brandCoffee")}
                    matchaLabel={tNav("brandMatcha")}
                  />
                </span>
                <button
                  type="button"
                  onClick={toggle}
                  aria-pressed={paused}
                  aria-label={pauseLabel}
                  className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-cream/10 max-sm:hidden"
                >
                  {paused ? (
                    <Play size={20} aria-hidden="true" />
                  ) : (
                    <Pause size={20} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label={tDrawer("menu")}
                  className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-cream/10"
                >
                  <Menu size={20} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      {drawerOpen ? <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} /> : null}
      {bagOpen ? <BagDrawer /> : null}
    </>
  );
}
