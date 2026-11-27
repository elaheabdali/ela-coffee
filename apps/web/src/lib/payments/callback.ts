/**
 * Payment callback handler (batch 9, item 6).
 *
 * Zarinpal redirects the customer back to GET /api/payments/callback
 * with `?Authority=<authority>&Status=OK` (or `Status=NOK` when the
 * customer cancels/fails on the gateway). This module is the whole
 * decision logic, kept free of HTTP so unit tests can drive it with
 * fake stores and a fake provider:
 *
 * 1. No authority, or no order stored under it → the payment cannot
 *    be resolved ("not-found" / "failed").
 * 2. `Status` anything but `OK` → the customer did not pay; mark the
 *    order FAILED and never call the gateway.
 * 3. Order already PAID → return "paid" without calling verify again
 *    (idempotent: Zarinpal, the browser refresh button and the mock
 *    gateway can all deliver the same callback twice).
 * 4. `Status=OK` → verify with the gateway, using the amount stored
 *    on the server-side order (never a client-supplied total), in
 *    Toman — the port converts to Rial. Verified → PAID, else FAILED.
 *
 * The verify result's ref id is returned to the caller for display /
 * logging. The Order row has no ref-id column (architecture §9 stores
 * "the authority, the amount and the verification result"), so the
 * ref id is not persisted.
 */
import type { OrderDTO, PaymentStatus } from "../types";
import type { PaymentPort } from "./port";

export type PaymentCallbackOutcome = "paid" | "failed" | "not-found";

export interface PaymentCallbackResult {
  outcome: PaymentCallbackOutcome;
  /** The resolved order id, or null when no order matched. */
  orderId: string | null;
  /** Gateway ref id (Zarinpal) or mock equivalent, when verified. */
  refId: string | null;
}

export interface PaymentCallbackDeps {
  findOrderByAuthority: (authority: string) => Promise<OrderDTO | null>;
  updatePayment: (
    id: string,
    payment: PaymentStatus,
    authority: string | null,
  ) => Promise<OrderDTO | null>;
  provider: PaymentPort;
}

export async function handlePaymentCallback(
  query: { authority: string | null; status: string | null },
  deps: PaymentCallbackDeps,
): Promise<PaymentCallbackResult> {
  const { authority, status } = query;

  if (!authority) {
    return { outcome: "failed", orderId: null, refId: null };
  }

  const order = await deps.findOrderByAuthority(authority);
  if (!order) {
    return { outcome: "not-found", orderId: null, refId: null };
  }

  // Idempotent replay: an already-paid order stays paid without a
  // second verify call (Zarinpal answers 101 "already verified" to a
  // repeat verify, but skipping the call is cheaper and safer).
  if (order.payment === "PAID") {
    return { outcome: "paid", orderId: order.id, refId: null };
  }

  // The customer cancelled or the payment failed on the gateway —
  // Zarinpal's own docs say verify should only be called for OK.
  if (status !== "OK") {
    await deps.updatePayment(order.id, "FAILED", authority);
    return { outcome: "failed", orderId: order.id, refId: null };
  }

  // Verify against the gateway with the SERVER-side order total.
  // The amount in the callback query is never trusted (there is not
  // even one — Zarinpal sends only Authority + Status).
  const result = await deps.provider.verifyPayment(authority, order.totalToman);
  if (result.verified) {
    await deps.updatePayment(order.id, "PAID", authority);
    return { outcome: "paid", orderId: order.id, refId: result.refId || null };
  }

  await deps.updatePayment(order.id, "FAILED", authority);
  return { outcome: "failed", orderId: order.id, refId: null };
}
