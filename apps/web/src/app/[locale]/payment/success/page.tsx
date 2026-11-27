import { Suspense } from "react";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { OrderStatus } from "@/components/OrderStatus";

/**
 * Payment success page (batch 9, item 6).
 *
 * Zarinpal's callback redirects here after the payment is verified
 * and the order is marked PAID. The copy is inline (not a dictionary
 * key): these pages sit outside the checkout flow and were added
 * without touching the dictionaries.
 */
const COPY = {
  fa: {
    title: "پرداخت انجام شد",
    body: "سفارشت ثبت شد و پرداختت با موفقیت انجام شد. به‌زودی آماده‌اش می‌کنیم.",
    orderLabel: "شمارهٔ سفارش",
    back: "بازگشت به خانه",
  },
  en: {
    title: "Payment successful",
    body: "Your order is in and paid. We'll start making it right away.",
    orderLabel: "Order number",
    back: "Back home",
  },
} as const;

/**
 * The order number comes from the callback's `?order=` query param, so it
 * is read in a separate async component behind a Suspense boundary —
 * reading searchParams in the page itself would block prerendering.
 */
async function OrderLine({
  searchParams,
  orderLabel,
}: {
  searchParams: Promise<{ order?: string }>;
  orderLabel: string;
}) {
  const { order } = await searchParams;
  if (!order) return null;
  return (
    <>
      <p className="text-muted-foreground">
        {orderLabel}:{" "}
        <span dir="ltr" className="font-mono text-foreground">
          {order}
        </span>
      </p>
      {/* Live order tracking (architecture §5): the drawer tracking
          view is no longer on the checkout path — the customer pays
          on the gateway first — so the success page carries the
          tracker instead. */}
      <div className="mt-4 w-full max-w-md text-start">
        <OrderStatus orderId={order} />
      </div>
    </>
  );
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  const t = COPY[locale === "en" ? "en" : "fa"];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check size={32} aria-hidden="true" />
      </p>
      <h1 className="font-display text-3xl font-bold">{t.title}</h1>
      <p className="max-w-md text-muted-foreground">{t.body}</p>
      <Suspense fallback={null}>
        <OrderLine searchParams={searchParams} orderLabel={t.orderLabel} />
      </Suspense>
      <Link
        href="/"
        className="mt-2 inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground"
      >
        {t.back}
      </Link>
    </main>
  );
}
