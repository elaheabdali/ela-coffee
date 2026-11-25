"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import { isValidIranianPhone } from "@ela-coffee/i18n";
import { Button, Price, Stepper } from "@ela-coffee/ui";
import { ALL_DRINKS, getDrink } from "@/data/flavours";
import { OrderStatus } from "@/components/OrderStatus";
import { zodResolver } from "@/lib/form-resolver";
import type { OrderDTO } from "@/lib/types";
import { bagSubtotal, useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";

/**
 * Zod jitless (SECURITY.md §3): this component builds a schema at
 * render time, so it sets the flag itself — otherwise Zod v4's JIT
 * probe (`Function("")`) can run before the shared schemas module
 * loads and log a CSP violation. See src/lib/schemas.ts.
 */
z.config({ jitless: true });

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Step = "bag" | "checkout" | "tracking";

interface CheckoutValues {
  customerName: string;
  phone: string;
}

function newIdempotencyKey(): string {
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  return `key-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Bag drawer (audit §2): an end-side panel over the page. Empty state
 * explains how to add a drink; the filled state lists one row per item
 * (thumbnail, name, unit price, stepper, line total, remove), the
 * subtotal and a Clear bag button.
 *
 * Phase 6: the bag now has a real checkout step. The checkout form
 * (name + Iranian mobile, RHF+Zod) POSTs to /api/orders with an
 * Idempotency-Key; on success the drawer shows the live OrderStatus
 * view for the created order (SSE + polling fallback). The payment
 * is the Mock provider by default — no real money moves.
 *
 * Focus trap + Esc + overlay click + body scroll lock + focus return,
 * following the same approach as the ui Dialog.
 */
export function BagDrawer() {
  const tBag = useTranslations("bag");
  const tDialog = useTranslations("dialog");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const { brand } = useBrand();
  const { items, isOpen, closeBag, setQty, remove, clear } = useBag();

  const [step, setStep] = useState<Step>("bag");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  const handleClose = useCallback((): void => {
    setStep("bag");
    setServerError(null);
    closeBag();
  }, [closeBag]);

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
        handleClose();
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
  }, [isOpen, closeBag, handleClose]);

  const checkoutSchema = z.object({
    customerName: z.string().min(1, tCheckout("nameRequired")).max(100),
    phone: z
      .string()
      .min(1, tCheckout("phoneRequired"))
      .refine((value) => isValidIranianPhone(value), tCheckout("phoneInvalid")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onSubmit",
  });

  const checkoutMutation = useMutation({
    mutationFn: async (values: CheckoutValues): Promise<{ order: OrderDTO }> => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": newIdempotencyKey(),
        },
        body: JSON.stringify({
          items: items.map((item) => ({ drinkId: item.drinkId, qty: item.qty })),
          customerName: values.customerName,
          phone: values.phone,
        }),
      });
      const data = (await response.json()) as { order?: OrderDTO; error?: { message?: string } };
      if (!response.ok || !data.order) {
        throw new Error(data.error?.message ?? "Order failed.");
      }
      return { order: data.order };
    },
    onSuccess: (data) => {
      clear();
      setOrderId(data.order.id);
      setServerError(null);
      setStep("tracking");
    },
    onError: () => {
      setServerError(tCheckout("serverError"));
    },
  });

  if (!isOpen) return null;

  const priceLocale = locale === "en" ? "en" : "fa";
  const nameError = errors.customerName?.message;
  const phoneError = errors.phone?.message;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-hidden="true"
        data-testid="bag-overlay"
        onClick={handleClose}
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={tBag("title")}
        tabIndex={-1}
        className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-card text-foreground shadow-ela-hero outline-none"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="font-display text-2xl font-bold">
            {step === "checkout" ? tCheckout("title") : tBag("title")}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={tDialog("close")}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[scale,background-color,color] hover:bg-accent hover:text-foreground active:scale-95"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {step === "tracking" && orderId ? (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <OrderStatus orderId={orderId} />
            <Button variant="ghost" onClick={handleClose} className="mt-4">
              {tCheckout("backToBag")}
            </Button>
          </div>
        ) : step === "checkout" ? (
          <form
            noValidate
            onSubmit={handleSubmit((values) => checkoutMutation.mutate(values))}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="checkout-name" className="text-sm font-medium">
                {tCheckout("nameLabel")}
              </label>
              <input
                id="checkout-name"
                type="text"
                autoComplete="name"
                aria-invalid={nameError ? true : undefined}
                {...register("customerName")}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
              {nameError ? (
                <p role="alert" className="text-sm text-destructive">
                  {nameError}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="checkout-phone" className="text-sm font-medium">
                {tCheckout("phoneLabel")}
              </label>
              <input
                id="checkout-phone"
                type="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="09123456789"
                aria-invalid={phoneError ? true : undefined}
                {...register("phone")}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
              {phoneError ? (
                <p role="alert" className="text-sm text-destructive">
                  {phoneError}
                </p>
              ) : null}
            </div>
            <p className="flex items-center justify-between font-semibold">
              <span>{tBag("subtotal")}</span>
              <Price amountToman={bagSubtotal(items)} locale={priceLocale} />
            </p>
            <p className="text-sm text-muted-foreground">{tCheckout("mockNote")}</p>
            {serverError ? (
              <p role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={checkoutMutation.isPending}>
                {checkoutMutation.isPending ? tCheckout("placing") : tCheckout("submit")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("bag")}>
                {tCheckout("backToBag")}
              </Button>
            </div>
          </form>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-10 text-center">
            <p className="font-display text-xl font-bold">{tBag("empty")}</p>
            <p className="text-sm text-muted-foreground">{tBag("emptyHint")}</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
              {items.map((item) => {
                const drink =
                  getDrink(brand, item.drinkId) ?? ALL_DRINKS.find((d) => d.id === item.drinkId);
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
            <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
              <p className="flex items-center justify-between font-semibold">
                <span>{tBag("subtotal")}</span>
                <Price amountToman={bagSubtotal(items)} locale={priceLocale} />
              </p>
              <Button onClick={() => setStep("checkout")}>{tCheckout("title")}</Button>
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
