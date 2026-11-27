import { Suspense } from "react";

/**
 * Mock payment gateway (dev/demo ONLY — no network, no real money).
 *
 * `MockPayment.createPayment` returns this page as the payment URL, so
 * the checkout flow can be driven end-to-end exactly like the real
 * one: order → redirect to the gateway → the customer "pays" (or
 * cancels) → the gateway returns to /api/payments/callback, which
 * verifies and marks the order PAID / FAILED.
 *
 * The two buttons are plain links to the callback with Status=OK /
 * Status=NOK, mirroring what Zarinpal's StartPay page does. The
 * authority is echoed back, never invented: without it the callback
 * cannot resolve the order and lands on the failure page.
 *
 * The authority comes from the `?authority=` query param, so it is
 * read in a separate async component behind a Suspense boundary —
 * reading searchParams in the page itself would block prerendering.
 */
async function GatewayActions({
  searchParams,
}: {
  searchParams: Promise<{ authority?: string }>;
}) {
  const { authority } = await searchParams;

  return (
    <>
      {authority ? (
        <p className="text-muted-foreground">
          Authority:{" "}
          <span dir="ltr" className="font-mono text-foreground">
            {authority}
          </span>
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <a
          data-testid="mock-pay-success"
          href={`/api/payments/callback?Authority=${encodeURIComponent(authority ?? "")}&Status=OK`}
          className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground"
        >
          Simulate successful payment
        </a>
        <a
          data-testid="mock-pay-cancel"
          href={`/api/payments/callback?Authority=${encodeURIComponent(authority ?? "")}&Status=NOK`}
          className="inline-flex items-center rounded-full border border-border px-5 py-2.5 font-medium"
        >
          Cancel payment
        </a>
      </div>
    </>
  );
}

export default function MockGatewayPage({
  searchParams,
}: {
  searchParams: Promise<{ authority?: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="rounded-full border border-border px-4 py-1 text-sm text-muted-foreground">
        Mock gateway — simulation only, no real money
      </p>
      <h1 className="font-display text-3xl font-bold">درگاه پرداخت آزمایشی</h1>
      <p className="max-w-md text-muted-foreground">
        This page stands in for Zarinpal&apos;s payment page. Choose how the simulated payment ends
        — the callback will verify it and mark the order paid or failed, just like the real flow.
      </p>
      <Suspense fallback={null}>
        <GatewayActions searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
