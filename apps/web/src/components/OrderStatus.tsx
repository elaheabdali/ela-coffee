/**
 * OrderStatus — live order tracker (architecture §5, §8).
 * Shows RECEIVED → PREPARING → READY → DONE with the order's items
 * and total. The transport (SSE or polling) is invisible to the
 * user; a small note shows which one is active for transparency.
 */
"use client";

import { Check, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Price } from "@ela-coffee/ui";
import { ALL_DRINKS } from "@/data/flavours";
import { useOrderStatus } from "@/hooks/useOrderStatus";
import { ORDER_STATUSES, type OrderStatus as OrderStatusValue } from "@/lib/types";

/** Translation key per order status (next-intl keys are type-checked). */
const STATUS_KEYS = {
  RECEIVED: "statusReceived",
  PREPARING: "statusPreparing",
  READY: "statusReady",
  DONE: "statusDone",
} as const;

export function OrderStatus({ orderId }: { orderId: string }) {
  const t = useTranslations("order");
  const locale = useLocale();
  const priceLocale = locale === "en" ? "en" : "fa";
  const { status, order, transport, error } = useOrderStatus(orderId);

  const currentIndex = ORDER_STATUSES.indexOf(status);

  return (
    <div className="flex flex-col gap-5" role="status" aria-live="polite">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-2xl font-bold">{t("trackingTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("orderNumber")}: <span dir="ltr">{orderId}</span>
        </p>
      </div>

      <ol className="flex flex-col gap-0">
        {ORDER_STATUSES.map((step: OrderStatusValue, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={`flex size-8 items-center justify-center rounded-full ring-2 ${
                    done || current
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-secondary text-muted-foreground ring-border"
                  }`}
                >
                  {done ? <Check size={16} /> : <Clock size={16} />}
                </span>
                {index < ORDER_STATUSES.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={`w-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`}
                  />
                ) : null}
              </div>
              <div className={`pb-5 ${current ? "font-semibold" : ""}`}>
                <p>{t(STATUS_KEYS[step])}</p>
                {current ? <p className="text-sm text-muted-foreground">{t("currentStep")}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>

      {order ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-secondary p-4 ring-1 ring-border">
          <ul className="flex flex-col gap-1 text-sm">
            {order.items.map((item) => {
              const drink = ALL_DRINKS.find((d) => d.id === item.drinkId);
              const name = drink ? (locale === "fa" ? drink.nameFa : drink.nameEn) : item.drinkId;
              return (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span>
                    {name} × {item.qty}
                  </span>
                  <Price amountToman={item.priceToman * item.qty} locale={priceLocale} size="sm" />
                </li>
              );
            })}
          </ul>
          <p className="flex items-center justify-between border-t border-border pt-2 font-semibold">
            <span>{t("total")}</span>
            <Price amountToman={order.totalToman} locale={priceLocale} />
          </p>
          <p className="text-sm text-muted-foreground">
            {t("payment")}: {t(order.payment === "PAID" ? "paid" : "pending")}
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {transport === "sse" ? t("liveViaStream") : t("liveViaPolling")}
      </p>
    </div>
  );
}
