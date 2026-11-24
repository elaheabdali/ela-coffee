/**
 * POST /api/orders — creates an order (architecture §6, §9).
 *
 * - Zod validation: items [{drinkId, qty 1–10}], customerName, phone.
 * - Idempotency: an Idempotency-Key header returns the original order
 *   when the same key is sent twice (no double charge, no duplicate).
 * - The total is computed server-side from data-layer prices — any
 *   total sent by the client is stripped by Zod and ignored.
 * - A payment is created through PaymentPort (Mock by default: no
 *   network, no real money). In mock mode the verification is also
 *   simulated here, so payment becomes PAID; in Zarinpal mode the
 *   customer must pay on Zarinpal's page first and verification
 *   happens at the callback (not built in v1 — see the Phase 6 doc).
 * - Honeypot + in-memory rate limit (10/min per IP).
 */
import { NextResponse } from "next/server";
import { jsonError, parseBodyError, validationError } from "@/lib/api-errors";
import { getPaymentProvider } from "@/lib/payments/port";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { assertSameOrigin, corsHeaders, handleOptions } from "@/lib/csrf";
import { canonicalPhone, orderSchema } from "@/lib/schemas";
import { createOrder, getOrderByIdempotencyKey, updateOrderPayment } from "@/lib/store";

/** CORS preflight — ACAO only for our own origin (see lib/csrf.ts). */
export function OPTIONS(request: Request): NextResponse {
  return handleOptions(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  // CSRF first: cross-origin requests are rejected before any other work.
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const limit = rateLimit(`orders:${clientIp(request)}`, 10, 60);
  if (!limit.allowed) {
    return jsonError(
      429,
      "RATE_LIMITED",
      "Too many requests. Try again shortly.",
      rateLimitHeaders(limit),
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return parseBodyError();
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(
      parsed.error.issues.map((issue) => ({
        field: issue.path.map(String).join(".") || "order",
        message: issue.message,
      })),
    );
  }

  // Honeypot filled → bot. Answer like a success, create nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true }, { headers: corsHeaders(request) });
  }

  const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;
  if (idempotencyKey) {
    const existing = await getOrderByIdempotencyKey(idempotencyKey);
    if (existing) {
      return NextResponse.json(
        { order: existing, idempotent: true },
        { headers: corsHeaders(request) },
      );
    }
  }

  let order;
  try {
    order = await createOrder(
      {
        items: parsed.data.items,
        customerName: parsed.data.customerName.trim(),
        phone: canonicalPhone(parsed.data.phone),
      },
      idempotencyKey,
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unknown drink")) {
      return jsonError(400, "UNKNOWN_DRINK", error.message);
    }
    // Never leak internals (Prisma errors, stack traces): a generic
    // 500 code. The real error is logged server-side by Next.js.
    return jsonError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
  }

  // Create the payment through the port (Mock by default).
  const provider = getPaymentProvider();
  const payment = await provider.createPayment(order);
  await updateOrderPayment(order.id, "PENDING", payment.authority);

  // Mock mode only: simulate the customer returning from the gateway
  // and the verification succeeding. Zarinpal mode leaves the payment
  // PENDING until the real callback verifies it.
  let verified = false;
  if (process.env.PAYMENT_PROVIDER !== "zarinpal") {
    const result = await provider.verifyPayment(payment.authority, order.totalToman);
    verified = result.verified;
    if (verified) {
      const paid = await updateOrderPayment(order.id, "PAID", payment.authority);
      if (paid) order = paid;
    }
  }

  return NextResponse.json(
    { order, payment: { authority: payment.authority, url: payment.url, verified } },
    { status: 201, headers: corsHeaders(request) },
  );
}
