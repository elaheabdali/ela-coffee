import { Suspense } from "react";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Payment failure page (batch 9, item 6).
 *
 * Zarinpal's callback redirects here when the customer cancels on the
 * gateway, the payment fails there, or the verification does not
 * succeed. The order stays open (FAILED payment) and the customer can
 * check out again. Copy is inline, like the success page — no
 * dictionary keys were touched for these pages.
 */
const COPY = {
  fa: {
    title: "پرداخت انجام نشد",
    body: "پرداختت کامل نشد. می‌توانی دوباره تسویهٔ حساب را امتحان کنی؛ سفارشت هنوز باز است.",
    orderLabel: "شمارهٔ سفارش",
    back: "بازگشت به خانه",
  },
  en: {
    title: "Payment didn't go through",
    body: "Your payment didn't complete. You can try checking out again — your order is still open.",
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
    <p className="text-muted-foreground">
      {orderLabel}:{" "}
      <span dir="ltr" className="font-mono text-foreground">
        {order}
      </span>
    </p>
  );
}

export default async function PaymentFailedPage({
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
      <p className="flex size-16 items-center justify-center rounded-full bg-destructive text-white">
        <X size={32} aria-hidden="true" />
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
