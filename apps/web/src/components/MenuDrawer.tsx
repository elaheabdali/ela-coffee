"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toFaDigits } from "@ela-coffee/i18n";
import { BRANDS } from "@/data/flavours";
import { useBrand } from "@/stores/brand";
import { useMotion } from "@/stores/motion";
import { BrandToggle } from "./BrandToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";

export interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const LINKS = [
  { href: "#story", labelKey: "story" },
  { href: "#menu", labelKey: "menu" },
  { href: "#process", labelKey: "process" },
  { href: "#origins", labelKey: "origins" },
  { href: "#join", labelKey: "join" },
] as const;

/**
 * Full-screen menu drawer (audit §2): dark overlay, wordmark top-left,
 * Close top-right, large serif numbered links, and a bottom bar with
 * the tagline, "Fresh every morning", the language switcher, the brand
 * toggle and the motion pause button. Focus trap + Esc + body scroll lock + focus return,
 * following the same approach as the ui Dialog (this is full-screen,
 * not a centred modal, so Dialog itself is not used here).
 * No Modulify badge anywhere.
 */
export function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  const tNav = useTranslations("nav");
  const tHero = useTranslations("hero");
  const tDrawer = useTranslations("drawer");
  const tFooter = useTranslations("footer");
  const locale = useLocale();
  const { brand } = useBrand();
  const { paused, toggle } = useMotion();

  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    (focusables[0] ?? panel).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocusedRef.current instanceof HTMLElement) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const tagline = brand === "midori" ? tFooter("taglineMatcha") : tFooter("tagline");
  const pauseLabel = paused ? tHero("playMotion") : tHero("pauseMotion");

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={tDrawer("menu")}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-espresso px-5 py-6 text-cream outline-none sm:px-12"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-3xl font-black tracking-[-0.02em]">
          {BRANDS[brand].wordmark}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={tDrawer("close")}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-[scale,background-color] hover:bg-cream/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
        >
          <X size={24} aria-hidden="true" />
        </button>
      </div>

      <nav aria-label={tDrawer("menu")} className="flex flex-1 flex-col justify-center gap-2">
        <ul className="flex flex-col gap-2">
          {LINKS.map((link, i) => {
            const number =
              locale === "fa"
                ? toFaDigits(String(i + 1).padStart(2, "0"))
                : String(i + 1).padStart(2, "0");
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={onClose}
                  className="group inline-flex items-baseline gap-4 rounded-lg font-display text-4xl font-bold leading-tight transition-[scale,color] hover:text-crema active:scale-95 sm:text-5xl"
                >
                  <span className="font-mono text-base font-normal text-muted-foreground">
                    {number}
                  </span>
                  {tNav(link.labelKey)}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-cream/10 pt-5">
        <p className="max-w-md text-sm text-muted-foreground">
          {tagline} <span className="text-cream">· {tDrawer("fresh")}</span>
        </p>
        <div className="flex items-center gap-2">
          <LocaleSwitcher className="border border-cream/10 bg-cream/[0.06] backdrop-blur-none hover:bg-cream/10" />
          <BrandToggle coffeeLabel={tNav("brandCoffee")} matchaLabel={tNav("brandMatcha")} />
          <button
            type="button"
            onClick={toggle}
            aria-pressed={paused}
            aria-label={pauseLabel}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium ring-1 ring-border transition-[scale,background-color] hover:bg-accent active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crema"
          >
            {paused ? (
              <Play size={16} aria-hidden="true" />
            ) : (
              <Pause size={16} aria-hidden="true" />
            )}
            {pauseLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
