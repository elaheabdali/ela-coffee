"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Price, Stepper } from "@ela-coffee/ui";
import { ALL_DRINKS, getDrink } from "@/data/flavours";
import { bagSubtotal, useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bag drawer (audit §2): an end-side panel over the page. Empty state
 * explains how to add a drink; the filled state lists one row per item
 * (thumbnail, name, unit price, stepper, line total, remove), the
 * subtotal and a Clear bag button. The bag is a local list only — no
 * checkout, payment or delivery button exists anywhere here.
 *
 * Focus trap + Esc + overlay click + body scroll lock + focus return,
 * following the same approach as the ui Dialog.
 */
export function BagDrawer() {
  const tBag = useTranslations("bag");
  const tDialog = useTranslations("dialog");
  const locale = useLocale();
  const { brand } = useBrand();
  const { items, isOpen, closeBag, setQty, remove, clear } = useBag();

  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    (focusables[0] ?? panel).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeBag();
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
  }, [isOpen, closeBag]);

  if (!isOpen) return null;

  const priceLocale = locale === "en" ? "en" : "fa";

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-hidden="true"
        data-testid="bag-overlay"
        onClick={closeBag}
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={tBag("title")}
        tabIndex={-1}
        className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-card text-foreground shadow-kuro-hero outline-none"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="font-display text-2xl font-bold">{tBag("title")}</h2>
          <button
            type="button"
            onClick={closeBag}
            aria-label={tDialog("close")}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-10 text-center">
            <p className="font-display text-xl font-bold">{tBag("empty")}</p>
            <p className="text-sm text-muted-foreground">{tBag("emptyHint")}</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
              {items.map((item) => {
                const drink =
                  getDrink(brand, item.drinkId) ??
                  ALL_DRINKS.find((d) => d.id === item.drinkId);
                if (!drink) return null;
                const name = locale === "fa" ? drink.nameFa : drink.nameEn;
                return (
                  <li
                    key={item.drinkId}
                    className="flex items-center gap-3 rounded-2xl bg-secondary p-3 ring-1 ring-border"
                  >
                    <Image
                      src={drink.image}
                      alt=""
                      width={64}
                      height={64}
                      className="size-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{name}</p>
                      <Price amountToman={drink.priceToman} locale={priceLocale} size="sm" />
                      <Stepper
                        value={item.qty}
                        min={0}
                        onChange={(next) => setQty(item.drinkId, next)}
                        decreaseLabel={tBag("decrease")}
                        increaseLabel={tBag("increase")}
                        valueLabel={tBag("quantity")}
                        locale={priceLocale}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Price
                        amountToman={drink.priceToman * item.qty}
                        locale={priceLocale}
                        size="sm"
                      />
                      <button
                        type="button"
                        onClick={() => remove(item.drinkId)}
                        aria-label={tBag("remove")}
                        className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <X size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-4 border-t border-border px-5 py-4">
              <p className="flex items-center justify-between font-semibold">
                <span>{tBag("subtotal")}</span>
                <Price amountToman={bagSubtotal(items)} locale={priceLocale} />
              </p>
              <Button variant="ghost" onClick={clear}>
                {tBag("clear")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
