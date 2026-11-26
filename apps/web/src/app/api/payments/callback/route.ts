/**
 * GET /api/payments/callback — Zarinpal returns the customer here.
 *
 * Zarinpal redirects with `?Authority=<authority>&Status=OK` (or
 * `Status=NOK` when the customer cancels or the payment fails on the
 * gateway). This route resolves the order from the authority, verifies
 * the payment with the gateway using the server-side order total, and
 * marks the order PAID or FAILED — then redirects the customer to the
 * matching result page. It never trusts anything in the query except
 * Authority + Status: there is no amount in the callback to forge.
 *
 * The locale for the redirect comes from next-intl's NEXT_LOCALE
 * cookie when it holds a valid locale, else the default locale (fa).
 * A repeated callback for the same authority is safe: the handler is
 * idempotent (an already-PAID order is returned as paid without a
 * second verify call).
 */
import { NextResponse } from "next/server";
import { handlePaymentCallback } from "@/lib/payments/callback";
import { getPaymentProvider } from "@/lib/payments/port";
import { getOrderByAuthority, updateOrderPayment } from "@/lib/store";

function redirectLocale(request: Request): "fa" | "en" {
  const cookie = request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)NEXT_LOCALE=(fa|en)(?:;|$)/.exec(cookie);
  return match?.[1] === "en" ? "en" : "fa";
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const result = await handlePaymentCallback(
    {
      authority: url.searchParams.get("Authority"),
      status: url.searchParams.get("Status"),
    },
    {
      findOrderByAuthority: getOrderByAuthority,
      updatePayment: updateOrderPayment,
      provider: getPaymentProvider(),
    },
  );

  const locale = redirectLocale(request);
  const target = new URL(
    `/${locale}/payment/${result.outcome === "paid" ? "success" : "failed"}`,
    request.url,
  );
  if (result.orderId) {
    target.searchParams.set("order", result.orderId);
  }
  return NextResponse.redirect(target);
}
